import { useState } from "react";
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
import { Settings as SettingsIcon, Store, Users, Bell, Shield, Database, Palette, DollarSign, Plus, Edit, Trash2, Star } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [isAddCurrencyDialogOpen, setIsAddCurrencyDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Currency form state
  const [currencyForm, setCurrencyForm] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRate: "1.000000",
    isActive: true,
    isDefault: false
  });

  // Fetch currencies
  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ["/api/currencies"],
  });

  // Create currency mutation
  const createCurrencyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/currencies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsAddCurrencyDialogOpen(false);
      resetCurrencyForm();
      toast({
        title: "Success",
        description: "Currency created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create currency",
        variant: "destructive",
      });
    },
  });

  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/currencies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setEditingCurrency(null);
      resetCurrencyForm();
      toast({
        title: "Success",
        description: "Currency updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update currency",
        variant: "destructive",
      });
    },
  });

  // Delete currency mutation
  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/currencies/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Success",
        description: "Currency deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete currency",
        variant: "destructive",
      });
    },
  });

  const resetCurrencyForm = () => {
    setCurrencyForm({
      code: "",
      name: "",
      symbol: "",
      exchangeRate: "1.000000",
      isActive: true,
      isDefault: false
    });
  };

  const handleEditCurrency = (currency: any) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate.toString(),
      isActive: currency.isActive,
      isDefault: currency.isDefault
    });
  };

  const handleSubmitCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currencyForm.code || !currencyForm.name || !currencyForm.symbol) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingCurrency) {
      updateCurrencyMutation.mutate({
        id: editingCurrency.id,
        data: currencyForm
      });
    } else {
      createCurrencyMutation.mutate(currencyForm);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Configure your system preferences</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="currencies">Currencies</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="w-5 h-5" />
                    <span>General Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" defaultValue="UTC" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input id="currency" defaultValue="USD" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Input id="dateFormat" defaultValue="MM/DD/YYYY" />
                  </div>

                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="w-5 h-5" />
                    <span>Business Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" placeholder="Your Business Name" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input id="ownerName" placeholder="Owner Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Phone</Label>
                      <Input id="businessPhone" placeholder="Business Phone" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Email</Label>
                    <Input id="businessEmail" type="email" placeholder="business@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Address</Label>
                    <Input id="businessAddress" placeholder="Business Address" />
                  </div>

                  <Button>Update Business Info</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="currencies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Currency Management
                    </div>
                    <Dialog open={isAddCurrencyDialogOpen} onOpenChange={setIsAddCurrencyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          resetCurrencyForm();
                          setEditingCurrency(null);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Currency
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingCurrency ? "Edit Currency" : "Add New Currency"}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitCurrency} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="currency-code">Code *</Label>
                              <Input
                                id="currency-code"
                                placeholder="USD, EUR, PKR"
                                value={currencyForm.code}
                                onChange={(e) => setCurrencyForm(prev => ({ 
                                  ...prev, 
                                  code: e.target.value.toUpperCase() 
                                }))}
                                maxLength={3}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="currency-symbol">Symbol *</Label>
                              <Input
                                id="currency-symbol"
                                placeholder="$, €, Rs"
                                value={currencyForm.symbol}
                                onChange={(e) => setCurrencyForm(prev => ({ 
                                  ...prev, 
                                  symbol: e.target.value 
                                }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currency-name">Name *</Label>
                            <Input
                              id="currency-name"
                              placeholder="US Dollar, Euro, Pakistani Rupee"
                              value={currencyForm.name}
                              onChange={(e) => setCurrencyForm(prev => ({ 
                                ...prev, 
                                name: e.target.value 
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="exchange-rate">Exchange Rate</Label>
                            <Input
                              id="exchange-rate"
                              type="number"
                              step="0.000001"
                              placeholder="1.000000"
                              value={currencyForm.exchangeRate}
                              onChange={(e) => setCurrencyForm(prev => ({ 
                                ...prev, 
                                exchangeRate: e.target.value 
                              }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="currency-active"
                                checked={currencyForm.isActive}
                                onCheckedChange={(checked) => setCurrencyForm(prev => ({ 
                                  ...prev, 
                                  isActive: checked 
                                }))}
                              />
                              <Label htmlFor="currency-active">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="currency-default"
                                checked={currencyForm.isDefault}
                                onCheckedChange={(checked) => setCurrencyForm(prev => ({ 
                                  ...prev, 
                                  isDefault: checked 
                                }))}
                              />
                              <Label htmlFor="currency-default">Default</Label>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsAddCurrencyDialogOpen(false);
                                setEditingCurrency(null);
                                resetCurrencyForm();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}
                            >
                              {editingCurrency ? "Update" : "Create"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading currencies...</div>
                  ) : currencies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No currencies configured yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currencies.map((currency: any) => (
                        <div
                          key={currency.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl font-mono">{currency.symbol}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {currency.code} - {currency.name}
                                </span>
                                {currency.isDefault && (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    Default
                                  </Badge>
                                )}
                                {!currency.isActive && (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                Exchange Rate: {currency.exchangeRate}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleEditCurrency(currency);
                                setIsAddCurrencyDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!currency.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteCurrencyMutation.mutate(currency.id)}
                                disabled={deleteCurrencyMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>User Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Default User Role</h3>
                      <p className="text-sm text-gray-500">Role assigned to new users</p>
                    </div>
                    <Input className="w-32" defaultValue="Cashier" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Auto-approve Users</h3>
                      <p className="text-sm text-gray-500">Automatically approve new user registrations</p>
                    </div>
                    <Switch />
                  </div>

                  <Button>Save User Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Enable Notifications</h3>
                      <p className="text-sm text-gray-500">Receive system notifications</p>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Low Stock Alerts</h3>
                      <p className="text-sm text-gray-500">Alert when products are running low</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Daily Sales Report</h3>
                      <p className="text-sm text-gray-500">Email daily sales summary</p>
                    </div>
                    <Switch />
                  </div>

                  <Button>Save Notification Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add extra security to your account</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="30" className="w-32" />
                  </div>

                  <Button>Update Security Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>System Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Auto Backup</h3>
                      <p className="text-sm text-gray-500">Automatically backup data daily</p>
                    </div>
                    <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backupTime">Backup Time</Label>
                    <Input id="backupTime" type="time" defaultValue="02:00" className="w-32" />
                  </div>

                  <div className="flex space-x-4">
                    <Button>Backup Now</Button>
                    <Button variant="outline">View Backup History</Button>
                  </div>

                  <Button>Save System Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}