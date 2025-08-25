import { useState } from "react";
import * as React from "react";
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
import { Settings as SettingsIcon, Store, Users, Bell, Shield, Database, Palette, DollarSign, Plus, Edit, Trash2, Star } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [isAddCurrencyDialogOpen, setIsAddCurrencyDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    systemCurrency: ""
  });

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
  const { data: currencies = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/currencies"],
  });

  // Fetch system settings
  const { data: systemSettings } = useQuery({
    queryKey: ['/api/settings/system_currency'],
  });

  // Update generalSettings when systemSettings loads
  React.useEffect(() => {
    if (systemSettings?.data?.value) {
      setGeneralSettings(prev => ({
        ...prev, 
        systemCurrency: systemSettings.data.value
      }));
    }
  }, [systemSettings?.data?.value]);

  // Create currency mutation
  const createCurrencyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create currency');
      return response.json();
    },
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
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/currencies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update currency');
      return response.json();
    },
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
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/currencies/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete currency');
      return response.json();
    },
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

  // Update system currency mutation
  const updateSystemCurrencyMutation = useMutation({
    mutationFn: async (currencyId: string) => {
      const response = await apiRequest(`/api/settings/system_currency`, {
        method: 'PUT',
        body: JSON.stringify({ value: currencyId })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/system_currency'] });
      queryClient.invalidateQueries({ queryKey: ['/api/currencies'] });
      toast({
        title: "Success",
        description: "System currency updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update system currency",
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

  // Handle general settings save
  const handleSaveGeneralSettings = () => {
    if (generalSettings.systemCurrency) {
      updateSystemCurrencyMutation.mutate(generalSettings.systemCurrency);
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
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your system preferences and configurations</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Business
              </TabsTrigger>
              <TabsTrigger value="currencies" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currencies
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
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
                      <Input 
                        id="timezone" 
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={generalSettings.systemCurrency}
                        onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, systemCurrency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency..." />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id.toString()}>
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Input 
                      id="dateFormat" 
                      value={generalSettings.dateFormat}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    />
                  </div>

                  <Button onClick={handleSaveGeneralSettings} disabled={updateSystemCurrencyMutation.isPending}>
                    {updateSystemCurrencyMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
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

                  <Button>Save Business Info</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Currencies Tab */}
            <TabsContent value="currencies" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Currency Management</h3>
                  <p className="text-gray-600">Manage currencies and exchange rates</p>
                </div>
                <Dialog open={isAddCurrencyDialogOpen} onOpenChange={setIsAddCurrencyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingCurrency(null);
                      resetCurrencyForm();
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Currency
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCurrency ? "Edit Currency" : "Add New Currency"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCurrency} className="space-y-4">
                      <div>
                        <Label htmlFor="code">Currency Code *</Label>
                        <Input
                          id="code"
                          value={currencyForm.code}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
                          placeholder="USD"
                          maxLength={10}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Currency Name *</Label>
                        <Input
                          id="name"
                          value={currencyForm.name}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                          placeholder="US Dollar"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="symbol">Symbol *</Label>
                        <Input
                          id="symbol"
                          value={currencyForm.symbol}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                          placeholder="$"
                          maxLength={10}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="exchangeRate">Exchange Rate</Label>
                        <Input
                          id="exchangeRate"
                          type="number"
                          step="0.000001"
                          value={currencyForm.exchangeRate}
                          onChange={(e) => setCurrencyForm({ ...currencyForm, exchangeRate: e.target.value })}
                          placeholder="1.000000"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={currencyForm.isActive}
                          onCheckedChange={(checked) => setCurrencyForm({ ...currencyForm, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isDefault"
                          checked={currencyForm.isDefault}
                          onCheckedChange={(checked) => setCurrencyForm({ ...currencyForm, isDefault: checked })}
                        />
                        <Label htmlFor="isDefault">Default Currency</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}>
                          {editingCurrency ? "Update Currency" : "Add Currency"}
                        </Button>
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
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  {currencies.length > 0 ? (
                    <div className="divide-y">
                      {currencies.map((currency: any) => (
                        <div key={currency.id} className="flex items-center justify-between p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{currency.code}</h4>
                                <Badge variant={currency.isActive ? "default" : "secondary"}>
                                  {currency.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {currency.isDefault && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    <Star className="h-3 w-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{currency.name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-500">Symbol: {currency.symbol}</span>
                                <span className="text-sm text-gray-500">Rate: {currency.exchangeRate}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCurrency(currency)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this currency?")) {
                                  deleteCurrencyMutation.mutate(currency.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No currencies found</h3>
                      <p className="text-gray-600 mb-4">Get started by adding your first currency.</p>
                      <Button onClick={() => setIsAddCurrencyDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Currency
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-gray-600">Receive notifications for important events</p>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Get email alerts for sales, inventory, etc.</p>
                    </div>
                    <Switch />
                  </div>

                  <Button>Save Notification Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security & Backup</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Automatic Backup</h4>
                      <p className="text-sm text-gray-600">Automatically backup data daily</p>
                    </div>
                    <Switch
                      checked={autoBackup}
                      onCheckedChange={setAutoBackup}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backupTime">Backup Time</Label>
                    <Input id="backupTime" type="time" defaultValue="02:00" />
                  </div>

                  <Button>Save Security Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}