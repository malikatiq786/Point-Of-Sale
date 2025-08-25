import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export class InventoryRepository {
  
  // Warehouse methods
  async findAllWarehouses() {
    try {
      return await db.select().from(schema.warehouses).orderBy(schema.warehouses.name);
    } catch (error) {
      console.error('Error finding warehouses:', error);
      throw error;
    }
  }

  async createWarehouse(warehouseData: { name: string; location?: string }) {
    try {
      const results = await db.insert(schema.warehouses)
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
      const results = await db.update(schema.warehouses)
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
      await db.delete(schema.warehouses)
        .where(eq(schema.warehouses.id, id));
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw error;
    }
  }

  async getWarehouseStockCount(warehouseId: number) {
    try {
      const result = await db.select({ count: sql`count(*)` })
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
      let query = db.select({
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
      // First, get the product ID from the variant
      const [variant] = await db.select({ productId: schema.productVariants.productId })
        .from(schema.productVariants)
        .where(eq(schema.productVariants.id, adjustmentData.productVariantId));

      if (!variant) {
        throw new Error('Product variant not found');
      }

      // Update the variant stock quantity
      await db.update(schema.stock)
        .set({
          quantity: sql`${schema.stock.quantity} + ${adjustmentData.quantityChange}`
        })
        .where(and(
          eq(schema.stock.productVariantId, adjustmentData.productVariantId),
          eq(schema.stock.warehouseId, adjustmentData.warehouseId)
        ));

      // Calculate the new total product stock by summing all variant stocks for this product
      const totalStockQuery = await db.select({
        totalStock: sql`COALESCE(SUM(${schema.stock.quantity}), 0)`.as('totalStock')
      })
      .from(schema.stock)
      .leftJoin(schema.productVariants, eq(schema.stock.productVariantId, schema.productVariants.id))
      .where(and(
        eq(schema.productVariants.productId, variant.productId),
        eq(schema.stock.warehouseId, adjustmentData.warehouseId)
      ));

      const newTotalStock = totalStockQuery[0]?.totalStock || 0;

      // Update the product's total stock
      await db.update(schema.products)
        .set({
          stock: Number(newTotalStock),
          updatedAt: new Date()
        })
        .where(eq(schema.products.id, variant.productId));

      console.log(`Updated product ${variant.productId} total stock to: ${newTotalStock}`);

      // Record the adjustment
      const adjustmentResults = await db.insert(schema.stockAdjustments)
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
      return await db.select({
        id: schema.stockTransfers.id,
        fromWarehouseId: schema.stockTransfers.fromWarehouseId,
        toWarehouseId: schema.stockTransfers.toWarehouseId,
        transferDate: schema.stockTransfers.transferDate,
        status: schema.stockTransfers.status,
        fromWarehouseName: sql`from_wh.name`,
        toWarehouseName: sql`to_wh.name`,
      })
      .from(schema.stockTransfers)
      .leftJoin(sql`${schema.warehouses} as from_wh`, eq(schema.stockTransfers.fromWarehouseId, sql`from_wh.id`))
      .leftJoin(sql`${schema.warehouses} as to_wh`, eq(schema.stockTransfers.toWarehouseId, sql`to_wh.id`))
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
      // Create the transfer record first
      const [transfer] = await db.insert(schema.stockTransfers)
        .values({
          fromWarehouseId: transferData.fromWarehouseId,
          toWarehouseId: transferData.toWarehouseId,
          transferDate: new Date(),
          status: 'completed'
        })
        .returning();

      // Process each item transfer - Update stock quantities
      for (const item of transferData.items) {
        // First, check if there's existing stock record for source warehouse
        const [sourceStock] = await db.select()
          .from(schema.stock)
          .where(and(
            eq(schema.stock.productVariantId, item.productVariantId),
            eq(schema.stock.warehouseId, transferData.fromWarehouseId)
          ));

        if (!sourceStock) {
          throw new Error(`No stock found for product variant ${item.productVariantId} in source warehouse`);
        }

        // Check if there's enough stock to transfer
        const currentStock = parseFloat(sourceStock.quantity || '0');
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product variant ${item.productVariantId}. Available: ${currentStock}, Requested: ${item.quantity}`);
        }

        // Decrease stock from source warehouse
        await db.update(schema.stock)
          .set({
            quantity: sql`${schema.stock.quantity} - ${item.quantity}`
          })
          .where(and(
            eq(schema.stock.productVariantId, item.productVariantId),
            eq(schema.stock.warehouseId, transferData.fromWarehouseId)
          ));

        // Check if destination warehouse already has stock for this product
        const [destinationStock] = await db.select()
          .from(schema.stock)
          .where(and(
            eq(schema.stock.productVariantId, item.productVariantId),
            eq(schema.stock.warehouseId, transferData.toWarehouseId)
          ));

        if (destinationStock) {
          // Update existing stock in destination warehouse
          await db.update(schema.stock)
            .set({
              quantity: sql`${schema.stock.quantity} + ${item.quantity}`
            })
            .where(and(
              eq(schema.stock.productVariantId, item.productVariantId),
              eq(schema.stock.warehouseId, transferData.toWarehouseId)
            ));
        } else {
          // Create new stock record in destination warehouse
          await db.insert(schema.stock)
            .values({
              productVariantId: item.productVariantId,
              warehouseId: transferData.toWarehouseId,
              quantity: item.quantity.toString()
            });
        }

        // Insert transfer item record
        await db.insert(schema.stockTransferItems)
          .values({
            transferId: transfer.id,
            productVariantId: item.productVariantId,
            quantity: item.quantity.toString()
          });

        console.log(`Stock transfer completed: ${item.quantity} units of product variant ${item.productVariantId} from warehouse ${transferData.fromWarehouseId} to ${transferData.toWarehouseId}`);
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
      return await db.select({
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