import { BaseRepository } from './BaseRepository';
import { expenseVendors } from '@shared/schema';
import { InsertExpenseVendor, SelectExpenseVendor } from '@shared/schema';
import { eq, like, or, sql } from 'drizzle-orm';

export class ExpenseVendorRepository extends BaseRepository<typeof expenseVendors, InsertExpenseVendor, SelectExpenseVendor> {
  constructor() {
    super(expenseVendors);
  }

  async findByEmail(email: string) {
    try {
      const [vendor] = await this.db
        .select()
        .from(expenseVendors)
        .where(eq(expenseVendors.email, email))
        .limit(1);

      return vendor;
    } catch (error) {
      console.error('ExpenseVendorRepository: Error in findByEmail:', error);
      throw error;
    }
  }

  async findByPhone(phone: string) {
    try {
      const [vendor] = await this.db
        .select()
        .from(expenseVendors)
        .where(eq(expenseVendors.phone, phone))
        .limit(1);

      return vendor;
    } catch (error) {
      console.error('ExpenseVendorRepository: Error in findByPhone:', error);
      throw error;
    }
  }

  async searchVendors(searchTerm: string) {
    try {
      const searchPattern = `%${searchTerm}%`;
      
      return await this.db
        .select()
        .from(expenseVendors)
        .where(
          or(
            like(expenseVendors.name, searchPattern),
            like(expenseVendors.email, searchPattern),
            like(expenseVendors.phone, searchPattern),
            like(expenseVendors.address, searchPattern)
          )
        )
        .orderBy(expenseVendors.name);
    } catch (error) {
      console.error('ExpenseVendorRepository: Error in searchVendors:', error);
      throw error;
    }
  }

  async getVendorUsageStats() {
    try {
      return await this.db
        .select({
          vendorId: expenseVendors.id,
          vendorName: expenseVendors.name,
          expenseCount: sql<number>`count(expenses.id)`,
          totalAmount: sql<number>`coalesce(sum(expenses.total_amount), 0)`,
          lastExpenseDate: sql<string>`max(expenses.expense_date)`,
        })
        .from(expenseVendors)
        .leftJoin(
          sql`expenses`,
          eq(expenseVendors.id, sql`expenses.vendor_id`)
        )
        .where(eq(expenseVendors.isActive, true))
        .groupBy(expenseVendors.id, expenseVendors.name)
        .orderBy(sql`count(expenses.id) desc`);
    } catch (error) {
      console.error('ExpenseVendorRepository: Error in getVendorUsageStats:', error);
      throw error;
    }
  }

  async getTopVendors(limit: number = 10) {
    try {
      return await this.db
        .select({
          vendor: expenseVendors,
          totalAmount: sql<number>`sum(expenses.total_amount)`,
          expenseCount: sql<number>`count(expenses.id)`,
        })
        .from(expenseVendors)
        .leftJoin(
          sql`expenses`,
          eq(expenseVendors.id, sql`expenses.vendor_id`)
        )
        .where(eq(expenseVendors.isActive, true))
        .groupBy(expenseVendors.id)
        .orderBy(sql`sum(expenses.total_amount) desc`)
        .limit(limit);
    } catch (error) {
      console.error('ExpenseVendorRepository: Error in getTopVendors:', error);
      throw error;
    }
  }
}