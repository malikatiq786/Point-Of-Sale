import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
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
import { Search, Warehouse, AlertTriangle, Plus, Minus, Edit, ChevronDown, ChevronUp, Package } from "lucide-react";

export default function Stock() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [adjustment, setAdjustment] = useState({ type: "increase", quantity: "", reason: "", productName: "" });
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [isAddMode, setIsAddMode] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const variantSearchRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stock data
  const { data: stockItems = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/stock"],
    retry: false,
  });

  // Fetch all product variants for searchable dropdown
  const { data: allVariants = [] } = useQuery<any[]>({
    queryKey: ["/api/product-variants/all"],
    retry: false,
  });

  // Filter variants based on search input
  const filteredVariants = allVariants.filter((variant: any) => {
    if (!variantSearch) return false;
    const searchLower = variantSearch.toLowerCase();
    return (
      variant.variantName?.toLowerCase().includes(searchLower) ||
      variant.productName?.toLowerCase().includes(searchLower) ||
      variant.barcode?.toLowerCase().includes(searchLower)
    );
  }).slice(0, 10);

  const filteredStock = stockItems.filter((stock: any) =>
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
    if (quantity <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const adjustStockMutation = useMutation({
    mutationFn: async (adjustmentData: any) => {
      const response = await fetch("/api/stock/adjustments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          warehouseId: adjustmentData.warehouseId,
          reason: adjustmentData.reason,
          items: [{
            productId: selectedStock?.productVariantId || selectedStock?.id,
            productName: selectedStock?.productName,
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
      setAdjustment({ type: "increase", quantity: "", reason: "", productName: "" });
      setIsAddMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust stock",
        variant: "destructive",
      });
    },
  });

  const handleAdjustStock = (stock: any) => {
    setSelectedStock(stock);
    setIsAddMode(false);
    setShowAdjustDialog(true);
  };

  const handleAddStockAdjustment = () => {
    setSelectedStock(null);
    setIsAddMode(true);
    setAdjustment({ type: "increase", quantity: "", reason: "", productName: "" });
    setVariantSearch("");
    setSelectedVariant(null);
    setShowVariantDropdown(false);
    setShowAdjustDialog(true);
  };

  const handleSelectVariant = (variant: any) => {
    setSelectedVariant(variant);
    setVariantSearch(`${variant.productName} - ${variant.variantName}`);
    setShowVariantDropdown(false);
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustment.quantity || !adjustment.reason || (isAddMode && !selectedVariant)) {
      toast({
        title: "Error",
        description: isAddMode ? "Please select a product variant and fill in all fields" : "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const quantityChange = adjustment.type === "increase" 
      ? parseInt(adjustment.quantity) 
      : -parseInt(adjustment.quantity);

    if (isAddMode && selectedVariant) {
      // For add mode, use the selected variant
      adjustStockMutation.mutate({
        warehouseId: 1,
        quantityChange,
        reason: adjustment.reason,
        items: [{
          productVariantId: selectedVariant.id,
          productId: selectedVariant.productId,
          productName: `${selectedVariant.productName} - ${selectedVariant.variantName}`,
          quantity: quantityChange,
          previousQuantity: parseInt(selectedVariant.stock || '0'),
          newQuantity: parseInt(selectedVariant.stock || '0') + quantityChange
        }]
      });
    } else {
      // For edit mode, we have the selected stock with product ID
      const currentQuantity = Math.round(parseFloat(selectedStock?.quantity || '0'));
      adjustStockMutation.mutate({
        warehouseId: selectedStock.warehouseId,
        quantityChange,
        reason: adjustment.reason,
        items: [{
          productVariantId: selectedStock?.productVariantId,
          productId: selectedStock?.productVariantId || selectedStock?.id,
          productName: `${selectedStock?.productName} - ${selectedStock?.variantName}`,
          quantity: quantityChange,
          previousQuantity: currentQuantity,
          newQuantity: currentQuantity + quantityChange
        }]
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
              <p className="text-sm text-gray-500">Monitor and manage inventory levels</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search stock..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              
              <Button 
                onClick={handleAddStockAdjustment}
                className="bg-primary-500 text-white hover:bg-primary-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock Adjustment
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groupedStockArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Warehouse className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock records found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery ? "Try adjusting your search terms" : "Stock levels will appear here once products are added"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedStockArray.map((product: any) => {
                const productKey = product.productName; // Use product name as key
                const isExpanded = expandedProducts.has(productKey);
                const stockStatus = getStockStatus(product.totalStock);
                
                return (
                  <Card key={productKey} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Main Product Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {product.productName}
                              <span className="text-gray-500 ml-2 text-sm">
                                ({product.variants.length} variant{product.variants.length !== 1 ? 's' : ''})
                              </span>
                            </h3>
                            <Badge className={`${stockStatus.color} px-2 py-1 text-xs font-medium`}>
                              {stockStatus.status}
                            </Badge>
                            {product.totalStock <= 10 && (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
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
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleProductExpand(productKey)}
                            className="flex items-center"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                            {isExpanded ? 'Hide' : 'View'} Variants
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Variant Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Variant Details</h4>
                          <div className="space-y-3">
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
                                    className="text-xs px-2 py-1 flex items-center"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Adjust
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddMode ? 'Add Stock Adjustment' : `Adjust Stock - ${selectedStock?.productName}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAdjustment} className="space-y-4">
            {isAddMode ? (
              <div className="space-y-2">
                <Label>Search Product Variant</Label>
                <div className="relative">
                  <div className="relative">
                    <Input
                      ref={variantSearchRef}
                      type="text"
                      value={variantSearch}
                      onChange={(e) => {
                        setVariantSearch(e.target.value);
                        setShowVariantDropdown(e.target.value.length > 0);
                        if (e.target.value !== `${selectedVariant?.productName} - ${selectedVariant?.variantName}`) {
                          setSelectedVariant(null);
                        }
                      }}
                      onFocus={() => variantSearch && setShowVariantDropdown(true)}
                      placeholder="Search by product name, variant name, or barcode..."
                      className="pl-10"
                      data-testid="input-variant-search"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  
                  {showVariantDropdown && filteredVariants.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredVariants.map((variant: any) => (
                        <div
                          key={variant.id}
                          className="p-3 cursor-pointer hover-elevate border-b last:border-b-0"
                          onClick={() => handleSelectVariant(variant)}
                          data-testid={`variant-option-${variant.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-sm">
                                  {variant.productName} - <span className="text-primary">{variant.variantName}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {variant.barcode && `Barcode: ${variant.barcode}`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                Stock: {variant.stock || 0}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showVariantDropdown && variantSearch && filteredVariants.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
                      No variants found matching "{variantSearch}"
                    </div>
                  )}
                </div>
                
                {selectedVariant && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800 mt-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">Selected:</span>
                    </div>
                    <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                      {selectedVariant.productName} - {selectedVariant.variantName}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Current Stock: {selectedVariant.stock || 0} units
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
            )}
            
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
              {!isAddMode && selectedStock && (
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
    </div>
  );
}