import { useState } from "react";
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
import { Search, Warehouse, AlertTriangle, Plus, Minus, Edit } from "lucide-react";

export default function Stock() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [adjustment, setAdjustment] = useState({ type: "increase", quantity: "", reason: "", productName: "" });
  const [isAddMode, setIsAddMode] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stock data
  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ["/api/stock"],
    retry: false,
  });

  const filteredStock = stockItems.filter((stock: any) =>
    stock.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.warehouseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setShowAdjustDialog(true);
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustment.quantity || !adjustment.reason || (isAddMode && !adjustment.productName)) {
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

    if (isAddMode) {
      // For add mode, we only have product name, so backend will look up by name
      adjustStockMutation.mutate({
        warehouseId: 1,
        quantityChange,
        reason: adjustment.reason,
        items: [{
          productName: adjustment.productName,
          quantity: quantityChange,
          previousQuantity: 0,
          newQuantity: quantityChange
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
          productId: selectedStock?.productVariantId || selectedStock?.id,
          productName: selectedStock?.productName,
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
          ) : filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Warehouse className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock records found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery ? "Try adjusting your search terms" : "Stock levels will appear here once products are added"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStock.map((stock: any) => {
                const stockStatus = getStockStatus(parseFloat(stock.quantity || '0'));
                
                return (
                  <Card key={stock.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {stock.productName || 'Unknown Product'}
                            </h3>
                            <Badge className={`${stockStatus.color} px-2 py-1 text-xs font-medium`}>
                              {stockStatus.status}
                            </Badge>
                            {parseFloat(stock.quantity || '0') <= 10 && (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              {stock.categoryName && (
                                <Badge variant="secondary" className="text-xs">
                                  {stock.categoryName}
                                </Badge>
                              )}
                              {stock.brandName && (
                                <Badge variant="outline" className="text-xs">
                                  {stock.brandName}
                                </Badge>
                              )}
                              {stock.unitName && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  {stock.unitShortName || stock.unitName}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Warehouse className="w-4 h-4" />
                                <span>{stock.warehouseName || 'Main Warehouse'}</span>
                              </div>
                              
                              <div>
                                <span className="font-medium">Current Stock: </span>
                                <span className="font-bold text-gray-900">
                                  {parseFloat(stock.quantity || '0').toFixed(0)} {stock.unitShortName || stock.unitName || 'units'}
                                </span>
                              </div>
                              
                              <div>
                                <span className="font-medium">SKU: </span>
                                <span>{stock.sku || stock.id}</span>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                Last Updated: Today
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAdjustStock(stock)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Adjust
                          </Button>
                        </div>
                      </div>
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
                <Label>Product Name</Label>
                <Input
                  type="text"
                  value={adjustment.productName}
                  onChange={(e) => setAdjustment({ ...adjustment, productName: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
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