import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { SaleService } from '../services/SaleService';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export class DashboardController {
  private dashboardService: DashboardService;
  private saleService: SaleService;

  constructor() {
    this.dashboardService = new DashboardService();
    this.saleService = new SaleService();
  }

  // Get dashboard statistics
  getStats = async (req: Request, res: Response) => {
    try {
      const result = await this.dashboardService.getDashboardStats();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('DashboardController: Error in getStats:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get recent activities
  getActivities = async (req: Request, res: Response) => {
    try {
      const result = await this.dashboardService.getRecentActivities();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('DashboardController: Error in getActivities:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get top products
  getTopProducts = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const result = await this.dashboardService.getTopProducts(limit);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('DashboardController: Error in getTopProducts:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get recent transactions
  getRecentTransactions = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const result = await this.saleService.getRecentTransactions(limit);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('DashboardController: Error in getRecentTransactions:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}