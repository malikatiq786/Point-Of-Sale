import { db } from '../../db.js';
import { transactions, sales } from '../../../shared/schema.js';
import { eq, gte, lte, and, desc, sql } from 'drizzle-orm';

export class TransactionRepository {

  async getTransactionsByDateRange(startDate: string, endDate: string) {
    try {
      const conditions = [];

      if (startDate) {
        conditions.push(gte(transactions.date, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(transactions.date, new Date(endDate)));
      }

      return await db
        .select({
          id: transactions.id,
          totalAmount: transactions.amount,
          type: transactions.type,
          createdAt: transactions.date,
          reference: transactions.reference,
          accountId: transactions.accountId
        })
        .from(transactions)
        .where(conditions.length > 0 ? and(...conditions) : sql`true`)
        .orderBy(desc(transactions.date));
    } catch (error) {
      console.error('TransactionRepository: Error in getTransactionsByDateRange:', error);
      throw error;
    }
  }

  async getSalesByDateRange(startDate: string, endDate: string) {
    try {
      const conditions = [];

      if (startDate) {
        conditions.push(gte(sales.saleDate, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(sales.saleDate, new Date(endDate)));
      }

      return await db
        .select({
          id: sales.id,
          totalAmount: sales.totalAmount,
          type: sql<string>`'sale'`,
          createdAt: sales.saleDate,
          customerId: sales.customerId,
          branchId: sales.branchId,
          status: sales.status
        })
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : sql`true`)
        .orderBy(desc(sales.saleDate));
    } catch (error) {
      console.error('TransactionRepository: Error in getSalesByDateRange:', error);
      throw error;
    }
  }

  async getTransactionSummary(filters: any = {}) {
    try {
      const conditions = [];

      if (filters.startDate) {
        conditions.push(gte(sales.saleDate, new Date(filters.startDate)));
      }

      if (filters.endDate) {
        conditions.push(lte(sales.saleDate, new Date(filters.endDate)));
      }

      if (filters.branchId) {
        conditions.push(eq(sales.branchId, filters.branchId));
      }

      const result = await db
        .select({
          totalRevenue: sql<number>`sum(${sales.totalAmount})`,
          totalTransactions: sql<number>`count(*)`,
          averageTransaction: sql<number>`avg(${sales.totalAmount})`
        })
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : sql`true`);

      return result[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 };
    } catch (error) {
      console.error('TransactionRepository: Error in getTransactionSummary:', error);
      throw error;
    }
  }

  async getRevenueByPeriod(period: string, startDate: Date, endDate: Date, branchId?: number) {
    try {
      const conditions = [
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      ];

      if (branchId) {
        conditions.push(eq(sales.branchId, branchId));
      }

      let dateFormat = 'YYYY-MM'; // Default to monthly
      let periodLabel = 'month';

      switch (period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          periodLabel = 'date';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          periodLabel = 'week';
          break;
        case 'quarterly':
          dateFormat = 'YYYY-"Q"Q';
          periodLabel = 'quarter';
          break;
        case 'yearly':
          dateFormat = 'YYYY';
          periodLabel = 'year';
          break;
      }

      return await db
        .select({
          period: sql`to_char(${sales.saleDate}, '${dateFormat}')`,
          total: sql<number>`sum(${sales.totalAmount})`,
          count: sql<number>`count(*)`
        })
        .from(sales)
        .where(and(...conditions))
        .groupBy(sql`to_char(${sales.saleDate}, '${dateFormat}')`)
        .orderBy(sql`to_char(${sales.saleDate}, '${dateFormat}')`);
    } catch (error) {
      console.error('TransactionRepository: Error in getRevenueByPeriod:', error);
      throw error;
    }
  }
}