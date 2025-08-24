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

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map((value: any) => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const exportToPDF = (reportData: any, filename: string) => {
    // Simple HTML to PDF export using browser's print functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = generatePDFContent(reportData);
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePDFContent = (data: any) => {
    const currentDate = new Date().toLocaleDateString();
    const reportTitle = getReportTitle(reportType);
    
    return `
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin: 20px 0; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportTitle}</h1>
            <p>Period: ${dateFrom || 'All time'} to ${dateTo || 'Present'}</p>
            <p>Generated on: ${currentDate}</p>
          </div>
          
          <div class="section">
            <h2>Summary Statistics</h2>
            <div class="stats">
              <div class="stat-box">
                <h3>Total Revenue</h3>
                <p>${formatCurrencyValue(dashboardSummary?.totalRevenue || 0)}</p>
              </div>
              <div class="stat-box">
                <h3>Total Expenses</h3>
                <p>${formatCurrencyValue(dashboardSummary?.totalExpenses || 0)}</p>
              </div>
              <div class="stat-box">
                <h3>Net Profit</h3>
                <p>${formatCurrencyValue(dashboardSummary?.netProfit || 0)}</p>
              </div>
              <div class="stat-box">
                <h3>Profit Margin</h3>
                <p>${(dashboardSummary?.profitMargin || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          ${profitLossData && profitLossData.length > 0 ? `
          <div class="section">
            <h2>Profit & Loss Data</h2>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                ${profitLossData.map((item: any) => `
                  <tr>
                    <td>${item.period}</td>
                    <td>${formatCurrencyValue(item.income || 0)}</td>
                    <td>${formatCurrencyValue(item.expenses || 0)}</td>
                    <td>${formatCurrencyValue(item.profit || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          ${expenseBreakdown && expenseBreakdown.length > 0 ? `
          <div class="section">
            <h2>Expense Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${expenseBreakdown.map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${formatCurrencyValue(item.value || 0)}</td>
                    <td>${((item.value / expenseBreakdown.reduce((sum: number, exp: any) => sum + exp.value, 0)) * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated by Universal POS System - ${currentDate}</p>
          </div>
        </body>
      </html>
    `;
  };

  const getReportTitle = (type: string) => {
    const titles: Record<string, string> = {
      'profit_loss': 'Profit & Loss Report',
      'sales_summary': 'Sales Summary Report',
      'expense_report': 'Expense Report',
      'cashflow': 'Cash Flow Report',
      'balance_sheet': 'Balance Sheet Report'
    };
    return titles[type] || 'Financial Report';
  };

  const exportReport = (format: string, quickReportName?: string) => {
    const reportTitle = quickReportName || getReportTitle(reportType);
    const dateStr = new Date().toISOString().slice(0, 10);
    
    const reportDataToExport = {
      reportType: quickReportName ? quickReportName.toLowerCase().replace(/\s+/g, '_') : reportType,
      dateFrom,
      dateTo,
      period,
      dashboardSummary,
      profitLossData,
      expenseBreakdown,
      reportData,
      generatedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Export different data based on report type
      let dataToExport: any[] = [];
      let filename = '';

      if (profitLossData && profitLossData.length > 0) {
        dataToExport = profitLossData;
        filename = `profit-loss-${dateStr}.csv`;
      } else if (expenseBreakdown && expenseBreakdown.length > 0) {
        dataToExport = expenseBreakdown.map((item: any) => ({
          category: item.name,
          amount: item.value,
          percentage: ((item.value / expenseBreakdown.reduce((sum: number, exp: any) => sum + exp.value, 0)) * 100).toFixed(1) + '%'
        }));
        filename = `expense-breakdown-${dateStr}.csv`;
      } else {
        // Export summary data
        dataToExport = [{
          report_type: reportTitle,
          date_from: dateFrom,
          date_to: dateTo,
          total_revenue: dashboardSummary?.totalRevenue || 0,
          total_expenses: dashboardSummary?.totalExpenses || 0,
          net_profit: dashboardSummary?.netProfit || 0,
          profit_margin: (dashboardSummary?.profitMargin || 0).toFixed(1) + '%'
        }];
        filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.csv`;
      }

      exportToCSV(dataToExport, filename);
    } else {
      // PDF export
      const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.pdf`;
      exportToPDF(reportDataToExport, filename);
    }
  };

  const handleQuickReport = (quickReportType: string) => {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
    const currentYear = currentDate.getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    switch (quickReportType) {
      case "Monthly Sales Report":
        setReportType("sales_summary");
        setPeriod("monthly");
        setDateFrom(`${currentMonth}-01`);
        setDateTo(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10));
        break;
      case "Expense Summary":
        setReportType("expense_report");
        setPeriod("monthly");
        setDateFrom(`${currentMonth}-01`);
        setDateTo(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10));
        break;
      case "Customer Payments":
        setReportType("cashflow");
        setPeriod("monthly");
        setDateFrom(`${currentMonth}-01`);
        setDateTo(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10));
        break;
      case "Inventory Valuation":
        setReportType("balance_sheet");
        setPeriod("monthly");
        setDateFrom(`${currentMonth}-01`);
        setDateTo(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10));
        break;
      case "Tax Summary":
        setReportType("profit_loss");
        setPeriod("quarterly");
        const currentQuarter = Math.floor((currentDate.getMonth()) / 3);
        const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
        const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0);
        setDateFrom(quarterStart.toISOString().slice(0, 10));
        setDateTo(quarterEnd.toISOString().slice(0, 10));
        break;
      case "Year-End Report":
        setReportType("profit_loss");
        setPeriod("yearly");
        setDateFrom(yearStart);
        setDateTo(yearEnd);
        break;
      default:
        break;
    }

    // Trigger report generation
    generateReport();
  };

  const handleQuickReportExport = (quickReportType: string, format: string) => {
    handleQuickReport(quickReportType);
    setTimeout(() => {
      exportReport(format, quickReportType);
    }, 1000); // Allow time for report generation
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
              { 
                name: "Monthly Sales Report", 
                description: "Sales performance for current month", 
                icon: TrendingUp,
                reportType: "sales_summary",
                period: "monthly" 
              },
              { 
                name: "Expense Summary", 
                description: "Expense breakdown by category", 
                icon: TrendingDown,
                reportType: "expense_report", 
                period: "monthly"
              },
              { 
                name: "Customer Payments", 
                description: "Outstanding and received payments", 
                icon: DollarSign,
                reportType: "cashflow",
                period: "monthly"
              },
              { 
                name: "Inventory Valuation", 
                description: "Current inventory value report", 
                icon: BarChart3,
                reportType: "balance_sheet",
                period: "monthly"
              },
              { 
                name: "Tax Summary", 
                description: "Tax calculations and summaries", 
                icon: FileText,
                reportType: "profit_loss",
                period: "quarterly" 
              },
              { 
                name: "Year-End Report", 
                description: "Annual financial summary", 
                icon: Calendar,
                reportType: "profit_loss",
                period: "yearly"
              },
            ].map((report, index) => {
              const IconComponent = report.icon;
              const isCurrentReport = reportType === report.reportType;
              return (
                <Card 
                  key={index} 
                  className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                    isCurrentReport ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <IconComponent className={`w-8 h-8 mt-1 ${
                        isCurrentReport ? 'text-blue-600' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${
                          isCurrentReport ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {report.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant={isCurrentReport ? "default" : "outline"}
                            onClick={() => handleQuickReport(report.name)}
                            data-testid={`button-view-${report.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {isCurrentReport && isLoading ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : null}
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuickReportExport(report.name, 'pdf')}
                            data-testid={`button-export-${report.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
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