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
import autoTable from 'jspdf-autotable';

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
      case "all":
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
      console.log(`Building sales query with dates: ${startDate} to ${endDate}`);
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    console.log(`Final sales query: /api/sales${queryString}`);
    return queryString;
  };

  // Fetch sales with date range support
  const { data: sales = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales", startDate, endDate],
    queryFn: async () => {
      const query = buildSalesQuery();
      console.log(`Fetching sales with query: /api/sales${query}`);
      const response = await fetch(`/api/sales${query}`);
      if (!response.ok) throw new Error('Failed to fetch sales');
      const data = await response.json();
      console.log(`Received ${data.length} sales from API`);
      return data;
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
    
    // Date filtering is now handled by the API query, so we only do client-side search filtering
    return matchesSearch;
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
    let currentY = 20;
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('Detailed Sales History Report', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    // Add date range
    pdf.setFontSize(12);
    let dateRangeText = 'All Sales';
    if (startDate && endDate) {
      dateRangeText = `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`;
    }
    pdf.text(dateRangeText, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Add summary
    const totalSales = filteredSales.length;
    const totalAmount = filteredSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount || '0'), 0);
    pdf.setFontSize(10);
    pdf.text(`Total Sales: ${totalSales} | Total Amount: ${formatCurrencyValue(totalAmount)}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Process each sale with detailed items
    for (const sale of filteredSales) {
      // Fetch sale items for this sale
      const itemsResponse = await fetch(`/api/sales/${sale.id}/items`);
      const saleItems = itemsResponse.ok ? await itemsResponse.json() : [];

      if (currentY > 250) { // Add new page if needed
        pdf.addPage();
        currentY = 20;
      }

      // Sale header
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Sale #${sale.id} - ${sale.saleDate ? format(new Date(sale.saleDate), 'MMM dd, yyyy HH:mm') : 'N/A'}`, 15, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.text(`Customer: ${sale.customerName || sale.customer?.name || 'Walk-in Customer'}`, 15, currentY);
      pdf.text(`Cashier: ${sale.user?.name || 'Unknown'}`, 110, currentY);
      currentY += 6;
      pdf.text(`Status: ${sale.status || 'Unknown'}`, 15, currentY);
      pdf.text(`Total: ${formatCurrencyValue(parseFloat(sale.totalAmount || '0'))}`, 110, currentY);
      currentY += 10;

      // Sale items table
      if (saleItems.length > 0) {
        const itemsData = saleItems.map((item: any) => [
          item.product?.name || 'Unknown Product',
          item.variant?.variantName || 'Default',
          item.product?.categoryName || 'N/A',
          item.product?.brandName || 'N/A',
          item.product?.barcode || 'N/A',
          parseFloat(item.quantity || '0').toString(),
          formatCurrencyValue(parseFloat(item.price || '0')),
          formatCurrencyValue(parseFloat(item.quantity || '0') * parseFloat(item.price || '0'))
        ]);

        autoTable(pdf, {
          startY: currentY,
          head: [['Product', 'Variant', 'Category', 'Brand', 'Code', 'Qty', 'Price', 'Total']],
          body: itemsData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 15, right: 15 },
          tableWidth: 'auto'
        });

        currentY = (pdf as any).lastAutoTable.finalY + 15;
      } else {
        pdf.text('No items found for this sale', 15, currentY);
        currentY += 10;
      }
    }

    pdf.save(`detailed-sales-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = async () => {
    const csvRows = [];
    
    // Header row
    csvRows.push([
      'Sale ID', 'Sale Date', 'Customer', 'Cashier', 'Sale Status', 'Sale Total',
      'Product Name', 'Variant', 'Category', 'Brand', 'Product Code', 'Quantity', 'Unit Price', 'Item Total'
    ]);

    // Process each sale with detailed items
    for (const sale of filteredSales) {
      const itemsResponse = await fetch(`/api/sales/${sale.id}/items`);
      const saleItems = itemsResponse.ok ? await itemsResponse.json() : [];

      if (saleItems.length > 0) {
        saleItems.forEach((item: any) => {
          csvRows.push([
            `#${sale.id}`,
            sale.saleDate ? format(new Date(sale.saleDate), 'yyyy-MM-dd HH:mm') : '',
            sale.customerName || sale.customer?.name || 'Walk-in Customer',
            sale.user?.name || 'Unknown',
            sale.status || 'Unknown',
            parseFloat(sale.totalAmount || '0').toFixed(2),
            item.product?.name || 'Unknown Product',
            item.variant?.variantName || 'Default',
            item.product?.categoryName || 'N/A',
            item.product?.brandName || 'N/A',
            item.product?.barcode || 'N/A',
            parseFloat(item.quantity || '0').toString(),
            parseFloat(item.price || '0').toFixed(2),
            (parseFloat(item.quantity || '0') * parseFloat(item.price || '0')).toFixed(2)
          ]);
        });
      } else {
        // If no items, still show the sale row
        csvRows.push([
          `#${sale.id}`,
          sale.saleDate ? format(new Date(sale.saleDate), 'yyyy-MM-dd HH:mm') : '',
          sale.customerName || sale.customer?.name || 'Walk-in Customer',
          sale.user?.name || 'Unknown',
          sale.status || 'Unknown',
          parseFloat(sale.totalAmount || '0').toFixed(2),
          'No items', '', '', '', '', '', '', ''
        ]);
      }
    }

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `detailed-sales-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = async () => {
    // Build detailed print content
    let salesHTML = '';
    
    for (const sale of filteredSales) {
      const itemsResponse = await fetch(`/api/sales/${sale.id}/items`);
      const saleItems = itemsResponse.ok ? await itemsResponse.json() : [];
      
      salesHTML += `
        <div class="sale-section">
          <div class="sale-header">
            <h3>Sale #${sale.id} - ${sale.saleDate ? format(new Date(sale.saleDate), 'MMM dd, yyyy HH:mm') : 'N/A'}</h3>
            <div class="sale-info">
              <div><strong>Customer:</strong> ${sale.customerName || sale.customer?.name || 'Walk-in Customer'}</div>
              <div><strong>Cashier:</strong> ${sale.user?.name || 'Unknown'}</div>
              <div><strong>Status:</strong> ${sale.status || 'Unknown'}</div>
              <div><strong>Total:</strong> ${formatCurrencyValue(parseFloat(sale.totalAmount || '0'))}</div>
            </div>
          </div>
          
          ${saleItems.length > 0 ? `
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Code</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${saleItems.map((item: any) => `
                  <tr>
                    <td>${item.product?.name || 'Unknown'}</td>
                    <td>${item.variant?.variantName || 'Default'}</td>
                    <td>${item.product?.categoryName || 'N/A'}</td>
                    <td>${item.product?.brandName || 'N/A'}</td>
                    <td>${item.product?.barcode || 'N/A'}</td>
                    <td>${parseFloat(item.quantity || '0')}</td>
                    <td>${formatCurrencyValue(parseFloat(item.price || '0'))}</td>
                    <td>${formatCurrencyValue(parseFloat(item.quantity || '0') * parseFloat(item.price || '0'))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="no-items">No items found for this sale</p>'}
        </div>
      `;
    }

    const totalSales = filteredSales.length;
    const totalAmount = filteredSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount || '0'), 0);

    const printContent = `
      <html>
        <head>
          <title>Detailed Sales History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; margin-bottom: 10px; }
            .date-range { text-align: center; margin-bottom: 10px; color: #666; }
            .summary { text-align: center; margin-bottom: 20px; padding: 10px; background-color: #f0f9ff; border-radius: 5px; }
            .sale-section { margin-bottom: 30px; page-break-inside: avoid; }
            .sale-header { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
            .sale-header h3 { margin: 0 0 10px 0; color: #1f2937; }
            .sale-info { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .items-table th, .items-table td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; }
            .items-table th { background-color: #22c55e; color: white; font-weight: bold; }
            .items-table td:nth-child(6), .items-table td:nth-child(7), .items-table td:nth-child(8) { text-align: right; }
            .no-items { text-align: center; color: #666; font-style: italic; }
            @media print { 
              body { margin: 0; } 
              .sale-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Detailed Sales History Report</h1>
          <div class="date-range">${startDate && endDate ? 
            `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}` : 
            'All Sales'}</div>
          <div class="summary">
            <strong>Summary:</strong> ${totalSales} Sales | Total Amount: ${formatCurrencyValue(totalAmount)}
          </div>
          ${salesHTML}
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