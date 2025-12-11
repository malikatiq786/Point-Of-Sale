import { BaseRepository } from './BaseRepository';
import { expenses, expenseCategories, expenseVendors, branches, users } from '@shared/schema';
import { InsertExpense, SelectExpense } from '@shared/schema';
import { eq, and, gte, lte, like, sql, desc, asc } from 'drizzle-orm';

export class ExpenseRepository extends BaseRepository<typeof expenses, InsertExpense, SelectExpense> {
  constructor() {
    super(expenses);
  }

  async findAllWithFilters(filters: any = {}) {
    try {
      console.log('ExpenseRepository: Finding expenses with filters:', filters);
      
      const {
        categoryId,
        branchId,
        vendorId,
        status,
        approvalStatus,
        startDate,
        endDate,
        paymentMethod,
        userId,
        page = 1,
        limit = 50,
        sortBy = 'expenseDate',
        sortOrder = 'desc'
      } = filters;

      let query = this.db
        .select({
          expense: expenses,
          category: {
            id: expenseCategories.id,
            name: expenseCategories.name,
          },
          vendor: {
            id: expenseVendors.id,
            name: expenseVendors.name,
          },
          branch: {
            id: branches.id,
            name: branches.name,
          },
          creator: {
            id: users.id,
            name: users.name,
          }
        })
        .from(expenses)
        .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
        .leftJoin(expenseVendors, eq(expenses.vendorId, expenseVendors.id))
        .leftJoin(branches, eq(expenses.branchId, branches.id))
        .leftJoin(users, eq(expenses.createdBy, users.id));

      // Apply filters
      const conditions = [];

      if (categoryId) {
        conditions.push(eq(expenses.categoryId, categoryId));
      }

      if (branchId) {
        conditions.push(eq(expenses.branchId, branchId));
      }

      if (vendorId) {
        conditions.push(eq(expenses.vendorId, vendorId));
      }

      if (status) {
        conditions.push(eq(expenses.status, status));
      }

      if (approvalStatus) {
        conditions.push(eq(expenses.approvalStatus, approvalStatus));
      }

      if (paymentMethod) {
        conditions.push(eq(expenses.paymentMethod, paymentMethod));
      }

      if (userId) {
        conditions.push(eq(expenses.createdBy, userId));
      }

      if (startDate) {
        conditions.push(gte(expenses.expenseDate, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(expenses.expenseDate, new Date(endDate)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = expenses[sortBy] || expenses.expenseDate;
      query = query.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      const data = await query.limit(limit).offset(offset);

      // Get total count for pagination
      let countQuery = this.db
        .select({ count: sql<number>`count(*)` })
        .from(expenses);

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }

      const [{ count: total }] = await countQuery;

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      console.error('ExpenseRepository: Error in findAllWithFilters:', error);
      throw error;
    }
  }

  async findByIdWithDetails(id: number) {
    try {
      const [expense] = await this.db
        .select({
          expense: expenses,
          category: {
            id: expenseCategories.id,
            name: expenseCategories.name,
          },
          vendor: {
            id: expenseVendors.id,
            name: expenseVendors.name,
            email: expenseVendors.email,
            phone: expenseVendors.phone,
          },
          branch: {
            id: branches.id,
            name: branches.name,
          },
          creator: {
            id: users.id,
            name: users.name,
            email: users.email,
          }
        })
        .from(expenses)
        .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
        .leftJoin(expenseVendors, eq(expenses.vendorId, expenseVendors.id))
        .leftJoin(branches, eq(expenses.branchId, branches.id))
        .leftJoin(users, eq(expenses.createdBy, users.id))
        .where(eq(expenses.id, id));

      return expense;
    } catch (error) {
      console.error('ExpenseRepository: Error in findByIdWithDetails:', error);
      throw error;
    }
  }

  async existsByCategoryId(categoryId: number): Promise<boolean> {
    try {
      const [result] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(expenses)
        .where(eq(expenses.categoryId, categoryId));

      return result.count > 0;
    } catch (error) {
      console.error('ExpenseRepository: Error in existsByCategoryId:', error);
      throw error;
    }
  }

  async getCountForMonth(year: number, month: number): Promise<number> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const [result] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(expenses)
        .where(
          and(
            gte(expenses.expenseDate, startDate),
            lte(expenses.expenseDate, endDate)
          )
        );

      return result.count;
    } catch (error) {
      console.error('ExpenseRepository: Error in getCountForMonth:', error);
      throw error;
    }
  }

  async getDashboardStatistics(filters: any = {}) {
    try {
      const { branchId, period = 'monthly' } = filters;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'weekly':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarterly':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const conditions = [gte(expenses.expenseDate, startDate)];
      
      if (branchId) {
        conditions.push(eq(expenses.branchId, branchId));
      }

      // Total expenses
      const [totalResult] = await this.db
        .select({
          count: sql<number>`count(*)`,
          sum: sql<number>`sum(${expenses.totalAmount})`
        })
        .from(expenses)
        .where(and(...conditions));

      // Expenses by status
      const statusStats = await this.db
        .select({
          status: expenses.approvalStatus,
          count: sql<number>`count(*)`,
          sum: sql<number>`sum(${expenses.totalAmount})`
        })
        .from(expenses)
        .where(and(...conditions))
        .groupBy(expenses.approvalStatus);

      // Top categories
      const topCategories = await this.db
        .select({
          categoryId: expenses.categoryId,
          categoryName: expenseCategories.name,
          count: sql<number>`count(*)`,
          sum: sql<number>`sum(${expenses.totalAmount})`
        })
        .from(expenses)
        .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
        .where(and(...conditions))
        .groupBy(expenses.categoryId, expenseCategories.name)
        .orderBy(desc(sql`sum(${expenses.totalAmount})`))
        .limit(10);

      // Monthly trends (last 12 months)
      const monthlyTrends = await this.db
        .select({
          month: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM')`,
          count: sql<number>`count(*)`,
          sum: sql<number>`sum(${expenses.totalAmount})`
        })
        .from(expenses)
        .where(
          and(
            gte(expenses.expenseDate, new Date(now.getFullYear() - 1, now.getMonth(), 1)),
            branchId ? eq(expenses.branchId, branchId) : sql`true`
          )
        )
        .groupBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`);

      return {
        summary: {
          totalExpenses: totalResult.sum || 0,
          totalCount: totalResult.count || 0,
          period: period,
        },
        statusBreakdown: statusStats,
        topCategories: topCategories,
        monthlyTrends: monthlyTrends,
      };
    } catch (error) {
      console.error('ExpenseRepository: Error in getDashboardStatistics:', error);
      throw error;
    }
  }

  // Report-specific methods
  async getDailyExpenses(filters: any = {}) {
    try {
      const { date = new Date().toISOString().split('T')[0], branchId } = filters;
      
      const conditions = [
        sql`date(${expenses.expenseDate}) = ${date}`
      ];

      if (branchId) {
        conditions.push(eq(expenses.branchId, branchId));
      }

      return await this.db
        .select({
          expense: expenses,
          category: expenseCategories.name,
          vendor: expenseVendors.name,
          creator: users.name,
        })
        .from(expenses)
        .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
        .leftJoin(expenseVendors, eq(expenses.vendorId, expenseVendors.id))
        .leftJoin(users, eq(expenses.createdBy, users.id))
        .where(and(...conditions))
        .orderBy(desc(expenses.expenseDate));
    } catch (error) {
      console.error('ExpenseRepository: Error in getDailyExpenses:', error);
      throw error;
    }
  }

  async getExpensesByCategory(filters: any = {}) {
    try {
      const { startDate, endDate, branchId } = filters;
      
      const conditions = [];

      if (startDate) {
        conditions.push(gte(expenses.expenseDate, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(expenses.expenseDate, new Date(endDate)));
      }

      if (branchId) {
        conditions.push(eq(expenses.branchId, branchId));
      }

      return await this.db
        .select({
          categoryId: expenses.categoryId,
          categoryName: expenseCategories.name,
          count: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(${expenses.totalAmount})`,
          averageAmount: sql<number>`avg(${expenses.totalAmount})`,
        })
        .from(expenses)
        .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
        .where(conditions.length > 0 ? and(...conditions) : sql`true`)
        .groupBy(expenses.categoryId, expenseCategories.name)
        .orderBy(desc(sql`sum(${expenses.totalAmount})`));
    } catch (error) {
      console.error('ExpenseRepository: Error in getExpensesByCategory:', error);
      throw error;
    }
  }

  async getExpensesByVendor(filters: any = {}) {
    try {
      const { startDate, endDate, branchId } = filters;
      
      const conditions = [];

      if (startDate) {
        conditions.push(gte(expenses.expenseDate, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(expenses.expenseDate, new Date(endDate)));
      }

      if (branchId) {
        conditions.push(eq(expenses.branchId, branchId));
      }

      return await this.db
        .select({
          vendorId: expenses.vendorId,
          vendorName: expenseVendors.name,
          count: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(${expenses.totalAmount})`,
          averageAmount: sql<number>`avg(${expenses.totalAmount})`,
        })
        .from(expenses)
        .leftJoin(expenseVendors, eq(expenses.vendorId, expenseVendors.id))
        .where(conditions.length > 0 ? and(...conditions) : sql`true`)
        .groupBy(expenses.vendorId, expenseVendors.name)
        .orderBy(desc(sql`sum(${expenses.totalAmount})`));
    } catch (error) {
      console.error('ExpenseRepository: Error in getExpensesByVendor:', error);
      throw error;
    }
  }

  async getExpensesByBranch(filters: any = {}) {
    try {
      const { startDate, endDate } = filters;
      
      const conditions = [];

      if (startDate) {
        conditions.push(gte(expenses.expenseDate, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(expenses.expenseDate, new Date(endDate)));
      }

      return await this.db
        .select({
          branchId: expenses.branchId,
          branchName: branches.name,
          count: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(${expenses.totalAmount})`,
          averageAmount: sql<number>`avg(${expenses.totalAmount})`,
        })
        .from(expenses)
        .leftJoin(branches, eq(expenses.branchId, branches.id))
        .where(conditions.length > 0 ? and(...conditions) : sql`true`)
        .groupBy(expenses.branchId, branches.name)
        .orderBy(desc(sql`sum(${expenses.totalAmount})`));
    } catch (error) {
      console.error('ExpenseRepository: Error in getExpensesByBranch:', error);
      throw error;
    }
  }

  async getExpenseTrends(filters: any = {}) {
    try {
      const { period = 'monthly', branchId, categoryId } = filters;
      
      let dateFormat: string;
      switch (period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          break;
        case 'quarterly':
          dateFormat = 'YYYY-"Q"Q';
          break;
        case 'yearly':
          dateFormat = 'YYYY';
          break;
        default:
          dateFormat = 'YYYY-MM';
      }

      const conditions = [];

      if (branchId) {
        conditions.push(eq(expenses.branchId, branchId));
      }

      if (categoryId) {
        conditions.push(eq(expenses.categoryId, categoryId));
      }

      return await this.db
        .select({
          period: sql<string>`to_char(${expenses.expenseDate}, '${dateFormat}')`,
          count: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(${expenses.totalAmount})`,
          averageAmount: sql<number>`avg(${expenses.totalAmount})`,
        })
        .from(expenses)
        .where(conditions.length > 0 ? and(...conditions) : sql`true`)
        .groupBy(sql`to_char(${expenses.expenseDate}, '${dateFormat}')`)
        .orderBy(sql`to_char(${expenses.expenseDate}, '${dateFormat}')`);
    } catch (error) {
      console.error('ExpenseRepository: Error in getExpenseTrends:', error);
      throw error;
    }
  }
}