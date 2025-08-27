import { Request, Response } from 'express';
import { TaxService } from '../services/TaxService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { taxCreateSchema, taxUpdateSchema } from '../validators';

export class TaxController {
  private taxService: TaxService;

  constructor() {
    this.taxService = new TaxService();
  }

  // Get all taxes
  getAllTaxes = async (req: Request, res: Response) => {
    try {
      const result = await this.taxService.getAllTaxes();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('TaxController: Error in getAllTaxes:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get enabled taxes only (for POS and invoicing)
  getEnabledTaxes = async (req: Request, res: Response) => {
    try {
      const result = await this.taxService.getEnabledTaxes();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('TaxController: Error in getEnabledTaxes:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get tax by ID
  getTaxById = async (req: Request, res: Response) => {
    try {
      const taxId = parseInt(req.params.id);
      if (isNaN(taxId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid tax ID'
        });
      }

      const result = await this.taxService.getTaxById(taxId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: result.error || ERROR_MESSAGES.NOT_FOUND
        });
      }
    } catch (error) {
      console.error('TaxController: Error in getTaxById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create new tax
  createTax = async (req: Request, res: Response) => {
    try {
      console.log('TaxController: Creating tax with data:', req.body);

      // Validate input
      const validation = taxCreateSchema.safeParse(req.body);
      if (!validation.success) {
        const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Validation failed',
          errors
        });
      }

      const result = await this.taxService.createTax(validation.data);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: result.message || SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('TaxController: Error in createTax:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update existing tax
  updateTax = async (req: Request, res: Response) => {
    try {
      const taxId = parseInt(req.params.id);
      if (isNaN(taxId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid tax ID'
        });
      }

      console.log('TaxController: Updating tax:', taxId, req.body);

      // Validate input
      const validation = taxUpdateSchema.safeParse({ id: taxId, ...req.body });
      if (!validation.success) {
        const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Validation failed',
          errors
        });
      }

      const { id, ...updateData } = validation.data;
      const result = await this.taxService.updateTax(id, updateData);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: result.message || SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('TaxController: Error in updateTax:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Delete tax
  deleteTax = async (req: Request, res: Response) => {
    try {
      const taxId = parseInt(req.params.id);
      if (isNaN(taxId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid tax ID'
        });
      }

      const result = await this.taxService.deleteTax(taxId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: result.message || SUCCESS_MESSAGES.DELETED
        });
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: result.error || ERROR_MESSAGES.NOT_FOUND
        });
      }
    } catch (error) {
      console.error('TaxController: Error in deleteTax:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Toggle tax enabled status
  toggleTaxEnabled = async (req: Request, res: Response) => {
    try {
      const taxId = parseInt(req.params.id);
      if (isNaN(taxId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid tax ID'
        });
      }

      const result = await this.taxService.toggleTaxEnabled(taxId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: result.message,
          data: result.data
        });
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: result.error || ERROR_MESSAGES.NOT_FOUND
        });
      }
    } catch (error) {
      console.error('TaxController: Error in toggleTaxEnabled:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update tax sort orders
  updateTaxSortOrders = async (req: Request, res: Response) => {
    try {
      const { taxUpdates } = req.body;

      if (!Array.isArray(taxUpdates)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'taxUpdates must be an array'
        });
      }

      const result = await this.taxService.updateTaxSortOrders(taxUpdates);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: result.message || SUCCESS_MESSAGES.UPDATED
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('TaxController: Error in updateTaxSortOrders:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}