import { BaseRepository, eq, like } from './BaseRepository';
import { categories } from '../../../shared/schema';
import { db } from '../../db';

export class CategoryRepository extends BaseRepository<typeof categories.$inferSelect> {
  constructor() {
    super('categories', categories);
  }

  // Find categories by name (for search)
  async findByName(name: string) {
    try {
      return await db.select()
        .from(categories)
        .where(like(categories.name, `%${name}%`));
    } catch (error) {
      console.error('Error finding categories by name:', error);
      throw error;
    }
  }

  // Find category by exact name (for uniqueness check)
  async findByExactName(name: string) {
    try {
      const results = await db.select()
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error('Error finding category by exact name:', error);
      throw error;
    }
  }

  // Get categories with product count
  async getCategoriesWithProductCount() {
    try {
      return await db.select({
        id: categories.id,
        name: categories.name,
        productCount: sql`COUNT(p.id)::text`,
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id, categories.name);
    } catch (error) {
      console.error('Error getting categories with product count:', error);
      throw error;
    }
  }
}

import { sql } from 'drizzle-orm';
import { products } from '../../../shared/schema';