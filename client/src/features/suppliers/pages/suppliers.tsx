import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Truck, Eye, Phone, Mail, MapPin } from "lucide-react";

export default function Suppliers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [editSupplier, setEditSupplier] = useState({
    id: 0,
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    retry: false,
  });

  const filteredSuppliers = (suppliers as any[]).filter((supplier: any) =>
    supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.includes(searchQuery)
  );

  const createSupplierMutation = useMutation({
    mutationFn: (supplierData: any) => apiRequest("POST", "/api/suppliers", supplierData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setShowAddDialog(false);
      setNewSupplier({ name: "", email: "", phone: "", address: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (supplierData: any) => apiRequest("PUT", `/api/suppliers/${supplierData.id}`, supplierData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setShowEditDialog(false);
      setEditSupplier({ id: 0, name: "", email: "", phone: "", address: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (supplierId: number) => apiRequest("DELETE", `/api/suppliers/${supplierId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }
    createSupplierMutation.mutate(newSupplier);
  };

  const handleEditSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupplier.name) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }
    updateSupplierMutation.mutate(editSupplier);
  };

  const handleViewSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setShowViewDialog(true);
  };

  const handleEditClick = (supplier: any) => {
    setEditSupplier({
      id: supplier.id,
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || ""
    });
    setShowEditDialog(true);
  };

  const handleDeleteSupplier = (supplier: any) => {
    if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      deleteSupplierMutation.mutate(supplier.id);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
              <p className="text-sm text-gray-500">Manage your supplier relationships</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search suppliers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-primary-500 text-white hover:bg-primary-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSupplier} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        placeholder="Enter supplier name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                        placeholder="Enter supplier address"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createSupplierMutation.isPending}>
                        {createSupplierMutation.isPending ? "Creating..." : "Create Supplier"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Edit Supplier Dialog */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Supplier</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditSupplier} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input
                        id="edit-name"
                        value={editSupplier.name}
                        onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })}
                        placeholder="Enter supplier name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editSupplier.email}
                        onChange={(e) => setEditSupplier({ ...editSupplier, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editSupplier.phone}
                        onChange={(e) => setEditSupplier({ ...editSupplier, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Textarea
                        id="edit-address"
                        value={editSupplier.address}
                        onChange={(e) => setEditSupplier({ ...editSupplier, address: e.target.value })}
                        placeholder="Enter supplier address"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateSupplierMutation.isPending}>
                        {updateSupplierMutation.isPending ? "Updating..." : "Update Supplier"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* View Supplier Dialog */}
              <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Supplier Details</DialogTitle>
                  </DialogHeader>
                  {selectedSupplier && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Supplier ID</Label>
                          <p className="text-sm">{selectedSupplier.id}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Name</Label>
                          <p className="text-sm font-semibold">{selectedSupplier.name}</p>
                        </div>
                      </div>
                      
                      {selectedSupplier.email && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <p className="text-sm">{selectedSupplier.email}</p>
                        </div>
                      )}
                      
                      {selectedSupplier.phone && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Phone</Label>
                          <p className="text-sm">{selectedSupplier.phone}</p>
                        </div>
                      )}
                      
                      {selectedSupplier.address && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Address</Label>
                          <p className="text-sm">{selectedSupplier.address}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Active Orders</Label>
                          <p className="text-sm">0</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Registration Date</Label>
                          <p className="text-sm">{selectedSupplier.createdAt ? new Date(selectedSupplier.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                          Close
                        </Button>
                        <Button onClick={() => {
                          setShowViewDialog(false);
                          handleEditClick(selectedSupplier);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Supplier
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredSuppliers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <Truck className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first supplier"}
                </p>
                <Button 
                  className="bg-primary-500 text-white hover:bg-primary-600"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
            ) : (
              filteredSuppliers.map((supplier: any) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs w-fit">
                      Supplier ID: {supplier.id}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {supplier.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      
                      {supplier.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      
                      {supplier.address && (
                        <div className="flex items-start space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <span className="line-clamp-2">{supplier.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Active Orders: 0
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewSupplier(supplier)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(supplier)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteSupplier(supplier)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}