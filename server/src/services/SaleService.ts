import { SaleRepository } from '../repositories/SaleRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { CustomerLedgerService } from './CustomerLedgerService';
import { CogsTrackingService } from './CogsTrackingService';
import { validateInput, saleCreateSchema } from '../validators';
import { formatCurrency, generateId } from '../utils';
import { SaleRequest, DatabaseResult, ActivityLog } from '../types/index';
import { db } from '../../db';
import { stock, products, productVariants } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export class SaleService {
  private saleRepository: SaleRepository;
  private productRepository: ProductRepository;
  private customerLedgerService: CustomerLedgerService;

  constructor() {
    this.saleRepository = new SaleRepository();
    this.productRepository = new ProductRepository();
    this.customerLedgerService = new CustomerLedgerService();
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

      // Update product/variant stock for each item and track COGS
      for (const item of items) {
        console.log(`Processing stock decrease for product ${item.productId}, variant ${item.variantId}, qty: ${item.quantity}`);
        
        if (item.variantId) {
          // Decrease stock from stock table for the variant
          await this.decreaseVariantStock(item.variantId, item.quantity);
          // Sync product total stock from all its variants
          await this.syncProductStockFromVariants(item.productId);
          console.log(`Variant ${item.variantId} stock decreased by ${item.quantity}, product ${item.productId} synced`);
        } else {
          // No variant, decrease product stock directly
          await this.productRepository.decreaseStock(item.productId, item.quantity);
          console.log(`Product ${item.productId} stock decreased by ${item.quantity}`);
        }
        
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

      // Handle customer ledger updates for non-cash payments or partial payments
      if (saleInfo.customerId) {
        const totalAmount = parseFloat(sale.totalAmount);
        const paidAmount = parseFloat(sale.paidAmount || '0');
        
        if (paidAmount < totalAmount) {
          // Customer owes money - create debit entry
          const unpaidAmount = totalAmount - paidAmount;
          await this.customerLedgerService.createEntry({
            customerId: saleInfo.customerId,
            amount: unpaidAmount.toFixed(2),
            type: 'debit',
            reference: `SALE-${sale.id}`,
            description: `Sale #${sale.id} - Outstanding amount`,
          });
          console.log(`Created debit entry for customer ${saleInfo.customerId}: ${unpaidAmount.toFixed(2)}`);
        } else if (paidAmount > totalAmount) {
          // Customer paid more - create credit entry
          const overpaidAmount = paidAmount - totalAmount;
          await this.customerLedgerService.createEntry({
            customerId: saleInfo.customerId,
            amount: overpaidAmount.toFixed(2),
            type: 'credit',
            reference: `SALE-${sale.id}`,
            description: `Sale #${sale.id} - Overpayment credit`,
          });
          console.log(`Created credit entry for customer ${saleInfo.customerId}: ${overpaidAmount.toFixed(2)}`);
        }
      }

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
      console.log(`SaleService: Fetching sales by date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      const sales = await this.saleRepository.findByDateRange(startDate, endDate);
      console.log(`SaleService: Found ${sales.length} sales in date range`);
      
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

  // Get sale items for a specific sale with product variants
  async getSaleItems(saleId: number): Promise<DatabaseResult> {
    try {
      const saleItems = await this.saleRepository.getSaleItems(saleId);
      
      return {
        success: true,
        data: saleItems,
      };
    } catch (error) {
      console.error('SaleService: Error getting sale items:', error);
      return {
        success: false,
        error: 'Failed to fetch sale items',
      };
    }
  }

  // Get sale items for multiple sales in bulk (for exports/printing performance)
  async getBulkSaleItems(saleIds: number[]): Promise<DatabaseResult> {
    try {
      const bulkItems = await this.saleRepository.getBulkSaleItems(saleIds);
      
      return {
        success: true,
        data: bulkItems,
      };
    } catch (error) {
      console.error('SaleService: Error getting bulk sale items:', error);
      return {
        success: false,
        error: 'Failed to fetch bulk sale items',
      };
    }
  }

  // Get customer sales history
  async getCustomerSales(customerId: number): Promise<DatabaseResult> {
    try {
      const sales = await this.saleRepository.findByCustomerId(customerId);
      
      return {
        success: true,
        data: sales.map(sale => ({
          ...sale,
          formattedTotal: formatCurrency(sale.totalAmount),
        })),
      };
    } catch (error) {
      console.error('SaleService: Error getting customer sales:', error);
      return {
        success: false,
        error: 'Failed to fetch customer sales',
      };
    }
  }

  // Get total sales count
  async getSalesCount(): Promise<DatabaseResult> {
    try {
      const count = await this.saleRepository.getTotalCount();
      
      return {
        success: true,
        data: count,
      };
    } catch (error) {
      console.error('SaleService: Error getting sales count:', error);
      return {
        success: false,
        error: 'Failed to fetch sales count',
      };
    }
  }

  // Decrease variant stock in the stock table
  private async decreaseVariantStock(variantId: number, quantity: number): Promise<void> {
    try {
      // Get current stock entries for this variant
      const stockEntries = await db.select()
        .from(stock)
        .where(eq(stock.productVariantId, variantId));

      if (stockEntries.length === 0) {
        console.warn(`No stock entries found for variant ${variantId}, creating default entry`);
        return;
      }

      // Decrease stock from the first warehouse that has enough stock
      let remainingQty = quantity;
      for (const entry of stockEntries) {
        if (remainingQty <= 0) break;
        
        const currentQty = parseFloat(entry.quantity || '0');
        const decreaseAmount = Math.min(currentQty, remainingQty);
        
        if (decreaseAmount > 0) {
          await db.update(stock)
            .set({ quantity: (currentQty - decreaseAmount).toString() })
            .where(eq(stock.id, entry.id));
          
          remainingQty -= decreaseAmount;
          console.log(`Decreased stock entry ${entry.id} by ${decreaseAmount}, new qty: ${currentQty - decreaseAmount}`);
        }
      }

      if (remainingQty > 0) {
        console.warn(`Could not fully decrease stock for variant ${variantId}, remaining: ${remainingQty}`);
      }
    } catch (error) {
      console.error(`Error decreasing variant ${variantId} stock:`, error);
      throw error;
    }
  }

  // Sync product total stock from all its variants
  private async syncProductStockFromVariants(productId: number): Promise<void> {
    try {
      // Calculate total stock from all variants
      const result = await db.execute(sql`
        SELECT COALESCE(SUM(CAST(s.quantity AS DECIMAL)), 0) as total_stock
        FROM product_variants pv
        LEFT JOIN stock s ON pv.id = s.product_variant_id
        WHERE pv.product_id = ${productId}
      `);

      const totalStock = Math.floor(parseFloat((result.rows[0] as any)?.total_stock || '0'));

      // Update product stock
      await db.update(products)
        .set({ stock: totalStock })
        .where(eq(products.id, productId));

      console.log(`Synced product ${productId} stock to ${totalStock}`);
    } catch (error) {
      console.error(`Error syncing product ${productId} stock:`, error);
      throw error;
    }
  }
}