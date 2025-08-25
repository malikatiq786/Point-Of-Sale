import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Receipt, Eye, Calendar, DollarSign, User, Package, CreditCard, ChevronDown, ChevronUp, Download, FileText, Printer } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRangeType, setDateRangeType] = useState("all");
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const { formatCurrencyValue } = useCurrency();

  // Handle date range presets
  const handleDateRangeChange = (value: string) => {
    setDateRangeType(value);
    const today = new Date();
    
    switch (value) {
      case "today":
        const todayStr = format(today, 'yyyy-MM-dd');
        setStartDate(todayStr);
        setEndDate(todayStr);
        setDateFilter("");
        break;
      case "thisMonth":
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        setDateFilter("");
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        setDateFilter("");
        break;
      case "thisYear":
        setStartDate(format(startOfYear(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfYear(today), 'yyyy-MM-dd'));
        setDateFilter("");
        break;
      case "lastYear":
        const lastYear = subYears(today, 1);
        setStartDate(format(startOfYear(lastYear), 'yyyy-MM-dd'));
        setEndDate(format(endOfYear(lastYear), 'yyyy-MM-dd'));
        setDateFilter("");
        break;
      case "custom":
        setStartDate("");
        setEndDate("");
        setDateFilter("");
        break;
      default:
        setStartDate("");
        setEndDate("");
        setDateFilter("");
        break;
    }
  };

  // Build query parameters for date filtering
  const buildSalesQuery = () => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Fetch sales with date range support
  const { data: sales = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales", startDate, endDate],
    queryFn: async () => {
      const query = buildSalesQuery();
      const response = await fetch(`/api/sales${query}`);
      if (!response.ok) throw new Error('Failed to fetch sales');
      return response.json();
    },
    retry: false,
  });

  // Fetch sale items for expanded sale
  const { data: saleItems = [], isLoading: itemsLoading } = useQuery<any[]>({
    queryKey: ["/api/sales", expandedSale, "items"],
    enabled: !!expandedSale,
    retry: false,
  });

  const filteredSales = sales.filter((sale: any) => {
    const matchesSearch = sale.id?.toString().includes(searchQuery) ||
      sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !dateFilter || 
      (sale.saleDate && format(new Date(sale.saleDate), 'yyyy-MM-dd') === dateFilter);
    
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export functions
  const exportToPDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('Sales History Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add date range
    pdf.setFontSize(12);
    let dateRangeText = 'All Sales';
    if (startDate && endDate) {
      dateRangeText = `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`;
    }
    pdf.text(dateRangeText, pageWidth / 2, 30, { align: 'center' });
    
    // Prepare table data
    const tableData = filteredSales.map((sale: any) => [
      `#${sale.id}`,
      sale.saleDate ? format(new Date(sale.saleDate), 'MMM dd, yyyy') : 'N/A',
      sale.customerName || sale.customer?.name || 'Walk-in',
      sale.user?.name || 'Unknown',
      formatCurrencyValue(parseFloat(sale.totalAmount || '0')),
      sale.status || 'Unknown'
    ]);

    // Add table
    (pdf as any).autoTable({
      startY: 40,
      head: [['Sale ID', 'Date', 'Customer', 'Cashier', 'Amount', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    pdf.save(`sales-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Sale ID', 'Date', 'Customer', 'Cashier', 'Amount', 'Status'],
      ...filteredSales.map((sale: any) => [
        `#${sale.id}`,
        sale.saleDate ? format(new Date(sale.saleDate), 'yyyy-MM-dd HH:mm') : '',
        sale.customerName || sale.customer?.name || 'Walk-in Customer',
        sale.user?.name || 'Unknown',
        parseFloat(sale.totalAmount || '0').toFixed(2),
        sale.status || 'Unknown'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const printContent = `
      <html>
        <head>
          <title>Sales History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #333; }
            .date-range { text-align: center; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .amount { text-align: right; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Sales History Report</h1>
          <div class="date-range">${startDate && endDate ? 
            `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}` : 
            'All Sales'}</div>
          <table>
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map((sale: any) => `
                <tr>
                  <td>#${sale.id}</td>
                  <td>${sale.saleDate ? format(new Date(sale.saleDate), 'MMM dd, yyyy') : 'N/A'}</td>
                  <td>${sale.customerName || sale.customer?.name || 'Walk-in Customer'}</td>
                  <td>${sale.user?.name || 'Unknown'}</td>
                  <td class="amount">${formatCurrencyValue(parseFloat(sale.totalAmount || '0'))}</td>
                  <td>${sale.status || 'Unknown'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600">View and manage all sales transactions</p>
      </div>

      <div className="space-y-4 mb-6">
        {/* Search and Export Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder="Search sales..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={printReport}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={dateRangeType} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateRangeType === "custom" && (
            <>
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-48"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-48"
              />
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter ? "Try adjusting your search criteria" : "No sales transactions yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale: any) => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Sale #{sale.id}
                          </h3>
                          <Badge className={`${getStatusColor(sale.status)} px-2 py-1 text-xs font-medium`}>
                            {sale.status || 'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {sale.saleDate ? format(new Date(sale.saleDate), 'MMM dd, yyyy HH:mm') : 'No date'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{sale.customerName || sale.customer?.name || 'Walk-in Customer'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Receipt className="w-4 h-4" />
                            <span>Cashier: {sale.user?.name || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">
                              {formatCurrencyValue(parseFloat(sale.totalAmount || '0'))}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Collapsible open={expandedSale === sale.id} onOpenChange={() => 
                          setExpandedSale(expandedSale === sale.id ? null : sale.id)
                        }>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {expandedSale === sale.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              View Details
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      </div>
                    </div>
                    
                    {/* Sale Items Details - Expandable */}
                    <Collapsible open={expandedSale === sale.id}>
                      <CollapsibleContent className="pt-4 border-t border-gray-200">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4" />
                            <h4 className="font-semibold text-gray-900">Sale Items</h4>
                          </div>
                          
                          {itemsLoading ? (
                            <div className="space-y-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white p-3 rounded-md animate-pulse">
                                  <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : saleItems.length > 0 ? (
                            <div className="space-y-2">
                              {saleItems.map((item: any, index: number) => (
                                <div key={index} className="bg-white p-3 rounded-md border">
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-medium text-gray-900">
                                          {item.product?.name || 'Unknown Product'}
                                        </h5>
                                        {item.variant?.variantName && (
                                          <Badge variant="secondary" className="text-xs">
                                            {item.variant.variantName}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex gap-4 text-sm text-gray-600">
                                        {item.product?.categoryName && (
                                          <span>Category: {item.product.categoryName}</span>
                                        )}
                                        {item.product?.brandName && (
                                          <span>Brand: {item.product.brandName}</span>
                                        )}
                                        {item.product?.barcode && (
                                          <span>Code: {item.product.barcode}</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600">
                                          {parseFloat(item.quantity || '0')} × {formatCurrencyValue(parseFloat(item.price || '0'))}
                                        </span>
                                      </div>
                                      <div className="font-semibold text-gray-900">
                                        {formatCurrencyValue(parseFloat(item.quantity || '0') * parseFloat(item.price || '0'))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="border-t pt-2 mt-3">
                                <div className="flex justify-between font-semibold text-gray-900">
                                  <span>Total:</span>
                                  <span>{formatCurrencyValue(parseFloat(sale.totalAmount || '0'))}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No items found for this sale</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}