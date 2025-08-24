import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Loader2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function Reports() {
  const [reportType, setReportType] = useState("profit_loss");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState("monthly");
  const { formatCurrencyValue } = useCurrency();

  // Fetch dashboard summary
  const { data: dashboardSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/reports/dashboard/summary", dateFrom, dateTo, period],
    retry: false,
  });

  // Fetch profit & loss data
  const { data: profitLossData = [], isLoading: isLoadingProfitLoss } = useQuery({
    queryKey: ["/api/reports/profit-loss", period, dateFrom, dateTo],
    retry: false,
  });

  // Fetch expense breakdown
  const { data: expenseBreakdown = [], isLoading: isLoadingExpenseBreakdown } = useQuery({
    queryKey: ["/api/reports/expense-breakdown", period, dateFrom, dateTo],
    retry: false,
  });

  // Fetch detailed report data
  const { data: reportData = {}, isLoading } = useQuery({
    queryKey: ["/api/reports", reportType, dateFrom, dateTo, period],
    enabled: reportType !== 'profit_loss', // Skip if we're showing profit_loss (already loaded above)
    retry: false,
  });

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  const generateReport = () => {
    // Trigger data refresh by invalidating queries
    queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reports/expense-breakdown"] });
  };

  const exportReport = (format: string) => {
    // Implement export functionality
    const reportDataToExport = {
      reportType,
      dateFrom,
      dateTo,
      period,
      dashboardSummary,
      profitLossData,
      expenseBreakdown,
      reportData
    };
    
    console.log('Exporting report as:', format, reportDataToExport);
    // TODO: Implement actual export logic (PDF, CSV, etc.)
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600">Generate and analyze financial reports and insights</p>
      </div>

      {/* Report Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit_loss">Profit & Loss</SelectItem>
                  <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                  <SelectItem value="cashflow">Cash Flow</SelectItem>
                  <SelectItem value="sales_summary">Sales Summary</SelectItem>
                  <SelectItem value="expense_report">Expense Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex space-x-2">
                <Button onClick={generateReport} size="sm">
                  Generate
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                {isLoadingSummary ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrencyValue(dashboardSummary?.totalRevenue || 0)}
                    </p>
                    <p className="text-xs text-green-500">
                      +{dashboardSummary?.revenueGrowth || 0}% from last month
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                {isLoadingSummary ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrencyValue(dashboardSummary?.totalExpenses || 0)}
                    </p>
                    <p className="text-xs text-red-500">
                      +{dashboardSummary?.expenseGrowth || 0}% from last month
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                {isLoadingSummary ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrencyValue(dashboardSummary?.netProfit || 0)}
                    </p>
                    <p className="text-xs text-green-500">
                      {(dashboardSummary?.netProfit || 0) >= 0 ? '+' : ''}
                      {((dashboardSummary?.revenueGrowth || 0) - (dashboardSummary?.expenseGrowth || 0)).toFixed(1)}% from last month
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                {isLoadingSummary ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-purple-600">
                      {(dashboardSummary?.profitMargin || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-green-500">
                      Margin based on revenue
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profit & Loss Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProfitLoss ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading profit & loss data...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitLossData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => formatCurrencyValue(value)} />
                  <Tooltip formatter={(value) => [formatCurrencyValue(value), '']} />
                  <Bar dataKey="income" fill="#10B981" name="Income" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingExpenseBreakdown ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading expense breakdown...</span>
              </div>
            ) : expenseBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">No expense data available for the selected period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrencyValue(value), '']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Quick Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Monthly Sales Report", description: "Sales performance for current month", icon: TrendingUp },
              { name: "Expense Summary", description: "Expense breakdown by category", icon: TrendingDown },
              { name: "Customer Payments", description: "Outstanding and received payments", icon: DollarSign },
              { name: "Inventory Valuation", description: "Current inventory value report", icon: BarChart3 },
              { name: "Tax Summary", description: "Tax calculations and summaries", icon: FileText },
              { name: "Year-End Report", description: "Annual financial summary", icon: Calendar },
            ].map((report, index) => {
              const IconComponent = report.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <IconComponent className="w-8 h-8 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}