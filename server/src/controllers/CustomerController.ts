import { Request, Response } from 'express';
import { CustomerService } from '../services/CustomerService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  // Get all customers
  getCustomers = async (req: Request, res: Response) => {
    try {
      console.log('CustomerController: Getting customers...');
      const result = await this.customerService.getCustomers();
      console.log('CustomerController: Customer result:', result);

      if (result.success) {
        console.log('CustomerController: Returning customers:', result.data);
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        console.error('CustomerController: Failed to get customers:', result.error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('CustomerController: Error in getCustomers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get customer by ID
  getCustomerById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.customerService.getCustomerById(parseInt(id));

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: result.error || ERROR_MESSAGES.NOT_FOUND
        });
      }
    } catch (error) {
      console.error('CustomerController: Error in getCustomerById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create customer
  createCustomer = async (req: Request, res: Response) => {
    try {
      console.log('CustomerController: Creating customer:', req.body);
      const result = await this.customerService.createCustomer(req.body);

      if (result.success) {
        console.log('CustomerController: Customer created successfully:', result.data);
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        console.log('CustomerController: Failed to create customer:', result.error);
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('CustomerController: Error in createCustomer:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update customer
  updateCustomer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.customerService.updateCustomer(parseInt(id), req.body);

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
      console.error('CustomerController: Error in updateCustomer:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Delete customer
  deleteCustomer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.customerService.deleteCustomer(parseInt(id));

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
      console.error('CustomerController: Error in deleteCustomer:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Search customers
  searchCustomers = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const result = await this.customerService.searchCustomers(q as string);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('CustomerController: Error in searchCustomers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}