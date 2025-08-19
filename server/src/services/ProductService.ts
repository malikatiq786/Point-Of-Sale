import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';

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
      const products = await this.productRepository.findAll(searchQuery, categoryId, brandId);
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

  // Get product by ID
  async getProductById(productId: number) {
    try {
      console.log('ProductService: Getting product by ID:', productId);
      const product = await this.productRepository.findById(productId);
      
      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }
      
      console.log('ProductService: Found product:', product);
      return {
        success: true,
        data: product
      };
    } catch (error) {
      console.error('ProductService: Error getting product by ID:', error);
      return {
        success: false,
        error: 'Failed to fetch product'
      };
    }
  }

  // Create new product
  async createProduct(productData: any) {
    try {
      console.log('ProductService: Creating product with data:', productData);
      
      if (!productData.name) {
        return { success: false, error: 'Product name is required' };
      }

      // Prepare data with proper field mapping
      const productToCreate = {
        name: productData.name,
        description: productData.description || null,
        barcode: productData.barcode || null,
        categoryId: productData.categoryId || null,
        brandId: productData.brandId || null,
        unitId: productData.unitId || null,
        price: productData.price || 0,
        stock: productData.stock || 0,
        lowStockAlert: productData.lowStockAlert || 0,
        image: productData.image || null
      };

      console.log('ProductService: Prepared product data:', productToCreate);
      const product = await this.productRepository.create(productToCreate);
      console.log('ProductService: Created product:', product);
      return { success: true, data: product };
    } catch (error) {
      console.error('ProductService: Error creating product:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to create product',
      };
    }
  }
}