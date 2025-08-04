import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Globe, ShoppingCart, Plus, Edit, Trash2, Star, UserCheck, Package, Car, Bike, Truck } from "lucide-react";

export default function RestaurantManagement() {
  const { user } = useAuth();
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(false);
  const [isAddRiderDialogOpen, setIsAddRiderDialogOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Rider form state
  const [riderForm, setRiderForm] = useState({
    name: "",
    phone: "",
    email: "",
    licenseNumber: "",
    vehicleType: "bike",
    vehicleNumber: "",
    isActive: true
  });

  // Fetch online ordering status
  const { data: onlineOrderingStatus } = useQuery<any>({
    queryKey: ["/api/admin/online-ordering-status"],
  });

  useEffect(() => {
    if (onlineOrderingStatus) {
      setOnlineOrderingEnabled(onlineOrderingStatus.enabled || false);
    }
  }, [onlineOrderingStatus]);

  // Fetch online customers
  const { data: onlineCustomers = [] } = useQuery<any[]>({
    queryKey: ["/api/online/customers"],
  });

  // Fetch online orders
  const { data: onlineOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/online/orders"],
  });

  // Fetch delivery riders
  const { data: deliveryRiders = [] } = useQuery<any[]>({
    queryKey: ["/api/delivery-riders"],
  });

  // Toggle online ordering mutation
  const toggleOnlineOrderingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch("/api/admin/toggle-online-ordering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle online ordering');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/online-ordering-status"] });
      setOnlineOrderingEnabled(data.enabled);
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle online ordering",
        variant: "destructive",
      });
    },
  });

  // Create rider mutation
  const createRiderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/delivery-riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create rider');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-riders"] });
      setIsAddRiderDialogOpen(false);
      resetRiderForm();
      toast({
        title: "Success",
        description: "Delivery rider created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create delivery rider",
        variant: "destructive",
      });
    },
  });

  // Update rider mutation
  const updateRiderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/delivery-riders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update rider');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-riders"] });
      setEditingRider(null);
      resetRiderForm();
      toast({
        title: "Success",
        description: "Delivery rider updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery rider",
        variant: "destructive",
      });
    },
  });

  // Delete rider mutation
  const deleteRiderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/delivery-riders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete rider');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-riders"] });
      toast({
        title: "Success",
        description: "Delivery rider deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete delivery rider",
        variant: "destructive",
      });
    },
  });

  const resetRiderForm = () => {
    setRiderForm({
      name: "",
      phone: "",
      email: "",
      licenseNumber: "",
      vehicleType: "bike",
      vehicleNumber: "",
      isActive: true
    });
  };

  const handleEditRider = (rider: any) => {
    setEditingRider(rider);
    setRiderForm({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || "",
      licenseNumber: rider.licenseNumber || "",
      vehicleType: rider.vehicleType || "bike",
      vehicleNumber: rider.vehicleNumber || "",
      isActive: rider.isActive
    });
    setIsAddRiderDialogOpen(true);
  };

  const handleSubmitRider = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!riderForm.name || !riderForm.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingRider) {
      updateRiderMutation.mutate({
        id: editingRider.id,
        data: riderForm
      });
    } else {
      createRiderMutation.mutate(riderForm);
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'bike': return Bike;
      case 'car': return Car;
      case 'truck': return Truck;
      default: return Bike;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
              <p className="text-gray-600">Manage online orders and delivery operations</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="online" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="online" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Online Orders
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Delivery
              </TabsTrigger>
            </TabsList>

            {/* Online Orders Tab */}
            <TabsContent value="online" className="space-y-6">
              {/* Online Ordering Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Online Ordering System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enable Online Ordering</h4>
                      <p className="text-sm text-gray-600">Allow customers to place orders through your online platform</p>
                    </div>
                    <Switch
                      checked={onlineOrderingEnabled}
                      onCheckedChange={(checked) => {
                        toggleOnlineOrderingMutation.mutate(checked);
                      }}
                    />
                  </div>
                  {onlineOrderingEnabled && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">Online ordering is active!</p>
                      <p className="text-green-700 text-sm">Customers can now place orders through your website.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Online Orders Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Online Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary-600">{onlineOrders.length}</div>
                    <p className="text-gray-600">Total orders received</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Online Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary-600">{onlineCustomers.length}</div>
                    <p className="text-gray-600">Registered customers</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Online Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Online Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {onlineOrders.length > 0 ? (
                    <div className="space-y-4">
                      {onlineOrders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-600">{order.customerName || order.customer?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${order.totalAmount}</p>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No online orders yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="space-y-6">
              {/* Add Rider Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Delivery Riders</h3>
                  <p className="text-gray-600">Manage your delivery team</p>
                </div>
                <Dialog open={isAddRiderDialogOpen} onOpenChange={setIsAddRiderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingRider(null);
                      resetRiderForm();
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rider
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingRider ? "Edit Delivery Rider" : "Add New Delivery Rider"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitRider} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={riderForm.name}
                          onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={riderForm.phone}
                          onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={riderForm.email}
                          onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="license">License Number</Label>
                        <Input
                          id="license"
                          value={riderForm.licenseNumber}
                          onChange={(e) => setRiderForm({ ...riderForm, licenseNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Select
                          value={riderForm.vehicleType}
                          onValueChange={(value) => setRiderForm({ ...riderForm, vehicleType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bike">Bike</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="truck">Truck</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                        <Input
                          id="vehicleNumber"
                          value={riderForm.vehicleNumber}
                          onChange={(e) => setRiderForm({ ...riderForm, vehicleNumber: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={riderForm.isActive}
                          onCheckedChange={(checked) => setRiderForm({ ...riderForm, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={createRiderMutation.isPending || updateRiderMutation.isPending}>
                          {editingRider ? "Update Rider" : "Add Rider"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddRiderDialogOpen(false);
                            setEditingRider(null);
                            resetRiderForm();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Delivery Riders List */}
              <Card>
                <CardContent className="p-0">
                  {deliveryRiders.length > 0 ? (
                    <div className="divide-y">
                      {deliveryRiders.map((rider: any) => {
                        const VehicleIcon = getVehicleIcon(rider.vehicleType);
                        return (
                          <div key={rider.id} className="flex items-center justify-between p-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <VehicleIcon className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{rider.name}</h4>
                                  <Badge variant={rider.isActive ? "default" : "secondary"}>
                                    {rider.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{rider.phone}</p>
                                {rider.email && <p className="text-sm text-gray-600">{rider.email}</p>}
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-sm text-gray-500 capitalize">{rider.vehicleType}</span>
                                  {rider.vehicleNumber && (
                                    <span className="text-sm text-gray-500">{rider.vehicleNumber}</span>
                                  )}
                                  {rider.licenseNumber && (
                                    <span className="text-sm text-gray-500">License: {rider.licenseNumber}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRider(rider)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this rider?")) {
                                    deleteRiderMutation.mutate(rider.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery riders</h3>
                      <p className="text-gray-600 mb-4">Get started by adding your first delivery rider.</p>
                      <Button onClick={() => setIsAddRiderDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Rider
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}