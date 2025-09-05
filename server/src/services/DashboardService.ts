import { SaleRepository } from '../repositories/SaleRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { formatCurrency } from '../utils';
import { DashboardStats, DatabaseResult } from '../types';
import { db } from "../../db";
import { sql } from "drizzle-orm";

export class DashboardService {
  private saleRepository: SaleRepository;
  private productRepository: ProductRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.saleRepository = new SaleRepository();
    this.productRepository = new ProductRepository();
    this.customerRepository = new CustomerRepository();
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DatabaseResult<DashboardStats>> {
    try {
      // Get total products count
      const productsResult = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
      
      // Get total customers count
      const customersResult = await db.execute(sql`SELECT COUNT(*) as count FROM customers`);
      
      // Get total suppliers count  
      const suppliersResult = await db.execute(sql`SELECT COUNT(*) as count FROM suppliers`);
      
      // Get total sales count and amount
      const salesCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM sales`);
      const salesTotalResult = await db.execute(sql`SELECT COALESCE(SUM(CAST(total_amount as DECIMAL)), 0) as total FROM sales`);
      
      // Get low stock items (where stock <= low_stock_alert)
      const lowStockResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE stock <= COALESCE(low_stock_alert, 5)
      `);

      const stats = {
        totalProducts: parseInt(productsResult.rows[0]?.count as string) || 0,
        totalCustomers: parseInt(customersResult.rows[0]?.count as string) || 0,
        totalSuppliers: parseInt(suppliersResult.rows[0]?.count as string) || 0,
        totalSales: parseInt(salesCountResult.rows[0]?.count as string) || 0,
        totalSalesAmount: parseFloat(salesTotalResult.rows[0]?.total as string) || 0,
        lowStockItems: parseInt(lowStockResult.rows[0]?.count as string) || 0,
        activeCustomers: parseInt(customersResult.rows[0]?.count as string) || 0, // For now, all customers are considered active
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('DashboardService: Error getting dashboard stats:', error);
      return {
        success: false,
        error: 'Failed to fetch dashboard statistics'
      };
    }
  }

  // Get recent activities (mock data for now - can be extended with actual activity logging)
  async getRecentActivities(): Promise<DatabaseResult> {
    try {
      // Mock activities for now - in a real system, you'd have an activities table
      const activities = [
        {
          id: 1,
          action: 'New product added',
          details: 'iPhone 15 added to inventory',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
        {
          id: 2,
          action: 'Sale completed',
          details: 'Sale #123 for $79.99',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        },
        {
          id: 3,
          action: 'Stock updated',
          details: 'MacBook Pro stock updated to 5 units',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        },
        {
          id: 4,
          action: 'New customer registered',
          details: 'John Doe added to customer database',
          timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
        },
        {
          id: 5,
          action: 'Category created',
          details: 'Electronics category created',
          timestamp: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
        },
      ];

      return {
        success: true,
        data: activities,
      };
    } catch (error) {
      console.error('DashboardService: Error getting recent activities:', error);
      return {
        success: false,
        error: 'Failed to fetch recent activities',
      };
    }
  }

  // Get top selling products (placeholder for now)
  async getTopProducts(limit: number = 5): Promise<DatabaseResult> {
    try {
      // This would require a more complex query joining sales_items with products
      // For now, returning empty array as the original implementation
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error('DashboardService: Error getting top products:', error);
      return {
        success: false,
        error: 'Failed to fetch top products',
      };
    }
  }
}