// Inventory feature exports
export { default as Warehouses } from './pages/warehouses';
export { default as StockManagement } from './pages/stock-management';
export { default as StockTransfers } from './pages/stock-transfers';
export { default as StockAdjustments } from './pages/stock-adjustments';

// Re-export existing stock page as Stock for compatibility
export { default as Stock } from '../products/pages/stock';