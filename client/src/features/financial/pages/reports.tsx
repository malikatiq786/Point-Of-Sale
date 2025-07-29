import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function Reports() {
  const [reportType, setReportType] = useState("profit_loss");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState("monthly");
  const { formatCurrencyValue } = useCurrency();

  // Fetch report data
  const { data: reportData = {}, isLoading } = useQuery({
    queryKey: ["/api/reports", reportType, dateFrom, dateTo, period],
    retry: false,
  });

  // Sample chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const profitLossData = [
    { month: 'Jan', income: 12000, expenses: 8000, profit: 4000 },
    { month: 'Feb', income: 15000, expenses: 9000, profit: 6000 },
    { month: 'Mar', income: 18000, expenses: 11000, profit: 7000 },
    { month: 'Apr', income: 16000, expenses: 12000, profit: 4000 },
    { month: 'May', income: 20000, expenses: 13000, profit: 7000 },
    { month: 'Jun', income: 22000, expenses: 14000, profit: 8000 },
  ];

  const expenseBreakdown = [
    { name: 'Rent', value: 3000, color: '#0088FE' },
    { name: 'Utilities', value: 800, color: '#00C49F' },
    { name: 'Supplies', value: 1200, color: '#FFBB28' },
    { name: 'Marketing', value: 1500, color: '#FF8042' },
    { name: 'Other', value: 900, color: '#8884D8' },
  ];

  const generateReport = () => {
    // This would trigger the report generation
    console.log('Generating report:', { reportType, dateFrom, dateTo, period });
  };

  const exportReport = (format: string) => {
    console.log('Exporting report as:', format);
    // This would trigger the export functionality
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
                <p className="text-2xl font-bold text-green-600">$125,400</p>
                <p className="text-xs text-green-500">+12% from last month</p>
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
                <p className="text-2xl font-bold text-red-600">$67,200</p>
                <p className="text-xs text-red-500">+5% from last month</p>
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
                <p className="text-2xl font-bold text-blue-600">$58,200</p>
                <p className="text-xs text-green-500">+18% from last month</p>
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
                <p className="text-2xl font-bold text-purple-600">46.4%</p>
                <p className="text-xs text-green-500">+2.1% from last month</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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