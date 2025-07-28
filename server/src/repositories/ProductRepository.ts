import { eq, and, or, like, sql } from 'drizzle-orm';
import * as schema from '../../../shared/schema';
import { storage } from '../../storage';

export class ProductRepository {

  // Find all products
  async findAll(searchQuery?: string, categoryId?: number, brandId?: number) {
    try {
      let query = storage.db.select()
        .from(schema.products);

      const conditions = [];

      if (searchQuery) {
        conditions.push(like(schema.products.name, `%${searchQuery}%`));
      }

      if (categoryId) {
        conditions.push(eq(schema.products.categoryId, categoryId));
      }

      if (brandId) {
        conditions.push(eq(schema.products.brandId, brandId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query;
    } catch (error) {
      console.error('Error finding products:', error);
      throw error;
    }
  }

  // Create new product
  async create(productData: any) {
    try {
      const results = await storage.db.insert(schema.products)
        .values(productData)
        .returning();
      return results[0];
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Find product by ID
  async findById(id: number) {
    try {
      const results = await storage.db.select()
        .from(schema.products)
        .where(eq(schema.products.id, id))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error('Error finding product by ID:', error);
      throw error;
    }
  }

  // Find low stock products
  async findLowStock(threshold: number = 10) {
    try {
      return await db.select()
        .from(products)
        .where(
          sql`${products.stock} < ${threshold}`
        );
    } catch (error) {
      console.error('Error finding low stock products:', error);
      throw error;
    }
  }

  // Update product stock
  async updateStock(productId: number, quantity: number) {
    try {
      const results = await db.update(products)
        .set({ 
          stock: quantity,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning();
      
      return results[0] || null;
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  }

  // Decrease stock (for sales)
  async decreaseStock(productId: number, quantity: number) {
    try {
      // First get the current stock
      const product = await this.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const currentStock = product.stock || 0;
      if (currentStock < quantity) {
        throw new Error('Insufficient stock');
      }

      return await this.updateStock(productId, currentStock - quantity);
    } catch (error) {
      console.error('Error decreasing product stock:', error);
      throw error;
    }
  }
}