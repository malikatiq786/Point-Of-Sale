import { db } from '../../db';
import { sql, and, gte, lte, eq, desc, asc } from 'drizzle-orm';
import { 
  cogsTracking, 
  sales, 
  saleItems, 
  products, 
  productVariants,
  categories, 
  brands,
  branches 
} from '../../../shared/schema';

export interface ProfitLossReport {
  revenue: number;
  cost: number;
  grossProfit: number;
  grossProfitMargin: number;
  netProfit: number;
  netProfitMargin: number;
  transactionCount: number;
  averageOrderValue: number;
}

export interface ProfitLossReportWithDetails extends ProfitLossReport {
  reportId: string;
  reportName: string;
  reportDate: Date;
  period: string;
  reportType: string;
}

export interface ProductProfitReport extends ProfitLossReport {
  productId: number;
  productName: string;
  brandName?: string | null;
  categoryName?: string | null;
}

export interface VariantProfitReport extends ProfitLossReport {
  variantId: number;
  variantName: string;
  productId: number;
  productName: string;
  brandName?: string | null;
  categoryName?: string | null;
}

export interface CategoryProfitReport extends ProfitLossReport {
  categoryId: number;
  categoryName: string;
  productCount: number;
}

export interface BrandProfitReport extends ProfitLossReport {
  brandId: number;
  brandName: string;
  productCount: number;
}

export interface TimePeriodReport extends ProfitLossReport {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export class ProfitLossReportService {
  /**
   * Generate overall P&L report for a time period
   */
  static async getOverallReport(
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ): Promise<ProfitLossReportWithDetails> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`${cogsTracking.saleDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${cogsTracking.saleDate} <= ${endDate}`);
    }
    if (branchId) {
      conditions.push(eq(cogsTracking.branchId, branchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        totalTransactions: sql<string>`COUNT(DISTINCT ${cogsTracking.saleItemId})`,
        totalQuantitySold: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL))`,
      })
      .from(cogsTracking)
      .where(whereClause);

    const data = result[0];
    const revenue = parseFloat(data.totalRevenue || '0');
    const cost = parseFloat(data.totalCost || '0');
    const grossProfit = revenue - cost;
    const transactionCount = parseInt(data.totalTransactions || '0');

    return {
      reportId: `overall-${Date.now()}`,
      reportName: 'Overall Profit & Loss Report',
      reportDate: new Date(),
      period: `${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`,
      reportType: 'overall',
      revenue,
      cost,
      grossProfit,
      grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netProfit: grossProfit, // Simplified - could subtract operating expenses
      netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      transactionCount,
      averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
    };
  }

  /**
   * Get Product-wise P&L Report
   */
  static async getProductWiseReport(
    startDate?: Date,
    endDate?: Date,
    branchId?: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<ProductProfitReport[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`${cogsTracking.saleDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${cogsTracking.saleDate} <= ${endDate}`);
    }
    if (branchId) {
      conditions.push(eq(cogsTracking.branchId, branchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        productId: cogsTracking.productId,
        productName: products.name,
        brandName: brands.name,
        categoryName: categories.name,
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        transactionCount: sql<string>`COUNT(*)`,
        totalQuantitySold: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL))`,
      })
      .from(cogsTracking)
      .leftJoin(products, eq(cogsTracking.productId, products.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .groupBy(cogsTracking.productId, products.name, brands.name, categories.name)
      .orderBy(sql`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL)) DESC`)
      .limit(limit)
      .offset(offset);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');

      return {
        productId: row.productId,
        productName: row.productName || 'Unknown Product',
        brandName: row.brandName,
        categoryName: row.categoryName,
        revenue,
        cost,
        grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netProfit: grossProfit,
        netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
      };
    });
  }

  /**
   * Get Product Variant-wise P&L Report
   */
  static async getVariantWiseReport(
    startDate?: Date,
    endDate?: Date,
    branchId?: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<VariantProfitReport[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`${cogsTracking.saleDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${cogsTracking.saleDate} <= ${endDate}`);
    }
    if (branchId) {
      conditions.push(eq(cogsTracking.branchId, branchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Join through sale_items to get product variant data
    const results = await db
      .select({
        variantId: productVariants.id,
        variantName: productVariants.variantName,
        productId: products.id,
        productName: products.name,
        brandName: brands.name,
        categoryName: categories.name,
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        transactionCount: sql<string>`COUNT(*)`,
        totalQuantitySold: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL))`,
      })
      .from(cogsTracking)
      .leftJoin(saleItems, eq(cogsTracking.saleItemId, saleItems.id))
      .leftJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .leftJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .groupBy(
        productVariants.id, 
        productVariants.variantName,
        products.id,
        products.name, 
        brands.name, 
        categories.name
      )
      .orderBy(sql`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL)) DESC`)
      .limit(limit)
      .offset(offset);

    return results
      .filter(row => row.variantId != null) // Only include variants
      .map((row: any) => {
        const revenue = parseFloat(row.totalRevenue || '0');
        const cost = parseFloat(row.totalCost || '0');
        const grossProfit = revenue - cost;
        const transactionCount = parseInt(row.transactionCount || '0');

        return {
          variantId: row.variantId!,
          variantName: row.variantName || 'Unknown Variant',
          productId: row.productId!,
          productName: row.productName || 'Unknown Product',
          brandName: row.brandName,
          categoryName: row.categoryName,
          revenue,
          cost,
          grossProfit,
          grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
          netProfit: grossProfit,
          netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
          transactionCount,
          averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
        };
      });
  }

  /**
   * Get Category-wise P&L Report
   */
  static async getCategoryWiseReport(
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ): Promise<CategoryProfitReport[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`${cogsTracking.saleDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${cogsTracking.saleDate} <= ${endDate}`);
    }
    if (branchId) {
      conditions.push(eq(cogsTracking.branchId, branchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        productCount: sql<string>`COUNT(DISTINCT ${cogsTracking.productId})`,
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        transactionCount: sql<string>`COUNT(*)`,
        totalQuantitySold: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL))`,
      })
      .from(cogsTracking)
      .leftJoin(products, eq(cogsTracking.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .groupBy(categories.id, categories.name)
      .orderBy(sql`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL)) DESC`);

    return results
      .filter(row => row.categoryId != null)
      .map((row: any) => {
        const revenue = parseFloat(row.totalRevenue || '0');
        const cost = parseFloat(row.totalCost || '0');
        const grossProfit = revenue - cost;
        const transactionCount = parseInt(row.transactionCount || '0');

        return {
          categoryId: row.categoryId!,
          categoryName: row.categoryName || 'Unknown Category',
          productCount: parseInt(row.productCount || '0'),
          revenue,
          cost,
          grossProfit,
          grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
          netProfit: grossProfit,
          netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
          transactionCount,
          averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
        };
      });
  }

  /**
   * Get Brand-wise P&L Report
   */
  static async getBrandWiseReport(
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ): Promise<BrandProfitReport[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`${cogsTracking.saleDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${cogsTracking.saleDate} <= ${endDate}`);
    }
    if (branchId) {
      conditions.push(eq(cogsTracking.branchId, branchId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        brandId: brands.id,
        brandName: brands.name,
        productCount: sql<string>`COUNT(DISTINCT ${cogsTracking.productId})`,
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        transactionCount: sql<string>`COUNT(*)`,
        totalQuantitySold: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL))`,
      })
      .from(cogsTracking)
      .leftJoin(products, eq(cogsTracking.productId, products.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(whereClause)
      .groupBy(brands.id, brands.name)
      .orderBy(sql`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL)) DESC`);

    return results
      .filter(row => row.brandId != null)
      .map((row: any) => {
        const revenue = parseFloat(row.totalRevenue || '0');
        const cost = parseFloat(row.totalCost || '0');
        const grossProfit = revenue - cost;
        const transactionCount = parseInt(row.transactionCount || '0');

        return {
          brandId: row.brandId!,
          brandName: row.brandName || 'Unknown Brand',
          productCount: parseInt(row.productCount || '0'),
          revenue,
          cost,
          grossProfit,
          grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
          netProfit: grossProfit,
          netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
          transactionCount,
          averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
        };
      });
  }

  /**
   * Get Daily P&L Report (for a date range)
   */
  static async getDailyReport(
    startDate: Date,
    endDate: Date,
    branchId?: number
  ): Promise<TimePeriodReport[]> {
    const results = await db
      .select({
        saleDate: sql<string>`DATE(${cogsTracking.saleDate})`,
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        transactionCount: sql<string>`COUNT(*)`,
      })
      .from(cogsTracking)
      .where(
        and(
          sql`${cogsTracking.saleDate} >= ${startDate}`,
          sql`${cogsTracking.saleDate} <= ${endDate}`,
          branchId ? eq(cogsTracking.branchId, branchId) : undefined
        )
      )
      .groupBy(sql`DATE(${cogsTracking.saleDate})`)
      .orderBy(sql`DATE(${cogsTracking.saleDate})`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');
      const reportDate = new Date(row.saleDate);

      return {
        periodStart: reportDate,
        periodEnd: reportDate,
        periodLabel: reportDate.toLocaleDateString(),
        reportType: 'daily' as const,
        revenue,
        cost,
        grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netProfit: grossProfit,
        netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
      };
    });
  }

  /**
   * Get Monthly P&L Report
   */
  static async getMonthlyReport(
    startDate: Date,
    endDate: Date,
    branchId?: number
  ): Promise<TimePeriodReport[]> {
    const results = await db
      .select({
        yearMonth: sql<string>`DATE_FORMAT(${cogsTracking.saleDate}, '%Y-%m')`,
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        transactionCount: sql<string>`COUNT(*)`,
      })
      .from(cogsTracking)
      .where(
        and(
          sql`${cogsTracking.saleDate} >= ${startDate}`,
          sql`${cogsTracking.saleDate} <= ${endDate}`,
          branchId ? eq(cogsTracking.branchId, branchId) : undefined
        )
      )
      .groupBy(sql`DATE_FORMAT(${cogsTracking.saleDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${cogsTracking.saleDate}, '%Y-%m')`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');
      
      // Parse year-month for period dates
      const [year, month] = row.yearMonth.split('-').map(Number);
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0); // Last day of month

      return {
        periodStart,
        periodEnd,
        periodLabel: periodStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        reportType: 'monthly' as const,
        revenue,
        cost,
        grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netProfit: grossProfit,
        netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
      };
    });
  }

  /**
   * Get Yearly P&L Report
   */
  static async getYearlyReport(
    startDate: Date,
    endDate: Date,
    branchId?: number
  ): Promise<TimePeriodReport[]> {
    const results = await db
      .select({
        year: sql<string>`EXTRACT(YEAR FROM ${cogsTracking.saleDate})`,
        totalRevenue: sql<string>`SUM(CAST(${cogsTracking.quantitySold} AS DECIMAL) * CAST(${cogsTracking.salePrice} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${cogsTracking.totalCogs} AS DECIMAL))`,
        transactionCount: sql<string>`COUNT(*)`,
      })
      .from(cogsTracking)
      .where(
        and(
          sql`${cogsTracking.saleDate} >= ${startDate}`,
          sql`${cogsTracking.saleDate} <= ${endDate}`,
          branchId ? eq(cogsTracking.branchId, branchId) : undefined
        )
      )
      .groupBy(sql`EXTRACT(YEAR FROM ${cogsTracking.saleDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${cogsTracking.saleDate})`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');
      
      const year = parseInt(row.year);
      const periodStart = new Date(year, 0, 1);
      const periodEnd = new Date(year, 11, 31);

      return {
        periodStart,
        periodEnd,
        periodLabel: year.toString(),
        reportType: 'yearly' as const,
        revenue,
        cost,
        grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netProfit: grossProfit,
        netProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0,
      };
    });
  }

  /**
   * Get Top Performing Products/Categories/Brands
   */
  static async getTopPerformers(
    type: 'products' | 'categories' | 'brands' | 'variants',
    startDate?: Date,
    endDate?: Date,
    branchId?: number,
    limit: number = 10,
    sortBy: 'revenue' | 'profit' | 'margin' = 'profit'
  ) {
    switch (type) {
      case 'products':
        return this.getProductWiseReport(startDate, endDate, branchId, limit, 0);
      case 'categories':
        return this.getCategoryWiseReport(startDate, endDate, branchId);
      case 'brands':
        return this.getBrandWiseReport(startDate, endDate, branchId);
      case 'variants':
        return this.getVariantWiseReport(startDate, endDate, branchId, limit, 0);
      default:
        throw new Error(`Invalid report type: ${type}`);
    }
  }
}