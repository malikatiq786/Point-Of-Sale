import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

export default function Brands() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch brands
  const { data: brands = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/brands'],
  });

  // Create brand mutation
  const createBrandMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create brand');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Brand created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create brand", variant: "destructive" });
    },
  });

  // Update brand mutation
  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, ...data }: BrandFormData & { id: number }) => {
      const response = await fetch(`/api/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update brand');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      setEditingBrand(null);
      form.reset();
      toast({ title: "Success", description: "Brand updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update brand", variant: "destructive" });
    },
  });

  // Delete brand mutation
  const deleteBrandMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete brand');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      toast({ title: "Success", description: "Brand deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete brand", variant: "destructive" });
    },
  });

  const onSubmit = (data: BrandFormData) => {
    if (editingBrand) {
      updateBrandMutation.mutate({ ...data, id: editingBrand.id });
    } else {
      createBrandMutation.mutate(data);
    }
  };

  const handleEdit = (brand: any) => {
    setEditingBrand(brand);
    form.reset({
      name: brand.name,
      description: brand.description || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      deleteBrandMutation.mutate(id);
    }
  };

  const filteredBrands = brands.filter((brand: any) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
        <p className="text-gray-600">Manage product brands and manufacturers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <Dialog open={isAddDialogOpen || !!editingBrand} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingBrand(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Brand
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter brand name" {...field} />
                      </FormControl>
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
                        <Input placeholder="Enter brand description" {...field} />
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
                      setEditingBrand(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                  >
                    {editingBrand ? 'Update' : 'Create'} Brand
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
          {filteredBrands.map((brand: any) => (
            <Card key={brand.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      {brand.description && (
                        <p className="text-sm text-gray-500 mt-1">{brand.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(brand)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(brand.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Brand ID: {brand.id}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    Active
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredBrands.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No brands match your search criteria.' : 'Get started by adding your first brand.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Brand
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}