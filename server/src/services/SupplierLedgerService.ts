import { SupplierLedgerRepository } from '../repositories/SupplierLedgerRepository';
import { DatabaseResult } from '../types/index';

export class SupplierLedgerService {
  private supplierLedgerRepository: SupplierLedgerRepository;

  constructor() {
    this.supplierLedgerRepository = new SupplierLedgerRepository();
  }

  // Get all ledger entries for a supplier
  async getSupplierLedger(supplierId: number): Promise<DatabaseResult> {
    try {
      const entries = await this.supplierLedgerRepository.findBySupplierId(supplierId);
      
      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('SupplierLedgerService: Error getting supplier ledger:', error);
      return {
        success: false,
        error: 'Failed to fetch supplier ledger',
      };
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
  }): Promise<DatabaseResult> {
    try {
      if (!entryData.supplierId || !entryData.amount || !entryData.type || !entryData.reference) {
        return {
          success: false,
          error: 'Missing required fields for ledger entry',
        };
      }

      const entry = await this.supplierLedgerRepository.createEntry(entryData);
      
      return {
        success: true,
        data: entry,
      };
    } catch (error) {
      console.error('SupplierLedgerService: Error creating ledger entry:', error);
      return {
        success: false,
        error: 'Failed to create ledger entry',
      };
    }
  }

  // Get supplier balance
  async getSupplierBalance(supplierId: number): Promise<DatabaseResult> {
    try {
      const balance = await this.supplierLedgerRepository.getSupplierBalance(supplierId);
      
      return {
        success: true,
        data: { balance },
      };
    } catch (error) {
      console.error('SupplierLedgerService: Error getting supplier balance:', error);
      return {
        success: false,
        error: 'Failed to get supplier balance',
      };
    }
  }

  // Get all ledger entries (for admin purposes)
  async getAllEntries(): Promise<DatabaseResult> {
    try {
      const entries = await this.supplierLedgerRepository.findAllWithSupplierNames();
      
      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error('SupplierLedgerService: Error getting all ledger entries:', error);
      return {
        success: false,
        error: 'Failed to fetch ledger entries',
      };
    }
  }
}