import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db';
import {
  purchaseOrders,
  purchaseOrderItems,
  suppliers,
  products,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrder,
  type InsertPurchaseOrderItem,
} from '@shared/schema';
import { WacCalculationService } from './WacCalculationService';

export interface CreatePurchaseOrderData {
  supplierId?: number;
  branchId?: number;
  warehouseId?: number;
  currency?: string;
  exchangeRate?: number;
  expectedDeliveryDate?: Date;
  notes?: string;
  createdBy: string;
  items: {
    productId: number;
    productVariantId?: number;
    orderedQuantity: number;
    unitCost: number;
    discountPercent?: number;
    taxPercent?: number;
    notes?: string;
  }[];
}

export interface ReceivePurchaseOrderData {
  purchaseOrderId: number;
  receivedBy: string;
  receivedDate?: Date;
  items: {
    itemId: number;
    receivedQuantity: number;
    actualUnitCost?: number; // If different from ordered cost
  }[];
}

export class PurchaseOrderService {
  /**
   * Create a new purchase order
   */
  static async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<PurchaseOrder> {
    console.log('Creating purchase order:', data);

    try {
      // Generate purchase order number
      const purchaseOrderNumber = await this.generatePurchaseOrderNumber();

      // Calculate totals from items
      let totalAmount = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      const itemsWithCalculations = data.items.map(item => {
        const lineSubtotal = item.orderedQuantity * item.unitCost;
        const discountAmount = lineSubtotal * (item.discountPercent || 0) / 100;
        const afterDiscount = lineSubtotal - discountAmount;
        const taxAmount = afterDiscount * (item.taxPercent || 0) / 100;
        const lineTotal = afterDiscount + taxAmount;

        totalAmount += lineSubtotal;
        totalDiscount += discountAmount;
        totalTax += taxAmount;

        return {
          ...item,
          totalCost: lineSubtotal.toString(),
          discountAmount: discountAmount.toString(),
          taxAmount: taxAmount.toString(),
          lineTotal: lineTotal.toString(),
        };
      });

      const grandTotal = totalAmount - totalDiscount + totalTax;

      // Create purchase order record
      const purchaseOrderData: InsertPurchaseOrder = {
        purchaseOrderNumber,
        supplierId: data.supplierId,
        branchId: data.branchId,
        warehouseId: data.warehouseId,
        totalAmount: totalAmount.toString(),
        taxAmount: totalTax.toString(),
        discountAmount: totalDiscount.toString(),
        grandTotal: grandTotal.toString(),
        currency: data.currency || 'USD',
        exchangeRate: data.exchangeRate?.toString() || '1',
        status: 'draft',
        expectedDeliveryDate: data.expectedDeliveryDate,
        notes: data.notes,
        createdBy: data.createdBy,
      };

      const [purchaseOrder] = await db
        .insert(purchaseOrders)
        .values(purchaseOrderData)
        .returning();

      // Create purchase order items
      const itemsData: InsertPurchaseOrderItem[] = itemsWithCalculations.map(item => ({
        purchaseOrderId: purchaseOrder.id,
        productId: item.productId,
        productVariantId: item.productVariantId || null,
        orderedQuantity: item.orderedQuantity.toString(),
        unitCost: item.unitCost.toString(),
        totalCost: item.totalCost,
        discountPercent: item.discountPercent?.toString() || '0',
        discountAmount: item.discountAmount,
        taxPercent: item.taxPercent?.toString() || '0',
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal,
        notes: item.notes,
      }));

      await db.insert(purchaseOrderItems).values(itemsData);

      console.log('Purchase order created successfully:', purchaseOrder.id);
      return purchaseOrder;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw new Error(`Failed to create purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Receive a purchase order and update WAC
   * This is where the magic happens - WAC gets recalculated automatically
   */
  static async receivePurchaseOrder(data: ReceivePurchaseOrderData): Promise<void> {
    console.log('Receiving purchase order:', data);

    try {
      // Get purchase order details
      const [purchaseOrder] = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, data.purchaseOrderId))
        .limit(1);

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Get purchase order items
      const orderItems = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, data.purchaseOrderId));

      // Process each received item
      for (const receivedItem of data.items) {
        const orderItem = orderItems.find(item => item.id === receivedItem.itemId);
        if (!orderItem) {
          throw new Error(`Purchase order item ${receivedItem.itemId} not found`);
        }

        // Use actual unit cost if provided, otherwise use ordered unit cost
        const actualUnitCost = receivedItem.actualUnitCost || parseFloat(orderItem.unitCost);
        
        console.log(`Processing received item: Product ${orderItem.productId}, Quantity: ${receivedItem.receivedQuantity}, Unit Cost: ${actualUnitCost}`);

        // Update received quantity in purchase order item
        await db
          .update(purchaseOrderItems)
          .set({
            receivedQuantity: receivedItem.receivedQuantity.toString(),
          })
          .where(eq(purchaseOrderItems.id, receivedItem.itemId));

        // Process inventory movement and update WAC
        if (receivedItem.receivedQuantity > 0) {
          await WacCalculationService.processInventoryMovement({
            productId: orderItem.productId,
            productVariantId: orderItem.productVariantId || undefined,
            branchId: purchaseOrder.branchId || undefined,
            warehouseId: purchaseOrder.warehouseId || undefined,
            movementType: 'purchase',
            quantity: receivedItem.receivedQuantity, // Positive for inbound
            unitCost: actualUnitCost,
            referenceType: 'purchase_order',
            referenceId: purchaseOrder.id,
            notes: `Purchase from PO: ${purchaseOrder.purchaseOrderNumber}`,
            createdBy: data.receivedBy,
            movementDate: data.receivedDate || new Date(),
          });

          console.log(`WAC updated for product ${orderItem.productId}`);
        }
      }

      // Update purchase order status
      const allItemsReceived = await this.checkIfAllItemsReceived(data.purchaseOrderId);
      const newStatus = allItemsReceived ? 'completed' : 'partially_received';

      await db
        .update(purchaseOrders)
        .set({
          status: newStatus,
          receivedDate: data.receivedDate || new Date(),
          receivedBy: data.receivedBy,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, data.purchaseOrderId));

      console.log(`Purchase order ${data.purchaseOrderId} status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      throw new Error(`Failed to receive purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get purchase orders with details
   */
  static async getPurchaseOrders(branchId?: number, status?: string) {
    const conditions = [];
    
    if (branchId) {
      conditions.push(eq(purchaseOrders.branchId, branchId));
    }
    if (status) {
      conditions.push(eq(purchaseOrders.status, status));
    }

    const orders = await db
      .select({
        id: purchaseOrders.id,
        purchaseOrderNumber: purchaseOrders.purchaseOrderNumber,
        supplierName: suppliers.name,
        totalAmount: purchaseOrders.totalAmount,
        grandTotal: purchaseOrders.grandTotal,
        status: purchaseOrders.status,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        receivedDate: purchaseOrders.receivedDate,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(purchaseOrders.orderDate));

    return orders.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount || '0'),
      grandTotal: parseFloat(order.grandTotal || '0'),
    }));
  }

  /**
   * Get purchase order details with items
   */
  static async getPurchaseOrderDetails(purchaseOrderId: number) {
    // Get purchase order
    const [purchaseOrder] = await db
      .select()
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .limit(1);

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Get purchase order items
    const items = await db
      .select({
        id: purchaseOrderItems.id,
        productId: purchaseOrderItems.productId,
        productName: products.name,
        orderedQuantity: purchaseOrderItems.orderedQuantity,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        unitCost: purchaseOrderItems.unitCost,
        totalCost: purchaseOrderItems.totalCost,
        discountPercent: purchaseOrderItems.discountPercent,
        discountAmount: purchaseOrderItems.discountAmount,
        taxPercent: purchaseOrderItems.taxPercent,
        taxAmount: purchaseOrderItems.taxAmount,
        lineTotal: purchaseOrderItems.lineTotal,
        notes: purchaseOrderItems.notes,
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

    return {
      purchaseOrder: {
        ...purchaseOrder.purchase_orders,
        supplier: purchaseOrder.suppliers,
        totalAmount: parseFloat(purchaseOrder.purchase_orders.totalAmount || '0'),
        taxAmount: parseFloat(purchaseOrder.purchase_orders.taxAmount || '0'),
        discountAmount: parseFloat(purchaseOrder.purchase_orders.discountAmount || '0'),
        grandTotal: parseFloat(purchaseOrder.purchase_orders.grandTotal || '0'),
      },
      items: items.map(item => ({
        ...item,
        orderedQuantity: parseFloat(item.orderedQuantity || '0'),
        receivedQuantity: parseFloat(item.receivedQuantity || '0'),
        unitCost: parseFloat(item.unitCost || '0'),
        totalCost: parseFloat(item.totalCost || '0'),
        discountPercent: parseFloat(item.discountPercent || '0'),
        discountAmount: parseFloat(item.discountAmount || '0'),
        taxPercent: parseFloat(item.taxPercent || '0'),
        taxAmount: parseFloat(item.taxAmount || '0'),
        lineTotal: parseFloat(item.lineTotal || '0'),
      })),
    };
  }

  /**
   * Check if all items in a purchase order have been received
   */
  private static async checkIfAllItemsReceived(purchaseOrderId: number): Promise<boolean> {
    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

    return items.every(item => 
      parseFloat(item.receivedQuantity || '0') >= parseFloat(item.orderedQuantity)
    );
  }

  /**
   * Generate unique purchase order number
   */
  private static async generatePurchaseOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the last purchase order number for this month
    const [lastOrder] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.purchaseOrderNumber, `PO-${year}${month}%`))
      .orderBy(desc(purchaseOrders.purchaseOrderNumber))
      .limit(1);

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.purchaseOrderNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `PO-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Cancel a purchase order
   */
  static async cancelPurchaseOrder(purchaseOrderId: number, cancelledBy: string): Promise<void> {
    await db
      .update(purchaseOrders)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, purchaseOrderId));

    console.log(`Purchase order ${purchaseOrderId} cancelled by ${cancelledBy}`);
  }

  /**
   * Get purchase order statistics
   */
  static async getPurchaseOrderStats(branchId?: number) {
    const conditions = branchId ? [eq(purchaseOrders.branchId, branchId)] : [];

    const stats = await db
      .select({
        status: purchaseOrders.status,
        count: db.$count(purchaseOrders.id),
        totalValue: purchaseOrders.grandTotal,
      })
      .from(purchaseOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(purchaseOrders.status);

    return stats.map(stat => ({
      ...stat,
      totalValue: parseFloat(stat.totalValue || '0'),
    }));
  }
}