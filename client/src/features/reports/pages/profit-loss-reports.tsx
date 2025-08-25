import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, TrendingUp, Calendar, Package, Tag, Building } from 'lucide-react';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  branchId?: number;
  limit?: number;
  offset?: number;
  type?: string;
  sortBy?: string;
}

interface ProfitLossData {
  revenue: number;
  cost: number;
  grossProfit: number;
  grossProfitMargin: number;
  netProfit: number;
  netProfitMargin: number;
  transactionCount: number;
  averageOrderValue: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatPercentage = (percentage: number) => {
  return `${percentage.toFixed(2)}%`;
};

export default function ProfitLossReports() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    limit: 50,
    type: 'products',
    sortBy: 'profit'
  });

  const [activeTab, setActiveTab] = useState('overall');

  // Overall Report
  const { data: overallReport, isLoading: overallLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/overall', filters.startDate, filters.endDate, filters.branchId],
    enabled: activeTab === 'overall',
  });

  // Product-wise Report
  const { data: productsReport, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/products', filters.startDate, filters.endDate, filters.branchId, filters.limit],
    enabled: activeTab === 'products',
  });

  // Variant-wise Report
  const { data: variantsReport, isLoading: variantsLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/variants', filters.startDate, filters.endDate, filters.branchId, filters.limit],
    enabled: activeTab === 'variants',
  });

  // Category-wise Report
  const { data: categoriesReport, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/categories', filters.startDate, filters.endDate, filters.branchId],
    enabled: activeTab === 'categories',
  });

  // Brand-wise Report
  const { data: brandsReport, isLoading: brandsLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/brands', filters.startDate, filters.endDate, filters.branchId],
    enabled: activeTab === 'brands',
  });

  // Daily Report
  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/daily', filters.startDate, filters.endDate, filters.branchId],
    enabled: activeTab === 'daily',
  });

  // Monthly Report
  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/monthly', filters.startDate, filters.endDate, filters.branchId],
    enabled: activeTab === 'monthly',
  });

  // Yearly Report
  const { data: yearlyReport, isLoading: yearlyLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/yearly', filters.startDate, filters.endDate, filters.branchId],
    enabled: activeTab === 'yearly',
  });

  // Top Performers
  const { data: topPerformersReport, isLoading: topPerformersLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss/top-performers', filters.type, filters.startDate, filters.endDate, filters.branchId, filters.limit, filters.sortBy],
    enabled: activeTab === 'top-performers',
  });

  const ProfitLossCard = ({ title, data, loading, icon: Icon }: { 
    title: string; 
    data: ProfitLossData | undefined; 
    loading: boolean;
    icon: React.ComponentType<any>;
  }) => (
    <Card data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        ) : data ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenue:</span>
              <span className="font-semibold text-green-600" data-testid="text-revenue">
                {formatCurrency(data.revenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cost:</span>
              <span className="font-semibold text-red-600" data-testid="text-cost">
                {formatCurrency(data.cost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Profit:</span>
              <span className={`font-semibold ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-gross-profit">
                {formatCurrency(data.grossProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Margin:</span>
              <Badge variant={data.grossProfitMargin >= 0 ? 'default' : 'destructive'} data-testid="badge-margin">
                {formatPercentage(data.grossProfitMargin)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Transactions:</span>
              <span className="font-medium" data-testid="text-transaction-count">
                {data.transactionCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Order:</span>
              <span className="font-medium" data-testid="text-avg-order">
                {formatCurrency(data.averageOrderValue)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  );

  const ListReportCard = ({ title, data, loading, icon: Icon, nameField = 'name' }: { 
    title: string; 
    data: any[] | undefined; 
    loading: boolean;
    icon: React.ComponentType<any>;
    nameField?: string;
  }) => (
    <Card data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}-list`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2" data-testid={`item-${nameField}-${index}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium" data-testid={`text-${nameField}-${index}`}>
                    {item[nameField] || item.productName || item.variantName || item.categoryName || item.brandName || 'Unknown'}
                  </span>
                  <Badge variant={item.grossProfit >= 0 ? 'default' : 'destructive'} data-testid={`badge-profit-${index}`}>
                    {formatCurrency(item.grossProfit)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>Revenue: <span className="text-green-600 font-medium" data-testid={`text-revenue-${index}`}>{formatCurrency(item.revenue)}</span></div>
                  <div>Cost: <span className="text-red-600 font-medium" data-testid={`text-cost-${index}`}>{formatCurrency(item.cost)}</span></div>
                  <div>Margin: <span className="font-medium" data-testid={`text-margin-${index}`}>{formatPercentage(item.grossProfitMargin)}</span></div>
                  <div>Transactions: <span className="font-medium" data-testid={`text-transactions-${index}`}>{item.transactionCount}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No data available</div>
        )}
      </CardContent>
    </Card>
  );

  const TimeSeriesCard = ({ title, data, loading, icon: Icon }: { 
    title: string; 
    data: any[] | undefined; 
    loading: boolean;
    icon: React.ComponentType<any>;
  }) => (
    <Card data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}-timeseries`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-3" data-testid={`timeseries-item-${index}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium" data-testid={`text-period-${index}`}>
                    {item.periodLabel}
                  </span>
                  <Badge variant={item.grossProfit >= 0 ? 'default' : 'destructive'} data-testid={`badge-period-profit-${index}`}>
                    {formatCurrency(item.grossProfit)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <div>Revenue</div>
                    <div className="text-green-600 font-medium" data-testid={`text-period-revenue-${index}`}>{formatCurrency(item.revenue)}</div>
                  </div>
                  <div>
                    <div>Cost</div>
                    <div className="text-red-600 font-medium" data-testid={`text-period-cost-${index}`}>{formatCurrency(item.cost)}</div>
                  </div>
                  <div>
                    <div>Margin</div>
                    <div className="font-medium" data-testid={`text-period-margin-${index}`}>{formatPercentage(item.grossProfitMargin)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No data available for this time period</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Profit & Loss Reports</h1>
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-40"
              data-testid="input-start-date"
            />
            <span className="flex items-center text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-40"
              data-testid="input-end-date"
            />
          </div>
            <Button variant="outline" size="sm" data-testid="button-refresh">
              Refresh Data
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-9 w-full" data-testid="tabs-list">
            <TabsTrigger value="overall" data-testid="tab-overall">Overall</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="variants" data-testid="tab-variants">Variants</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="brands" data-testid="tab-brands">Brands</TabsTrigger>
            <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" data-testid="tab-yearly">Yearly</TabsTrigger>
            <TabsTrigger value="top-performers" data-testid="tab-top-performers">Top</TabsTrigger>
          </TabsList>

        <TabsContent value="overall" className="space-y-4">
          <ProfitLossCard 
            title="Overall Performance" 
            data={(overallReport as any)?.data} 
            loading={overallLoading}
            icon={BarChart}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ListReportCard 
            title="Product-wise P&L" 
            data={(productsReport as any)?.data} 
            loading={productsLoading}
            icon={Package}
            nameField="productName"
          />
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <ListReportCard 
            title="Product Variant-wise P&L" 
            data={(variantsReport as any)?.data} 
            loading={variantsLoading}
            icon={Tag}
            nameField="variantName"
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ListReportCard 
            title="Category-wise P&L" 
            data={(categoriesReport as any)?.data} 
            loading={categoriesLoading}
            icon={Tag}
            nameField="categoryName"
          />
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <ListReportCard 
            title="Brand-wise P&L" 
            data={(brandsReport as any)?.data} 
            loading={brandsLoading}
            icon={Building}
            nameField="brandName"
          />
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <TimeSeriesCard 
            title="Daily P&L Trend" 
            data={(dailyReport as any)?.data} 
            loading={dailyLoading}
            icon={Calendar}
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <TimeSeriesCard 
            title="Monthly P&L Trend" 
            data={(monthlyReport as any)?.data} 
            loading={monthlyLoading}
            icon={Calendar}
          />
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <TimeSeriesCard 
            title="Yearly P&L Trend" 
            data={(yearlyReport as any)?.data} 
            loading={yearlyLoading}
            icon={Calendar}
          />
        </TabsContent>

        <TabsContent value="top-performers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performers Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger data-testid="select-performer-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products" data-testid="option-products">Products</SelectItem>
                    <SelectItem value="categories" data-testid="option-categories">Categories</SelectItem>
                    <SelectItem value="brands" data-testid="option-brands">Brands</SelectItem>
                    <SelectItem value="variants" data-testid="option-variants">Variants</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger data-testid="select-sort-by">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profit" data-testid="option-profit">Profit</SelectItem>
                    <SelectItem value="revenue" data-testid="option-revenue">Revenue</SelectItem>
                    <SelectItem value="margin" data-testid="option-margin">Margin</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.limit?.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value) }))}
                >
                  <SelectTrigger data-testid="select-limit">
                    <SelectValue placeholder="Limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" data-testid="option-10">Top 10</SelectItem>
                    <SelectItem value="25" data-testid="option-25">Top 25</SelectItem>
                    <SelectItem value="50" data-testid="option-50">Top 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <ListReportCard 
            title={`Top ${filters.limit} ${filters.type?.charAt(0)?.toUpperCase() + (filters.type?.slice(1) || '')} by ${filters.sortBy?.charAt(0)?.toUpperCase() + (filters.sortBy?.slice(1) || '')}`}
            data={(topPerformersReport as any)?.data} 
            loading={topPerformersLoading}
            icon={TrendingUp}
            nameField={filters.type === 'products' ? 'productName' : 
                     filters.type === 'categories' ? 'categoryName' : 
                     filters.type === 'brands' ? 'brandName' : 'variantName'}
          />
        </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}