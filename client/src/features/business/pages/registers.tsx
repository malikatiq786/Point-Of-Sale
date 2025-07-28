import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Edit, Trash2, ShoppingCart, DollarSign, Clock, Store, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(1, "Register name is required"),
  code: z.string().min(1, "Register code is required"),
  branchId: z.number().min(1, "Branch selection is required"),
  isActive: z.boolean(),
  openingBalance: z.number().min(0, "Opening balance must be positive"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Registers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      code: "",
      branchId: 0,
      isActive: true,
      openingBalance: 0,
    },
  });

  // Fetch branches for dropdown
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
  });

  // Fetch registers
  const { data: registers = [], isLoading } = useQuery({
    queryKey: ['/api/registers'],
  });

  // Create register mutation
  const createRegisterMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await fetch('/api/registers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create register');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registers'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Register created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create register", variant: "destructive" });
    },
  });

  // Update register mutation
  const updateRegisterMutation = useMutation({
    mutationFn: async ({ id, ...data }: RegisterFormData & { id: number }) => {
      const response = await fetch(`/api/registers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update register');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registers'] });
      setEditingRegister(null);
      form.reset();
      toast({ title: "Success", description: "Register updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update register", variant: "destructive" });
    },
  });

  // Delete register mutation
  const deleteRegisterMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/registers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete register');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registers'] });
      toast({ title: "Success", description: "Register deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete register", variant: "destructive" });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    if (editingRegister) {
      updateRegisterMutation.mutate({ ...data, id: editingRegister.id });
    } else {
      createRegisterMutation.mutate(data);
    }
  };

  const handleEdit = (register: any) => {
    setEditingRegister(register);
    form.reset({
      name: register.name,
      code: register.code,
      branchId: register.branchId,
      isActive: register.isActive,
      openingBalance: register.openingBalance,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this register?')) {
      deleteRegisterMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const filteredRegisters = registers.filter((register: any) =>
    register.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    register.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    register.branchName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Register Management</h1>
        <p className="text-gray-600">Manage POS registers and cash drawers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search registers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <Dialog open={isAddDialogOpen || !!editingRegister} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingRegister(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Register
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRegister ? 'Edit Register' : 'Add New Register'}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Register Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Register 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Register Code</FormLabel>
                        <FormControl>
                          <Input placeholder="REG001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch: any) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="openingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Balance</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this register for transactions
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingRegister(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRegisterMutation.isPending || updateRegisterMutation.isPending}
                  >
                    {editingRegister ? 'Update' : 'Create'} Register
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegisters.map((register: any) => (
            <Card key={register.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${register.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <ShoppingCart className={`w-5 h-5 ${register.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{register.name}</CardTitle>
                      <p className="text-sm text-gray-500">Code: {register.code}</p>
                      <p className="text-xs text-gray-400">{register.branchName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={register.isActive ? "default" : "secondary"}>
                      {register.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(register)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(register.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-4 h-4 mx-auto text-green-600 mb-1" />
                    <p className="text-xs text-gray-500">Current Balance</p>
                    <p className="font-semibold text-green-600">{formatCurrency(register.currentBalance)}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                    <p className="text-xs text-gray-500">Opening Balance</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(register.openingBalance)}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Last Opened:</span>
                    <span className="text-gray-700">{formatDateTime(register.lastOpened)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Last Closed:</span>
                    <span className="text-gray-700">{formatDateTime(register.lastClosed)}</span>
                  </div>
                </div>

                {register.isActive && (
                  <div className="pt-2 border-t">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Power className="w-3 h-3 mr-1" />
                        Open
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <PowerOff className="w-3 h-3 mr-1" />
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredRegisters.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No registers found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No registers match your search criteria.' : 'Get started by adding your first register.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Register
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}