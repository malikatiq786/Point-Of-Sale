import { Request, Response } from 'express';
import { ReturnService } from '../services/ReturnService';
import { AuthenticatedRequest, HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

export class ReturnController {
  private returnService: ReturnService;

  constructor() {
    this.returnService = new ReturnService();
  }

  // Create a new return
  createReturn = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const result = await this.returnService.createReturn(req.body, userId);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: 'Return created successfully',
          data: result.data
        });
      } else {
        const status = result.error?.includes('Validation failed') || 
                     result.error?.includes('not found')
          ? HTTP_STATUS.BAD_REQUEST 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ReturnController: Error in createReturn:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get all returns with optional date range filtering
  getReturns = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      console.log(`ReturnController: getReturns called with startDate=${startDate}, endDate=${endDate}`);
      
      let result;
      if (startDate && endDate) {
        // Use date range filtering
        console.log(`ReturnController: Using date range filtering from ${startDate} to ${endDate}`);
        result = await this.returnService.getReturnsByDateRange(new Date(startDate), new Date(endDate));
      } else {
        // Get all returns with pagination
        console.log(`ReturnController: Using pagination - limit: ${limit}, offset: ${offset}`);
        result = await this.returnService.getReturns(limit, offset);
      }

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ReturnController: Error in getReturns:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get return by ID
  getReturnById = async (req: Request, res: Response) => {
    try {
      const returnId = parseInt(req.params.id);
      
      if (isNaN(returnId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid return ID'
        });
      }

      const result = await this.returnService.getReturnById(returnId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        const status = result.error === 'Return not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ReturnController: Error in getReturnById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update return status
  updateReturnStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const returnId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.user?.id;
      
      if (isNaN(returnId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid return ID'
        });
      }

      if (!status) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Status is required'
        });
      }

      const result = await this.returnService.updateReturnStatus(returnId, status, userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: 'Return status updated successfully',
          data: result.data
        });
      } else {
        const status = result.error === 'Return not found' || result.error?.includes('Invalid status')
          ? HTTP_STATUS.BAD_REQUEST 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ReturnController: Error in updateReturnStatus:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get returns by date range
  getReturnsByDateRange = async (req: Request, res: Response) => {
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

      const result = await this.returnService.getReturnsByDateRange(start, end);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ReturnController: Error in getReturnsByDateRange:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get today's returns count for dashboard
  getTodaysReturnsCount = async (req: Request, res: Response) => {
    try {
      const result = await this.returnService.getTodaysReturnsCount();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ReturnController: Error in getTodaysReturnsCount:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get bulk return items for multiple returns
  getBulkReturnItems = async (req: Request, res: Response) => {
    try {
      const { returnIds } = req.body;
      
      if (!returnIds || !Array.isArray(returnIds)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Return IDs are required and must be an array'
        });
      }

      const result = await this.returnService.getBulkReturnItems(returnIds);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ReturnController: Error in getBulkReturnItems:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}