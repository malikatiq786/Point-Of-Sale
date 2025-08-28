import { BaseRepository, eq, and, gte, lte, sql } from './BaseRepository';
import { desc, inArray } from 'drizzle-orm';
import { sales, saleItems, customers, products, productVariants, categories, brands, units, users, returns, returnItems } from '../../../shared/schema';
import { db } from '../../db';

export class SaleRepository extends BaseRepository<typeof sales, any, typeof sales.$inferSelect> {
  constructor() {
    super(sales);
  }

  // Create sale with items
  async createSaleWithItems(saleData: any, items: any[] = []) {
    try {
      // Start transaction by creating the sale first
      const saleResults = await db.insert(sales)
        .values({
          ...saleData,
          saleDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const sale = saleResults[0];

      // If items are provided, create sale items
      if (items.length > 0) {
        const saleItemsData = items.map(item => ({
          saleId: sale.id,
          productVariantId: item.productVariantId || item.variantId,
          quantity: item.quantity,
          price: item.unitPrice || item.price,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(saleItems).values(saleItemsData);
      }

      return sale;
    } catch (error) {
      console.error('Error creating sale with items:', error);
      throw error;
    }
  }

  // Find sales with customer and user information
  async findAllWithDetails(limit: number = 10, offset: number = 0) {
    try {
      const salesData = await db.select()
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .orderBy(desc(sales.saleDate))
      .limit(limit)
      .offset(offset);

      // Get items for each sale and format the response
      const salesWithItems = await Promise.all(
        salesData.map(async (saleRow) => {
          try {
            const sale = saleRow.sales;
            const customer = saleRow.customers;
            const user = saleRow.users;
            
            const items = await this.getSaleItems(sale.id);
            
            return {
              id: sale.id,
              totalAmount: sale.totalAmount,
              paidAmount: sale.paidAmount,
              status: sale.status,
              saleDate: sale.saleDate,
              customerName: sale.customerName,
              customerPhone: sale.customerPhone,
              paymentMethod: sale.paymentMethod,
              customerId: sale.customerId,
              customer: customer ? {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
              } : null,
              user: user ? {
                id: user.id,
                name: user.name,
              } : null,
              items: items.map((item: any) => ({
                id: item.id,
                productId: item.product?.id,
                variantId: item.productVariantId,
                productName: item.variant?.variantName ? 
                  `${item.product?.name} - ${item.variant.variantName}` : 
                  item.product?.name,
                quantity: item.quantity,
                price: item.price,
                unitPrice: item.price,
                total: parseFloat(item.quantity) * parseFloat(item.price),
                discount: 0
              }))
            };
          } catch (error) {
            console.error(`Error getting items for sale ${saleRow.sales.id}:`, error);
            return {
              id: saleRow.sales.id,
              totalAmount: saleRow.sales.totalAmount,
              paidAmount: saleRow.sales.paidAmount,
              status: saleRow.sales.status,
              saleDate: saleRow.sales.saleDate,
              customerName: saleRow.sales.customerName,
              customerPhone: saleRow.sales.customerPhone,
              paymentMethod: saleRow.sales.paymentMethod,
              customerId: saleRow.sales.customerId,
              customer: null,
              user: null,
              items: []
            };
          }
        })
      );

      return salesWithItems;
    } catch (error) {
      console.error('Error finding sales with details:', error);
      throw error;
    }
  }

  // Get sales by date range with details
  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      const salesData = await db.select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        paidAmount: sales.paidAmount,
        status: sales.status,
        saleDate: sales.saleDate,
        customerName: sales.customerName,
        customerPhone: sales.customerPhone,
        paymentMethod: sales.paymentMethod,
        customerId: sales.customerId,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        },
        user: {
          id: users.id,
          name: users.name,
        }
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .where(and(
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      ))
      .orderBy(desc(sales.saleDate));

      // Get items for each sale
      const salesWithItems = await Promise.all(
        salesData.map(async (sale) => {
          try {
            const items = await this.getSaleItems(sale.id);
            return {
              ...sale,
              items: items.map((item: any) => ({
                id: item.id,
                productId: item.product?.id,
                variantId: item.productVariantId,
                productName: item.variant?.variantName ? 
                  `${item.product?.name} - ${item.variant.variantName}` : 
                  item.product?.name,
                quantity: item.quantity,
                price: item.price,
                unitPrice: item.price,
                total: parseFloat(item.quantity) * parseFloat(item.price),
                discount: 0
              }))
            };
          } catch (error) {
            console.error(`Error getting items for sale ${sale.id}:`, error);
            return {
              ...sale,
              items: []
            };
          }
        })
      );

      return salesWithItems;
    } catch (error) {
      console.error('Error finding sales by date range:', error);
      throw error;
    }
  }

  // Get today's sales total
  async getTodaysSalesTotal(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const results = await db.select({
        total: sql`COALESCE(SUM(${sales.totalAmount}), 0)::text`
      })
      .from(sales)
      .where(and(
        gte(sales.saleDate, today),
        lte(sales.saleDate, tomorrow),
        eq(sales.status, 'completed')
      ));

      return parseFloat(results[0]?.total || '0');
    } catch (error) {
      console.error('Error getting today\'s sales total:', error);
      return 0;
    }
  }

  // Get recent transactions
  async getRecentTransactions(limit: number = 5) {
    try {
      return await db.select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        saleDate: sales.saleDate,
        customerName: customers.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.status, 'completed'))
      .orderBy(sales.saleDate)
      .limit(limit);
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw error;
    }
  }

  // Get sale items for a specific sale with product variant details and return information
  async getSaleItems(saleId: number) {
    try {
      // Get sale items with product details
      const items = await db.select({
        id: saleItems.id,
        quantity: saleItems.quantity,
        price: saleItems.price,
        productVariantId: saleItems.productVariantId,
        product: {
          id: products.id,
          name: products.name,
          barcode: products.barcode,
          categoryName: categories.name,
          brandName: brands.name,
          unitName: units.name,
        },
        variant: {
          id: productVariants.id,
          variantName: productVariants.variantName,
          salePrice: productVariants.salePrice,
          purchasePrice: productVariants.purchasePrice,
        }
      })
      .from(saleItems)
      .leftJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .leftJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(units, eq(products.unitId, units.id))
      .where(eq(saleItems.saleId, saleId));

      // Get the sale total for fallback price calculation
      const saleInfo = await db.select({
        totalAmount: sales.totalAmount
      })
      .from(sales)
      .where(eq(sales.id, saleId))
      .limit(1);

      const saleTotal = saleInfo[0]?.totalAmount ? parseFloat(saleInfo[0].totalAmount) : 0;

      // Get return information for this sale
      const returnItemsQuery = await db.execute(sql`
        SELECT 
          ri.product_variant_id,
          SUM(ri.quantity) as total_returned
        FROM returns r
        JOIN return_items ri ON r.id = ri.return_id
        WHERE r.sale_id = ${saleId} 
          AND r.status IN ('approved', 'processed')
        GROUP BY ri.product_variant_id
      `);

      // Convert return data to a map for easy lookup
      const returnedQuantities = new Map();
      returnItemsQuery.rows.forEach((row: any) => {
        returnedQuantities.set(row.product_variant_id, parseFloat(row.total_returned || '0'));
      });

      // Add return information to each item and handle missing data
      return items.map(item => {
        const originalQuantity = parseFloat(item.quantity || '0');
        const returnedQuantity = returnedQuantities.get(item.productVariantId) || 0;
        const netQuantity = originalQuantity - returnedQuantity;

        // Handle missing product information - use fallback values
        let itemPrice = parseFloat(item.price || '0');
        let productName = item.product?.name || 'Product';
        
        // If price is missing but we have a sale total, use that as fallback
        if (!itemPrice && saleTotal && items.length === 1) {
          itemPrice = saleTotal;
        } else if (!itemPrice && saleTotal) {
          // If multiple items, distribute total evenly as fallback
          itemPrice = saleTotal / items.length;
        }

        // If product name is missing, try to create a descriptive fallback
        if (!item.product?.name) {
          productName = `Sale Item ${item.id}`;
        }

        return {
          ...item,
          // Ensure price is set
          price: itemPrice.toString(),
          // Ensure product object exists with fallback data
          product: {
            id: item.product?.id || null,
            name: productName,
            barcode: item.product?.barcode || null,
            categoryName: item.product?.categoryName || null,
            brandName: item.product?.brandName || null,
            unitName: item.product?.unitName || null,
          },
          originalQuantity: originalQuantity,
          returnedQuantity: returnedQuantity,
          netQuantity: netQuantity,
          hasReturns: returnedQuantity > 0,
          isFullyReturned: netQuantity <= 0,
        };
      });
    } catch (error) {
      console.error('Error getting sale items:', error);
      throw error;
    }
  }

  // Get sale items for multiple sales in a single optimized query with return information
  async getBulkSaleItems(saleIds: number[]) {
    try {
      // Get all sale items with product details
      const allItems = await db.select({
        saleId: saleItems.saleId,
        id: saleItems.id,
        quantity: saleItems.quantity,
        price: saleItems.price,
        productVariantId: saleItems.productVariantId,
        product: {
          id: products.id,
          name: products.name,
          barcode: products.barcode,
          categoryName: categories.name,
          brandName: brands.name,
          unitName: units.name,
        },
        variant: {
          id: productVariants.id,
          variantName: productVariants.variantName,
          salePrice: productVariants.salePrice,
          purchasePrice: productVariants.purchasePrice,
        }
      })
      .from(saleItems)
      .leftJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .leftJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(units, eq(products.unitId, units.id))
      .where(inArray(saleItems.saleId, saleIds));

      // Get sales totals for fallback price calculation
      const salesTotals = await db.select({
        id: sales.id,
        totalAmount: sales.totalAmount
      })
      .from(sales)
      .where(inArray(sales.id, saleIds));

      const salesTotalsMap = new Map();
      salesTotals.forEach(sale => {
        salesTotalsMap.set(sale.id, parseFloat(sale.totalAmount || '0'));
      });

      // Get all return information for these sales
      const returnItemsData = await db.select({
        saleId: returns.saleId,
        productVariantId: returnItems.productVariantId,
        totalReturned: sql<number>`SUM(${returnItems.quantity})`.as('total_returned')
      })
      .from(returns)
      .innerJoin(returnItems, eq(returns.id, returnItems.returnId))
      .where(and(
        inArray(returns.saleId, saleIds),
        inArray(returns.status, ['approved', 'processed'])
      ))
      .groupBy(returns.saleId, returnItems.productVariantId);

      // Convert return data to a nested map for easy lookup: [saleId][variantId] = returnedQuantity
      const returnedQuantities = new Map();
      returnItemsData.forEach((row) => {
        const saleId = row.saleId;
        const variantId = row.productVariantId;
        const returnedQty = parseFloat(row.totalReturned?.toString() || '0');
        
        if (!returnedQuantities.has(saleId)) {
          returnedQuantities.set(saleId, new Map());
        }
        returnedQuantities.get(saleId).set(variantId, returnedQty);
      });

      // Add return information to items and group by sale ID with fallback data
      const groupedItems: Record<number, any[]> = {};
      allItems.forEach(item => {
        const saleReturns = returnedQuantities.get(item.saleId) || new Map();
        const returnedQuantity = saleReturns.get(item.productVariantId) || 0;
        const saleTotal = salesTotalsMap.get(item.saleId) || 0;
        
        const originalQuantity = parseFloat(item.quantity || '0');
        const netQuantity = originalQuantity - returnedQuantity;

        // Handle missing product information - use fallback values
        let itemPrice = parseFloat(item.price || '0');
        let productName = item.product?.name || 'Product';
        
        // Get items for this sale to calculate distributed prices
        const saleItemsCount = allItems.filter(i => i.saleId === item.saleId).length;
        
        // If price is missing but we have a sale total, use that as fallback
        if (!itemPrice && saleTotal && saleItemsCount === 1) {
          itemPrice = saleTotal;
        } else if (!itemPrice && saleTotal && saleItemsCount > 0) {
          // If multiple items, distribute total evenly as fallback
          itemPrice = saleTotal / saleItemsCount;
        }

        // If product name is missing, try to create a descriptive fallback
        if (!item.product?.name) {
          productName = `Sale Item ${item.id}`;
        }

        const enrichedItem = {
          ...item,
          // Ensure price is set
          price: itemPrice.toString(),
          // Ensure product object exists with fallback data
          product: {
            id: item.product?.id || null,
            name: productName,
            barcode: item.product?.barcode || null,
            categoryName: item.product?.categoryName || null,
            brandName: item.product?.brandName || null,
            unitName: item.product?.unitName || null,
          },
          originalQuantity: originalQuantity,
          returnedQuantity: returnedQuantity,
          netQuantity: netQuantity,
          hasReturns: returnedQuantity > 0,
          isFullyReturned: netQuantity <= 0,
        };

        if (!groupedItems[item.saleId]) {
          groupedItems[item.saleId] = [];
        }
        groupedItems[item.saleId].push(enrichedItem);
      });

      return groupedItems;
    } catch (error) {
      console.error('Error getting bulk sale items:', error);
      throw error;
    }
  }

  // Get customer sales history with items
  async findByCustomerId(customerId: number) {
    try {
      console.log(`SaleRepository: Finding sales for customer ID: ${customerId}`);
      const salesData = await db.select()
      .from(sales)
      .where(eq(sales.customerId, customerId))
      .orderBy(desc(sales.saleDate));

      console.log(`SaleRepository: Found ${salesData.length} sales for customer ${customerId}`);
      
      // Get items for each sale
      const salesWithItems = await Promise.all(
        salesData.map(async (sale) => {
          try {
            const items = await this.getSaleItems(sale.id);
            return {
              ...sale,
              items: items.map((item: any) => ({
                id: item.id,
                productId: item.product?.id,
                variantId: item.productVariantId,
                productName: item.variant?.variantName ? 
                  `${item.product?.name} - ${item.variant.variantName}` : 
                  item.product?.name,
                quantity: item.quantity,
                price: item.price,
                unitPrice: item.price,
                total: parseFloat(item.quantity) * parseFloat(item.price),
                discount: 0
              }))
            };
          } catch (error) {
            console.error(`Error getting items for sale ${sale.id}:`, error);
            return {
              ...sale,
              items: []
            };
          }
        })
      );

      return salesWithItems;
    } catch (error) {
      console.error('Error finding sales by customer ID:', error);
      throw error;
    }
  }
}

