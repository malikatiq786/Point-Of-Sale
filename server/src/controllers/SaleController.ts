import { Request, Response } from 'express';
import { SaleService } from '../services/SaleService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

export class SaleController {
  private saleService: SaleService;

  constructor() {
    this.saleService = new SaleService();
  }

  // Process a new sale
  processSale = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const result = await this.saleService.processSale(req.body, userId);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.SALE_COMPLETED,
          data: result.data
        });
      } else {
        const status = result.error?.includes('Validation failed') || 
                     result.error?.includes('not found') ||
                     result.error?.includes('Insufficient stock')
          ? HTTP_STATUS.BAD_REQUEST 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('SaleController: Error in processSale:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get all sales with optional date range filtering
  getSales = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      let result;
      if (startDate && endDate) {
        // Use date range filtering
        result = await this.saleService.getSalesByDateRange(new Date(startDate), new Date(endDate));
      } else {
        // Get all sales with pagination
        result = await this.saleService.getSales(limit, offset);
      }

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('SaleController: Error in getSales:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get sale by ID
  getSaleById = async (req: Request, res: Response) => {
    try {
      const saleId = parseInt(req.params.id);
      
      if (isNaN(saleId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid sale ID'
        });
      }

      const result = await this.saleService.getSaleById(saleId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        const status = result.error === 'Sale not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('SaleController: Error in getSaleById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get sale items for a specific sale
  getSaleItems = async (req: Request, res: Response) => {
    try {
      const saleId = parseInt(req.params.id);
      
      if (isNaN(saleId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid sale ID'
        });
      }

      const result = await this.saleService.getSaleItems(saleId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('SaleController: Error in getSaleItems:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get sales by date range
  getSalesByDateRange = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid date format'
        });
      }

      const result = await this.saleService.getSalesByDateRange(start, end);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('SaleController: Error in getSalesByDateRange:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}