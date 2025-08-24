import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { ExpenseCategoryRepository } from '../repositories/ExpenseCategoryRepository';
import { ExpenseVendorRepository } from '../repositories/ExpenseVendorRepository';
import { ExpenseBudgetRepository } from '../repositories/ExpenseBudgetRepository';
import { InsertExpense, InsertExpenseCategory, InsertExpenseVendor, InsertExpenseBudget } from '@shared/schema';

export class ExpenseService {
  private expenseRepository: ExpenseRepository;
  private categoryRepository: ExpenseCategoryRepository;
  private vendorRepository: ExpenseVendorRepository;
  private budgetRepository: ExpenseBudgetRepository;

  constructor() {
    this.expenseRepository = new ExpenseRepository();
    this.categoryRepository = new ExpenseCategoryRepository();
    this.vendorRepository = new ExpenseVendorRepository();
    this.budgetRepository = new ExpenseBudgetRepository();
  }

  // =========================================
  // EXPENSE OPERATIONS
  // =========================================

  async getExpenses(filters: any = {}) {
    try {
      console.log('ExpenseService: Getting expenses with filters:', filters);
      const result = await this.expenseRepository.findAllWithFilters(filters);
      
      // Calculate summary statistics
      const summary = this.calculateExpenseSummary(result.data);
      
      return { 
        success: true, 
        data: result.data,
        pagination: result.pagination,
        summary 
      };
    } catch (error) {
      console.error('ExpenseService: Error getting expenses:', error);
      return { success: false, error: 'Failed to fetch expenses' };
    }
  }

  async getExpenseById(id: number) {
    try {
      const expense = await this.expenseRepository.findByIdWithDetails(id);
      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }
      return { success: true, data: expense };
    } catch (error) {
      console.error('ExpenseService: Error getting expense by id:', error);
      return { success: false, error: 'Failed to fetch expense' };
    }
  }

  async createExpense(expenseData: InsertExpense & { attachments?: any[] }) {
    try {
      console.log('ExpenseService: Creating expense:', expenseData);

      // Validate required fields
      if (!expenseData.amount || expenseData.amount <= 0) {
        return { success: false, error: 'Valid amount is required' };
      }

      if (!expenseData.expenseDate) {
        return { success: false, error: 'Expense date is required' };
      }

      if (!expenseData.paymentMethod) {
        return { success: false, error: 'Payment method is required' };
      }

      // Generate expense number
      const expenseNumber = await this.generateExpenseNumber();
      
      // Calculate total amount including tax
      const taxAmount = expenseData.taxAmount || 0;
      const totalAmount = Number(expenseData.amount) + Number(taxAmount);

      // Convert expenseDate string to Date object if needed
      const expenseDate = typeof expenseData.expenseDate === 'string' 
        ? new Date(expenseData.expenseDate) 
        : expenseData.expenseDate;

      // Prepare expense data
      const processedExpenseData = {
        ...expenseData,
        expenseDate,
        expenseNumber,
        totalAmount,
        taxAmount: taxAmount || 0,
        status: 'pending',
        approvalStatus: 'pending',
      };

      // Create the expense
      const expense = await this.expenseRepository.create(processedExpenseData);

      // Handle file attachments if provided
      if (expenseData.attachments && expenseData.attachments.length > 0) {
        // Process file uploads and update attachment URLs
        // This would integrate with your file upload service
        const attachmentUrls = expenseData.attachments.map(file => file.url);
        await this.expenseRepository.update(expense.id, { attachmentUrls });
      }

      // Create audit log
      await this.createAuditLog(expense.id, expenseData.createdBy, 'created', null, null, null);

      // Check for approval workflow
      await this.processApprovalWorkflow(expense);

      // Check budget limits and send notifications if exceeded
      await this.checkBudgetLimits(expense);

      return { success: true, data: expense };
    } catch (error) {
      console.error('ExpenseService: Error creating expense:', error);
      return { success: false, error: 'Failed to create expense' };
    }
  }

  async updateExpense(id: number, expenseData: Partial<InsertExpense>, userId: string) {
    try {
      // Get the existing expense
      const existingExpense = await this.expenseRepository.findById(id);
      if (!existingExpense) {
        return { success: false, error: 'Expense not found' };
      }

      // Check if user has permission to edit
      if (existingExpense.createdBy !== userId && !(await this.hasApprovalPermission(userId))) {
        return { success: false, error: 'Insufficient permissions to edit this expense' };
      }

      // Recalculate total if amount or tax changed
      if (expenseData.amount !== undefined || expenseData.taxAmount !== undefined) {
        const amount = expenseData.amount ?? existingExpense.amount;
        const taxAmount = expenseData.taxAmount ?? existingExpense.taxAmount ?? 0;
        expenseData.totalAmount = Number(amount) + Number(taxAmount);
      }

      // Update the expense
      const updatedExpense = await this.expenseRepository.update(id, expenseData);

      // Create audit logs for changed fields
      await this.createUpdateAuditLogs(id, userId, existingExpense, expenseData);

      return { success: true, data: updatedExpense };
    } catch (error) {
      console.error('ExpenseService: Error updating expense:', error);
      return { success: false, error: 'Failed to update expense' };
    }
  }

  async deleteExpense(id: number, userId: string) {
    try {
      const expense = await this.expenseRepository.findById(id);
      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      // Check permissions
      if (expense.createdBy !== userId && !(await this.hasDeletePermission(userId))) {
        return { success: false, error: 'Insufficient permissions to delete this expense' };
      }

      // Prevent deletion of approved expenses
      if (expense.approvalStatus === 'approved') {
        return { success: false, error: 'Cannot delete approved expenses' };
      }

      const success = await this.expenseRepository.delete(id);
      if (!success) {
        return { success: false, error: 'Expense not found' };
      }

      // Create audit log
      await this.createAuditLog(id, userId, 'deleted', null, null, null);

      return { success: true };
    } catch (error) {
      console.error('ExpenseService: Error deleting expense:', error);
      return { success: false, error: 'Failed to delete expense' };
    }
  }

  async bulkDeleteExpenses(expenseIds: number[], userId: string) {
    try {
      let deletedCount = 0;
      const failedIds: number[] = [];

      for (const expenseId of expenseIds) {
        try {
          const result = await this.deleteExpense(expenseId, userId);
          if (result.success) {
            deletedCount++;
          } else {
            failedIds.push(expenseId);
          }
        } catch (error) {
          failedIds.push(expenseId);
        }
      }

      if (failedIds.length > 0) {
        return { 
          success: false, 
          error: `Failed to delete expenses with IDs: ${failedIds.join(', ')}`,
          deletedCount 
        };
      }

      return { success: true, deletedCount };
    } catch (error) {
      console.error('ExpenseService: Error in bulk delete:', error);
      return { success: false, error: 'Failed to perform bulk delete operation' };
    }
  }

  // =========================================
  // CATEGORY OPERATIONS
  // =========================================

  async getCategories() {
    try {
      const categoryRepo = new (await import('../repositories/SimpleCategoryRepository')).SimpleCategoryRepository();
      const categories = await categoryRepo.findAll();
      return { success: true, data: categories };
    } catch (error) {
      console.error('ExpenseService: Error getting categories:', error);
      return { success: false, error: 'Failed to fetch categories' };
    }
  }

  async createCategory(categoryData: any) {
    try {
      if (!categoryData.name) {
        return { success: false, error: 'Category name is required' };
      }

      const categoryRepo = new (await import('../repositories/SimpleCategoryRepository')).SimpleCategoryRepository();
      const category = await categoryRepo.create({ name: categoryData.name });
      return { success: true, data: category };
    } catch (error) {
      console.error('ExpenseService: Error creating category:', error);
      return { success: false, error: 'Failed to create category' };
    }
  }

  async updateCategory(id: number, categoryData: Partial<InsertExpenseCategory>) {
    try {
      const category = await this.categoryRepository.update(id, categoryData);
      if (!category) {
        return { success: false, error: 'Category not found' };
      }
      return { success: true, data: category };
    } catch (error) {
      console.error('ExpenseService: Error updating category:', error);
      return { success: false, error: 'Failed to update category' };
    }
  }

  async deleteCategory(id: number) {
    try {
      // Check if category has expenses
      const hasExpenses = await this.expenseRepository.existsByCategoryId(id);
      if (hasExpenses) {
        return { success: false, error: 'Cannot delete category with existing expenses' };
      }

      const success = await this.categoryRepository.delete(id);
      if (!success) {
        return { success: false, error: 'Category not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('ExpenseService: Error deleting category:', error);
      return { success: false, error: 'Failed to delete category' };
    }
  }

  // =========================================
  // VENDOR OPERATIONS
  // =========================================

  async getVendors() {
    try {
      const vendorRepo = new (await import('../repositories/SimpleVendorRepository')).SimpleVendorRepository();
      const vendors = await vendorRepo.findAll();
      return { success: true, data: vendors };
    } catch (error) {
      console.error('ExpenseService: Error getting vendors:', error);
      return { success: false, error: 'Failed to fetch vendors' };
    }
  }

  async createVendor(vendorData: any) {
    try {
      if (!vendorData.name) {
        return { success: false, error: 'Vendor name is required' };
      }

      const vendorRepo = new (await import('../repositories/SimpleVendorRepository')).SimpleVendorRepository();
      const vendor = await vendorRepo.create({
        name: vendorData.name,
        email: vendorData.email,
        phone: vendorData.phone
      });
      return { success: true, data: vendor };
    } catch (error) {
      console.error('ExpenseService: Error creating vendor:', error);
      return { success: false, error: 'Failed to create vendor' };
    }
  }

  // =========================================
  // BUDGET OPERATIONS
  // =========================================

  async getBudgets(filters: any = {}) {
    try {
      const budgets = await this.budgetRepository.findAllWithFilters(filters);
      return { success: true, data: budgets };
    } catch (error) {
      console.error('ExpenseService: Error getting budgets:', error);
      return { success: false, error: 'Failed to fetch budgets' };
    }
  }

  async createBudget(budgetData: InsertExpenseBudget) {
    try {
      // Validate required fields
      if (!budgetData.categoryId || !budgetData.budgetAmount || !budgetData.period || !budgetData.year) {
        return { success: false, error: 'Category, amount, period, and year are required' };
      }

      // Check for duplicate budget
      const existingBudget = await this.budgetRepository.findExisting(
        budgetData.categoryId,
        budgetData.branchId,
        budgetData.period,
        budgetData.year,
        budgetData.month,
        budgetData.quarter
      );

      if (existingBudget) {
        return { success: false, error: 'Budget already exists for this category and period' };
      }

      const budget = await this.budgetRepository.create(budgetData);
      return { success: true, data: budget };
    } catch (error) {
      console.error('ExpenseService: Error creating budget:', error);
      return { success: false, error: 'Failed to create budget' };
    }
  }

  // =========================================
  // APPROVAL OPERATIONS
  // =========================================

  async approveExpense(expenseId: number, approverId: string, comments?: string) {
    try {
      const expense = await this.expenseRepository.findById(expenseId);
      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      if (expense.approvalStatus === 'approved') {
        return { success: false, error: 'Expense is already approved' };
      }

      // Update expense status
      await this.expenseRepository.update(expenseId, {
        approvalStatus: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
      });

      // Create approval record
      await this.createApprovalRecord(expenseId, approverId, 'approved', comments);

      // Create audit log
      await this.createAuditLog(expenseId, approverId, 'approved', null, null, null);

      // Send notification to expense creator
      await this.sendApprovalNotification(expenseId, 'approved');

      return { success: true, data: { message: 'Expense approved successfully' } };
    } catch (error) {
      console.error('ExpenseService: Error approving expense:', error);
      return { success: false, error: 'Failed to approve expense' };
    }
  }

  async rejectExpense(expenseId: number, approverId: string, comments?: string) {
    try {
      const expense = await this.expenseRepository.findById(expenseId);
      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      // Update expense status
      await this.expenseRepository.update(expenseId, {
        approvalStatus: 'rejected',
      });

      // Create approval record
      await this.createApprovalRecord(expenseId, approverId, 'rejected', comments);

      // Create audit log
      await this.createAuditLog(expenseId, approverId, 'rejected', null, null, null);

      // Send notification to expense creator
      await this.sendApprovalNotification(expenseId, 'rejected');

      return { success: true, data: { message: 'Expense rejected successfully' } };
    } catch (error) {
      console.error('ExpenseService: Error rejecting expense:', error);
      return { success: false, error: 'Failed to reject expense' };
    }
  }

  // =========================================
  // REPORTING OPERATIONS
  // =========================================

  async generateReport(reportType: string, filters: any) {
    try {
      console.log('ExpenseService: Generating report:', reportType, filters);

      switch (reportType) {
        case 'daily':
          return await this.generateDailyReport(filters);
        case 'category':
          return await this.generateCategoryReport(filters);
        case 'vendor':
          return await this.generateVendorReport(filters);
        case 'branch':
          return await this.generateBranchReport(filters);
        case 'budget-vs-actual':
          return await this.generateBudgetVsActualReport(filters);
        case 'expense-trends':
          return await this.generateExpenseTrendsReport(filters);
        default:
          return { success: false, error: 'Invalid report type' };
      }
    } catch (error) {
      console.error('ExpenseService: Error generating report:', error);
      return { success: false, error: 'Failed to generate report' };
    }
  }

  async getDashboardStats(filters: any = {}) {
    try {
      const stats = await this.expenseRepository.getDashboardStatistics(filters);
      return { success: true, data: stats };
    } catch (error) {
      console.error('ExpenseService: Error getting dashboard stats:', error);
      return { success: false, error: 'Failed to fetch dashboard statistics' };
    }
  }

  // =========================================
  // HELPER METHODS
  // =========================================

  private async generateExpenseNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.expenseRepository.getCountForMonth(year, parseInt(month));
    return `EXP-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }

  private calculateExpenseSummary(expenses: any[]) {
    return {
      total: expenses.reduce((sum, exp) => sum + Number(exp.totalAmount || 0), 0),
      count: expenses.length,
      pending: expenses.filter(exp => exp.approvalStatus === 'pending').length,
      approved: expenses.filter(exp => exp.approvalStatus === 'approved').length,
      rejected: expenses.filter(exp => exp.approvalStatus === 'rejected').length,
    };
  }

  private async processApprovalWorkflow(expense: any) {
    // Implementation for automatic approval workflow processing
    // This would check approval workflows and create necessary approval records
    console.log('Processing approval workflow for expense:', expense.id);
  }

  private async checkBudgetLimits(expense: any) {
    // Implementation for budget limit checking and notifications
    console.log('Checking budget limits for expense:', expense.id);
  }

  private async createAuditLog(expenseId: number, userId: string, action: string, fieldChanged?: string, oldValue?: any, newValue?: any) {
    // Implementation for creating audit logs
    console.log('Creating audit log:', { expenseId, userId, action, fieldChanged });
  }

  private async createUpdateAuditLogs(expenseId: number, userId: string, existing: any, updates: any) {
    // Implementation for creating audit logs for field updates
    console.log('Creating update audit logs for expense:', expenseId);
  }

  private async hasApprovalPermission(userId: string): Promise<boolean> {
    // Implementation for checking approval permissions
    return true; // Placeholder
  }

  private async hasDeletePermission(userId: string): Promise<boolean> {
    // Implementation for checking delete permissions
    return true; // Placeholder
  }

  private async createApprovalRecord(expenseId: number, approverId: string, status: string, comments?: string) {
    // Implementation for creating approval records
    console.log('Creating approval record:', { expenseId, approverId, status });
  }

  private async sendApprovalNotification(expenseId: number, status: string) {
    // Implementation for sending approval notifications
    console.log('Sending approval notification:', { expenseId, status });
  }

  private async generateDailyReport(filters: any) {
    const data = await this.expenseRepository.getDailyExpenses(filters);
    return { success: true, data, summary: this.calculateExpenseSummary(data) };
  }

  private async generateCategoryReport(filters: any) {
    const data = await this.expenseRepository.getExpensesByCategory(filters);
    return { success: true, data, summary: this.calculateExpenseSummary(data) };
  }

  private async generateVendorReport(filters: any) {
    const data = await this.expenseRepository.getExpensesByVendor(filters);
    return { success: true, data, summary: this.calculateExpenseSummary(data) };
  }

  private async generateBranchReport(filters: any) {
    const data = await this.expenseRepository.getExpensesByBranch(filters);
    return { success: true, data, summary: this.calculateExpenseSummary(data) };
  }

  private async generateBudgetVsActualReport(filters: any) {
    const data = await this.budgetRepository.getBudgetVsActualData(filters);
    return { success: true, data };
  }

  private async generateExpenseTrendsReport(filters: any) {
    const data = await this.expenseRepository.getExpenseTrends(filters);
    return { success: true, data };
  }
}