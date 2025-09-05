import { Request, Response } from 'express';
import { SupplierLedgerService } from '../services/SupplierLedgerService';

export class SupplierLedgerController {
  private supplierLedgerService: SupplierLedgerService;

  constructor() {
    this.supplierLedgerService = new SupplierLedgerService();
  }

  // Get ledger entries for a specific supplier
  getSupplierLedger = async (req: Request, res: Response) => {
    try {
      const supplierId = parseInt(req.params.supplierId);
      
      if (isNaN(supplierId)) {
        return res.status(400).json({ error: 'Invalid supplier ID' });
      }

      const result = await this.supplierLedgerService.getSupplierLedger(supplierId);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.data);
    } catch (error) {
      console.error('SupplierLedgerController: Error getting supplier ledger:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a new ledger entry
  createEntry = async (req: Request, res: Response) => {
    try {
      const entryData = req.body;
      
      const result = await this.supplierLedgerService.createEntry(entryData);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result.data);
    } catch (error) {
      console.error('SupplierLedgerController: Error creating ledger entry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get supplier balance
  getSupplierBalance = async (req: Request, res: Response) => {
    try {
      const supplierId = parseInt(req.params.supplierId);
      
      if (isNaN(supplierId)) {
        return res.status(400).json({ error: 'Invalid supplier ID' });
      }

      const result = await this.supplierLedgerService.getSupplierBalance(supplierId);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.data);
    } catch (error) {
      console.error('SupplierLedgerController: Error getting supplier balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all ledger entries (admin)
  getAllEntries = async (req: Request, res: Response) => {
    try {
      const result = await this.supplierLedgerService.getAllEntries();
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.data);
    } catch (error) {
      console.error('SupplierLedgerController: Error getting all ledger entries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}