import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Package, TrendingUp, DollarSign, RefreshCw, Tag, Bookmark } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InventoryValuationItem {
  productId: number;
  productName: string;
  currentQuantity: number;
  weightedAverageCost: number;
  totalValue: number;
  lastCalculatedAt: string;
}

interface EnhancedInventoryValuationItem {
  productId: number;
  productName: string;
  categoryId: number | null;
  categoryName: string | null;
  brandId: number | null;
  brandName: string | null;
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

  // Get enhanced inventory valuation data with categories and brands
  const { data: enhancedData, isLoading: enhancedLoading } = useQuery({
    queryKey: ['/api/wac/inventory-valuation-enhanced', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/wac/inventory-valuation-enhanced');
      if (!response.ok) {
        throw new Error('Failed to fetch enhanced inventory valuation');
      }
      return response.json() as Promise<EnhancedInventoryValuationItem[]>;
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

  // Process enhanced data for brand and category wise display
  const brandWiseData = enhancedData?.reduce((acc: any, item) => {
    const brandKey = item.brandName || 'No Brand';
    if (!acc[brandKey]) {
      acc[brandKey] = {
        brandName: brandKey,
        products: [],
        totalValue: 0,
        totalQuantity: 0,
        averageWac: 0,
      };
    }
    acc[brandKey].products.push(item);
    acc[brandKey].totalValue += item.totalValue;
    acc[brandKey].totalQuantity += item.currentQuantity;
    return acc;
  }, {}) || {};

  // Calculate average WAC for each brand
  Object.values(brandWiseData).forEach((brand: any) => {
    brand.averageWac = brand.totalQuantity > 0 
      ? brand.totalValue / brand.totalQuantity 
      : 0;
  });

  const categoryWiseData = enhancedData?.reduce((acc: any, item) => {
    const categoryKey = item.categoryName || 'No Category';
    if (!acc[categoryKey]) {
      acc[categoryKey] = {
        categoryName: categoryKey,
        products: [],
        totalValue: 0,
        totalQuantity: 0,
        averageWac: 0,
      };
    }
    acc[categoryKey].products.push(item);
    acc[categoryKey].totalValue += item.totalValue;
    acc[categoryKey].totalQuantity += item.currentQuantity;
    return acc;
  }, {}) || {};

  // Calculate average WAC for each category
  Object.values(categoryWiseData).forEach((category: any) => {
    category.averageWac = category.totalQuantity > 0 
      ? category.totalValue / category.totalQuantity 
      : 0;
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (valuationError) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading inventory valuation data. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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

      {/* Enhanced Inventory Valuation with Tabs */}
      <Card className="col-span-full" data-testid="card-enhanced-inventory-valuation">
        <CardHeader>
          <CardTitle>Detailed Inventory Valuation</CardTitle>
          <CardDescription>
            WAC-based valuation organized by product, brand, and category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products" data-testid="tab-products">
                <Package className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="brands" data-testid="tab-brands">
                <Tag className="w-4 h-4 mr-2" />
                Brands
              </TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-categories">
                <Bookmark className="w-4 h-4 mr-2" />
                Categories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              {enhancedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading product data...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {enhancedData && enhancedData.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {enhancedData.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between py-3 border-b last:border-b-0"
                          data-testid={`row-enhanced-product-${item.productId}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium" data-testid={`text-enhanced-product-name-${item.productId}`}>
                              {item.productName}
                            </div>
                            <div className="text-sm text-muted-foreground space-x-4">
                              <span>Qty: {item.currentQuantity}</span>
                              <span>•</span>
                              <span>WAC: ${item.weightedAverageCost.toFixed(2)}</span>
                              {item.brandName && (
                                <>
                                  <span>•</span>
                                  <span>Brand: {item.brandName}</span>
                                </>
                              )}
                              {item.categoryName && (
                                <>
                                  <span>•</span>
                                  <span>Category: {item.categoryName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium" data-testid={`text-enhanced-total-value-${item.productId}`}>
                              ${item.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Updated: {new Date(item.lastCalculatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No product inventory data available
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="brands" className="mt-6">
              <div className="space-y-4">
                {Object.values(brandWiseData).length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {Object.values(brandWiseData).map((brand: any) => (
                      <div
                        key={brand.brandName}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`card-brand-${brand.brandName.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{brand.brandName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {brand.products.length} product{brand.products.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-medium">
                              ${brand.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Avg WAC: ${brand.averageWac.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {brand.products.slice(0, 6).map((product: any) => (
                            <div key={product.productId} className="text-sm bg-gray-50 p-2 rounded">
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-muted-foreground">
                                Qty: {product.currentQuantity} • WAC: ${product.weightedAverageCost.toFixed(2)}
                              </div>
                            </div>
                          ))}
                          {brand.products.length > 6 && (
                            <div className="text-sm text-muted-foreground p-2">
                              +{brand.products.length - 6} more product{brand.products.length - 6 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No brand data available
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="space-y-4">
                {Object.values(categoryWiseData).length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {Object.values(categoryWiseData).map((category: any) => (
                      <div
                        key={category.categoryName}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`card-category-${category.categoryName.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{category.categoryName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {category.products.length} product{category.products.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-medium">
                              ${category.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Avg WAC: ${category.averageWac.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {category.products.slice(0, 6).map((product: any) => (
                            <div key={product.productId} className="text-sm bg-gray-50 p-2 rounded">
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-muted-foreground">
                                Qty: {product.currentQuantity} • WAC: ${product.weightedAverageCost.toFixed(2)}
                              </div>
                            </div>
                          ))}
                          {category.products.length > 6 && (
                            <div className="text-sm text-muted-foreground p-2">
                              +{category.products.length - 6} more product{category.products.length - 6 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No category data available
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Current Valuation Summary */}
        <Card data-testid="card-inventory-valuation">
          <CardHeader>
            <CardTitle>Current Inventory Summary</CardTitle>
            <CardDescription>
              Overview of WAC-based valuation from approved purchases
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
                    {valuationData.slice(0, 10).map((item) => (
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
                    {valuationData.length > 10 && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        Showing top 10 of {valuationData.length} products
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No inventory data available. Approve purchase orders to see valuation.
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
    </AppLayout>
  );
}