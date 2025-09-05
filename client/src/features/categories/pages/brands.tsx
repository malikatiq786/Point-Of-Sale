import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Edit, Trash2, Package, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

export default function Brands() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create brand');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Brand created successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to create brand";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update brand');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      setEditingBrand(null);
      form.reset();
      toast({ title: "Success", description: "Brand updated successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to update brand";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Delete brand mutation
  const deleteBrandMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete brand');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      toast({ title: "Success", description: "Brand deleted successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to delete brand";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (brandIds: number[]) => {
      console.log('Frontend: Sending bulk delete with brandIds:', brandIds);
      console.log('Frontend: BrandIds types:', brandIds.map(id => ({ id, type: typeof id })));
      
      const response = await fetch('/api/brands/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandIds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete brands');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      setSelectedBrands([]);
      setShowBulkDeleteDialog(false);
      toast({
        title: "Success",
        description: `${data.deletedCount} brands deleted successfully`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to delete brands";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
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
      image: brand.image || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      deleteBrandMutation.mutate(id);
    }
  };

  // Bulk selection handlers
  const handleSelectBrand = (brandId: number) => {
    console.log('Frontend: Selecting brand with ID:', brandId, 'Type:', typeof brandId);
    setSelectedBrands(prev => {
      const newSelection = prev.includes(brandId) 
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId];
      console.log('Frontend: Updated selectedBrands:', newSelection);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedBrands.length === filteredBrands.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(filteredBrands.map((brand: any) => brand.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedBrands.length > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = () => {
    console.log('Frontend: About to delete brands. selectedBrands:', selectedBrands);
    console.log('Frontend: selectedBrands types:', selectedBrands.map(id => ({ id, type: typeof id, isNaN: isNaN(id) })));
    
    // Filter out any invalid IDs
    const validIds = selectedBrands.filter(id => typeof id === 'number' && !isNaN(id) && id > 0);
    console.log('Frontend: After filtering, valid IDs:', validIds);
    
    if (validIds.length !== selectedBrands.length) {
      console.warn('Frontend: Some invalid IDs were filtered out!');
    }
    
    bulkDeleteMutation.mutate(validIds);
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
        
        <div className="flex gap-2">
          {/* Select All Checkbox */}
          {filteredBrands.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedBrands.length === filteredBrands.length && filteredBrands.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All
              </label>
            </div>
          )}
          
          {/* Bulk Delete Button */}
          {selectedBrands.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-bulk-delete"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete Selected ({selectedBrands.length})
            </Button>
          )}

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
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center space-y-4">
                          {field.value && (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                              <img 
                                src={field.value}
                                alt="Brand image preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Image load error:', field.value);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', field.value);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => field.onChange('')}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs font-bold"
                                title="Remove image"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5485760}
                            buttonClassName="px-4 py-2"
                            onGetUploadParameters={async () => {
                              try {
                                console.log("Requesting upload URL...");
                                const response = await fetch('/api/objects/upload', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  credentials: 'include',
                                  body: JSON.stringify({})
                                });
                                
                                if (!response.ok) {
                                  throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                
                                const data = await response.json();
                                console.log("Upload URL response:", data);
                                
                                if (!data.uploadURL) {
                                  throw new Error('No upload URL received from server');
                                }
                                
                                return {
                                  method: 'PUT' as const,
                                  url: data.uploadURL
                                };
                              } catch (error) {
                                console.error("Failed to get upload URL:", error);
                                throw error;
                              }
                            }}
                            onComplete={(result: UploadResult) => {
                              console.log("Upload result:", result);
                              if (result.successful && result.successful.length > 0) {
                                const uploadURL = result.successful[0].uploadURL;
                                console.log("Original upload URL:", uploadURL);
                                
                                // Convert the upload URL to serving URL format
                                // Extract the object ID from the upload URL
                                const urlParts = uploadURL.split('/');
                                const uploadsIndex = urlParts.findIndex(part => part === 'uploads');
                                if (uploadsIndex !== -1 && uploadsIndex < urlParts.length - 1) {
                                  const objectId = urlParts[uploadsIndex + 1].split('?')[0];
                                  const servingURL = `/api/objects/uploads/${objectId}`;
                                  console.log("Serving URL:", servingURL);
                                  field.onChange(servingURL);
                                } else {
                                  // Fallback to original URL if parsing fails
                                  field.onChange(uploadURL);
                                }
                                
                                toast({
                                  title: "Success",
                                  description: "Image uploaded successfully",
                                });
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span>📁</span>
                              <span>Upload Image</span>
                            </div>
                          </ObjectUploader>
                        </div>
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
                    <Checkbox
                      checked={selectedBrands.includes(brand.id)}
                      onCheckedChange={() => handleSelectBrand(brand.id)}
                      data-testid={`checkbox-brand-${brand.id}`}
                    />
                    <div className="p-2 bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden">
                      {brand.image ? (
                        <img 
                          src={brand.image} 
                          alt={brand.name} 
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.classList.add('bg-blue-100');
                            if (e.target.parentElement?.querySelector('.fallback-icon')) {
                              (e.target.parentElement.querySelector('.fallback-icon') as HTMLElement).style.display = 'block';
                            }
                          }}
                        />
                      ) : null}
                      <Package 
                        className={`w-5 h-5 text-blue-600 fallback-icon ${brand.image ? 'hidden' : ''}`} 
                      />
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete {selectedBrands.length} selected brand{selectedBrands.length > 1 ? 's' : ''}?
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
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Brands'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}