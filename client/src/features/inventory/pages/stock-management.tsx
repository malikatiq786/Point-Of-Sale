import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, AlertTriangle, Plus, Minus, Warehouse, Edit, ChevronDown, ChevronUp, Eye, FileText, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useCurrency } from "@/hooks/useCurrency";

export default function StockManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [adjustment, setAdjustment] = useState({ type: "increase", quantity: "", reason: "" });
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrencyValue } = useCurrency();

  // Fetch stock data
  const { data: stockData = [], isLoading } = useQuery({
    queryKey: ["/api/stock", { warehouseId: selectedWarehouse !== "all" ? selectedWarehouse : undefined, lowStock: showLowStock }],
    retry: false,
  });

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (adjustmentData: any) => {
      // Create the adjustment record
      const response = await fetch("/api/stock/adjustments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          warehouseId: adjustmentData.warehouseId || 9,
          reason: adjustmentData.reason,
          items: [{
            productVariantId: selectedStock?.id,
            productId: selectedStock?.productId,
            productName: selectedStock?.productName,
            variantName: selectedStock?.variantName,
            quantity: adjustmentData.quantityChange,
            previousQuantity: Math.round(parseFloat(selectedStock?.quantity || '0')),
            newQuantity: Math.round(parseFloat(selectedStock?.quantity || '0')) + adjustmentData.quantityChange
          }]
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create stock adjustment");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock adjusted successfully and logged in adjustments history",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/adjustments"] });
      setShowAdjustDialog(false);
      setAdjustment({ type: "increase", quantity: "", reason: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust stock",
        variant: "destructive",
      });
    },
  });

  const filteredStock = (stockData as any[]).filter((stock: any) =>
    stock.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.variantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.warehouseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group stock by product name (since productId is not available in API response)
  const groupedStock = filteredStock.reduce((groups: any, stock: any) => {
    const key = stock.productName; // Use just product name as key
    if (!groups[key]) {
      groups[key] = {
        productName: stock.productName,
        categoryName: stock.categoryName,
        brandName: stock.brandName,
        unitName: stock.unitName,
        unitShortName: stock.unitShortName,
        variants: [],
        totalStock: 0
      };
    }
    
    groups[key].variants.push(stock);
    groups[key].totalStock += parseFloat(stock.quantity || '0');
    
    return groups;
  }, {});

  const groupedStockArray = Object.values(groupedStock);

  const toggleProductExpand = (productName: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productName)) {
      newExpanded.delete(productName);
    } else {
      newExpanded.add(productName);
    }
    setExpandedProducts(newExpanded);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    if (quantity <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (quantity <= 50) return { status: 'Medium Stock', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const handleAdjustStock = (stock: any) => {
    setSelectedStock(stock);
    setShowAdjustDialog(true);
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustment.quantity || !adjustment.reason) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const quantityChange = adjustment.type === "increase" 
      ? parseInt(adjustment.quantity) 
      : -parseInt(adjustment.quantity);

    adjustStockMutation.mutate({
      productVariantId: selectedStock.productVariantId,
      warehouseId: selectedStock.warehouseId,
      quantityChange,
      reason: adjustment.reason,
      userId: "user123" // This should come from auth context
    });
  };

  // Export to PDF function
  const exportToPDF = () => {
    const pdf = new jsPDF();
    let currentY = 20;

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Stock Management Report', 15, currentY);
    currentY += 10;

    // Summary
    pdf.setFontSize(10);
    pdf.text(`Total Products: ${groupedStockArray.length}`, 15, currentY);
    currentY += 8;
    const totalVariants = filteredStock.length;
    pdf.text(`Total Variants: ${totalVariants}`, 15, currentY);
    currentY += 8;
    const totalStockValue = filteredStock.reduce((sum: number, stock: any) => {
      return sum + (parseFloat(stock.quantity || '0') * parseFloat(stock.unitCost || '0'));
    }, 0);
    pdf.text(`Total Stock Items: ${filteredStock.reduce((sum: number, stock: any) => sum + parseFloat(stock.quantity || '0'), 0)}`, 15, currentY);
    currentY += 15;

    // Process each product with its variants
    for (const productGroup of groupedStockArray as any[]) {
      if (currentY > 250) { // Add new page if needed
        pdf.addPage();
        currentY = 20;
      }

      // Product header
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${productGroup.productName}`, 15, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.text(`Category: ${productGroup.categoryName || 'N/A'}`, 15, currentY);
      pdf.text(`Brand: ${productGroup.brandName || 'N/A'}`, 110, currentY);
      currentY += 6;
      pdf.text(`Unit: ${productGroup.unitName || 'N/A'}`, 15, currentY);
      pdf.text(`Total Stock: ${productGroup.totalStock} ${productGroup.unitShortName || 'units'}`, 110, currentY);
      currentY += 10;

      // Variants table
      if (productGroup.variants.length > 0) {
        const variantsData = productGroup.variants.map((variant: any) => [
          variant.variantName || 'Default',
          variant.warehouseName || 'N/A',
          parseFloat(variant.quantity || '0').toString(),
          getStockStatus(parseFloat(variant.quantity || '0')).status,
          variant.location || 'N/A'
        ]);

        autoTable(pdf, {
          startY: currentY,
          head: [['Variant', 'Warehouse', 'Quantity', 'Status', 'Location']],
          body: variantsData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 15, right: 15 },
          tableWidth: 'auto'
        });

        currentY = (pdf as any).lastAutoTable.finalY + 15;
      } else {
        pdf.text('No variants found for this product', 15, currentY);
        currentY += 10;
      }
    }

    pdf.save(`stock-management-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Print function
  const printReport = () => {
    let productsHTML = '';
    
    for (const productGroup of groupedStockArray as any[]) {
      productsHTML += `
        <div class="product-section">
          <div class="product-header">
            <h3>${productGroup.productName}</h3>
            <div class="product-info">
              <div><strong>Category:</strong> ${productGroup.categoryName || 'N/A'}</div>
              <div><strong>Brand:</strong> ${productGroup.brandName || 'N/A'}</div>
              <div><strong>Unit:</strong> ${productGroup.unitName || 'N/A'}</div>
              <div><strong>Total Stock:</strong> ${productGroup.totalStock} ${productGroup.unitShortName || 'units'}</div>
            </div>
          </div>
          
          ${productGroup.variants.length > 0 ? `
            <table class="variants-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Warehouse</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                ${productGroup.variants.map((variant: any) => `
                  <tr>
                    <td>${variant.variantName || 'Default'}</td>
                    <td>${variant.warehouseName || 'N/A'}</td>
                    <td>${parseFloat(variant.quantity || '0')}</td>
                    <td><span class="status-badge ${getStockStatus(parseFloat(variant.quantity || '0')).status.toLowerCase().replace(' ', '-')}">${getStockStatus(parseFloat(variant.quantity || '0')).status}</span></td>
                    <td>${variant.location || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="no-variants">No variants found for this product</p>'}
        </div>
      `;
    }

    const totalVariants = filteredStock.length;
    const totalStockItems = filteredStock.reduce((sum: number, stock: any) => sum + parseFloat(stock.quantity || '0'), 0);

    const printContent = `
      <html>
        <head>
          <title>Stock Management Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; margin-bottom: 10px; }
            .summary { text-align: center; margin-bottom: 20px; padding: 10px; background-color: #f0f9ff; border-radius: 5px; }
            .product-section { margin-bottom: 30px; page-break-inside: avoid; }
            .product-header { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
            .product-header h3 { margin: 0 0 10px 0; color: #22c55e; }
            .product-info { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
            .variants-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .variants-table th, .variants-table td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; }
            .variants-table th { background-color: #22c55e; color: white; font-weight: bold; }
            .variants-table td:nth-child(3) { text-align: right; }
            .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .out-of-stock { background-color: #fee2e2; color: #991b1b; }
            .low-stock { background-color: #fef3c7; color: #92400e; }
            .medium-stock { background-color: #dbeafe; color: #1e40af; }
            .in-stock { background-color: #dcfce7; color: #166534; }
            .no-variants { text-align: center; color: #666; font-style: italic; }
            @media print { 
              body { margin: 0; } 
              .product-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Stock Management Report</h1>
          <div class="summary">
            <strong>Total Products:</strong> ${(groupedStockArray as any[]).length} | <strong>Total Variants:</strong> ${totalVariants} | <strong>Total Stock Items:</strong> ${totalStockItems}
          </div>
          ${productsHTML}
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

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600">Monitor and manage inventory levels across all warehouses</p>
          </div>
          
          {/* Export Buttons */}
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
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search products, variants, warehouses, categories, or brands..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {(warehouses as any[]).map((warehouse: any) => (
              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showLowStock ? "default" : "outline"}
          onClick={() => setShowLowStock(!showLowStock)}
          className="w-full sm:w-auto"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {showLowStock ? "Show All" : "Low Stock Only"}
        </Button>
      </div>

      {/* Stock Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{groupedStockArray.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groupedStockArray.filter((group: any) => group.totalStock <= 10).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-red-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {groupedStockArray.filter((group: any) => group.totalStock <= 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Warehouse className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(groupedStockArray.reduce((total: number, group: any) => total + group.totalStock, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : groupedStockArray.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stock records found</h3>
              <p className="text-gray-500">
                {searchQuery ? "Try adjusting your search terms" : "Stock records will appear here once products are added"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedStockArray.map((product: any) => {
                const productKey = product.productName; // Use product name as key
                const isExpanded = expandedProducts.has(productKey);
                const stockStatus = getStockStatus(product.totalStock);
                
                return (
                  <div key={productKey} className="border rounded-lg">
                    {/* Main Product Row */}
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                          {product.productName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {product.productName}
                            <span className="text-gray-500 ml-2 text-sm">
                              ({product.variants.length} variant{product.variants.length !== 1 ? 's' : ''})
                            </span>
                          </h3>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            {product.categoryName && (
                              <Badge variant="secondary" className="text-xs">
                                {product.categoryName}
                              </Badge>
                            )}
                            {product.brandName && (
                              <Badge variant="outline" className="text-xs">
                                {product.brandName}
                              </Badge>
                            )}
                            {product.unitName && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                {product.unitShortName || product.unitName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {Math.round(product.totalStock)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.unitShortName || product.unitName || 'units'}
                          </div>
                        </div>
                        
                        <Badge className={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleProductExpand(productKey)}
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                          {isExpanded ? 'Hide' : 'View'} Variants
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Variant Details */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50">
                        <div className="px-4 py-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Variant Details</h4>
                          <div className="space-y-2">
                            {product.variants.map((variant: any) => (
                              <div key={`${variant.productVariantId}-${variant.warehouseId}`} 
                                   className="flex items-center justify-between p-3 bg-white rounded border">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                                    {variant.variantName?.charAt(0) || 'V'}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm text-gray-900">
                                      {variant.variantName}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Warehouse className="w-3 h-3 mr-1" />
                                      {variant.warehouseName}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <div className="font-bold text-gray-900">
                                      {Math.round(parseFloat(variant.quantity || '0'))}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {variant.unitShortName || variant.unitName || 'units'}
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAdjustStock(variant)}
                                    className="text-xs px-2 py-1"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Adjust
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedStock?.productName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAdjustment} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Product</Label>
                <p className="font-semibold text-gray-900">{selectedStock?.productName}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Category</Label>
                  {selectedStock?.categoryName ? (
                    <Badge variant="secondary" className="mt-1">
                      {selectedStock.categoryName}
                    </Badge>
                  ) : (
                    <p className="text-gray-400 text-sm">No Category</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Brand</Label>
                  {selectedStock?.brandName ? (
                    <Badge variant="outline" className="mt-1">
                      {selectedStock.brandName}
                    </Badge>
                  ) : (
                    <p className="text-gray-400 text-sm">No Brand</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Unit</Label>
                  {selectedStock?.unitName ? (
                    <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                      {selectedStock.unitShortName || selectedStock.unitName}
                    </Badge>
                  ) : (
                    <p className="text-gray-400 text-sm">No Unit</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Stock</Label>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedStock ? Math.round(parseFloat(selectedStock.quantity || '0')) : 0} {selectedStock?.unitShortName || selectedStock?.unitName || 'units'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Warehouse</Label>
                  <div className="flex items-center mt-1">
                    <Warehouse className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-700">{selectedStock?.warehouseName || 'Main Warehouse'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustment.type} onValueChange={(value) => setAdjustment({ ...adjustment, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2 text-green-600" />
                      Increase Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="decrease">
                    <div className="flex items-center">
                      <Minus className="w-4 h-4 mr-2 text-red-600" />
                      Decrease Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={adjustment.quantity}
                onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })}
                placeholder="Enter quantity to adjust"
                min="1"
                required
              />
              {selectedStock && (
                <p className="text-xs text-gray-500 mt-1">
                  New stock will be: {Math.round(parseFloat(selectedStock.quantity || '0')) + (adjustment.type === "increase" ? parseInt(adjustment.quantity || '0') : -parseInt(adjustment.quantity || '0'))} units
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={adjustment.reason}
                onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                placeholder="Enter reason for adjustment (e.g., damaged goods, recount, etc.)"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowAdjustDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjustStockMutation.isPending}>
                {adjustStockMutation.isPending ? "Adjusting..." : "Adjust Stock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}