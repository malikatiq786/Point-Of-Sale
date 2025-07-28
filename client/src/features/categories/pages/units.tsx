import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Edit, Trash2, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  symbol: z.string().min(1, "Unit symbol is required"),
  type: z.string().min(1, "Unit type is required"),
  description: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

export default function Units() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      symbol: "",
      type: "",
      description: "",
    },
  });

  // Mock units data (replace with actual API call)
  const { data: units = [], isLoading } = useQuery({
    queryKey: ['/api/units'],
    queryFn: () => Promise.resolve([
      { id: 1, name: "Kilogram", symbol: "kg", type: "weight", description: "Base unit of mass" },
      { id: 2, name: "Gram", symbol: "g", type: "weight", description: "Smaller unit of mass" },
      { id: 3, name: "Liter", symbol: "L", type: "volume", description: "Base unit of volume" },
      { id: 4, name: "Milliliter", symbol: "ml", type: "volume", description: "Smaller unit of volume" },
      { id: 5, name: "Piece", symbol: "pcs", type: "count", description: "Individual items" },
      { id: 6, name: "Box", symbol: "box", type: "packaging", description: "Packaged items" },
      { id: 7, name: "Meter", symbol: "m", type: "length", description: "Base unit of length" },
      { id: 8, name: "Centimeter", symbol: "cm", type: "length", description: "Smaller unit of length" },
    ]),
  });

  // Create unit mutation (mock)
  const createUnitMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      // Mock API call
      return Promise.resolve({ id: Date.now(), ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Unit created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create unit", variant: "destructive" });
    },
  });

  // Update unit mutation (mock)
  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, ...data }: UnitFormData & { id: number }) => {
      // Mock API call
      return Promise.resolve({ id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      setEditingUnit(null);
      form.reset();
      toast({ title: "Success", description: "Unit updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update unit", variant: "destructive" });
    },
  });

  // Delete unit mutation (mock)
  const deleteUnitMutation = useMutation({
    mutationFn: async (id: number) => {
      // Mock API call
      return Promise.resolve({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      toast({ title: "Success", description: "Unit deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete unit", variant: "destructive" });
    },
  });

  const onSubmit = (data: UnitFormData) => {
    if (editingUnit) {
      updateUnitMutation.mutate({ ...data, id: editingUnit.id });
    } else {
      createUnitMutation.mutate(data);
    }
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    form.reset({
      name: unit.name,
      symbol: unit.symbol,
      type: unit.type,
      description: unit.description || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      deleteUnitMutation.mutate(id);
    }
  };

  const getUnitTypeColor = (type: string) => {
    switch (type) {
      case 'weight': return 'bg-green-100 text-green-800';
      case 'volume': return 'bg-blue-100 text-blue-800';
      case 'count': return 'bg-purple-100 text-purple-800';
      case 'length': return 'bg-orange-100 text-orange-800';
      case 'packaging': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUnits = units.filter((unit: any) =>
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Unit Management</h1>
        <p className="text-gray-600">Manage measurement units for products</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <Dialog open={isAddDialogOpen || !!editingUnit} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingUnit(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unit name (e.g., Kilogram)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unit symbol (e.g., kg)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weight">Weight</SelectItem>
                          <SelectItem value="volume">Volume</SelectItem>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="length">Length</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unit description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingUnit(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createUnitMutation.isPending || updateUnitMutation.isPending}
                  >
                    {editingUnit ? 'Update' : 'Create'} Unit
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
          {filteredUnits.map((unit: any) => (
            <Card key={unit.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Scale className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{unit.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">Symbol: {unit.symbol}</p>
                      {unit.description && (
                        <p className="text-xs text-gray-400 mt-1">{unit.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(unit)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(unit.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${getUnitTypeColor(unit.type)}`}>
                    {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    ID: {unit.id}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredUnits.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Scale className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No units match your search criteria.' : 'Get started by adding your first unit.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}