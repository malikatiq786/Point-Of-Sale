import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Users, Eye, Phone, Mail, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Customers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [editCustomer, setEditCustomer] = useState({
    id: 0,
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });

  const filteredCustomers = customers.filter((customer: any) =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const createCustomerMutation = useMutation({
    mutationFn: (customerData: any) => apiRequest("POST", "/api/customers", customerData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowAddDialog(false);
      setNewCustomer({ name: "", email: "", phone: "", address: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: (customerData: any) => apiRequest("PUT", `/api/customers/${customerData.id}`, customerData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowEditDialog(false);
      setEditCustomer({ id: 0, name: "", email: "", phone: "", address: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (customerId: number) => apiRequest("DELETE", `/api/customers/${customerId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (customerIds: number[]) => apiRequest("DELETE", "/api/customers/bulk-delete", { customerIds }),
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data.message || "Customers deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomers([]);
      setShowBulkDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customers",
        variant: "destructive",
      });
    },
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(newCustomer);
  };

  const handleEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer.name) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }
    updateCustomerMutation.mutate(editCustomer);
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowViewDialog(true);
  };

  const handleEditClick = (customer: any) => {
    setEditCustomer({
      id: customer.id,
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || ""
    });
    setShowEditDialog(true);
  };

  const handleDeleteCustomer = (customer: any) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map((customer: any) => customer.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "Error",
        description: "Please select customers to delete",
        variant: "destructive",
      });
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedCustomers);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-500">Manage your customer relationships</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search customers..." 
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
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCustomer} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        placeholder="Enter customer address"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCustomerMutation.isPending}>
                        {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Edit Customer Dialog */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditCustomer} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input
                        id="edit-name"
                        value={editCustomer.name}
                        onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editCustomer.email}
                        onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editCustomer.phone}
                        onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Textarea
                        id="edit-address"
                        value={editCustomer.address}
                        onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
                        placeholder="Enter customer address"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateCustomerMutation.isPending}>
                        {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* View Customer Dialog */}
              <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Customer Details</DialogTitle>
                  </DialogHeader>
                  {selectedCustomer && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Customer ID</Label>
                          <p className="text-sm">{selectedCustomer.id}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Name</Label>
                          <p className="text-sm font-semibold">{selectedCustomer.name}</p>
                        </div>
                      </div>
                      
                      {selectedCustomer.email && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <p className="text-sm">{selectedCustomer.email}</p>
                        </div>
                      )}
                      
                      {selectedCustomer.phone && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Phone</Label>
                          <p className="text-sm">{selectedCustomer.phone}</p>
                        </div>
                      )}
                      
                      {selectedCustomer.address && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Address</Label>
                          <p className="text-sm">{selectedCustomer.address}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Total Orders</Label>
                          <p className="text-sm">0</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Registration Date</Label>
                          <p className="text-sm">{selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                          Close
                        </Button>
                        <Button onClick={() => {
                          setShowViewDialog(false);
                          handleEditClick(selectedCustomer);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Customer
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
          {/* Bulk Actions */}
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all-customers"
                />
                <span className="text-sm text-gray-600">
                  {selectedCustomers.length > 0 
                    ? `${selectedCustomers.length} of ${filteredCustomers.length} customers selected` 
                    : `Select all ${filteredCustomers.length} customers`
                  }
                </span>
              </div>
              
              {selectedCustomers.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  data-testid="button-delete-selected-customers"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedCustomers.length})
                </Button>
              )}
            </div>
          )}

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
            ) : filteredCustomers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <Users className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first customer"}
                </p>
                <Button 
                  className="bg-primary-500 text-white hover:bg-primary-600"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            ) : (
              filteredCustomers.map((customer: any) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => handleSelectCustomer(customer.id)}
                          data-testid={`checkbox-customer-${customer.id}`}
                        />
                        <div>
                          <CardTitle className="text-lg">{customer.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs w-fit">
                            Customer ID: {customer.id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customer.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      
                      {customer.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      
                      {customer.address && (
                        <div className="flex items-start space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <span className="line-clamp-2">{customer.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Total Orders: 0
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(customer)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(customer)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteCustomer(customer)}>
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete {selectedCustomers.length} selected customer{selectedCustomers.length > 1 ? 's' : ''}?
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={bulkDeleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-bulk-delete-customers"
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Customers'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}