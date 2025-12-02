import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Warehouse, Plus, Edit, MapPin, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Warehouses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: "", location: "" });
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch warehouses
  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  // Fetch stock summary for each warehouse
  const { data: stockSummary = [] } = useQuery({
    queryKey: ["/api/stock"],
    retry: false,
  });

  const createWarehouseMutation = useMutation({
    mutationFn: (warehouseData: any) =>
      apiRequest("/api/warehouses", {
        method: "POST",
        body: JSON.stringify(warehouseData),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Warehouse created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setShowAddDialog(false);
      setNewWarehouse({ name: "", location: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create warehouse",
        variant: "destructive",
      });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/warehouses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Warehouse updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setShowEditDialog(false);
      setEditingWarehouse(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update warehouse",
        variant: "destructive",
      });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/warehouses/${id}`, {
        method: "DELETE",
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Warehouse deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete warehouse",
        variant: "destructive",
      });
    },
  });

  const filteredWarehouses = (warehouses as any[]).filter((warehouse: any) =>
    warehouse.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWarehouseStockCount = (warehouseId: number) => {
    const warehouseStock = (stockSummary as any[]).filter((stock: any) => stock.warehouseId === warehouseId);
    return warehouseStock.length;
  };

  const getWarehouseTotalItems = (warehouseId: number) => {
    const warehouseStock = (stockSummary as any[]).filter((stock: any) => stock.warehouseId === warehouseId);
    return warehouseStock.reduce((total: number, stock: any) => total + parseFloat(stock.quantity || '0'), 0);
  };

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name) {
      toast({
        title: "Error",
        description: "Warehouse name is required",
        variant: "destructive",
      });
      return;
    }
    createWarehouseMutation.mutate(newWarehouse);
  };

  const handleEditWarehouse = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setShowEditDialog(true);
  };

  const handleUpdateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse.name) {
      toast({
        title: "Error",
        description: "Warehouse name is required",
        variant: "destructive",
      });
      return;
    }
    updateWarehouseMutation.mutate({
      id: editingWarehouse.id,
      data: { 
        name: editingWarehouse.name, 
        location: editingWarehouse.location 
      }
    });
  };

  const handleDeleteWarehouse = (id: number) => {
    if (confirm("Are you sure you want to delete this warehouse? This action cannot be undone.")) {
      deleteWarehouseMutation.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
        <p className="text-gray-600">Manage your storage locations and facilities</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-96">
          <Input 
            type="text" 
            placeholder="Search warehouses..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>
                Enter the warehouse details including name and location
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  placeholder="Enter warehouse name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Textarea
                  id="location"
                  value={newWarehouse.location}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
                  placeholder="Enter warehouse address or location details"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWarehouseMutation.isPending}>
                  {createWarehouseMutation.isPending ? "Creating..." : "Create Warehouse"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Warehouse Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Warehouse</DialogTitle>
              <DialogDescription>
                Update the warehouse details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateWarehouse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Warehouse Name</Label>
                <Input
                  id="edit-name"
                  value={editingWarehouse?.name || ""}
                  onChange={(e) => setEditingWarehouse({ 
                    ...editingWarehouse, 
                    name: e.target.value 
                  })}
                  placeholder="Enter warehouse name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Textarea
                  id="edit-location"
                  value={editingWarehouse?.location || ""}
                  onChange={(e) => setEditingWarehouse({ 
                    ...editingWarehouse, 
                    location: e.target.value 
                  })}
                  placeholder="Enter warehouse address or location details"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateWarehouseMutation.isPending}>
                  {updateWarehouseMutation.isPending ? "Updating..." : "Update Warehouse"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Warehouse className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No warehouses found</h3>
          <p className="text-gray-500 text-center mb-4">
            {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first warehouse"}
          </p>
          <Button onClick={() => setShowAddDialog(true)} className="bg-primary-600 hover:bg-primary-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map((warehouse: any) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Warehouse className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      {warehouse.location && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {warehouse.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditWarehouse(warehouse)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteWarehouse(warehouse.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Package className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {getWarehouseStockCount(warehouse.id)}
                    </div>
                    <div className="text-xs text-gray-500">Product Types</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Badge variant="outline" className="w-4 h-4 rounded-full p-0 border-gray-400" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {Math.round(getWarehouseTotalItems(warehouse.id))}
                    </div>
                    <div className="text-xs text-gray-500">Total Items</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}