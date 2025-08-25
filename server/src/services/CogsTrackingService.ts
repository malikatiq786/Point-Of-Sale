import { eq, and, desc, sum } from 'drizzle-orm';
import { db } from '../../db';
import {
  cogsTracking,
  saleItems,
  sales,
  products,
  productWac,
  inventoryMovements,
  type CogsTracking,
  type InsertCogsTracking,
} from '@shared/schema';
import { WacCalculationService } from './WacCalculationService';

export interface SaleItemCogsData {
  saleItemId: number;
  productId: number;
  quantitySold: number;
  salePrice: number;
  branchId?: number;
  saleDate: Date;
}

export interface CogsReport {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  profitMargin: number;
  averageWac: number;
  salesCount: number;
}

export interface ProfitabilityAnalysis {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossProfitMargin: number;
  topProfitableProducts: CogsReport[];
  leastProfitableProducts: CogsReport[];
  byCategory: {
    categoryName: string;
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
  }[];
}

export class CogsTrackingService {
  /**
   * Track COGS for a sale item (called after each sale)
   * This automatically calculates and records the cost of goods sold
   */
  static async trackCogsForSaleItem(saleItemData: SaleItemCogsData): Promise<CogsTracking> {
    console.log('Tracking COGS for sale item:', saleItemData);

    try {
      // Get current WAC for the product
      const currentWac = await WacCalculationService.getCurrentWacValue(
        saleItemData.productId,
        saleItemData.branchId
      );

      console.log(`Current WAC for product ${saleItemData.productId}: ${currentWac}`);

      // Calculate COGS and profit metrics
      const totalCogs = saleItemData.quantitySold * currentWac;
      const totalRevenue = saleItemData.quantitySold * saleItemData.salePrice;
      const grossProfit = totalRevenue - totalCogs;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      console.log('COGS Calculation:', {
        quantitySold: saleItemData.quantitySold,
        salePrice: saleItemData.salePrice,
        currentWac,
        totalCogs,
        totalRevenue,
        grossProfit,
        profitMargin
      });

      // Create COGS tracking record
      const cogsData: InsertCogsTracking = {
        saleItemId: saleItemData.saleItemId,
        productId: saleItemData.productId,
        quantitySold: saleItemData.quantitySold.toString(),
        wacAtSale: currentWac.toString(),
        totalCogs: totalCogs.toString(),
        salePrice: saleItemData.salePrice.toString(),
        grossProfit: grossProfit.toString(),
        profitMargin: profitMargin.toString(),
        saleDate: saleItemData.saleDate,
        branchId: saleItemData.branchId,
      };

      const [cogsRecord] = await db.insert(cogsTracking).values(cogsData).returning();

      // Process inventory movement for the sale (negative quantity for outbound)
      await WacCalculationService.processInventoryMovement({
        productId: saleItemData.productId,
        branchId: saleItemData.branchId,
        movementType: 'sale',
        quantity: -saleItemData.quantitySold, // Negative for outbound
        unitCost: currentWac, // Use WAC as the cost basis
        referenceType: 'sale_item',
        referenceId: saleItemData.saleItemId,
        notes: `Sale of ${saleItemData.quantitySold} units at ${saleItemData.salePrice} each`,
        movementDate: saleItemData.saleDate,
      });

      console.log('COGS tracking completed successfully');
      return cogsRecord;
    } catch (error) {
      console.error('Error tracking COGS:', error);
      throw new Error(`Failed to track COGS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Track COGS for multiple sale items (for bulk sales)
   */
  static async trackCogsForSale(saleId: number): Promise<CogsTracking[]> {
    console.log('Tracking COGS for sale:', saleId);

    try {
      // Get sale details with items
      const saleWithItems = await db
        .select({
          saleId: sales.id,
          saleDate: sales.saleDate,
          branchId: sales.branchId,
          itemId: saleItems.id,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          price: saleItems.price,
        })
        .from(sales)
        .leftJoin(saleItems, eq(sales.id, saleItems.saleId))
        .where(eq(sales.id, saleId));

      if (saleWithItems.length === 0) {
        throw new Error(`Sale ${saleId} not found`);
      }

      const cogsRecords: CogsTracking[] = [];

      // Process each sale item
      for (const item of saleWithItems) {
        if (item.itemId && item.productId) {
          const cogsRecord = await this.trackCogsForSaleItem({
            saleItemId: item.itemId,
            productId: item.productId,
            quantitySold: parseFloat(item.quantity || '0'),
            salePrice: parseFloat(item.price || '0'),
            branchId: item.branchId || undefined,
            saleDate: item.saleDate || new Date(),
          });
          cogsRecords.push(cogsRecord);
        }
      }

      console.log(`COGS tracking completed for ${cogsRecords.length} items`);
      return cogsRecords;
    } catch (error) {
      console.error('Error tracking COGS for sale:', error);
      throw new Error(`Failed to track COGS for sale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get COGS report for products
   */
  static async getCogsReport(
    startDate?: Date,
    endDate?: Date,
    branchId?: number,
    productIds?: number[]
  ): Promise<CogsReport[]> {
    console.log('Generating COGS report:', { startDate, endDate, branchId, productIds });

    const conditions = [];

    if (startDate) {
      conditions.push(`cogs_tracking.sale_date >= '${startDate.toISOString()}'`);
    }
    if (endDate) {
      conditions.push(`cogs_tracking.sale_date <= '${endDate.toISOString()}'`);
    }
    if (branchId) {
      conditions.push(`cogs_tracking.branch_id = ${branchId}`);
    }
    if (productIds && productIds.length > 0) {
      conditions.push(`cogs_tracking.product_id IN (${productIds.join(',')})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Use raw SQL for complex aggregation
    const query = `
      SELECT 
        ct.product_id,
        p.name as product_name,
        SUM(CAST(ct.quantity_sold AS DECIMAL)) as total_quantity_sold,
        SUM(CAST(ct.quantity_sold AS DECIMAL) * CAST(ct.sale_price AS DECIMAL)) as total_revenue,
        SUM(CAST(ct.total_cogs AS DECIMAL)) as total_cogs,
        SUM(CAST(ct.gross_profit AS DECIMAL)) as gross_profit,
        AVG(CAST(ct.profit_margin AS DECIMAL)) as profit_margin,
        AVG(CAST(ct.wac_at_sale AS DECIMAL)) as average_wac,
        COUNT(*) as sales_count
      FROM cogs_tracking ct
      LEFT JOIN products p ON ct.product_id = p.id
      ${whereClause}
      GROUP BY ct.product_id, p.name
      ORDER BY gross_profit DESC
    `;

    const results = await db.execute({ sql: query });

    return results.rows.map((row: any) => ({
      productId: parseInt(row.product_id),
      productName: row.product_name || 'Unknown Product',
      totalQuantitySold: parseFloat(row.total_quantity_sold || '0'),
      totalRevenue: parseFloat(row.total_revenue || '0'),
      totalCogs: parseFloat(row.total_cogs || '0'),
      grossProfit: parseFloat(row.gross_profit || '0'),
      profitMargin: parseFloat(row.profit_margin || '0'),
      averageWac: parseFloat(row.average_wac || '0'),
      salesCount: parseInt(row.sales_count || '0'),
    }));
  }

  /**
   * Get profitability analysis
   */
  static async getProfitabilityAnalysis(
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ): Promise<ProfitabilityAnalysis> {
    console.log('Generating profitability analysis:', { startDate, endDate, branchId });

    // Get overall COGS report
    const cogsReport = await this.getCogsReport(startDate, endDate, branchId);

    // Calculate totals
    const totalRevenue = cogsReport.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCogs = cogsReport.reduce((sum, item) => sum + item.totalCogs, 0);
    const grossProfit = totalRevenue - totalCogs;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Get top and least profitable products
    const sortedByProfit = [...cogsReport].sort((a, b) => b.grossProfit - a.grossProfit);
    const topProfitableProducts = sortedByProfit.slice(0, 10);
    const leastProfitableProducts = sortedByProfit.slice(-10).reverse();

    // Get profitability by category (simplified version)
    const byCategory = await this.getProfitabilityByCategory(startDate, endDate, branchId);

    return {
      totalRevenue,
      totalCogs,
      grossProfit,
      grossProfitMargin,
      topProfitableProducts,
      leastProfitableProducts,
      byCategory,
    };
  }

  /**
   * Get profitability by category
   */
  private static async getProfitabilityByCategory(
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ) {
    const conditions = [];

    if (startDate) {
      conditions.push(`ct.sale_date >= '${startDate.toISOString()}'`);
    }
    if (endDate) {
      conditions.push(`ct.sale_date <= '${endDate.toISOString()}'`);
    }
    if (branchId) {
      conditions.push(`ct.branch_id = ${branchId}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COALESCE(cat.name, 'Uncategorized') as category_name,
        SUM(CAST(ct.quantity_sold AS DECIMAL) * CAST(ct.sale_price AS DECIMAL)) as revenue,
        SUM(CAST(ct.total_cogs AS DECIMAL)) as cogs,
        SUM(CAST(ct.gross_profit AS DECIMAL)) as profit,
        AVG(CAST(ct.profit_margin AS DECIMAL)) as margin
      FROM cogs_tracking ct
      LEFT JOIN products p ON ct.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      ${whereClause}
      GROUP BY cat.name
      ORDER BY profit DESC
    `;

    const results = await db.execute({ sql: query });

    return results.rows.map((row: any) => ({
      categoryName: row.category_name,
      revenue: parseFloat(row.revenue || '0'),
      cogs: parseFloat(row.cogs || '0'),
      profit: parseFloat(row.profit || '0'),
      margin: parseFloat(row.margin || '0'),
    }));
  }

  /**
   * Get COGS for a specific sale
   */
  static async getCogsForSale(saleId: number): Promise<CogsTracking[]> {
    const cogsData = await db
      .select({
        id: cogsTracking.id,
        saleItemId: cogsTracking.saleItemId,
        productId: cogsTracking.productId,
        quantitySold: cogsTracking.quantitySold,
        wacAtSale: cogsTracking.wacAtSale,
        totalCogs: cogsTracking.totalCogs,
        salePrice: cogsTracking.salePrice,
        grossProfit: cogsTracking.grossProfit,
        profitMargin: cogsTracking.profitMargin,
        saleDate: cogsTracking.saleDate,
        branchId: cogsTracking.branchId,
        productName: products.name,
      })
      .from(cogsTracking)
      .leftJoin(saleItems, eq(cogsTracking.saleItemId, saleItems.id))
      .leftJoin(products, eq(cogsTracking.productId, products.id))
      .where(eq(saleItems.saleId, saleId));

    return cogsData.map(item => ({
      ...item,
      quantitySold: item.quantitySold,
      wacAtSale: item.wacAtSale,
      totalCogs: item.totalCogs,
      salePrice: item.salePrice,
      grossProfit: item.grossProfit,
      profitMargin: item.profitMargin,
    })) as CogsTracking[];
  }

  /**
   * Get daily COGS summary
   */
  static async getDailyCogsummary(
    startDate: Date,
    endDate: Date,
    branchId?: number
  ) {
    const conditions = [];

    if (branchId) {
      conditions.push(`branch_id = ${branchId}`);
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        DATE(sale_date) as sale_date,
        SUM(CAST(quantity_sold AS DECIMAL) * CAST(sale_price AS DECIMAL)) as daily_revenue,
        SUM(CAST(total_cogs AS DECIMAL)) as daily_cogs,
        SUM(CAST(gross_profit AS DECIMAL)) as daily_profit,
        AVG(CAST(profit_margin AS DECIMAL)) as avg_margin,
        COUNT(DISTINCT product_id) as products_sold,
        COUNT(*) as transactions
      FROM cogs_tracking
      WHERE sale_date >= '${startDate.toISOString()}' 
        AND sale_date <= '${endDate.toISOString()}'
        ${whereClause}
      GROUP BY DATE(sale_date)
      ORDER BY sale_date DESC
    `;

    const results = await db.execute({ sql: query });

    return results.rows.map((row: any) => ({
      saleDate: row.sale_date,
      dailyRevenue: parseFloat(row.daily_revenue || '0'),
      dailyCogs: parseFloat(row.daily_cogs || '0'),
      dailyProfit: parseFloat(row.daily_profit || '0'),
      avgMargin: parseFloat(row.avg_margin || '0'),
      productsSold: parseInt(row.products_sold || '0'),
      transactions: parseInt(row.transactions || '0'),
    }));
  }

  /**
   * Fix missing COGS data for existing sales
   * This is useful for backfilling COGS data
   */
  static async backfillCogsData(saleIds?: number[]): Promise<number> {
    console.log('Backfilling COGS data for sales:', saleIds ? saleIds.length : 'all');

    let query = `
      SELECT DISTINCT s.id as sale_id
      FROM sales s
      LEFT JOIN cogs_tracking ct ON s.id = (
        SELECT si.sale_id 
        FROM sale_items si 
        WHERE si.id = ct.sale_item_id 
        LIMIT 1
      )
      WHERE ct.id IS NULL
    `;

    if (saleIds && saleIds.length > 0) {
      query += ` AND s.id IN (${saleIds.join(',')})`;
    }

    const salesWithoutCogs = await db.execute({ sql: query });
    let backfilledCount = 0;

    for (const sale of salesWithoutCogs.rows) {
      try {
        const saleId = parseInt((sale as any).sale_id);
        await this.trackCogsForSale(saleId);
        backfilledCount++;
        console.log(`Backfilled COGS for sale ${saleId}`);
      } catch (error) {
        console.error(`Failed to backfill COGS for sale ${(sale as any).sale_id}:`, error);
      }
    }

    console.log(`Backfilled COGS data for ${backfilledCount} sales`);
    return backfilledCount;
  }
}