import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../../../shared/schema';
import { eq, and, or, like, gte, lte, sql } from 'drizzle-orm';

// Database connection
const sqlClient = neon(process.env.DATABASE_URL!);
export const db = drizzle(sqlClient, { schema });

// Base repository class with common CRUD operations
export abstract class BaseRepository<TTable, TInsert, TSelect> {
  protected table: TTable;
  protected db = db;

  constructor(table: TTable) {
    this.table = table;
  }

  // Generic find all with optional conditions
  async findAll(conditions?: any, limit?: number, offset?: number): Promise<TSelect[]> {
    try {
      let query = this.db.select().from(this.table);
      
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
      console.error(`Error finding all:`, error);
      throw error;
    }
  }

  // Generic find by ID
  async findById(id: number): Promise<TSelect | null> {
    try {
      const results = await this.db.select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error(`Error finding by ID:`, error);
      throw error;
    }
  }

  // Generic create
  async create(data: TInsert): Promise<TSelect> {
    try {
      const results = await this.db.insert(this.table)
        .values(data)
        .returning();
      
      return results[0];
    } catch (error) {
      console.error(`Error creating:`, error);
      throw error;
    }
  }

  // Generic update
  async update(id: number, data: Partial<TInsert>): Promise<TSelect | null> {
    try {
      const results = await this.db.update(this.table)
        .set(data)
        .where(eq(this.table.id, id))
        .returning();
      
      return results[0] || null;
    } catch (error) {
      console.error(`Error updating:`, error);
      throw error;
    }
  }

  // Generic delete
  async delete(id: number): Promise<boolean> {
    try {
      const results = await this.db.delete(this.table)
        .where(eq(this.table.id, id))
        .returning();
      
      return results.length > 0;
    } catch (error) {
      console.error(`Error deleting:`, error);
      throw error;
    }
  }

  // Generic count
  async count(conditions?: any): Promise<number> {
    try {
      let query = this.db.select({ count: sql`count(*)::text` }).from(this.table);
      
      if (conditions) {
        query = query.where(conditions);
      }
      
      const results = await query;
      return parseInt(results[0]?.count || '0');
    } catch (error) {
      console.error(`Error counting:`, error);
      throw error;
    }
  }
}

// Export necessary operators
export { eq, and, or, like, gte, lte, sql };