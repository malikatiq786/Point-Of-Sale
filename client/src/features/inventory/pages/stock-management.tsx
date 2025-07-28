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
import { Search, Package, AlertTriangle, Plus, Minus, Warehouse, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function StockManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [adjustment, setAdjustment] = useState({ type: "increase", quantity: "", reason: "" });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          warehouseId: adjustmentData.warehouseId,
          reason: adjustmentData.reason,
          items: [{
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

  const filteredStock = stockData.filter((stock: any) =>
    stock.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.variantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.warehouseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
        <p className="text-gray-600">Monitor and manage inventory levels across all warehouses</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search products, variants, or warehouses..." 
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
            {warehouses.map((warehouse: any) => (
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
                <p className="text-2xl font-bold text-gray-900">{stockData.length}</p>
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
                  {stockData.filter((s: any) => parseFloat(s.quantity) <= 10).length}
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
                  {stockData.filter((s: any) => parseFloat(s.quantity) <= 0).length}
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
                  {Math.round(stockData.reduce((total: number, s: any) => total + parseFloat(s.quantity || '0'), 0))}
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
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stock records found</h3>
              <p className="text-gray-500">
                {searchQuery ? "Try adjusting your search terms" : "Stock records will appear here once products are added"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStock.map((stock: any) => {
                const stockStatus = getStockStatus(parseFloat(stock.quantity || '0'));
                
                return (
                  <div key={`${stock.productVariantId}-${stock.warehouseId}`} 
                       className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {stock.productName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {stock.productName}
                          {stock.variantName && stock.variantName !== stock.productName && (
                            <span className="text-gray-500 ml-2">({stock.variantName})</span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Warehouse className="w-3 h-3 mr-1" />
                            {stock.warehouseName}
                          </span>
                          {stock.categoryName && <span>Category: {stock.categoryName}</span>}
                          {stock.brandName && <span>Brand: {stock.brandName}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {Math.round(parseFloat(stock.quantity || '0'))}
                        </div>
                        <div className="text-xs text-gray-500">units</div>
                      </div>
                      
                      <Badge className={stockStatus.color}>
                        {stockStatus.status}
                      </Badge>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAdjustStock(stock)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Adjust
                      </Button>
                    </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <div className="p-2 bg-gray-100 rounded text-center font-semibold">
                  {selectedStock ? Math.round(parseFloat(selectedStock.quantity || '0')) : 0} units
                </div>
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <div className="p-2 bg-gray-100 rounded text-center">
                  {selectedStock?.warehouseName}
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