import { BaseRepository } from './BaseRepository';
import { customerLedgers } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';

type CustomerLedgerInsert = typeof customerLedgers.$inferInsert;
type CustomerLedgerSelect = typeof customerLedgers.$inferSelect;

export class CustomerLedgerRepository extends BaseRepository<typeof customerLedgers, CustomerLedgerInsert, CustomerLedgerSelect> {
  constructor() {
    super(customerLedgers);
  }

  // Get ledger entries for a specific customer
  async findByCustomerId(customerId: number) {
    try {
      return await this.findAll(eq(customerLedgers.customerId, customerId), undefined, undefined);
    } catch (error) {
      console.error('Error finding customer ledger entries:', error);
      throw error;
    }
  }

  // Create a new ledger entry
  async createEntry(entryData: {
    customerId: number;
    amount: string;
    type: 'debit' | 'credit';
    reference: string;
    description?: string;
    paymentMethod?: string;
    date?: string;
  }) {
    try {
      const entry = await this.create({
        customerId: entryData.customerId,
        amount: entryData.amount,
        type: entryData.type,
        reference: entryData.reference,
        date: entryData.date ? new Date(entryData.date) : new Date(),
      });
      
      console.log(`Customer ledger entry created: ${entryData.type} of ${entryData.amount} for customer ${entryData.customerId}`);
      return entry;
    } catch (error) {
      console.error('Error creating customer ledger entry:', error);
      throw error;
    }
  }

  // Get customer balance (sum of all entries)
  async getCustomerBalance(customerId: number): Promise<number> {
    try {
      const entries = await this.findByCustomerId(customerId);
      
      return entries.reduce((balance: number, entry: any) => {
        const amount = parseFloat(entry.amount) || 0;
        return entry.type === 'debit' ? balance + amount : balance - amount;
      }, 0);
    } catch (error) {
      console.error('Error calculating customer balance:', error);
      return 0;
    }
  }
}