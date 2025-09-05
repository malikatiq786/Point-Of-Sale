import { Request, Response } from 'express';
import { CustomerLedgerService } from '../services/CustomerLedgerService';

export class CustomerLedgerController {
  private customerLedgerService: CustomerLedgerService;

  constructor() {
    this.customerLedgerService = new CustomerLedgerService();
  }

  // Get ledger entries for a specific customer
  getCustomerLedger = async (req: Request, res: Response) => {
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
  createEntry = async (req: Request, res: Response) => {
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
  getCustomerBalance = async (req: Request, res: Response) => {
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
  getAllEntries = async (req: Request, res: Response) => {
    try {
      console.log('CustomerLedgerController: getAllEntries called');
      const result = await this.customerLedgerService.getAllEntries();
      console.log('CustomerLedgerController: Service result:', result);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      console.log(`CustomerLedgerController: Returning ${result.data?.length || 0} entries`);
      res.json(result.data);
    } catch (error) {
      console.error('CustomerLedgerController: Error getting all ledger entries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}