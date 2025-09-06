import { CustomerLedgerRepository } from '../repositories/CustomerLedgerRepository';
import { DatabaseResult } from '../types/index';

export class CustomerLedgerService {
  private customerLedgerRepository: CustomerLedgerRepository;

  constructor() {
    this.customerLedgerRepository = new CustomerLedgerRepository();
  }

  // Get all ledger entries for a customer
  async getCustomerLedger(customerId: number): Promise<DatabaseResult> {
    try {
      const entries = await this.customerLedgerRepository.findByCustomerId(customerId);
      
      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('CustomerLedgerService: Error getting customer ledger:', error);
      return {
        success: false,
        error: 'Failed to fetch customer ledger',
      };
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
  }): Promise<DatabaseResult> {
    try {
      if (!entryData.customerId || !entryData.amount || !entryData.type || !entryData.reference) {
        return {
          success: false,
          error: 'Missing required fields for ledger entry',
        };
      }

      const entry = await this.customerLedgerRepository.createEntry(entryData);
      
      return {
        success: true,
        data: entry,
      };
    } catch (error) {
      console.error('CustomerLedgerService: Error creating ledger entry:', error);
      return {
        success: false,
        error: 'Failed to create ledger entry',
      };
    }
  }

  // Get customer balance
  async getCustomerBalance(customerId: number): Promise<DatabaseResult> {
    try {
      const balance = await this.customerLedgerRepository.getCustomerBalance(customerId);
      
      return {
        success: true,
        data: { balance },
      };
    } catch (error) {
      console.error('CustomerLedgerService: Error getting customer balance:', error);
      return {
        success: false,
        error: 'Failed to get customer balance',
      };
    }
  }

  // Get all ledger entries (for admin purposes)
  async getAllEntries(): Promise<DatabaseResult> {
    try {
      const entries = await this.customerLedgerRepository.findAllWithCustomerNames();
      
      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('CustomerLedgerService: Error getting all ledger entries:', error);
      return {
        success: false,
        error: 'Failed to fetch ledger entries',
      };
    }
  }
}