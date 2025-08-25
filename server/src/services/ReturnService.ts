import { ReturnRepository } from '../repositories/ReturnRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { validateInput } from '../validators';
import { formatCurrency, generateId } from '../utils';
import { DatabaseResult, ActivityLog } from '../types';
import { z } from 'zod';

// Validation schemas
const returnCreateSchema = z.object({
  saleId: z.number().positive(),
  reason: z.string().min(1, 'Return reason is required'),
  customerId: z.number().optional(),
  customerName: z.string().optional(),
  totalAmount: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val || 0;
  }),
  items: z.array(z.object({
    productVariantId: z.number().optional(),
    quantity: z.number().positive(),
    price: z.union([z.number(), z.string()]).optional().transform((val) => {
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val || 0;
    }),
    returnType: z.enum(['refund', 'exchange', 'store_credit']).default('refund'),
  })).optional().default([]),
});

export class ReturnService {
  private returnRepository: ReturnRepository;
  private saleRepository: SaleRepository;

  constructor() {
    this.returnRepository = new ReturnRepository();
    this.saleRepository = new SaleRepository();
  }

  // Create a new return
  async createReturn(returnData: any, userId?: string): Promise<DatabaseResult> {
    try {
      // Validate input
      const validation = validateInput(returnCreateSchema, returnData);
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      const { items = [], ...returnInfo } = validation.data!;

      // Fetch the original sale to get customer and amount info
      const sale = await this.saleRepository.findById(returnInfo.saleId);
      if (!sale) {
        return {
          success: false,
          error: `Sale with ID ${returnInfo.saleId} not found`,
        };
      }

      // Prepare return data
      const finalReturnData = {
        ...returnInfo,
        userId: userId || null,
        customerId: sale.customerId || null,
        customerName: returnInfo.customerName || sale.customerName || 'Walk-in Customer',
        totalAmount: returnInfo.totalAmount || sale.totalAmount,
        status: 'pending',
      };

      // Create the return
      const returnRecord = await this.returnRepository.createReturnWithItems(finalReturnData, items);

      // Log the activity
      const activityLog: ActivityLog = {
        id: generateId(),
        action: `Created return #${returnRecord.id}`,
        details: `Return for Sale #${returnInfo.saleId}: ${formatCurrency(finalReturnData.totalAmount)}`,
        userId: userId ? parseInt(userId) : undefined,
        timestamp: new Date(),
      };

      console.log('Return activity logged:', activityLog);

      return {
        success: true,
        data: {
          ...returnRecord,
          formattedAmount: formatCurrency(returnRecord.totalAmount || 0),
        },
      };
    } catch (error) {
      console.error('ReturnService: Error creating return:', error);
      return {
        success: false,
        error: 'Failed to create return',
      };
    }
  }

  // Get all returns with pagination
  async getReturns(limit: number = 50, offset: number = 0): Promise<DatabaseResult> {
    try {
      const returnRecords = await this.returnRepository.findAllWithDetails(limit, offset);
      
      return {
        success: true,
        data: returnRecords.map(returnRecord => ({
          ...returnRecord,
          formattedAmount: formatCurrency(returnRecord.totalAmount || 0),
          customerName: returnRecord.customerName || returnRecord.customer?.name || 'Walk-in Customer',
        })),
      };
    } catch (error) {
      console.error('ReturnService: Error getting returns:', error);
      return {
        success: false,
        error: 'Failed to fetch returns',
      };
    }
  }

  // Get return by ID with items
  async getReturnById(returnId: number): Promise<DatabaseResult> {
    try {
      const returnRecord = await this.returnRepository.findById(returnId);
      if (!returnRecord) {
        return {
          success: false,
          error: 'Return not found',
        };
      }

      const items = await this.returnRepository.getReturnItems(returnId);

      return {
        success: true,
        data: {
          ...returnRecord,
          items,
          formattedAmount: formatCurrency(returnRecord.totalAmount || 0),
        },
      };
    } catch (error) {
      console.error('ReturnService: Error getting return by ID:', error);
      return {
        success: false,
        error: 'Failed to fetch return',
      };
    }
  }

  // Get returns by date range
  async getReturnsByDateRange(startDate: Date, endDate: Date): Promise<DatabaseResult> {
    try {
      console.log(`ReturnService: Fetching returns by date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      const returnRecords = await this.returnRepository.findByDateRange(startDate, endDate);
      console.log(`ReturnService: Found ${returnRecords.length} returns in date range`);
      
      return {
        success: true,
        data: returnRecords.map(returnRecord => ({
          ...returnRecord,
          formattedAmount: formatCurrency(returnRecord.totalAmount || 0),
          customerName: returnRecord.customerName || returnRecord.customer?.name || 'Walk-in Customer',
        })),
      };
    } catch (error) {
      console.error('ReturnService: Error getting returns by date range:', error);
      return {
        success: false,
        error: 'Failed to fetch returns by date range',
      };
    }
  }

  // Update return status
  async updateReturnStatus(returnId: number, status: string, userId?: string): Promise<DatabaseResult> {
    try {
      const validStatuses = ['pending', 'approved', 'rejected', 'processed'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        };
      }

      const updatedReturn = await this.returnRepository.updateStatus(returnId, status, userId);
      
      if (updatedReturn.length === 0) {
        return {
          success: false,
          error: 'Return not found',
        };
      }

      // Log the activity
      const activityLog: ActivityLog = {
        id: generateId(),
        action: `Updated return #${returnId} status`,
        details: `Status changed to: ${status}`,
        userId: userId ? parseInt(userId) : undefined,
        timestamp: new Date(),
      };

      console.log('Return status update logged:', activityLog);

      return {
        success: true,
        data: updatedReturn[0],
      };
    } catch (error) {
      console.error('ReturnService: Error updating return status:', error);
      return {
        success: false,
        error: 'Failed to update return status',
      };
    }
  }

  // Get today's returns count for dashboard
  async getTodaysReturnsCount(): Promise<DatabaseResult> {
    try {
      const count = await this.returnRepository.getTodaysReturnsCount();
      
      return {
        success: true,
        data: {
          count,
        },
      };
    } catch (error) {
      console.error('ReturnService: Error getting today\'s returns count:', error);
      return {
        success: false,
        error: 'Failed to fetch today\'s returns count',
      };
    }
  }
}