import { Request, Response } from 'express';
import { CustomerLedgerService } from '../services/CustomerLedgerService';

export class CustomerLedgerController {
  private customerLedgerService: CustomerLedgerService;

  constructor() {
    this.customerLedgerService = new CustomerLedgerService();
  }

  // Get ledger entries for a specific customer
  async getCustomerLedger(req: Request, res: Response) {
    try {
      const customerId = parseInt(req.params.customerId);
      
      if (isNaN(customerId)) {
        return res.status(400).json({ error: 'Invalid customer ID' });
      }

      const result = await this.customerLedgerService.getCustomerLedger(customerId);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.data);
    } catch (error) {
      console.error('CustomerLedgerController: Error getting customer ledger:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a new ledger entry
  async createEntry(req: Request, res: Response) {
    try {
      const entryData = req.body;
      
      const result = await this.customerLedgerService.createEntry(entryData);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result.data);
    } catch (error) {
      console.error('CustomerLedgerController: Error creating ledger entry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get customer balance
  async getCustomerBalance(req: Request, res: Response) {
    try {
      const customerId = parseInt(req.params.customerId);
      
      if (isNaN(customerId)) {
        return res.status(400).json({ error: 'Invalid customer ID' });
      }

      const result = await this.customerLedgerService.getCustomerBalance(customerId);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.data);
    } catch (error) {
      console.error('CustomerLedgerController: Error getting customer balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all ledger entries (admin)
  async getAllEntries(req: Request, res: Response) {
    try {
      const result = await this.customerLedgerService.getAllEntries();
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.data);
    } catch (error) {
      console.error('CustomerLedgerController: Error getting all ledger entries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}