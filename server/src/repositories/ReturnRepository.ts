import { BaseRepository, eq, and, gte, lte, sql } from './BaseRepository';
import { desc, inArray } from 'drizzle-orm';
import { returns, returnItems, sales, customers, products, productVariants, categories, brands, units, users } from '../../../shared/schema';
import { db } from './BaseRepository';

export class ReturnRepository extends BaseRepository<typeof returns, any, typeof returns.$inferSelect> {
  constructor() {
    super(returns);
  }

  // Create return with items
  async createReturnWithItems(returnData: any, items: any[] = []) {
    try {
      // Create the return
      const returnResults = await db.insert(returns)
        .values({
          ...returnData,
          returnDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const returnRecord = returnResults[0];

      // If items are provided, create return items
      if (items.length > 0) {
        const returnItemsData = items.map(item => ({
          returnId: returnRecord.id,
          productVariantId: item.productVariantId || null,
          quantity: item.quantity,
          price: item.price || 0,
          returnType: item.returnType || 'refund',
        }));

        await db.insert(returnItems).values(returnItemsData);
      }

      return returnRecord;
    } catch (error) {
      console.error('Error creating return with items:', error);
      throw error;
    }
  }

  // Get all returns with details
  async findAllWithDetails(limit: number = 50, offset: number = 0) {
    try {
      return await db.select({
        id: returns.id,
        saleId: returns.saleId,
        userId: returns.userId,
        customerId: returns.customerId,
        reason: returns.reason,
        status: returns.status,
        totalAmount: returns.totalAmount,
        customerName: returns.customerName,
        returnDate: returns.returnDate,
        createdAt: returns.createdAt,
        updatedAt: returns.updatedAt,
        sale: {
          id: sales.id,
          totalAmount: sales.totalAmount,
          saleDate: sales.saleDate,
        },
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
        },
        user: {
          id: users.id,
          name: users.name,
        }
      })
      .from(returns)
      .leftJoin(sales, eq(returns.saleId, sales.id))
      .leftJoin(customers, eq(returns.customerId, customers.id))
      .leftJoin(users, eq(returns.userId, users.id))
      .orderBy(desc(returns.createdAt))
      .limit(limit)
      .offset(offset);
    } catch (error) {
      console.error('Error getting returns with details:', error);
      throw error;
    }
  }

  // Get returns by date range
  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      return await db.select({
        id: returns.id,
        saleId: returns.saleId,
        userId: returns.userId,
        customerId: returns.customerId,
        reason: returns.reason,
        status: returns.status,
        totalAmount: returns.totalAmount,
        customerName: returns.customerName,
        returnDate: returns.returnDate,
        createdAt: returns.createdAt,
        updatedAt: returns.updatedAt,
        sale: {
          id: sales.id,
          totalAmount: sales.totalAmount,
          saleDate: sales.saleDate,
        },
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
        },
        user: {
          id: users.id,
          name: users.name,
        }
      })
      .from(returns)
      .leftJoin(sales, eq(returns.saleId, sales.id))
      .leftJoin(customers, eq(returns.customerId, customers.id))
      .leftJoin(users, eq(returns.userId, users.id))
      .where(
        and(
          gte(returns.returnDate, startDate),
          lte(returns.returnDate, endDate)
        )
      )
      .orderBy(desc(returns.createdAt));
    } catch (error) {
      console.error('Error getting returns by date range:', error);
      throw error;
    }
  }

  // Get return items for a specific return
  async getReturnItems(returnId: number) {
    try {
      return await db.select({
        id: returnItems.id,
        quantity: returnItems.quantity,
        price: returnItems.price,
        returnType: returnItems.returnType,
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
      .from(returnItems)
      .leftJoin(productVariants, eq(returnItems.productVariantId, productVariants.id))
      .leftJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(units, eq(products.unitId, units.id))
      .where(eq(returnItems.returnId, returnId));
    } catch (error) {
      console.error('Error getting return items:', error);
      throw error;
    }
  }

  // Update return status
  async updateStatus(returnId: number, status: string, updatedBy?: string) {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      // Don't update userId to avoid foreign key constraint issues
      // The updatedBy information is logged in activity logs instead

      return await db.update(returns)
        .set(updateData)
        .where(eq(returns.id, returnId))
        .returning();
    } catch (error) {
      console.error('Error updating return status:', error);
      throw error;
    }
  }

  // Get today's returns count
  async getTodaysReturnsCount(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(returns)
        .where(
          and(
            gte(returns.returnDate, today),
            lte(returns.returnDate, tomorrow)
          )
        );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting today\'s returns count:', error);
      return 0;
    }
  }

  // Get return items for multiple returns in a single optimized query
  async getBulkReturnItems(returnIds: number[]) {
    try {
      const allItems = await db.select({
        returnId: returnItems.returnId,
        id: returnItems.id,
        quantity: returnItems.quantity,
        price: returnItems.price,
        returnType: returnItems.returnType,
        productVariantId: returnItems.productVariantId,
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
      .from(returnItems)
      .leftJoin(productVariants, eq(returnItems.productVariantId, productVariants.id))
      .leftJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(units, eq(products.unitId, units.id))
      .where(inArray(returnItems.returnId, returnIds));

      // Group by returnId for easier consumption
      const groupedItems: Record<number, any[]> = {};
      allItems.forEach(item => {
        if (!groupedItems[item.returnId]) {
          groupedItems[item.returnId] = [];
        }
        groupedItems[item.returnId].push(item);
      });

      return groupedItems;
    } catch (error) {
      console.error('Error getting bulk return items:', error);
      throw error;
    }
  }
}