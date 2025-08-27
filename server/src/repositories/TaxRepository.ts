import { eq } from 'drizzle-orm';
import { taxes } from '../../../shared/schema';
import { BaseRepository } from './BaseRepository';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type InsertTax = InferInsertModel<typeof taxes>;
export type SelectTax = InferSelectModel<typeof taxes>;

export class TaxRepository extends BaseRepository<typeof taxes, InsertTax, SelectTax> {
  constructor() {
    super(taxes);
  }

  // Find all taxes ordered by sortOrder and name
  async findAllOrdered(): Promise<SelectTax[]> {
    try {
      return await this.db.select()
        .from(taxes)
        .orderBy(taxes.sortOrder, taxes.name);
    } catch (error) {
      console.error('TaxRepository: Error finding all ordered taxes:', error);
      throw error;
    }
  }

  // Find all enabled taxes
  async findAllEnabled(): Promise<SelectTax[]> {
    try {
      return await this.db.select()
        .from(taxes)
        .where(eq(taxes.isEnabled, true))
        .orderBy(taxes.sortOrder, taxes.name);
    } catch (error) {
      console.error('TaxRepository: Error finding enabled taxes:', error);
      throw error;
    }
  }

  // Update sort orders for multiple taxes
  async updateSortOrders(taxUpdates: { id: number; sortOrder: number }[]): Promise<void> {
    try {
      for (const update of taxUpdates) {
        await this.db.update(taxes)
          .set({ sortOrder: update.sortOrder })
          .where(eq(taxes.id, update.id));
      }
    } catch (error) {
      console.error('TaxRepository: Error updating sort orders:', error);
      throw error;
    }
  }

  // Toggle tax enabled status
  async toggleEnabled(id: number): Promise<SelectTax | null> {
    try {
      const currentTax = await this.findById(id);
      if (!currentTax) return null;

      const results = await this.db.update(taxes)
        .set({ isEnabled: !currentTax.isEnabled })
        .where(eq(taxes.id, id))
        .returning();

      return results[0] || null;
    } catch (error) {
      console.error('TaxRepository: Error toggling enabled status:', error);
      throw error;
    }
  }

  // Find tax by name
  async findByName(name: string): Promise<SelectTax | null> {
    try {
      const results = await this.db.select()
        .from(taxes)
        .where(eq(taxes.name, name))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error('TaxRepository: Error finding tax by name:', error);
      throw error;
    }
  }
}