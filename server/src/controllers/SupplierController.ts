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

  // Bulk delete suppliers
  bulkDeleteSuppliers = async (req: Request, res: Response) => {
    try {
      console.log('=== BULK DELETE SUPPLIERS START ===');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      
      const { supplierIds } = req.body;
      console.log('Received bulk delete request with body:', req.body);
      console.log('SupplierIds type:', typeof supplierIds, 'Value:', supplierIds);
      console.log('SupplierIds as JSON:', JSON.stringify(supplierIds));

      if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
        console.log('Invalid supplierIds array');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Supplier IDs array is required and cannot be empty'
        });
      }

      // Validate and parse supplier IDs
      const validIds: number[] = [];
      for (let i = 0; i < supplierIds.length; i++) {
        const id = supplierIds[i];
        console.log(`Processing ID at index ${i}: ${id} Type: ${typeof id}`);
        
        const parsedId = typeof id === 'string' ? parseInt(id, 10) : id;
        console.log(`Parsed value: ${parsedId} isNaN: ${isNaN(parsedId)} isFinite: ${isFinite(parsedId)}`);
        
        if (isNaN(parsedId) || !isFinite(parsedId) || parsedId <= 0) {
          console.log(`Invalid supplier ID: ${id} (parsed: ${parsedId})`);
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: `Invalid supplier ID: ${id}`
          });
        }
        
        validIds.push(parsedId);
        console.log(`Added valid ID: ${parsedId}`);
      }

      console.log('Original supplierIds:', supplierIds);
      console.log('Valid parsed IDs:', validIds);

      const result = await this.supplierService.bulkDeleteSuppliers(validIds);

      if (result.success) {
        console.log('=== BULK DELETE SUPPLIERS END ===');
        res.status(HTTP_STATUS.OK).json({
          message: `Successfully deleted ${result.deletedCount} supplier(s)`
        });
      } else {
        console.log('Bulk delete failed:', result.error);
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('SupplierController: Error in bulkDeleteSuppliers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}