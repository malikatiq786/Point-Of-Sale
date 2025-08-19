import { eq, and, or, like, sql } from 'drizzle-orm';
import * as schema from '../../../shared/schema';
import { db } from '../../db';

export class ProductRepository {

  // Find all products
  async findAll(searchQuery?: string, categoryId?: number, brandId?: number) {
    try {
      let query = db.select()
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
      console.log('ProductRepository: Creating product with data:', productData);
      const results = await db.insert(schema.products)
        .values({
          name: productData.name,
          description: productData.description,
          barcode: productData.barcode,
          categoryId: productData.categoryId,
          brandId: productData.brandId,
          unitId: productData.unitId,
          price: productData.price?.toString() || "0",
          stock: productData.stock || 0,
          lowStockAlert: productData.lowStockAlert || 0,
          image: productData.image
        })
        .returning();
      console.log('ProductRepository: Insert result:', results);
      return results[0];
    } catch (error) {
      console.error('ProductRepository: Error creating product:', error);
      throw error;
    }
  }

  // Find product by ID
  async findById(id: number) {
    try {
      const results = await db.select()
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
        .from(schema.products)
        .where(
          sql`${schema.products.stock} < ${threshold}`
        );
    } catch (error) {
      console.error('Error finding low stock products:', error);
      throw error;
    }
  }

  // Update product stock
  async updateStock(productId: number, quantity: number) {
    try {
      const results = await db.update(schema.products)
        .set({ 
          stock: quantity
        })
        .where(eq(schema.products.id, productId))
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