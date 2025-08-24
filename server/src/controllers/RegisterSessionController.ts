import { Request, Response } from 'express';
import { RegisterSessionService } from '../services/RegisterSessionService';
import { z } from 'zod';

const registerSessionService = new RegisterSessionService();

// Validation schemas
const openSessionSchema = z.object({
  registerId: z.number().min(1),
  branchId: z.number().min(1),
  declaredOpeningBalance: z.string(),
  denominationBreakdown: z.array(z.object({
    denominationId: z.number().min(1),
    quantity: z.number().min(0),
    amount: z.string(),
  })),
  notes: z.string().optional(),
});

const closeSessionSchema = z.object({
  declaredClosingBalance: z.string(),
  denominationBreakdown: z.array(z.object({
    denominationId: z.number().min(1),
    quantity: z.number().min(0),
    amount: z.string(),
  })),
  notes: z.string().optional(),
});

// Get denomination types
export const getDenominationTypes = async (req: Request, res: Response) => {
  try {
    console.log('RegisterSessionController: Getting denomination types...');
    
    const result = await registerSessionService.getDenominationTypes();
    
    if (result.success) {
      console.log(`Fetching denomination types, total: ${result.data?.length}`);
      return res.json(result.data);
    } else {
      console.error('RegisterSessionController: Failed to get denomination types:', result.error);
      return res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('RegisterSessionController: Error getting denomination types:', error);
    return res.status(500).json({ message: 'Failed to fetch denomination types' });
  }
};

// Open register session
export const openRegisterSession = async (req: Request, res: Response) => {
  try {
    console.log('RegisterSessionController: Opening register session...');
    
    const validation = openSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: validation.error.errors,
      });
    }

    const sessionData = {
      ...validation.data,
      userId: req.user?.id || 'system',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const result = await registerSessionService.openRegisterSession(sessionData);
    
    if (result.success) {
      console.log('RegisterSessionController: Session opened successfully:', result.data?.id);
      return res.status(201).json(result.data);
    } else {
      console.error('RegisterSessionController: Failed to open session:', result.error);
      return res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('RegisterSessionController: Error opening register session:', error);
    return res.status(500).json({ message: 'Failed to open register session' });
  }
};

// Close register session
export const closeRegisterSession = async (req: Request, res: Response) => {
  try {
    console.log('RegisterSessionController: Closing register session...');
    
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const validation = closeSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: validation.error.errors,
      });
    }

    const closingData = {
      ...validation.data,
      closedBy: req.user?.id || 'system',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const result = await registerSessionService.closeRegisterSession(sessionId, closingData);
    
    if (result.success) {
      console.log('RegisterSessionController: Session closed successfully:', result.data?.id);
      return res.json(result.data);
    } else {
      console.error('RegisterSessionController: Failed to close session:', result.error);
      return res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('RegisterSessionController: Error closing register session:', error);
    return res.status(500).json({ message: 'Failed to close register session' });
  }
};

// Get active session for register
export const getActiveSession = async (req: Request, res: Response) => {
  try {
    console.log('RegisterSessionController: Getting active session...');
    
    const registerId = parseInt(req.params.registerId);
    if (isNaN(registerId)) {
      return res.status(400).json({ message: 'Invalid register ID' });
    }

    const result = await registerSessionService.getActiveSession(registerId);
    
    if (result.success) {
      console.log('RegisterSessionController: Active session result:', result.data ? 'Found' : 'None');
      return res.json(result.data);
    } else {
      console.error('RegisterSessionController: Failed to get active session:', result.error);
      return res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('RegisterSessionController: Error getting active session:', error);
    return res.status(500).json({ message: 'Failed to get active session' });
  }
};

// Get denomination breakdown for session
export const getDenominationBreakdown = async (req: Request, res: Response) => {
  try {
    console.log('RegisterSessionController: Getting denomination breakdown...');
    
    const sessionId = parseInt(req.params.sessionId);
    const type = req.query.type as 'opening' | 'closing';
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    if (!type || !['opening', 'closing'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be "opening" or "closing"' });
    }

    const result = await registerSessionService.getDenominationBreakdown(sessionId, type);
    
    if (result.success) {
      console.log(`RegisterSessionController: Found ${result.data?.length || 0} denomination entries`);
      return res.json(result.data);
    } else {
      console.error('RegisterSessionController: Failed to get denomination breakdown:', result.error);
      return res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('RegisterSessionController: Error getting denomination breakdown:', error);
    return res.status(500).json({ message: 'Failed to get denomination breakdown' });
  }
};

// Get session history for register
export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    console.log('RegisterSessionController: Getting session history...');
    
    const registerId = parseInt(req.params.registerId);
    if (isNaN(registerId)) {
      return res.status(400).json({ message: 'Invalid register ID' });
    }

    const result = await registerSessionService.getSessionHistory(registerId);
    
    if (result.success) {
      console.log(`RegisterSessionController: Found ${result.data?.length || 0} session history entries`);
      return res.json(result.data);
    } else {
      console.error('RegisterSessionController: Failed to get session history:', result.error);
      return res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('RegisterSessionController: Error getting session history:', error);
    return res.status(500).json({ message: 'Failed to get session history' });
  }
};

// Get discrepancy reports for branch
export const getDiscrepancyReports = async (req: Request, res: Response) => {
  try {
    console.log('RegisterSessionController: Getting discrepancy reports...');
    
    const branchId = parseInt(req.params.branchId);
    if (isNaN(branchId)) {
      return res.status(400).json({ message: 'Invalid branch ID' });
    }

    const result = await registerSessionService.getDiscrepancyReports(branchId);
    
    if (result.success) {
      console.log(`RegisterSessionController: Found ${result.data?.length || 0} discrepancy reports`);
      return res.json(result.data);
    } else {
      console.error('RegisterSessionController: Failed to get discrepancy reports:', result.error);
      return res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('RegisterSessionController: Error getting discrepancy reports:', error);
    return res.status(500).json({ message: 'Failed to get discrepancy reports' });
  }
};