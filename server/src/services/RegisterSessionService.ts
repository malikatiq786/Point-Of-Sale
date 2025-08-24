import { RegisterSessionRepository } from '../repositories/RegisterSessionRepository';
import type { 
  InsertRegisterSession,
  RegisterSession,
  DenominationType
} from '../../../shared/schema';
import { DatabaseResult } from '../types';

export class RegisterSessionService {
  private registerSessionRepository: RegisterSessionRepository;

  constructor() {
    this.registerSessionRepository = new RegisterSessionRepository();
  }

  // Get all available denomination types
  async getDenominationTypes(): Promise<DatabaseResult<DenominationType[]>> {
    try {
      const denominations = await this.registerSessionRepository.getDenominationTypes();
      return {
        success: true,
        data: denominations,
      };
    } catch (error) {
      console.error('RegisterSessionService: Error getting denomination types:', error);
      return {
        success: false,
        error: 'Failed to fetch denomination types',
      };
    }
  }

  // Open a new register session with denomination breakdown
  async openRegisterSession(sessionData: {
    registerId: number;
    userId: string;
    branchId: number;
    declaredOpeningBalance: string;
    denominationBreakdown: Array<{
      denominationId: number;
      quantity: number;
      amount: string;
    }>;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DatabaseResult<RegisterSession>> {
    try {
      // Check if there's already an active session for this register
      const existingSession = await this.registerSessionRepository.getActiveSession(sessionData.registerId);
      if (existingSession) {
        return {
          success: false,
          error: 'Register already has an active session. Please close the current session first.',
        };
      }

      // Calculate total from denominations
      const calculatedTotal = sessionData.denominationBreakdown.reduce((sum, denom) => {
        return sum + parseFloat(denom.amount);
      }, 0);

      // Validate that declared balance matches calculated total
      const declaredBalance = parseFloat(sessionData.declaredOpeningBalance);
      const difference = Math.abs(declaredBalance - calculatedTotal);
      
      if (difference > 0.01) { // Allow for minor floating point differences
        return {
          success: false,
          error: `Declared opening balance (${declaredBalance.toFixed(2)}) does not match calculated total (${calculatedTotal.toFixed(2)}). Please verify denomination quantities.`,
        };
      }

      // Create the session
      const newSession = await this.registerSessionRepository.createSession({
        registerId: sessionData.registerId,
        userId: sessionData.userId,
        branchId: sessionData.branchId,
        declaredOpeningBalance: sessionData.declaredOpeningBalance,
        calculatedOpeningBalance: calculatedTotal.toFixed(2),
        openedBy: sessionData.userId,
        notes: sessionData.notes,
      });

      // Save denomination breakdown
      const denominationRecords = sessionData.denominationBreakdown.map(denom => ({
        denominationId: denom.denominationId,
        openingQuantity: denom.quantity,
        openingAmount: denom.amount,
        type: 'opening' as const,
      }));

      await this.registerSessionRepository.saveDenominationBreakdown(
        newSession.id,
        denominationRecords
      );

      // Log audit entry
      await this.registerSessionRepository.logAudit({
        registerId: sessionData.registerId,
        sessionId: newSession.id,
        userId: sessionData.userId,
        branchId: sessionData.branchId,
        action: 'session_opened',
        description: `Register session opened with opening balance of ${sessionData.declaredOpeningBalance}`,
        newValue: {
          sessionId: newSession.id,
          declaredBalance: sessionData.declaredOpeningBalance,
          calculatedBalance: calculatedTotal.toFixed(2),
          denominationBreakdown: sessionData.denominationBreakdown,
        },
        amount: sessionData.declaredOpeningBalance,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        metadata: {
          denominationCount: sessionData.denominationBreakdown.length,
        },
      });

      return {
        success: true,
        data: newSession,
      };
    } catch (error) {
      console.error('RegisterSessionService: Error opening register session:', error);
      return {
        success: false,
        error: 'Failed to open register session',
      };
    }
  }

  // Close register session with denomination breakdown
  async closeRegisterSession(sessionId: number, closingData: {
    declaredClosingBalance: string;
    denominationBreakdown: Array<{
      denominationId: number;
      quantity: number;
      amount: string;
    }>;
    closedBy: string;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DatabaseResult<RegisterSession>> {
    try {
      // Calculate total from denominations
      const calculatedTotal = closingData.denominationBreakdown.reduce((sum, denom) => {
        return sum + parseFloat(denom.amount);
      }, 0);

      // Validate that declared balance matches calculated total
      const declaredBalance = parseFloat(closingData.declaredClosingBalance);
      const difference = Math.abs(declaredBalance - calculatedTotal);
      
      if (difference > 0.01) { // Allow for minor floating point differences
        return {
          success: false,
          error: `Declared closing balance (${declaredBalance.toFixed(2)}) does not match calculated total (${calculatedTotal.toFixed(2)}). Please verify denomination quantities.`,
        };
      }

      // TODO: Calculate system expected balance from sales and expenses
      // For now, we'll use the calculated balance as system expected
      const systemExpectedBalance = calculatedTotal.toFixed(2);

      // Close the session
      const closedSession = await this.registerSessionRepository.closeSession(sessionId, {
        declaredClosingBalance: closingData.declaredClosingBalance,
        calculatedClosingBalance: calculatedTotal.toFixed(2),
        systemExpectedBalance,
        closedBy: closingData.closedBy,
        notes: closingData.notes,
      });

      // Save closing denomination breakdown
      const denominationRecords = closingData.denominationBreakdown.map(denom => ({
        denominationId: denom.denominationId,
        closingQuantity: denom.quantity,
        closingAmount: denom.amount,
        type: 'closing' as const,
      }));

      await this.registerSessionRepository.saveDenominationBreakdown(
        sessionId,
        denominationRecords
      );

      // Log audit entry
      await this.registerSessionRepository.logAudit({
        sessionId,
        userId: closingData.closedBy,
        action: 'session_closed',
        description: `Register session closed with closing balance of ${closingData.declaredClosingBalance}`,
        newValue: {
          sessionId,
          declaredBalance: closingData.declaredClosingBalance,
          calculatedBalance: calculatedTotal.toFixed(2),
          discrepancy: closedSession.discrepancyAmount,
          denominationBreakdown: closingData.denominationBreakdown,
        },
        amount: closingData.declaredClosingBalance,
        ipAddress: closingData.ipAddress,
        userAgent: closingData.userAgent,
        metadata: {
          denominationCount: closingData.denominationBreakdown.length,
          hasDiscrepancy: parseFloat(closedSession.discrepancyAmount || '0') !== 0,
        },
      });

      return {
        success: true,
        data: closedSession,
      };
    } catch (error) {
      console.error('RegisterSessionService: Error closing register session:', error);
      return {
        success: false,
        error: 'Failed to close register session',
      };
    }
  }

  // Get active session for a register
  async getActiveSession(registerId: number): Promise<DatabaseResult<RegisterSession | null>> {
    try {
      const session = await this.registerSessionRepository.getActiveSession(registerId);
      return {
        success: true,
        data: session,
      };
    } catch (error) {
      console.error('RegisterSessionService: Error getting active session:', error);
      return {
        success: false,
        error: 'Failed to get active session',
      };
    }
  }

  // Get denomination breakdown for session
  async getDenominationBreakdown(sessionId: number, type: 'opening' | 'closing'): Promise<DatabaseResult> {
    try {
      const breakdown = await this.registerSessionRepository.getDenominationBreakdown(sessionId, type);
      return {
        success: true,
        data: breakdown,
      };
    } catch (error) {
      console.error('RegisterSessionService: Error getting denomination breakdown:', error);
      return {
        success: false,
        error: 'Failed to get denomination breakdown',
      };
    }
  }

  // Get session history for register
  async getSessionHistory(registerId: number): Promise<DatabaseResult> {
    try {
      const history = await this.registerSessionRepository.getSessionHistory(registerId);
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      console.error('RegisterSessionService: Error getting session history:', error);
      return {
        success: false,
        error: 'Failed to get session history',
      };
    }
  }

  // Get discrepancy reports for branch
  async getDiscrepancyReports(branchId: number): Promise<DatabaseResult> {
    try {
      const reports = await this.registerSessionRepository.getDiscrepancyReports(branchId);
      return {
        success: true,
        data: reports,
      };
    } catch (error) {
      console.error('RegisterSessionService: Error getting discrepancy reports:', error);
      return {
        success: false,
        error: 'Failed to get discrepancy reports',
      };
    }
  }

  // Calculate denomination total
  static calculateDenominationTotal(denominations: Array<{value: number; quantity: number}>): number {
    return denominations.reduce((sum, denom) => {
      return sum + (denom.value * denom.quantity);
    }, 0);
  }
}