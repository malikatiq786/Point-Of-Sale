import { InventoryRepository } from '../repositories/InventoryRepository';

export class InventoryService {
  private inventoryRepository: InventoryRepository;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }

  async getWarehouses() {
    try {
      const warehouses = await this.inventoryRepository.findAllWarehouses();
      return { success: true, data: warehouses };
    } catch (error) {
      console.error('InventoryService: Error getting warehouses:', error);
      return { success: false, error: 'Failed to fetch warehouses' };
    }
  }

  async createWarehouse(warehouseData: { name: string; location?: string }) {
    try {
      if (!warehouseData.name) {
        return { success: false, error: 'Warehouse name is required' };
      }

      const warehouse = await this.inventoryRepository.createWarehouse(warehouseData);
      return { success: true, data: warehouse };
    } catch (error) {
      console.error('InventoryService: Error creating warehouse:', error);
      return { success: false, error: 'Failed to create warehouse' };
    }
  }

  async getStock(warehouseId?: number, lowStockOnly?: boolean) {
    try {
      const stock = await this.inventoryRepository.findStock(warehouseId, lowStockOnly);
      return { success: true, data: stock };
    } catch (error) {
      console.error('InventoryService: Error getting stock:', error);
      return { success: false, error: 'Failed to fetch stock data' };
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
      const adjustment = await this.inventoryRepository.adjustStock(adjustmentData);
      return { success: true, data: adjustment };
    } catch (error) {
      console.error('InventoryService: Error adjusting stock:', error);
      return { success: false, error: 'Failed to adjust stock' };
    }
  }

  async getStockTransfers() {
    try {
      const transfers = await this.inventoryRepository.findStockTransfers();
      return { success: true, data: transfers };
    } catch (error) {
      console.error('InventoryService: Error getting stock transfers:', error);
      return { success: false, error: 'Failed to fetch stock transfers' };
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
      const transfer = await this.inventoryRepository.createStockTransfer(transferData);
      return { success: true, data: transfer };
    } catch (error) {
      console.error('InventoryService: Error creating stock transfer:', error);
      return { success: false, error: 'Failed to create stock transfer' };
    }
  }

  async getStockAdjustments() {
    try {
      const adjustments = await this.inventoryRepository.findStockAdjustments();
      return { success: true, data: adjustments };
    } catch (error) {
      console.error('InventoryService: Error getting stock adjustments:', error);
      return { success: false, error: 'Failed to fetch stock adjustments' };
    }
  }
}