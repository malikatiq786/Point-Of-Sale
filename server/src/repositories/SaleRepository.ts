import { BaseRepository, eq, and, gte, lte } from './BaseRepository';
import { sales, saleItems, customers, products, productVariants, categories, brands, units, users } from '../../../shared/schema';
import { db } from './BaseRepository';

export class SaleRepository extends BaseRepository<typeof sales.$inferSelect> {
  constructor() {
    super('sales', sales);
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
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          totalPrice: (item.unitPrice * item.quantity) - (item.discount || 0),
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

  // Find sales with customer and items information
  async findAllWithDetails(limit: number = 10, offset: number = 0) {
    try {
      return await db.select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        paidAmount: sales.paidAmount,
        status: sales.status,
        saleDate: sales.saleDate,
        customer: {
          id: customers.id,
          name: customers.name,
        },
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(sales.saleDate)
      .limit(limit)
      .offset(offset);
    } catch (error) {
      console.error('Error finding sales with details:', error);
      throw error;
    }
  }

  // Get sales by date range
  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      return await db.select()
        .from(sales)
        .where(and(
          gte(sales.saleDate, startDate),
          lte(sales.saleDate, endDate)
        ))
        .orderBy(sales.saleDate);
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

  // Get sale items for a specific sale with product variant details
  async getSaleItems(saleId: number) {
    try {
      return await db.select({
        id: saleItems.id,
        quantity: saleItems.quantity,
        price: saleItems.price,
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
    } catch (error) {
      console.error('Error getting sale items:', error);
      throw error;
    }
  }
}

