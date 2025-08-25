import { Request, Response } from 'express';
import { ProfitLossReportService } from '../services/ProfitLossReportService';
// HTTP Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

export class ProfitLossController {
  /**
   * Get Overall P&L Report
   */
  getOverallReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId
      } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getOverallReport(start, end, branch);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting overall report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate overall P&L report'
      });
    }
  };

  /**
   * Get Product-wise P&L Report
   */
  getProductWiseReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId,
        limit = '100',
        offset = '0'
      } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getProductWiseReport(
        start,
        end,
        branch,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting product-wise report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate product-wise P&L report'
      });
    }
  };

  /**
   * Get Product Variant-wise P&L Report
   */
  getVariantWiseReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId,
        limit = '100',
        offset = '0'
      } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getVariantWiseReport(
        start,
        end,
        branch,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting variant-wise report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate variant-wise P&L report'
      });
    }
  };

  /**
   * Get Category-wise P&L Report
   */
  getCategoryWiseReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId
      } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getCategoryWiseReport(start, end, branch);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting category-wise report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate category-wise P&L report'
      });
    }
  };

  /**
   * Get Brand-wise P&L Report
   */
  getBrandWiseReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId
      } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getBrandWiseReport(start, end, branch);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting brand-wise report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate brand-wise P&L report'
      });
    }
  };

  /**
   * Get Daily P&L Report
   */
  getDailyReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId
      } = req.query;

      if (!startDate || !endDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Start date and end date are required for daily reports'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getDailyReport(start, end, branch);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting daily report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate daily P&L report'
      });
    }
  };

  /**
   * Get Monthly P&L Report
   */
  getMonthlyReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId
      } = req.query;

      if (!startDate || !endDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Start date and end date are required for monthly reports'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getMonthlyReport(start, end, branch);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting monthly report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate monthly P&L report'
      });
    }
  };

  /**
   * Get Yearly P&L Report
   */
  getYearlyReport = async (req: Request, res: Response) => {
    try {
      const {
        startDate,
        endDate,
        branchId
      } = req.query;

      if (!startDate || !endDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Start date and end date are required for yearly reports'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getYearlyReport(start, end, branch);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting yearly report:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate yearly P&L report'
      });
    }
  };

  /**
   * Get Top Performers (Products, Categories, Brands, Variants)
   */
  getTopPerformers = async (req: Request, res: Response) => {
    try {
      const {
        type = 'products',
        startDate,
        endDate,
        branchId,
        limit = '10',
        sortBy = 'profit'
      } = req.query;

      const validTypes = ['products', 'categories', 'brands', 'variants'];
      const validSortBy = ['revenue', 'profit', 'margin'];

      if (!validTypes.includes(type as string)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      if (!validSortBy.includes(sortBy as string)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Invalid sortBy. Must be one of: ${validSortBy.join(', ')}`
        });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const branch = branchId ? parseInt(branchId as string) : undefined;

      const report = await ProfitLossReportService.getTopPerformers(
        type as 'products' | 'categories' | 'brands' | 'variants',
        start,
        end,
        branch,
        parseInt(limit as string),
        sortBy as 'revenue' | 'profit' | 'margin'
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('ProfitLossController: Error getting top performers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate top performers report'
      });
    }
  };
}