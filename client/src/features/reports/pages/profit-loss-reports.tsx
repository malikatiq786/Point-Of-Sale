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
import { Progress } from '@/components/ui/progress';
import { BarChart, TrendingUp, Calendar, Package, Tag, Building, DollarSign, ShoppingCart, Percent, Activity } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

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

// Use system-wide currency formatting
const usePLCurrency = () => {
  const { formatCurrencyValue } = useCurrency();
  return { formatCurrency: formatCurrencyValue };
};

const formatPercentage = (percentage: number) => {
  return `${percentage.toFixed(2)}%`;
};

// Chart colors for consistent theming
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981', 
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  gradient: {
    revenue: ['#10b981', '#059669'],
    cost: ['#ef4444', '#dc2626'],
    profit: ['#3b82f6', '#2563eb']
  }
};

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label, formatCurrencyProp }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? formatCurrencyProp(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProfitLossReports() {
  const { formatCurrency } = usePLCurrency();
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

  // Enhanced KPI Card Component with visual indicators
  const KPICard = ({ title, value, icon: Icon, color, change, loading }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    change?: number;
    loading?: boolean;
  }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>
                  {typeof value === 'number' ? formatCurrency(value) : value}
                </p>
                {change !== undefined && (
                  <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}% from last period
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${color.includes('green') ? 'bg-green-100' : 
                                                  color.includes('red') ? 'bg-red-100' : 
                                                  color.includes('blue') ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  // Enhanced Donut Chart for Revenue Breakdown
  const RevenueBreakdownChart = ({ data, loading }: { data: ProfitLossData | undefined; loading: boolean }) => {
    if (loading || !data) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      );
    }

    const chartData = [
      { name: 'Gross Profit', value: data.grossProfit, color: CHART_COLORS.success },
      { name: 'Cost', value: data.cost, color: CHART_COLORS.danger }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={(props) => <CustomTooltip {...props} formatCurrencyProp={formatCurrency} />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Total Revenue: <span className="font-bold text-green-600">{formatCurrency(data.revenue)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Profit Margin: <span className={`font-bold ${data.grossProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.grossProfitMargin)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Enhanced Bar Chart for List Data
  const ListChartCard = ({ title, data, loading, icon: Icon, nameField = 'name' }: { 
    title: string; 
    data: any[] | undefined; 
    loading: boolean;
    icon: React.ComponentType<any>;
    nameField?: string;
  }) => {
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <div className="h-full bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      );
    }

    if (!data || data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available for the selected period</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Prepare data for charts
    const chartData = data.slice(0, 10).map((item) => ({
      name: (item[nameField] || item.productName || item.variantName || item.categoryName || item.brandName || 'Unknown').substring(0, 15) + '...',
      fullName: item[nameField] || item.productName || item.variantName || item.categoryName || item.brandName || 'Unknown',
      revenue: item.revenue,
      cost: item.cost,
      profit: item.grossProfit,
      margin: item.grossProfitMargin
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title} - Revenue vs Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip content={(props) => <CustomTooltip {...props} formatCurrencyProp={formatCurrency} />} />
                <Legend />
                <Bar dataKey="revenue" fill={CHART_COLORS.success} name="Revenue" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cost" fill={CHART_COLORS.danger} name="Cost" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="profit" stroke={CHART_COLORS.primary} name="Profit" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Performance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {data.slice(0, 8).map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-sm">
                      {(item[nameField] || item.productName || item.variantName || item.categoryName || item.brandName || 'Unknown').substring(0, 30)}
                    </h4>
                    <Badge variant={item.grossProfit >= 0 ? 'default' : 'destructive'}>
                      {formatCurrency(item.grossProfit)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="text-green-600 font-medium">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="text-red-600 font-medium">{formatCurrency(item.cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-medium">{formatPercentage(item.grossProfitMargin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orders:</span>
                      <span className="font-medium">{item.transactionCount}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={Math.min(100, Math.max(0, item.grossProfitMargin))} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Enhanced Time Series Chart with Area Chart
  const TimeSeriesChart = ({ title, data, loading, icon: Icon }: { 
    title: string; 
    data: any[] | undefined; 
    loading: boolean;
    icon: React.ComponentType<any>;
  }) => {
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <div className="h-full bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      );
    }

    if (!data || data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available for the selected time period</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Prepare chart data
    const chartData = data.map((item) => ({
      period: item.periodLabel || item.period,
      revenue: item.revenue,
      cost: item.cost,
      profit: item.grossProfit,
      margin: item.grossProfitMargin
    }));

    return (
      <div className="space-y-6">
        {/* Time Series Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title} - Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis fontSize={12} />
                <Tooltip content={(props) => <CustomTooltip {...props} formatCurrencyProp={formatCurrency} />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.success}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={CHART_COLORS.primary}
                  fill="url(#profitGradient)"
                  name="Profit"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke={CHART_COLORS.danger}
                  name="Cost"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Revenue"
            value={chartData.reduce((sum, item) => sum + item.revenue, 0)}
            icon={DollarSign}
            color="text-green-600"
          />
          <KPICard
            title="Total Profit"
            value={chartData.reduce((sum, item) => sum + item.profit, 0)}
            icon={TrendingUp}
            color="text-blue-600"
          />
          <KPICard
            title="Avg Margin"
            value={formatPercentage(chartData.reduce((sum, item) => sum + item.margin, 0) / chartData.length)}
            icon={Percent}
            color="text-purple-600"
          />
        </div>
      </div>
    );
  };

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

        <TabsContent value="overall" className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Revenue"
              value={(overallReport as any)?.data?.revenue || 0}
              icon={DollarSign}
              color="text-green-600"
              loading={overallLoading}
            />
            <KPICard
              title="Total Cost"
              value={(overallReport as any)?.data?.cost || 0}
              icon={TrendingUp}
              color="text-red-600"
              loading={overallLoading}
            />
            <KPICard
              title="Gross Profit"
              value={(overallReport as any)?.data?.grossProfit || 0}
              icon={Activity}
              color="text-blue-600"
              loading={overallLoading}
            />
            <KPICard
              title="Transactions"
              value={(overallReport as any)?.data?.transactionCount || 0}
              icon={ShoppingCart}
              color="text-purple-600"
              loading={overallLoading}
            />
          </div>

          {/* Revenue Breakdown Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueBreakdownChart 
                data={(overallReport as any)?.data} 
                loading={overallLoading}
              />
            </div>
            
            {/* Additional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {overallLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (overallReport as any)?.data ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profit Margin</span>
                        <span className={`font-bold ${((overallReport as any)?.data?.grossProfitMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage((overallReport as any)?.data?.grossProfitMargin || 0)}
                        </span>
                      </div>
                      <Progress value={Math.max(0, Math.min(100, (overallReport as any)?.data?.grossProfitMargin || 0))} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Average Order</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency((overallReport as any)?.data?.averageOrderValue || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost Ratio</span>
                        <span className="font-bold text-orange-600">
                          {formatPercentage(((overallReport as any)?.data?.cost / (overallReport as any)?.data?.revenue * 100) || 0)}
                        </span>
                      </div>
                      <Progress value={((overallReport as any)?.data?.cost / (overallReport as any)?.data?.revenue * 100) || 0} className="h-2" />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(((overallReport as any)?.data?.revenue || 0) - ((overallReport as any)?.data?.cost || 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Net Profit</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ListChartCard 
            title="Product-wise P&L" 
            data={(productsReport as any)?.data} 
            loading={productsLoading}
            icon={Package}
            nameField="productName"
          />
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <ListChartCard 
            title="Product Variant-wise P&L" 
            data={(variantsReport as any)?.data} 
            loading={variantsLoading}
            icon={Tag}
            nameField="variantName"
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ListChartCard 
            title="Category-wise P&L" 
            data={(categoriesReport as any)?.data} 
            loading={categoriesLoading}
            icon={Tag}
            nameField="categoryName"
          />
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <ListChartCard 
            title="Brand-wise P&L" 
            data={(brandsReport as any)?.data} 
            loading={brandsLoading}
            icon={Building}
            nameField="brandName"
          />
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <TimeSeriesChart 
            title="Daily P&L Trend" 
            data={(dailyReport as any)?.data} 
            loading={dailyLoading}
            icon={Calendar}
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <TimeSeriesChart 
            title="Monthly P&L Trend" 
            data={(monthlyReport as any)?.data} 
            loading={monthlyLoading}
            icon={Calendar}
          />
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <TimeSeriesChart 
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
          
          <ListChartCard 
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