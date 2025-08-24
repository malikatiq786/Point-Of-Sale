import { BaseRepository } from './BaseRepository';
import { expenseBudgets, expenseCategories, branches } from '@shared/schema';
import { InsertExpenseBudget, SelectExpenseBudget } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export class ExpenseBudgetRepository extends BaseRepository<typeof expenseBudgets, InsertExpenseBudget, SelectExpenseBudget> {
  constructor() {
    super(expenseBudgets);
  }

  async findAllWithFilters(filters: any = {}) {
    try {
      console.log('ExpenseBudgetRepository: Finding budgets with filters:', filters);
      
      const { categoryId, branchId, year, period } = filters;

      let query = this.db
        .select({
          budget: expenseBudgets,
          category: {
            id: expenseCategories.id,
            name: expenseCategories.name,
          },
          branch: {
            id: branches.id,
            name: branches.name,
          }
        })
        .from(expenseBudgets)
        .leftJoin(expenseCategories, eq(expenseBudgets.categoryId, expenseCategories.id))
        .leftJoin(branches, eq(expenseBudgets.branchId, branches.id));

      const conditions = [eq(expenseBudgets.isActive, true)];

      if (categoryId) {
        conditions.push(eq(expenseBudgets.categoryId, categoryId));
      }

      if (branchId) {
        conditions.push(eq(expenseBudgets.branchId, branchId));
      }

      if (year) {
        conditions.push(eq(expenseBudgets.year, year));
      }

      if (period) {
        conditions.push(eq(expenseBudgets.period, period));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(expenseBudgets.year, expenseBudgets.period);
    } catch (error) {
      console.error('ExpenseBudgetRepository: Error in findAllWithFilters:', error);
      throw error;
    }
  }

  async findExisting(
    categoryId: number,
    branchId?: number,
    period?: string,
    year?: number,
    month?: number,
    quarter?: number
  ) {
    try {
      const conditions = [
        eq(expenseBudgets.categoryId, categoryId),
        eq(expenseBudgets.isActive, true)
      ];

      if (branchId) {
        conditions.push(eq(expenseBudgets.branchId, branchId));
      }

      if (period) {
        conditions.push(eq(expenseBudgets.period, period));
      }

      if (year) {
        conditions.push(eq(expenseBudgets.year, year));
      }

      if (month) {
        conditions.push(eq(expenseBudgets.month, month));
      }

      if (quarter) {
        conditions.push(eq(expenseBudgets.quarter, quarter));
      }

      const [budget] = await this.db
        .select()
        .from(expenseBudgets)
        .where(and(...conditions))
        .limit(1);

      return budget;
    } catch (error) {
      console.error('ExpenseBudgetRepository: Error in findExisting:', error);
      throw error;
    }
  }

  async getBudgetVsActualData(filters: any = {}) {
    try {
      console.log('ExpenseBudgetRepository: Getting budget vs actual data:', filters);
      
      const { categoryId, branchId, year, period } = filters;
      
      // This query would need to join with expenses to calculate actual vs budget
      // For now, returning budget data - the actual comparison logic would be implemented here
      const conditions = [eq(expenseBudgets.isActive, true)];

      if (categoryId) {
        conditions.push(eq(expenseBudgets.categoryId, categoryId));
      }

      if (branchId) {
        conditions.push(eq(expenseBudgets.branchId, branchId));
      }

      if (year) {
        conditions.push(eq(expenseBudgets.year, year));
      }

      if (period) {
        conditions.push(eq(expenseBudgets.period, period));
      }

      const budgets = await this.db
        .select({
          budget: expenseBudgets,
          category: {
            id: expenseCategories.id,
            name: expenseCategories.name,
          },
          branch: {
            id: branches.id,
            name: branches.name,
          },
          // These would be calculated from actual expenses
          actualAmount: sql<number>`0`,
          variance: sql<number>`0`,
          utilizationPercentage: sql<number>`0`,
        })
        .from(expenseBudgets)
        .leftJoin(expenseCategories, eq(expenseBudgets.categoryId, expenseCategories.id))
        .leftJoin(branches, eq(expenseBudgets.branchId, branches.id))
        .where(and(...conditions))
        .orderBy(expenseBudgets.year, expenseBudgets.period);

      return budgets;
    } catch (error) {
      console.error('ExpenseBudgetRepository: Error in getBudgetVsActualData:', error);
      throw error;
    }
  }

  async getBudgetUtilization(budgetId: number) {
    try {
      // This would calculate actual spending against the budget
      // Implementation would join with expenses table to get actual amounts
      const [budget] = await this.db
        .select()
        .from(expenseBudgets)
        .where(eq(expenseBudgets.id, budgetId))
        .limit(1);

      if (!budget) {
        return null;
      }

      // Placeholder calculation - would be replaced with actual expense aggregation
      return {
        budgetId: budget.id,
        budgetAmount: budget.budgetAmount,
        actualAmount: 0,
        variance: 0,
        utilizationPercentage: 0,
        isOverBudget: false,
      };
    } catch (error) {
      console.error('ExpenseBudgetRepository: Error in getBudgetUtilization:', error);
      throw error;
    }
  }

  async getBudgetAlerts(thresholdPercentage: number = 80) {
    try {
      // This would find budgets that are over the threshold percentage
      // Implementation would calculate actual vs budget and return alerts
      const budgets = await this.db
        .select({
          budget: expenseBudgets,
          category: expenseCategories.name,
          branch: branches.name,
        })
        .from(expenseBudgets)
        .leftJoin(expenseCategories, eq(expenseBudgets.categoryId, expenseCategories.id))
        .leftJoin(branches, eq(expenseBudgets.branchId, branches.id))
        .where(eq(expenseBudgets.isActive, true));

      // Placeholder - would filter based on actual utilization calculation
      return budgets.map(budget => ({
        ...budget,
        utilizationPercentage: 0,
        isOverThreshold: false,
        alertMessage: '',
      }));
    } catch (error) {
      console.error('ExpenseBudgetRepository: Error in getBudgetAlerts:', error);
      throw error;
    }
  }
}