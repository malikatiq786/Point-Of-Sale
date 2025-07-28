import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { validateInput, productCreateSchema, productUpdateSchema } from '../validators';
import { formatCurrency } from '../utils';
import { ProductCreateRequest, ProductUpdateRequest, DatabaseResult } from '../types';

export class ProductService {
  private productRepository: ProductRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.categoryRepository = new CategoryRepository();
  }

  // Get all products with search and filtering  
  async getProducts(searchQuery?: string, categoryId?: number, brandId?: number) {
    try {
      const products = await this.productRepository.findAll();
      return {
        success: true,
        data: products || [],
      };
    } catch (error) {
      console.error('ProductService: Error getting products:', error);
      return {
        success: false,
        error: 'Failed to fetch products',
      };
    }
  }

  // Create new product
  async createProduct(productData: any) {
    try {
      if (!productData.name) {
        return { success: false, error: 'Product name is required' };
      }

      const product = await this.productRepository.create(productData);
      return { success: true, data: product };
    } catch (error) {
      console.error('ProductService: Error creating product:', error);
      return {
        success: false,
        error: 'Failed to create product',
      };
    }
  }

  // Update product
  async updateProduct(productData: ProductUpdateRequest): Promise<DatabaseResult> {
    try {
      // Validate input
      const validation = validateInput(productUpdateSchema, productData);
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // Check if product exists
      const existingProduct = await this.productRepository.findById(productData.id);
      if (!existingProduct) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      // Update product
      const { id, ...updateData } = validation.data!;
      const updatedProduct = await this.productRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      return {
        success: true,
        data: updatedProduct,
      };
    } catch (error) {
      console.error('ProductService: Error updating product:', error);
      return {
        success: false,
        error: 'Failed to update product',
      };
    }
  }

  // Delete product
  async deleteProduct(productId: number): Promise<DatabaseResult> {
    try {
      const success = await this.productRepository.delete(productId);
      
      if (success) {
        return {
          success: true,
          data: { message: 'Product deleted successfully' },
        };
      } else {
        return {
          success: false,
          error: 'Product not found',
        };
      }
    } catch (error) {
      console.error('ProductService: Error deleting product:', error);
      return {
        success: false,
        error: 'Failed to delete product',
      };
    }
  }

  // Get product by ID
  async getProductById(productId: number): Promise<DatabaseResult> {
    try {
      const product = await this.productRepository.findById(productId);
      
      if (product) {
        return {
          success: true,
          data: {
            ...product,
            formattedPrice: formatCurrency(product.price || 0),
          },
        };
      } else {
        return {
          success: false,
          error: 'Product not found',
        };
      }
    } catch (error) {
      console.error('ProductService: Error getting product by ID:', error);
      return {
        success: false,
        error: 'Failed to fetch product',
      };
    }
  }

  // Get low stock products
  async getLowStockProducts(threshold: number = 10): Promise<DatabaseResult> {
    try {
      const products = await this.productRepository.findLowStock(threshold);
      
      return {
        success: true,
        data: products.map(product => ({
          ...product,
          formattedPrice: formatCurrency(product.price || 0),
        })),
      };
    } catch (error) {
      console.error('ProductService: Error getting low stock products:', error);
      return {
        success: false,
        error: 'Failed to fetch low stock products',
      };
    }
  }

  // Update product stock
  async updateProductStock(productId: number, quantity: number): Promise<DatabaseResult> {
    try {
      if (quantity < 0) {
        return {
          success: false,
          error: 'Stock quantity cannot be negative',
        };
      }

      const updatedProduct = await this.productRepository.updateStock(productId, quantity);
      
      if (updatedProduct) {
        return {
          success: true,
          data: updatedProduct,
        };
      } else {
        return {
          success: false,
          error: 'Product not found',
        };
      }
    } catch (error) {
      console.error('ProductService: Error updating product stock:', error);
      return {
        success: false,
        error: 'Failed to update product stock',
      };
    }
  }
}