export interface SalesReport {
  period: string;
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface InventoryReport {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export interface FinancialReport {
  revenue: number;
  expenses: number;
  profit: number;
  period: string;
}