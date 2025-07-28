import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  // Get all products
  getProducts = async (req: Request, res: Response) => {
    try {
      const { search, categoryId, brandId } = req.query;
      
      const result = await this.productService.getProducts(
        search as string,
        categoryId ? parseInt(categoryId as string) : undefined,
        brandId ? parseInt(brandId as string) : undefined
      );

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ProductController: Error in getProducts:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get product by ID
  getProductById = async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid product ID'
        });
      }

      const result = await this.productService.getProductById(productId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        const status = result.error === 'Product not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ProductController: Error in getProductById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create new product
  createProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await this.productService.createProduct(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        const status = result.error?.includes('Validation failed') 
          ? HTTP_STATUS.BAD_REQUEST 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ProductController: Error in createProduct:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update product
  updateProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid product ID'
        });
      }

      const productData = { ...req.body, id: productId };
      const result = await this.productService.updateProduct(productData);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        const status = result.error === 'Product not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : result.error?.includes('Validation failed')
          ? HTTP_STATUS.BAD_REQUEST
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ProductController: Error in updateProduct:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Delete product
  deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid product ID'
        });
      }

      const result = await this.productService.deleteProduct(productId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.DELETED
        });
      } else {
        const status = result.error === 'Product not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ProductController: Error in deleteProduct:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get low stock products
  getLowStockProducts = async (req: Request, res: Response) => {
    try {
      const threshold = req.query.threshold 
        ? parseInt(req.query.threshold as string) 
        : 10;

      const result = await this.productService.getLowStockProducts(threshold);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ProductController: Error in getLowStockProducts:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update product stock
  updateProductStock = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (isNaN(productId) || typeof quantity !== 'number') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid product ID or quantity'
        });
      }

      const result = await this.productService.updateProductStock(productId, quantity);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: 'Stock updated successfully',
          data: result.data
        });
      } else {
        const status = result.error === 'Product not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.BAD_REQUEST;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('ProductController: Error in updateProductStock:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}