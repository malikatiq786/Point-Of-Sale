import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  // Get all warehouses
  getWarehouses = async (req: Request, res: Response) => {
    try {
      console.log('InventoryController: Getting warehouses...');
      const result = await this.inventoryService.getWarehouses();
      console.log('InventoryController: Warehouse result:', result);

      if (result.success) {
        console.log('InventoryController: Returning warehouses:', result.data);
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        console.error('InventoryController: Failed to get warehouses:', result.error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in getWarehouses:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create warehouse
  createWarehouse = async (req: Request, res: Response) => {
    try {
      const result = await this.inventoryService.createWarehouse(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.VALIDATION_FAILED
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in createWarehouse:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update warehouse
  updateWarehouse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.inventoryService.updateWarehouse(parseInt(id), req.body);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.VALIDATION_FAILED
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in updateWarehouse:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Delete warehouse
  deleteWarehouse = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.inventoryService.deleteWarehouse(parseInt(id));

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.DELETED
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.VALIDATION_FAILED
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in deleteWarehouse:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get stock levels
  getStock = async (req: Request, res: Response) => {
    try {
      const { warehouseId, lowStock } = req.query;
      const result = await this.inventoryService.getStock(
        warehouseId ? parseInt(warehouseId as string) : undefined,
        lowStock === 'true'
      );

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in getStock:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Adjust stock
  adjustStock = async (req: Request, res: Response) => {
    try {
      const result = await this.inventoryService.adjustStock(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.VALIDATION_FAILED
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in adjustStock:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get stock transfers
  getStockTransfers = async (req: Request, res: Response) => {
    try {
      const result = await this.inventoryService.getStockTransfers();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in getStockTransfers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create stock transfer
  createStockTransfer = async (req: Request, res: Response) => {
    try {
      const result = await this.inventoryService.createStockTransfer(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.VALIDATION_FAILED
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in createStockTransfer:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get stock adjustments
  getStockAdjustments = async (req: Request, res: Response) => {
    try {
      const result = await this.inventoryService.getStockAdjustments();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('InventoryController: Error in getStockAdjustments:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}