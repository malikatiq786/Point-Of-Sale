import { BaseRepository } from './BaseRepository';
import { supplierLedgers, suppliers } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';

type SupplierLedgerInsert = typeof supplierLedgers.$inferInsert;
type SupplierLedgerSelect = typeof supplierLedgers.$inferSelect;

export class SupplierLedgerRepository extends BaseRepository<typeof supplierLedgers, SupplierLedgerInsert, SupplierLedgerSelect> {
  constructor() {
    super(supplierLedgers);
  }

  // Get all ledger entries with supplier names
  async findAllWithSupplierNames() {
    try {
      const result = await this.db
        .select({
          id: supplierLedgers.id,
          supplierId: supplierLedgers.supplierId,
          amount: supplierLedgers.amount,
          type: supplierLedgers.type,
          reference: supplierLedgers.reference,
          description: supplierLedgers.description,
          date: supplierLedgers.date,
          supplierName: suppliers.name,
        })
        .from(supplierLedgers)
        .leftJoin(suppliers, eq(supplierLedgers.supplierId, suppliers.id))
        .orderBy(desc(supplierLedgers.date));
      
      return result;
    } catch (error) {
      console.error('Error finding all supplier ledger entries with names:', error);
      throw error;
    }
  }

  // Get ledger entries for a specific supplier
  async findBySupplierId(supplierId: number) {
    try {
      return await this.findAll(eq(supplierLedgers.supplierId, supplierId), undefined, undefined);
    } catch (error) {
      console.error('Error finding supplier ledger entries:', error);
      throw error;
    }
  }

  // Create a new ledger entry
  async createEntry(entryData: {
    supplierId: number;
    amount: string;
    type: 'debit' | 'credit';
    reference: string;
    description?: string;
    paymentMethod?: string;
    date?: string;
  }) {
    try {
      const entry = await this.create({
        supplierId: entryData.supplierId,
        amount: entryData.amount,
        type: entryData.type,
        reference: entryData.reference,
        description: entryData.description,
        date: entryData.date ? new Date(entryData.date) : new Date(),
      });
      
      console.log(`Supplier ledger entry created: ${entryData.type} of ${entryData.amount} for supplier ${entryData.supplierId}`);
      return entry;
    } catch (error) {
      console.error('Error creating supplier ledger entry:', error);
      throw error;
    }
  }

  // Get supplier balance (sum of all entries)
  async getSupplierBalance(supplierId: number): Promise<number> {
    try {
      const entries = await this.findBySupplierId(supplierId);
      
      return entries.reduce((balance: number, entry: any) => {
        const amount = parseFloat(entry.amount) || 0;
        return entry.type === 'debit' ? balance + amount : balance - amount;
      }, 0);
    } catch (error) {
      console.error('Error calculating supplier balance:', error);
      return 0;
    }
  }
}