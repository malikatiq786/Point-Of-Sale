import { Request, Response } from 'express';
import { ExpenseService } from '../services/ExpenseService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

export class ExpenseController {
  private expenseService: ExpenseService;

  constructor() {
    this.expenseService = new ExpenseService();
  }

  // =========================================
  // EXPENSE CRUD OPERATIONS
  // =========================================

  // Get all expenses with filters and pagination
  getExpenses = async (req: Request, res: Response) => {
    try {
      console.log('ExpenseController: Getting expenses with filters:', req.query);
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        branchId: req.query.branchId ? parseInt(req.query.branchId as string) : undefined,
        vendorId: req.query.vendorId ? parseInt(req.query.vendorId as string) : undefined,
        status: req.query.status as string,
        approvalStatus: req.query.approvalStatus as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        paymentMethod: req.query.paymentMethod as string,
        userId: req.query.userId as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await this.expenseService.getExpenses(filters);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          data: result.data,
          pagination: result.pagination,
          summary: result.summary
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in getExpenses:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get expense by ID with full details
  getExpenseById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.expenseService.getExpenseById(parseInt(id));

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: result.error || ERROR_MESSAGES.NOT_FOUND
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in getExpenseById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create new expense
  createExpense = async (req: Request, res: Response) => {
    try {
      console.log('ExpenseController: Creating expense:', req.body);
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          message: 'User authentication required'
        });
      }

      const expenseData = { ...req.body, createdBy: userId };
      const result = await this.expenseService.createExpense(expenseData);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in createExpense:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update expense
  updateExpense = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const result = await this.expenseService.updateExpense(parseInt(id), req.body, userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in updateExpense:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Delete expense
  deleteExpense = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const result = await this.expenseService.deleteExpense(parseInt(id), userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.DELETED
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in deleteExpense:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Bulk delete expenses
  bulkDeleteExpenses = async (req: Request, res: Response) => {
    try {
      const { expenseIds } = req.body;
      const userId = (req as any).user?.id;

      if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Expense IDs array is required and cannot be empty'
        });
      }

      const result = await this.expenseService.bulkDeleteExpenses(expenseIds, userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: `Successfully deleted ${result.deletedCount} expense(s)`
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in bulkDeleteExpenses:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // =========================================
  // EXPENSE CATEGORIES
  // =========================================

  getCategories = async (req: Request, res: Response) => {
    try {
      const result = await this.expenseService.getCategories();
      
      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in getCategories:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const result = await this.expenseService.createCategory(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in createCategory:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.expenseService.updateCategory(parseInt(id), req.body);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in updateCategory:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.expenseService.deleteCategory(parseInt(id));

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.DELETED
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in deleteCategory:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // =========================================
  // EXPENSE VENDORS
  // =========================================

  getVendors = async (req: Request, res: Response) => {
    try {
      const result = await this.expenseService.getVendors();
      
      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in getVendors:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  createVendor = async (req: Request, res: Response) => {
    try {
      const result = await this.expenseService.createVendor(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in createVendor:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // =========================================
  // EXPENSE BUDGETS
  // =========================================

  getBudgets = async (req: Request, res: Response) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        branchId: req.query.branchId ? parseInt(req.query.branchId as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        period: req.query.period as string,
      };

      const result = await this.expenseService.getBudgets(filters);
      
      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in getBudgets:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  createBudget = async (req: Request, res: Response) => {
    try {
      const result = await this.expenseService.createBudget(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in createBudget:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // =========================================
  // EXPENSE APPROVALS
  // =========================================

  approveExpense = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.expenseService.approveExpense(parseInt(id), userId, comments);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: 'Expense approved successfully',
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in approveExpense:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  rejectExpense = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.expenseService.rejectExpense(parseInt(id), userId, comments);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: 'Expense rejected successfully',
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in rejectExpense:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // =========================================
  // EXPENSE REPORTS
  // =========================================

  getExpenseReports = async (req: Request, res: Response) => {
    try {
      const reportType = req.params.reportType;
      const filters = req.query;

      const result = await this.expenseService.generateReport(reportType, filters as any);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          reportType,
          data: result.data,
          summary: result.summary,
          generatedAt: new Date().toISOString()
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in getExpenseReports:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const filters = {
        branchId: req.query.branchId ? parseInt(req.query.branchId as string) : undefined,
        period: req.query.period as string || 'monthly',
      };

      const result = await this.expenseService.getDashboardStats(filters);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ExpenseController: Error in getDashboardStats:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}