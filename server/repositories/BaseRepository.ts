import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../../shared/schema';

// Database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Base repository class with common CRUD operations
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected table: any;

  constructor(tableName: string, table: any) {
    this.tableName = tableName;
    this.table = table;
  }

  // Generic find all with optional conditions
  async findAll(conditions?: any, limit?: number, offset?: number): Promise<T[]> {
    try {
      let query = db.select().from(this.table);
      
      if (conditions) {
        query = query.where(conditions);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      if (offset) {
        query = query.offset(offset);
      }
      
      return await query;
    } catch (error) {
      console.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic find by ID
  async findById(id: number): Promise<T | null> {
    try {
      const results = await db.select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  // Generic create
  async create(data: Partial<T>): Promise<T> {
    try {
      const results = await db.insert(this.table)
        .values(data)
        .returning();
      
      return results[0];
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic update
  async update(id: number, data: Partial<T>): Promise<T | null> {
    try {
      const results = await db.update(this.table)
        .set(data)
        .where(eq(this.table.id, id))
        .returning();
      
      return results[0] || null;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic delete
  async delete(id: number): Promise<boolean> {
    try {
      const results = await db.delete(this.table)
        .where(eq(this.table.id, id))
        .returning();
      
      return results.length > 0;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Generic count
  async count(conditions?: any): Promise<number> {
    try {
      let query = db.select({ count: sql`count(*)` }).from(this.table);
      
      if (conditions) {
        query = query.where(conditions);
      }
      
      const results = await query;
      return parseInt(results[0]?.count || '0');
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }
}

// Import necessary operators
import { eq, and, or, like, gte, lte } from 'drizzle-orm';
export { eq, and, or, like, gte, lte };