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

  // Create product
  createProduct = async (req: Request, res: Response) => {
    try {
      console.log('ProductController: Creating product with data:', req.body);
      
      if (!req.body.name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Product name is required'
        });
      }

      const result = await this.productService.createProduct(req.body);
      console.log('ProductController: Service result:', result);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        console.error('ProductController: Service error:', result.error);
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: result.error || ERROR_MESSAGES.INVALID_INPUT
        });
      }
    } catch (error) {
      console.error('ProductController: Error in createProduct:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: (error as Error).message
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
      
      if (result.success && result.data) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: ERROR_MESSAGES.PRODUCT_NOT_FOUND
        });
      }
    } catch (error) {
      console.error('ProductController: Error in getProductById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get low stock products
  getLowStockProducts = async (req: Request, res: Response) => {
    try {
      res.status(HTTP_STATUS.OK).json([]);
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}