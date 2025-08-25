import { db } from '../database';
import { sql } from 'drizzle-orm';

/**
 * Utility functions for keeping product stock in sync with variant stocks
 */
export class StockSyncUtils {
  /**
   * Recalculate and update a specific product's total stock from its variants
   */
  static async syncProductStockFromVariants(productId: number): Promise<number> {
    console.log(`Syncing product ${productId} stock from variants...`);
    
    const result = await db.execute(sql`
      UPDATE products 
      SET stock = (
        SELECT COALESCE(SUM(CAST(s.quantity AS INTEGER)), 0)
        FROM product_variants pv
        LEFT JOIN stock s ON pv.id = s.product_variant_id
        WHERE pv.product_id = ${productId}
      ),
      updated_at = NOW()
      WHERE id = ${productId}
      RETURNING stock
    `);

    const newStock = (result.rows[0] as any)?.stock || 0;
    console.log(`✓ Product ${productId} stock synced to ${newStock}`);
    return newStock;
  }

  /**
   * Sync all products' stock from their variants
   */
  static async syncAllProductStocks(): Promise<number> {
    console.log('Syncing all product stocks from variants...');
    
    const result = await db.execute(sql`
      UPDATE products 
      SET stock = (
        SELECT COALESCE(SUM(CAST(s.quantity AS INTEGER)), 0)
        FROM product_variants pv
        LEFT JOIN stock s ON pv.id = s.product_variant_id
        WHERE pv.product_id = products.id
      ),
      updated_at = NOW()
      WHERE EXISTS (
        SELECT 1 FROM product_variants pv WHERE pv.product_id = products.id
      )
    `);

    console.log(`✓ Synced stock for ${result.rowCount} products`);
    return result.rowCount || 0;
  }

  /**
   * Update variant stock and sync product total
   */
  static async updateVariantStockAndSync(
    productVariantId: number, 
    warehouseId: number, 
    quantityChange: number
  ): Promise<void> {
    console.log(`Updating variant ${productVariantId} stock by ${quantityChange} in warehouse ${warehouseId}`);
    
    // Update variant stock
    await db.execute(sql`
      UPDATE stock 
      SET quantity = quantity + ${quantityChange}
      WHERE product_variant_id = ${productVariantId}
        AND warehouse_id = ${warehouseId}
    `);

    // Get the product ID for this variant
    const variantResult = await db.execute(sql`
      SELECT product_id FROM product_variants WHERE id = ${productVariantId}
    `);
    
    if (variantResult.rows.length > 0) {
      const productId = (variantResult.rows[0] as any).product_id;
      await this.syncProductStockFromVariants(productId);
    }
  }
}