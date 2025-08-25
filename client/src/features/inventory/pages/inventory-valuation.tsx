import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Package, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InventoryValuationItem {
  productId: number;
  productName: string;
  currentQuantity: number;
  weightedAverageCost: number;
  totalValue: number;
  lastCalculatedAt: string;
}

interface CogsReport {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  profitMargin: number;
  averageWac: number;
  salesCount: number;
}

export default function InventoryValuationPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Get inventory valuation data
  const { data: valuationData, isLoading: valuationLoading, error: valuationError } = useQuery({
    queryKey: ['/api/wac/inventory-valuation', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/wac/inventory-valuation');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory valuation');
      }
      return response.json() as Promise<InventoryValuationItem[]>;
    },
  });

  // Get COGS report for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: cogsData, isLoading: cogsLoading } = useQuery({
    queryKey: ['/api/cogs/report', thirtyDaysAgo.toISOString(), new Date().toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/cogs/report?startDate=${thirtyDaysAgo.toISOString()}&endDate=${new Date().toISOString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch COGS report');
      }
      return response.json() as Promise<CogsReport[]>;
    },
  });

  // Calculate summary statistics
  const totalInventoryValue = valuationData?.reduce((sum, item) => sum + item.totalValue, 0) || 0;
  const totalProducts = valuationData?.length || 0;
  const averageWac = valuationData && valuationData.length > 0
    ? valuationData.reduce((sum, item) => sum + item.weightedAverageCost, 0) / valuationData.length
    : 0;

  const totalRevenue = cogsData?.reduce((sum, item) => sum + item.totalRevenue, 0) || 0;
  const totalCogs = cogsData?.reduce((sum, item) => sum + item.totalCogs, 0) || 0;
  const grossProfit = totalRevenue - totalCogs;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (valuationError) {
    return (
      <div className="p-6 space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading inventory valuation data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="inventory-valuation-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Valuation</h1>
          <p className="text-muted-foreground">
            Weighted Average Cost (WAC) based inventory valuation and profitability analysis
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-inventory-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              ${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {totalProducts} products
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-average-wac">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average WAC</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-average-wac">
              ${averageWac.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted average cost
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-gross-profit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Gross Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-gross-profit">
              ${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {grossProfitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              COGS: ${totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inventory Valuation Table */}
        <Card data-testid="card-inventory-valuation">
          <CardHeader>
            <CardTitle>Current Inventory Valuation</CardTitle>
            <CardDescription>
              WAC-based valuation of current stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            {valuationLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading inventory data...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {valuationData && valuationData.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {valuationData.slice(0, 20).map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                        data-testid={`row-product-${item.productId}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium" data-testid={`text-product-name-${item.productId}`}>
                            {item.productName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.currentQuantity} • WAC: ${item.weightedAverageCost.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium" data-testid={`text-total-value-${item.productId}`}>
                            ${item.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.lastCalculatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {valuationData.length > 20 && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        Showing top 20 of {valuationData.length} products
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No inventory data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Profitable Products */}
        <Card data-testid="card-profitable-products">
          <CardHeader>
            <CardTitle>Most Profitable Products (30 Days)</CardTitle>
            <CardDescription>
              Products with highest gross profit margins
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cogsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading profitability data...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {cogsData && cogsData.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {cogsData
                      .sort((a, b) => b.profitMargin - a.profitMargin)
                      .slice(0, 15)
                      .map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between py-2 border-b last:border-b-0"
                          data-testid={`row-profitable-product-${item.productId}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium" data-testid={`text-profitable-name-${item.productId}`}>
                              {item.productName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Sold: {item.totalQuantitySold} • Sales: {item.salesCount}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge 
                              variant={item.profitMargin > 30 ? "default" : item.profitMargin > 15 ? "secondary" : "outline"}
                              data-testid={`badge-margin-${item.productId}`}
                            >
                              {item.profitMargin.toFixed(1)}%
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              ${item.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No sales data available for the last 30 days
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-wac-info">
        <CardHeader>
          <CardTitle>About Weighted Average Cost (WAC)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Weighted Average Cost method calculates inventory value using the formula: 
            <strong> WAC = Total Value of Inventory ÷ Total Quantity in Inventory</strong>
          </p>
          <Separator />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Smooths out price fluctuations</li>
                <li>• IFRS/GAAP compliant</li>
                <li>• Accurate COGS calculation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Auto-Updates</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Purchase receipts</li>
                <li>• Stock adjustments</li>
                <li>• Return processing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Reports Available</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Inventory valuation</li>
                <li>• COGS tracking</li>
                <li>• Profitability analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}