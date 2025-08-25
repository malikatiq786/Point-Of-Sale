import { SaleRepository } from '../repositories/SaleRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { CogsTrackingService } from './CogsTrackingService';
import { validateInput, saleCreateSchema } from '../validators';
import { formatCurrency, generateId } from '../utils';
import { SaleRequest, DatabaseResult, ActivityLog } from '../types';

export class SaleService {
  private saleRepository: SaleRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.saleRepository = new SaleRepository();
    this.productRepository = new ProductRepository();
  }

  // Process a new sale
  async processSale(saleData: SaleRequest, userId?: string): Promise<DatabaseResult> {
    try {
      // Validate input
      const validation = validateInput(saleCreateSchema, saleData);
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      const { items = [], ...saleInfo } = validation.data!;

      // Check stock availability for all items
      for (const item of items) {
        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          return {
            success: false,
            error: `Product with ID ${item.productId} not found`,
          };
        }

        const currentStock = product.stock || 0;
        if (currentStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${product.name}. Available: ${currentStock}, Required: ${item.quantity}`,
          };
        }
      }

      // Create the sale
      const sale = await this.saleRepository.createSaleWithItems(saleInfo, items);

      // Update product stock for each item and track COGS
      for (const item of items) {
        await this.productRepository.decreaseStock(item.productId, item.quantity);
        
        // Track COGS for this sale item (WAC-based cost tracking)
        try {
          await CogsTrackingService.trackCogsForSaleItem({
            saleItemId: item.id || 0, // This will be set by the repository
            productId: item.productId,
            quantitySold: item.quantity,
            salePrice: item.price,
            branchId: saleInfo.branchId,
            saleDate: new Date(saleInfo.saleDate),
          });
          console.log(`COGS tracked for product ${item.productId}: ${item.quantity} units at $${item.price}`);
        } catch (cogsError) {
          console.error(`Failed to track COGS for product ${item.productId}:`, cogsError);
          // Don't fail the sale if COGS tracking fails, but log the error
        }
      }

      // Log the activity (you can add this to an activities table if needed)
      const activityLog: ActivityLog = {
        id: generateId(),
        action: `Completed sale #${sale.id}`,
        details: `Sale amount: ${formatCurrency(sale.totalAmount)}`,
        userId: userId ? parseInt(userId) : undefined,
        timestamp: new Date(),
      };

      console.log('Sale activity logged:', activityLog);

      return {
        success: true,
        data: {
          ...sale,
          formattedTotal: formatCurrency(sale.totalAmount),
        },
      };
    } catch (error) {
      console.error('SaleService: Error processing sale:', error);
      return {
        success: false,
        error: 'Failed to process sale',
      };
    }
  }

  // Get all sales with pagination
  async getSales(limit: number = 10, offset: number = 0): Promise<DatabaseResult> {
    try {
      const sales = await this.saleRepository.findAllWithDetails(limit, offset);
      
      return {
        success: true,
        data: sales.map(sale => ({
          ...sale,
          formattedTotal: formatCurrency(sale.totalAmount),
          customerName: sale.customer?.name || 'Walk-in Customer',
        })),
      };
    } catch (error) {
      console.error('SaleService: Error getting sales:', error);
      return {
        success: false,
        error: 'Failed to fetch sales',
      };
    }
  }

  // Get sale by ID with items
  async getSaleById(saleId: number): Promise<DatabaseResult> {
    try {
      const sale = await this.saleRepository.findById(saleId);
      if (!sale) {
        return {
          success: false,
          error: 'Sale not found',
        };
      }

      const items = await this.saleRepository.getSaleItems(saleId);

      return {
        success: true,
        data: {
          ...sale,
          items,
          formattedTotal: formatCurrency(sale.totalAmount),
        },
      };
    } catch (error) {
      console.error('SaleService: Error getting sale by ID:', error);
      return {
        success: false,
        error: 'Failed to fetch sale',
      };
    }
  }

  // Get sales by date range
  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<DatabaseResult> {
    try {
      const sales = await this.saleRepository.findByDateRange(startDate, endDate);
      
      return {
        success: true,
        data: sales.map(sale => ({
          ...sale,
          formattedTotal: formatCurrency(sale.totalAmount),
        })),
      };
    } catch (error) {
      console.error('SaleService: Error getting sales by date range:', error);
      return {
        success: false,
        error: 'Failed to fetch sales by date range',
      };
    }
  }

  // Get today's sales total
  async getTodaysSalesTotal(): Promise<DatabaseResult> {
    try {
      const total = await this.saleRepository.getTodaysSalesTotal();
      
      return {
        success: true,
        data: {
          total,
          formattedTotal: formatCurrency(total),
        },
      };
    } catch (error) {
      console.error('SaleService: Error getting today\'s sales total:', error);
      return {
        success: false,
        error: 'Failed to fetch today\'s sales total',
      };
    }
  }

  // Get recent transactions for dashboard
  async getRecentTransactions(limit: number = 5): Promise<DatabaseResult> {
    try {
      const transactions = await this.saleRepository.getRecentTransactions(limit);
      
      return {
        success: true,
        data: transactions.map(transaction => ({
          ...transaction,
          formattedTotal: formatCurrency(transaction.totalAmount || 0),
          customerName: transaction.customerName || 'Walk-in Customer',
        })),
      };
    } catch (error) {
      console.error('SaleService: Error getting recent transactions:', error);
      return {
        success: false,
        error: 'Failed to fetch recent transactions',
      };
    }
  }
}