import { storage } from '../../storage';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export class InventoryRepository {
  
  // Warehouse methods
  async findAllWarehouses() {
    try {
      return await storage.db.select().from(schema.warehouses).orderBy(schema.warehouses.name);
    } catch (error) {
      console.error('Error finding warehouses:', error);
      throw error;
    }
  }

  async createWarehouse(warehouseData: { name: string; location?: string }) {
    try {
      const results = await storage.db.insert(schema.warehouses)
        .values(warehouseData)
        .returning();
      return results[0];
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  }

  async updateWarehouse(id: number, warehouseData: { name?: string; location?: string }) {
    try {
      const results = await storage.db.update(schema.warehouses)
        .set(warehouseData)
        .where(eq(schema.warehouses.id, id))
        .returning();
      return results[0];
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw error;
    }
  }

  async deleteWarehouse(id: number) {
    try {
      await storage.db.delete(schema.warehouses)
        .where(eq(schema.warehouses.id, id));
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw error;
    }
  }

  async getWarehouseStockCount(warehouseId: number) {
    try {
      const result = await storage.db.select({ count: sql`count(*)` })
        .from(schema.stock)
        .where(eq(schema.stock.warehouseId, warehouseId));
      return parseInt(result[0].count as string);
    } catch (error) {
      console.error('Error getting warehouse stock count:', error);
      throw error;
    }
  }

  // Stock methods
  async findStock(warehouseId?: number, lowStockOnly?: boolean) {
    try {
      let query = storage.db.select({
        id: schema.stock.id,
        productVariantId: schema.stock.productVariantId,
        warehouseId: schema.stock.warehouseId,
        quantity: schema.stock.quantity,
        productName: schema.products.name,
        variantName: schema.productVariants.variantName,
        warehouseName: schema.warehouses.name,
        categoryName: schema.categories.name,
        brandName: schema.brands.name,
      })
      .from(schema.stock)
      .leftJoin(schema.productVariants, eq(schema.stock.productVariantId, schema.productVariants.id))
      .leftJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .leftJoin(schema.warehouses, eq(schema.stock.warehouseId, schema.warehouses.id))
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id));

      if (warehouseId) {
        query = query.where(eq(schema.stock.warehouseId, warehouseId));
      }

      if (lowStockOnly) {
        query = query.where(sql`${schema.stock.quantity} <= 10`);
      }

      return await query.orderBy(schema.products.name);
    } catch (error) {
      console.error('Error finding stock:', error);
      throw error;
    }
  }

  async adjustStock(adjustmentData: {
    productVariantId: number;
    warehouseId: number;
    quantityChange: number;
    reason: string;
    userId: string;
  }) {
    try {
      // First, update the stock quantity
      await db.update(schema.stock)
        .set({
          quantity: sql`${schema.stock.quantity} + ${adjustmentData.quantityChange}`
        })
        .where(and(
          eq(schema.stock.productVariantId, adjustmentData.productVariantId),
          eq(schema.stock.warehouseId, adjustmentData.warehouseId)
        ));

      // Then, record the adjustment
      const adjustmentResults = await storage.db.insert(schema.stockAdjustments)
        .values({
          warehouseId: adjustmentData.warehouseId,
          userId: adjustmentData.userId,
          reason: adjustmentData.reason,
        })
        .returning();

      return adjustmentResults[0];
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  // Stock transfer methods
  async findStockTransfers() {
    try {
      return await storage.db.select({
        id: schema.stockTransfers.id,
        fromWarehouseId: schema.stockTransfers.fromWarehouseId,
        toWarehouseId: schema.stockTransfers.toWarehouseId,
        transferDate: schema.stockTransfers.transferDate,
        status: schema.stockTransfers.status,
        fromWarehouseName: schema.warehouses.name,
        toWarehouseName: sql`to_warehouse.name`,
      })
      .from(schema.stockTransfers)
      .leftJoin(schema.warehouses, eq(schema.stockTransfers.fromWarehouseId, schema.warehouses.id))
      .leftJoin(sql`warehouses to_warehouse`, sql`${schema.stockTransfers.toWarehouseId} = to_warehouse.id`)
      .orderBy(desc(schema.stockTransfers.transferDate));
    } catch (error) {
      console.error('Error finding stock transfers:', error);
      throw error;
    }
  }

  async createStockTransfer(transferData: {
    fromWarehouseId: number;
    toWarehouseId: number;
    items: Array<{
      productVariantId: number;
      quantity: number;
    }>;
  }) {
    try {
      // Create the transfer record
      const transferResults = await storage.db.insert(schema.stockTransfers)
        .values({
          fromWarehouseId: transferData.fromWarehouseId,
          toWarehouseId: transferData.toWarehouseId,
          transferDate: new Date(),
          status: 'pending'
        })
        .returning();

      const transfer = transferResults[0];

      // Create transfer items
      for (const item of transferData.items) {
        await storage.db.insert(schema.stockTransferItems)
          .values({
            transferId: transfer.id,
            productVariantId: item.productVariantId,
            quantity: item.quantity
          });

        // Update stock quantities
        await storage.db.update(schema.stock)
          .set({
            quantity: sql`${schema.stock.quantity} - ${item.quantity}`
          })
          .where(and(
            eq(schema.stock.productVariantId, item.productVariantId),
            eq(schema.stock.warehouseId, transferData.fromWarehouseId)
          ));

        await storage.db.update(schema.stock)
          .set({
            quantity: sql`${schema.stock.quantity} + ${item.quantity}`
          })
          .where(and(
            eq(schema.stock.productVariantId, item.productVariantId),
            eq(schema.stock.warehouseId, transferData.toWarehouseId)
          ));
      }

      return transfer;
    } catch (error) {
      console.error('Error creating stock transfer:', error);
      throw error;
    }
  }

  // Stock adjustment methods
  async findStockAdjustments() {
    try {
      return await storage.db.select({
        id: schema.stockAdjustments.id,
        warehouseId: schema.stockAdjustments.warehouseId,
        userId: schema.stockAdjustments.userId,
        reason: schema.stockAdjustments.reason,
        createdAt: schema.stockAdjustments.createdAt,
        warehouseName: schema.warehouses.name,
        userName: schema.users.name,
      })
      .from(schema.stockAdjustments)
      .leftJoin(schema.warehouses, eq(schema.stockAdjustments.warehouseId, schema.warehouses.id))
      .leftJoin(schema.users, eq(schema.stockAdjustments.userId, schema.users.id))
      .orderBy(desc(schema.stockAdjustments.createdAt));
    } catch (error) {
      console.error('Error finding stock adjustments:', error);
      throw error;
    }
  }
}