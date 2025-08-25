import { useState, useEffect } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, RotateCcw, Plus, Calendar, DollarSign, Package, User, FileText, Printer } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Currency formatting utility
const formatCurrency = (amount: number | string | null | undefined) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

export default function Returns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [returnData, setReturnData] = useState({
    saleId: "",
    reason: "",
    items: [{ productId: "", quantity: "", returnType: "refund" }]
  });
  const [selectedSaleItems, setSelectedSaleItems] = useState<any[]>([]);
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update return status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ returnId, status }: { returnId: number; status: string }) => {
      const response = await fetch(`/api/returns/${returnId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update return status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Return status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update return status",
        variant: "destructive",
      });
    },
  });

  // Fetch returns
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["/api/returns"],
    retry: false,
  });

  // Fetch sales for return creation
  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales"],
    retry: false,
  });

  // Fetch sale items when a sale is selected
  const { data: saleItemsData, isLoading: isLoadingSaleItems } = useQuery({
    queryKey: ["/api/sales", returnData.saleId, "items"],
    enabled: !!returnData.saleId,
    retry: false,
  });

  // Update sale items when data changes
  useEffect(() => {
    if (saleItemsData && Array.isArray(saleItemsData)) {
      setSelectedSaleItems(saleItemsData);
      // Initialize return items with all items unchecked
      setReturnItems(saleItemsData.map((item: any) => ({
        ...item,
        selected: false,
        returnQuantity: 1,
        returnType: "refund"
      })));
    }
  }, [saleItemsData]);

  const createReturnMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create return");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Return processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      setShowCreateDialog(false);
      setReturnData({
        saleId: "",
        reason: "",
        items: [{ productId: "", quantity: "", returnType: "refund" }]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process return",
        variant: "destructive",
      });
    },
  });

  // Filter returns by search and date
  const filteredReturns = returns.filter((returnItem: any) => {
    const matchesSearch = 
      returnItem.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.saleId?.toString().includes(searchQuery) ||
      returnItem.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!dateFilter) return matchesSearch;
    
    const returnDate = new Date(returnItem.createdAt || returnItem.returnDate);
    const filterDate = new Date(dateFilter);
    
    return matchesSearch && 
           returnDate.toDateString() === filterDate.toDateString();
  });

  const getReturnStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-800' };
      case 'processed':
        return { label: 'Processed', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Calculate total return amount based on selected items
  const calculateReturnAmount = () => {
    return returnItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.returnQuantity), 0);
  };

  // Format currency value for exports
  const formatCurrencyValue = (amount: number) => {
    return formatCurrency(amount);
  };

  // Export to PDF
  const exportToPDF = async () => {
    const pdf = new jsPDF();
    let currentY = 20;

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Detailed Returns History Report', 15, currentY);
    currentY += 10;

    // Date range and summary
    pdf.setFontSize(10);
    pdf.text(`All Returns`, 15, currentY);
    currentY += 8;
    const totalReturns = filteredReturns.length;
    const totalAmount = filteredReturns.reduce((sum: number, returnItem: any) => sum + parseFloat(returnItem.totalAmount || '0'), 0);
    pdf.text(`Summary: ${totalReturns} Returns | Total Amount: ${formatCurrencyValue(totalAmount)}`, 15, currentY);
    currentY += 15;

    // Fetch return details with items for each return
    const returnIds = filteredReturns.map(returnItem => returnItem.id);
    const bulkResponse = await fetch('/api/returns/bulk-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnIds })
    });
    const allReturnItems = bulkResponse.ok ? await bulkResponse.json() : {};

    // Process each return with detailed items
    for (const returnItem of filteredReturns) {
      // Get items from bulk response
      const returnItemsList = allReturnItems[returnItem.id] || [];

      if (currentY > 250) { // Add new page if needed
        pdf.addPage();
        currentY = 20;
      }

      // Return header
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Return #${returnItem.id} - ${returnItem.createdAt ? format(new Date(returnItem.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}`, 15, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.text(`Sale: #${returnItem.saleId}`, 15, currentY);
      pdf.text(`Customer: ${returnItem.customerName || 'Walk-in Customer'}`, 110, currentY);
      currentY += 6;
      pdf.text(`Status: ${returnItem.status || 'Unknown'}`, 15, currentY);
      pdf.text(`Total: ${formatCurrencyValue(parseFloat(returnItem.totalAmount || '0'))}`, 110, currentY);
      currentY += 6;
      pdf.text(`Reason: ${returnItem.reason || 'N/A'}`, 15, currentY);
      currentY += 10;

      // Return items table
      if (returnItemsList.length > 0) {
        const itemsData = returnItemsList.map((item: any) => [
          item.product?.name || 'Unknown Product',
          item.variant?.variantName || 'Default',
          item.product?.categoryName || 'N/A',
          item.product?.brandName || 'N/A',
          item.product?.barcode || 'N/A',
          parseFloat(item.quantity || '0').toString(),
          formatCurrencyValue(parseFloat(item.price || '0')),
          formatCurrencyValue(parseFloat(item.quantity || '0') * parseFloat(item.price || '0')),
          item.returnType || 'refund'
        ]);

        autoTable(pdf, {
          startY: currentY,
          head: [['Product', 'Variant', 'Category', 'Brand', 'Code', 'Qty', 'Price', 'Total', 'Type']],
          body: itemsData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [220, 53, 69] },
          margin: { left: 15, right: 15 },
          tableWidth: 'auto'
        });

        currentY = (pdf as any).lastAutoTable.finalY + 15;
      } else {
        pdf.text('No items found for this return', 15, currentY);
        currentY += 10;
      }
    }

    pdf.save(`detailed-returns-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const printReport = async () => {
    // Build detailed print content
    let returnsHTML = '';
    
    // Fetch return details with items for each return
    const returnIds = filteredReturns.map(returnItem => returnItem.id);
    const bulkResponse = await fetch('/api/returns/bulk-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnIds })
    });
    const allReturnItems = bulkResponse.ok ? await bulkResponse.json() : {};
    
    for (const returnItem of filteredReturns) {
      // Get items from bulk response
      const returnItemsList = allReturnItems[returnItem.id] || [];
      
      returnsHTML += `
        <div class="return-section">
          <div class="return-header">
            <h3>Return #${returnItem.id} - ${returnItem.createdAt ? format(new Date(returnItem.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</h3>
            <div class="return-info">
              <div><strong>Sale:</strong> #${returnItem.saleId}</div>
              <div><strong>Customer:</strong> ${returnItem.customerName || 'Walk-in Customer'}</div>
              <div><strong>Status:</strong> ${returnItem.status || 'Unknown'}</div>
              <div><strong>Total:</strong> ${formatCurrencyValue(parseFloat(returnItem.totalAmount || '0'))}</div>
              <div><strong>Reason:</strong> ${returnItem.reason || 'N/A'}</div>
            </div>
          </div>
          
          ${returnItemsList.length > 0 ? `
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Code</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Return Type</th>
                </tr>
              </thead>
              <tbody>
                ${returnItemsList.map((item: any) => `
                  <tr>
                    <td>${item.product?.name || 'Unknown'}</td>
                    <td>${item.variant?.variantName || 'Default'}</td>
                    <td>${item.product?.categoryName || 'N/A'}</td>
                    <td>${item.product?.brandName || 'N/A'}</td>
                    <td>${item.product?.barcode || 'N/A'}</td>
                    <td>${parseFloat(item.quantity || '0')}</td>
                    <td>${formatCurrencyValue(parseFloat(item.price || '0'))}</td>
                    <td>${formatCurrencyValue(parseFloat(item.quantity || '0') * parseFloat(item.price || '0'))}</td>
                    <td class="capitalize">${item.returnType || 'refund'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="no-items">No items found for this return</p>'}
        </div>
      `;
    }

    const totalReturns = filteredReturns.length;
    const totalAmount = filteredReturns.reduce((sum: number, returnItem: any) => sum + parseFloat(returnItem.totalAmount || '0'), 0);

    const printContent = `
      <html>
        <head>
          <title>Detailed Returns History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; margin-bottom: 10px; }
            .date-range { text-align: center; margin-bottom: 10px; color: #666; }
            .summary { text-align: center; margin-bottom: 20px; padding: 10px; background-color: #fee2e2; border-radius: 5px; }
            .return-section { margin-bottom: 30px; page-break-inside: avoid; }
            .return-header { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
            .return-header h3 { margin: 0 0 10px 0; color: #dc2626; }
            .return-info { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .items-table th, .items-table td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; }
            .items-table th { background-color: #dc2626; color: white; font-weight: bold; }
            .items-table td:nth-child(6), .items-table td:nth-child(7), .items-table td:nth-child(8) { text-align: right; }
            .capitalize { text-transform: capitalize; }
            .no-items { text-align: center; color: #666; font-style: italic; }
            @media print { 
              body { margin: 0; } 
              .return-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Detailed Returns History Report</h1>
          <div class="date-range">All Returns</div>
          <div class="summary">
            <strong>Summary:</strong> ${totalReturns} Returns | <strong>Total Amount:</strong> ${formatCurrencyValue(totalAmount)}
          </div>
          ${returnsHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Handle item selection
  const toggleItemSelection = (itemId: number, checked: boolean) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, selected: checked } : item
      )
    );
  };

  // Handle quantity change
  const updateReturnQuantity = (itemId: number, quantity: number) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, returnQuantity: Math.max(1, Math.min(quantity, item.quantity)) } : item
      )
    );
  };

  // Handle return type change
  const updateReturnType = (itemId: number, returnType: string) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, returnType } : item
      )
    );
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnData.saleId || !returnData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedItems = returnItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to return",
        variant: "destructive",
      });
      return;
    }

    const returnSubmission = {
      saleId: parseInt(returnData.saleId),
      reason: returnData.reason,
      totalAmount: calculateReturnAmount(),
      items: selectedItems.map(item => ({
        productVariantId: item.productVariantId,
        quantity: item.returnQuantity,
        price: item.price,
        returnType: item.returnType
      }))
    };

    createReturnMutation.mutate(returnSubmission);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
        <p className="text-gray-600">Process customer returns and refunds</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search returns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-48"
        />

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Process Return
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <RotateCcw className="w-5 h-5 mr-2" />
              Returns History
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={printReport}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RotateCcw className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No returns found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter ? "Try adjusting your search criteria" : "No returns processed yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((returnItem: any) => {
                const statusInfo = getReturnStatus(returnItem.status);
                return (
                  <div key={returnItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Return #{returnItem.id}
                        </h3>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Sale #{returnItem.saleId}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(returnItem.createdAt || returnItem.returnDate).toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {formatCurrency(returnItem.totalAmount)}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {returnItem.customerName || 'Walk-in Customer'}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Reason:</span> {returnItem.reason}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {returnItem.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ returnId: returnItem.id, status: 'approved' })}
                            disabled={updateStatusMutation.isPending}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            data-testid={`button-approve-${returnItem.id}`}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ returnId: returnItem.id, status: 'rejected' })}
                            disabled={updateStatusMutation.isPending}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            data-testid={`button-reject-${returnItem.id}`}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {returnItem.status === 'approved' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ returnId: returnItem.id, status: 'processed' })}
                          disabled={updateStatusMutation.isPending}
                          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          data-testid={`button-process-${returnItem.id}`}
                        >
                          Mark Processed
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          setShowViewDialog(true);
                        }}
                        data-testid={`button-view-details-${returnItem.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sale Transaction</Label>
                <Select value={returnData.saleId} onValueChange={(value) => {
                  setReturnData({ ...returnData, saleId: value });
                  setReturnItems([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sale to return" />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.slice(0, 20).map((sale: any) => (
                      <SelectItem key={sale.id} value={sale.id.toString()}>
                        Sale #{sale.id} - {formatCurrency(sale.totalAmount)} ({new Date(sale.createdAt || sale.saleDate).toLocaleDateString('en-GB')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Default Return Type</Label>
                <Select value="refund" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">You can set individual return types for each item below</p>
              </div>
            </div>

            {/* Sale Items Selection */}
            {returnData.saleId && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Select Items to Return</Label>
                {isLoadingSaleItems ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading sale items...</span>
                  </div>
                ) : returnItems.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {returnItems.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-3 p-2 border rounded bg-gray-50">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(checked: boolean) => toggleItemSelection(item.id, checked)}
                          data-testid={`checkbox-item-${item.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.product?.name || item.productName || 'Unknown Product'}
                            {item.variant?.variantName && ` (${item.variant.variantName})`}
                          </p>
                          <p className="text-xs text-gray-600">
                            Price: {formatCurrency(item.price)} | Available: {item.quantity}
                          </p>
                        </div>
                        {item.selected && (
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Qty:</Label>
                            <Input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={item.returnQuantity}
                              onChange={(e) => updateReturnQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-xs"
                              data-testid={`input-quantity-${item.id}`}
                            />
                            <Select value={item.returnType} onValueChange={(value) => updateReturnType(item.id, value)}>
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="refund">Refund</SelectItem>
                                <SelectItem value="exchange">Exchange</SelectItem>
                                <SelectItem value="store_credit">Credit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No items found for this sale</p>
                  </div>
                )}
                
                {returnItems.filter(item => item.selected).length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-800">
                        Selected Items: {returnItems.filter(item => item.selected).length}
                      </span>
                      <span className="font-bold text-blue-800">
                        Total Return Amount: {formatCurrency(calculateReturnAmount())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Return Reason</Label>
              <Textarea
                value={returnData.reason}
                onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                placeholder="Enter reason for return (e.g., defective product, wrong size, customer changed mind)"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReturnMutation.isPending}>
                {createReturnMutation.isPending ? "Processing..." : "Process Return"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Return ID</Label>
                  <p className="text-sm"># {selectedReturn.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Sale ID</Label>
                  <p className="text-sm"># {selectedReturn.saleId}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Customer</Label>
                  <p className="text-sm">{selectedReturn.customerName || 'Walk-in Customer'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={getReturnStatus(selectedReturn.status).color}>
                    {getReturnStatus(selectedReturn.status).label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Return Amount</Label>
                  <p className="text-sm">{formatCurrency(selectedReturn.totalAmount)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date</Label>
                  <p className="text-sm">{new Date(selectedReturn.createdAt || selectedReturn.returnDate).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Return Reason</Label>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedReturn.reason}</p>
              </div>
              
              {selectedReturn.items && selectedReturn.items.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Return Items</Label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    {selectedReturn.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">Product ID: {item.productId}</span>
                        <span className="text-sm">Qty: {item.quantity}</span>
                        <span className="text-sm capitalize">{item.returnType || 'refund'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewDialog(false)}
                  data-testid="button-close-return-details"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}