import { eq, and, desc, sql } from 'drizzle-orm';
import * as schema from '../../../shared/schema';
import { db } from '../../db';
import type { 
  InsertRegisterSession, 
  RegisterSession,
  InsertRegisterSessionDenomination,
  InsertRegisterAuditLog,
  InsertCashReconciliationReport,
  DenominationType
} from '../../../shared/schema';

export class RegisterSessionRepository {
  
  // Get all denomination types
  async getDenominationTypes(): Promise<DenominationType[]> {
    try {
      return await db.select()
        .from(schema.denominationTypes)
        .where(eq(schema.denominationTypes.isActive, true))
        .orderBy(schema.denominationTypes.sortOrder);
    } catch (error) {
      console.error('Error fetching denomination types:', error);
      throw error;
    }
  }

  // Create new register session
  async createSession(sessionData: InsertRegisterSession): Promise<RegisterSession> {
    try {
      const sessionNumber = `REG-${sessionData.registerId}-${Date.now()}`;
      
      const results = await db.insert(schema.registerSessions)
        .values({
          ...sessionData,
          sessionNumber,
        })
        .returning();
      
      return results[0];
    } catch (error) {
      console.error('Error creating register session:', error);
      throw error;
    }
  }

  // Get active session for a register
  async getActiveSession(registerId: number): Promise<RegisterSession | null> {
    try {
      const results = await db.select()
        .from(schema.registerSessions)
        .where(
          and(
            eq(schema.registerSessions.registerId, registerId),
            eq(schema.registerSessions.status, 'open')
          )
        )
        .limit(1);
      
      return results[0] || null;
    } catch (error) {
      console.error('Error finding active session:', error);
      throw error;
    }
  }

  // Save denomination breakdown for session
  async saveDenominationBreakdown(sessionId: number, denominations: InsertRegisterSessionDenomination[]): Promise<void> {
    try {
      await db.insert(schema.registerSessionDenominations)
        .values(denominations.map(d => ({ ...d, sessionId })));
    } catch (error) {
      console.error('Error saving denomination breakdown:', error);
      throw error;
    }
  }

  // Get denomination breakdown for session
  async getDenominationBreakdown(sessionId: number, type: 'opening' | 'closing'): Promise<any[]> {
    try {
      return await db.select({
        id: schema.registerSessionDenominations.id,
        sessionId: schema.registerSessionDenominations.sessionId,
        denominationId: schema.registerSessionDenominations.denominationId,
        quantity: type === 'opening' 
          ? schema.registerSessionDenominations.openingQuantity 
          : schema.registerSessionDenominations.closingQuantity,
        amount: type === 'opening' 
          ? schema.registerSessionDenominations.openingAmount 
          : schema.registerSessionDenominations.closingAmount,
        denominationValue: schema.denominationTypes.value,
        denominationName: schema.denominationTypes.name,
        denominationType: schema.denominationTypes.type,
      })
        .from(schema.registerSessionDenominations)
        .leftJoin(
          schema.denominationTypes,
          eq(schema.registerSessionDenominations.denominationId, schema.denominationTypes.id)
        )
        .where(
          and(
            eq(schema.registerSessionDenominations.sessionId, sessionId),
            eq(schema.registerSessionDenominations.type, type)
          )
        )
        .orderBy(schema.denominationTypes.sortOrder);
    } catch (error) {
      console.error('Error fetching denomination breakdown:', error);
      throw error;
    }
  }

  // Close register session
  async closeSession(sessionId: number, closingData: {
    declaredClosingBalance: string;
    calculatedClosingBalance: string;
    systemExpectedBalance: string;
    closedBy: string;
    notes?: string;
  }): Promise<RegisterSession> {
    try {
      const discrepancyAmount = (
        parseFloat(closingData.systemExpectedBalance) - parseFloat(closingData.calculatedClosingBalance)
      ).toFixed(2);

      const results = await db.update(schema.registerSessions)
        .set({
          ...closingData,
          discrepancyAmount,
          status: 'closed',
          closedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.registerSessions.id, sessionId))
        .returning();
      
      return results[0];
    } catch (error) {
      console.error('Error closing register session:', error);
      throw error;
    }
  }

  // Create cash reconciliation report
  async createReconciliationReport(reportData: InsertCashReconciliationReport): Promise<void> {
    try {
      await db.insert(schema.cashReconciliationReports)
        .values(reportData);
    } catch (error) {
      console.error('Error creating reconciliation report:', error);
      throw error;
    }
  }

  // Log audit entry
  async logAudit(auditData: InsertRegisterAuditLog): Promise<void> {
    try {
      await db.insert(schema.registerAuditLogs)
        .values(auditData);
    } catch (error) {
      console.error('Error logging audit entry:', error);
      throw error;
    }
  }

  // Get session history for register
  async getSessionHistory(registerId: number, limit: number = 50): Promise<RegisterSession[]> {
    try {
      return await db.select()
        .from(schema.registerSessions)
        .where(eq(schema.registerSessions.registerId, registerId))
        .orderBy(desc(schema.registerSessions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  }

  // Get discrepancy reports for branch
  async getDiscrepancyReports(branchId: number, limit: number = 20): Promise<any[]> {
    try {
      return await db.select({
        sessionId: schema.registerSessions.id,
        sessionNumber: schema.registerSessions.sessionNumber,
        registerName: schema.registers.name,
        discrepancyAmount: schema.registerSessions.discrepancyAmount,
        openedAt: schema.registerSessions.openedAt,
        closedAt: schema.registerSessions.closedAt,
        openedByUser: schema.users.name,
      })
        .from(schema.registerSessions)
        .leftJoin(schema.registers, eq(schema.registerSessions.registerId, schema.registers.id))
        .leftJoin(schema.users, eq(schema.registerSessions.openedBy, schema.users.id))
        .where(
          and(
            eq(schema.registerSessions.branchId, branchId),
            sql`${schema.registerSessions.discrepancyAmount} != 0`
          )
        )
        .orderBy(desc(schema.registerSessions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching discrepancy reports:', error);
      throw error;
    }
  }
}