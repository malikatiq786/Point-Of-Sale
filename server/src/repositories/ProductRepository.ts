import { BaseRepository, eq, and, or, like } from './BaseRepository';
import { sql } from 'drizzle-orm';
import { products, categories, brands } from '../../../shared/schema';
import { db } from './BaseRepository';

export class ProductRepository extends BaseRepository<typeof products.$inferSelect> {
  constructor() {
    super('products', products);
  }

  // Find products with category and brand information
  async findAllWithRelations(searchQuery?: string, categoryId?: number, brandId?: number) {
    try {
      let query = db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        barcode: products.barcode,
        category: {
          id: categories.id,
          name: categories.name,
        },
        brand: {
          id: brands.id,
          name: brands.name,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id));

      const conditions = [];

      if (searchQuery) {
        conditions.push(
          or(
            like(products.name, `%${searchQuery}%`),
            like(products.description, `%${searchQuery}%`),
            like(products.barcode, `%${searchQuery}%`)
          )
        );
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
      }

      if (brandId) {
        conditions.push(eq(products.brandId, brandId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query;
    } catch (error) {
      console.error('Error finding products with relations:', error);
      throw error;
    }
  }

  // Find products by barcode
  async findByBarcode(barcode: string) {
    try {
      const results = await db.select()
        .from(products)
        .where(eq(products.barcode, barcode))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error('Error finding product by barcode:', error);
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