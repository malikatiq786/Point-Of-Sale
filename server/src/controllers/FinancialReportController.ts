import { Request, Response } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { FinancialReportService } from '../services/FinancialReportService.js';

export class FinancialReportController {
  private financialReportService: FinancialReportService;

  constructor() {
    this.financialReportService = new FinancialReportService();
  }

  getFinancialReport = async (req: Request, res: Response) => {
    try {
      const reportType = req.params.reportType;
      const { dateFrom, dateTo, period, branchId } = req.query;

      const filters = {
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        period: period as string || 'monthly',
        branchId: branchId ? parseInt(branchId as string) : undefined
      };

      console.log('FinancialReportController: Generating financial report:', reportType, filters);

      const result = await this.financialReportService.generateFinancialReport(reportType as string, filters);

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
      console.error('FinancialReportController: Error in getFinancialReport:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  getDashboardSummary = async (req: Request, res: Response) => {
    try {
      const { period, branchId, dateFrom, dateTo } = req.query;

      const filters = {
        period: period as string || 'monthly',
        branchId: branchId ? parseInt(branchId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      };

      console.log('FinancialReportController: Getting dashboard summary with filters:', filters);

      const result = await this.financialReportService.getDashboardSummary(filters);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('FinancialReportController: Error in getDashboardSummary:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  getProfitLossData = async (req: Request, res: Response) => {
    try {
      const { period, dateFrom, dateTo, branchId } = req.query;

      const filters = {
        period: period as string || 'monthly',
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        branchId: branchId ? parseInt(branchId as string) : undefined
      };

      console.log('FinancialReportController: Getting profit loss data:', filters);

      const result = await this.financialReportService.getProfitLossData(filters);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('FinancialReportController: Error in getProfitLossData:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  getExpenseBreakdown = async (req: Request, res: Response) => {
    try {
      const { period, dateFrom, dateTo, branchId } = req.query;

      const filters = {
        period: period as string || 'monthly',
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        branchId: branchId ? parseInt(branchId as string) : undefined
      };

      console.log('FinancialReportController: Getting expense breakdown:', filters);

      const result = await this.financialReportService.getExpenseBreakdown(filters);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('FinancialReportController: Error in getExpenseBreakdown:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}