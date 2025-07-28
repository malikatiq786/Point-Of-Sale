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
import { Search, ArrowRightLeft, Plus, Warehouse, Package, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function StockTransfers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [transfer, setTransfer] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    items: [{ productVariantId: "", quantity: "" }]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch transfers
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["/api/stock/transfers"],
    retry: false,
  });

  // Fetch warehouses for transfer form
  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  // Fetch stock for product selection
  const { data: stockData = [] } = useQuery({
    queryKey: ["/api/stock"],
    retry: false,
  });

  const createTransferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await fetch("/api/stock/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create transfer");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock transfer created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setShowCreateDialog(false);
      setTransfer({
        fromWarehouseId: "",
        toWarehouseId: "",
        items: [{ productVariantId: "", quantity: "" }]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transfer",
        variant: "destructive",
      });
    },
  });

  const filteredTransfers = transfers.filter((transfer: any) =>
    transfer.fromWarehouseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transfer.toWarehouseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transfer.fromWarehouseId || !transfer.toWarehouseId) {
      toast({
        title: "Error",
        description: "Please select both source and destination warehouses",
        variant: "destructive",
      });
      return;
    }

    if (transfer.fromWarehouseId === transfer.toWarehouseId) {
      toast({
        title: "Error",
        description: "Source and destination warehouses must be different",
        variant: "destructive",
      });
      return;
    }

    const validItems = transfer.items.filter(item => 
      item.productVariantId && item.quantity && parseInt(item.quantity) > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid item to transfer",
        variant: "destructive",
      });
      return;
    }

    createTransferMutation.mutate({
      fromWarehouseId: parseInt(transfer.fromWarehouseId),
      toWarehouseId: parseInt(transfer.toWarehouseId),
      items: validItems.map(item => ({
        productVariantId: parseInt(item.productVariantId),
        quantity: parseInt(item.quantity)
      }))
    });
  };

  const addTransferItem = () => {
    setTransfer({
      ...transfer,
      items: [...transfer.items, { productVariantId: "", quantity: "" }]
    });
  };

  const updateTransferItem = (index: number, field: string, value: string) => {
    const updatedItems = transfer.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setTransfer({ ...transfer, items: updatedItems });
  };

  const removeTransferItem = (index: number) => {
    if (transfer.items.length > 1) {
      setTransfer({
        ...transfer,
        items: transfer.items.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
        <p className="text-gray-600">Move inventory between warehouses and track transfer history</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-96">
          <Input 
            type="text" 
            placeholder="Search transfers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4 mr-2" />
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Stock Transfer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitTransfer} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Warehouse</Label>
                  <Select 
                    value={transfer.fromWarehouseId} 
                    onValueChange={(value) => setTransfer({ ...transfer, fromWarehouseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Warehouse</Label>
                  <Select 
                    value={transfer.toWarehouseId} 
                    onValueChange={(value) => setTransfer({ ...transfer, toWarehouseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Items to Transfer</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTransferItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {transfer.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-7 space-y-2">
                      <Label className="text-xs">Product</Label>
                      <Select 
                        value={item.productVariantId} 
                        onValueChange={(value) => updateTransferItem(index, 'productVariantId', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {stockData
                            .filter((stock: any) => 
                              transfer.fromWarehouseId === "" || 
                              stock.warehouseId?.toString() === transfer.fromWarehouseId
                            )
                            .map((stock: any) => (
                              <SelectItem key={`${stock.productVariantId}-${stock.warehouseId}`} value={stock.productVariantId?.toString()}>
                                {stock.productName} ({Math.round(parseFloat(stock.quantity || '0'))} available)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateTransferItem(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        min="1"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      {transfer.items.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeTransferItem(index)}
                          className="h-9 w-full text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTransferMutation.isPending}>
                  {createTransferMutation.isPending ? "Creating..." : "Create Transfer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowRightLeft className="mr-2 h-5 w-5" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Transfer history will appear here once you start moving stock"}
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-primary-600 hover:bg-primary-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Transfer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransfers.map((transfer: any) => (
                <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center text-white">
                      <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Warehouse className="w-4 h-4 mr-1" />
                          {transfer.fromWarehouseName || 'Unknown Warehouse'}
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center text-sm text-gray-600">
                          <Warehouse className="w-4 h-4 mr-1" />
                          {transfer.toWarehouseName || 'Unknown Warehouse'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(transfer.transferDate).toLocaleDateString()}
                        </span>
                        <span>Transfer #{transfer.id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(transfer.status)}>
                      {transfer.status || 'Pending'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}