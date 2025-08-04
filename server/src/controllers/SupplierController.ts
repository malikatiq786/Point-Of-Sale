import { Request, Response } from 'express';
import { SupplierService } from '../services/SupplierService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

export class SupplierController {
  private supplierService: SupplierService;

  constructor() {
    this.supplierService = new SupplierService();
  }

  // Get all suppliers
  getSuppliers = async (req: Request, res: Response) => {
    try {
      console.log('SupplierController: Getting suppliers...');
      const result = await this.supplierService.getSuppliers();
      console.log('SupplierController: Supplier result:', result);

      if (result.success) {
        console.log('SupplierController: Returning suppliers:', result.data);
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        console.error('SupplierController: Failed to get suppliers:', result.error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('SupplierController: Error in getSuppliers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get supplier by ID
  getSupplierById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.supplierService.getSupplierById(parseInt(id));

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: result.error || ERROR_MESSAGES.NOT_FOUND
        });
      }
    } catch (error) {
      console.error('SupplierController: Error in getSupplierById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create supplier
  createSupplier = async (req: Request, res: Response) => {
    try {
      console.log('SupplierController: Creating supplier:', req.body);
      const result = await this.supplierService.createSupplier(req.body);

      if (result.success) {
        console.log('SupplierController: Supplier created successfully:', result.data);
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        console.log('SupplierController: Failed to create supplier:', result.error);
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('SupplierController: Error in createSupplier:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update supplier
  updateSupplier = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.supplierService.updateSupplier(parseInt(id), req.body);

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
      console.error('SupplierController: Error in updateSupplier:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Delete supplier
  deleteSupplier = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.supplierService.deleteSupplier(parseInt(id));

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
      console.error('SupplierController: Error in deleteSupplier:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Search suppliers
  searchSuppliers = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const result = await this.supplierService.searchSuppliers(q as string);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('SupplierController: Error in searchSuppliers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}