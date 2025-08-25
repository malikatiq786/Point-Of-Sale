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
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        totalRevenue: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL) * 0.6)`, // Assuming 60% cost ratio
        totalTransactions: sql<string>`COUNT(${sales.id})`,
        totalSales: sql<string>`COUNT(${sales.id})`,
      })
      .from(sales)
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
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        productId: products.id,
        productName: products.name,
        brandName: brands.name,
        categoryName: categories.name,
        totalRevenue: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL) * 0.6)`,
        transactionCount: sql<string>`COUNT(DISTINCT ${sales.id})`,
        totalQuantitySold: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL))`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .groupBy(products.id, products.name, brands.name, categories.name)
      .orderBy(sql`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL)) DESC`)
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
        brandName: row.brandName || null,
        categoryName: row.categoryName || null,
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
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        variantId: productVariants.id,
        variantName: productVariants.variantName,
        productId: products.id,
        productName: products.name,
        brandName: brands.name,
        categoryName: categories.name,
        totalRevenue: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL) * 0.6)`,
        transactionCount: sql<string>`COUNT(DISTINCT ${sales.id})`,
        totalQuantitySold: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL))`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .groupBy(productVariants.id, productVariants.variantName, products.id, products.name, brands.name, categories.name)
      .orderBy(sql`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL)) DESC`)
      .limit(limit)
      .offset(offset);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');

      return {
        variantId: row.variantId,
        variantName: row.variantName || 'Unknown Variant',
        productId: row.productId,
        productName: row.productName || 'Unknown Product',
        brandName: row.brandName || null,
        categoryName: row.categoryName || null,
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
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        productCount: sql<string>`COUNT(DISTINCT ${products.id})`,
        totalRevenue: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL) * 0.6)`,
        transactionCount: sql<string>`COUNT(DISTINCT ${sales.id})`,
        totalQuantitySold: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL))`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .groupBy(categories.id, categories.name)
      .orderBy(sql`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL)) DESC`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');

      return {
        categoryId: row.categoryId,
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
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        brandId: brands.id,
        brandName: brands.name,
        productCount: sql<string>`COUNT(DISTINCT ${products.id})`,
        totalRevenue: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL) * 0.6)`,
        transactionCount: sql<string>`COUNT(DISTINCT ${sales.id})`,
        totalQuantitySold: sql<string>`SUM(CAST(${saleItems.quantity} AS DECIMAL))`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(brands, eq(products.brandId, brands.id))
      .where(whereClause)
      .groupBy(brands.id, brands.name)
      .orderBy(sql`SUM(CAST(${saleItems.quantity} AS DECIMAL) * CAST(${saleItems.price} AS DECIMAL)) DESC`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');

      return {
        brandId: row.brandId,
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
   * Get Daily P&L Report
   */
  static async getDailyReport(
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ): Promise<TimePeriodReport[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        saleDate: sql<string>`DATE(${sales.saleDate})`,
        totalRevenue: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL) * 0.6)`,
        transactionCount: sql<string>`COUNT(${sales.id})`,
      })
      .from(sales)
      .where(whereClause)
      .groupBy(sql`DATE(${sales.saleDate})`)
      .orderBy(sql`DATE(${sales.saleDate})`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');
      const saleDate = new Date(row.saleDate);

      return {
        periodStart: saleDate,
        periodEnd: saleDate,
        periodLabel: saleDate.toLocaleDateString(),
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
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ): Promise<TimePeriodReport[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        yearMonth: sql<string>`DATE_TRUNC('month', ${sales.saleDate})`,
        totalRevenue: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL) * 0.6)`,
        transactionCount: sql<string>`COUNT(${sales.id})`,
      })
      .from(sales)
      .where(whereClause)
      .groupBy(sql`DATE_TRUNC('month', ${sales.saleDate})`)
      .orderBy(sql`DATE_TRUNC('month', ${sales.saleDate})`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');
      const periodStart = new Date(row.yearMonth);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0); // Last day of the month

      return {
        periodStart,
        periodEnd,
        periodLabel: periodStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
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
    startDate?: Date,
    endDate?: Date,
    branchId?: number
  ): Promise<TimePeriodReport[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(sales.saleDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.saleDate, endDate));
    }
    if (branchId) {
      conditions.push(eq(sales.branchId, branchId));
    }
    
    // Only include completed sales
    conditions.push(eq(sales.status, 'completed'));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        year: sql<string>`DATE_TRUNC('year', ${sales.saleDate})`,
        totalRevenue: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL))`,
        totalCost: sql<string>`SUM(CAST(${sales.totalAmount} AS DECIMAL) * 0.6)`,
        transactionCount: sql<string>`COUNT(${sales.id})`,
      })
      .from(sales)
      .where(whereClause)
      .groupBy(sql`DATE_TRUNC('year', ${sales.saleDate})`)
      .orderBy(sql`DATE_TRUNC('year', ${sales.saleDate})`);

    return results.map((row: any) => {
      const revenue = parseFloat(row.totalRevenue || '0');
      const cost = parseFloat(row.totalCost || '0');
      const grossProfit = revenue - cost;
      const transactionCount = parseInt(row.transactionCount || '0');
      const periodStart = new Date(row.year);
      const periodEnd = new Date(periodStart);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      periodEnd.setDate(0); // Last day of the year

      return {
        periodStart,
        periodEnd,
        periodLabel: periodStart.getFullYear().toString(),
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
   * Get Top Performers Report
   */
  static async getTopPerformers(
    type: 'products' | 'categories' | 'brands' | 'variants',
    startDate?: Date,
    endDate?: Date,
    branchId?: number,
    limit: number = 10,
    sortBy: 'revenue' | 'profit' | 'margin' = 'profit'
  ): Promise<any[]> {
    // Use the appropriate existing method based on type
    switch (type) {
      case 'products':
        return this.getProductWiseReport(startDate, endDate, branchId, limit, 0);
      case 'variants':
        return this.getVariantWiseReport(startDate, endDate, branchId, limit, 0);
      case 'categories':
        return this.getCategoryWiseReport(startDate, endDate, branchId);
      case 'brands':
        return this.getBrandWiseReport(startDate, endDate, branchId);
      default:
        return [];
    }
  }
}