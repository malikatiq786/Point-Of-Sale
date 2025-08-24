import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Tags, Eye, CheckCircle, Info, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categorySchema, CategoryFormData } from "@/features/categories/validations";

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showDeletableDialog, setShowDeletableDialog] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: undefined,
    },
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Query for deletable categories
  const { data: deletableData, isLoading: isLoadingDeletable, refetch: refetchDeletable } = useQuery({
    queryKey: ["/api/categories/deletable"],
    enabled: false, // Only fetch when requested
    retry: false,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to create category";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: CategoryFormData & { id: number }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      form.reset();
      toast({ title: "Success", description: "Category updated successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to update category";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to delete category";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ ...data, id: editingCategory.id });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || undefined,
    });
  };

  const handleView = (category: any) => {
    setViewingCategory(category);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleCheckDeletable = async () => {
    setShowDeletableDialog(true);
    await refetchDeletable();
  };

  // Helper functions for hierarchy
  const buildCategoryHierarchy = (categories: any[]) => {
    const categoryMap = new Map();
    const rootCategories: any[] = [];
    
    // First, create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });
    
    // Then, build the hierarchy
    categories.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        } else {
          // Parent doesn't exist, treat as root
          rootCategories.push(categoryMap.get(category.id));
        }
      } else {
        rootCategories.push(categoryMap.get(category.id));
      }
    });
    
    return rootCategories;
  };

  const flattenHierarchy = (hierarchicalCategories: any[], level = 0): any[] => {
    const result: any[] = [];
    
    hierarchicalCategories.forEach(category => {
      result.push({ ...category, level });
      if (category.children && category.children.length > 0) {
        result.push(...flattenHierarchy(category.children, level + 1));
      }
    });
    
    return result;
  };

  const getParentPath = (categoryId: number, categories: any[]): string => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || !category.parentId) return '';
    
    const parent = categories.find(cat => cat.id === category.parentId);
    if (!parent) return '';
    
    const parentPath = getParentPath(parent.id, categories);
    return parentPath ? `${parentPath} > ${parent.name}` : parent.name;
  };

  const hierarchicalCategories = buildCategoryHierarchy(categories as any[]);
  const flatCategories = flattenHierarchy(hierarchicalCategories);
  
  const filteredCategories = flatCategories.filter((category: any) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600">Organize your products with categories</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen || !!editingCategory} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingCategory(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category name" {...field} />
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
                          <Input placeholder="Enter category description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Root Category)</SelectItem>
                            {(categories as any[])
                              .filter((category: any) => 
                                // Don't show the category being edited as a potential parent (prevent circular reference)
                                !editingCategory || category.id !== editingCategory.id
                              )
                              .map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
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
                        setEditingCategory(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {editingCategory ? 'Update' : 'Create'} Category
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={handleCheckDeletable}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Check Deletable
          </Button>
        </div>
      </div>

      {/* Deletable Categories Dialog */}
      <Dialog open={showDeletableDialog} onOpenChange={setShowDeletableDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Categories Safe to Delete
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingDeletable ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Checking categories...</p>
              </div>
            ) : deletableData ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-semibold text-blue-700">Total Categories</p>
                    <p className="text-2xl font-bold text-blue-800">{(deletableData as any)?.totalCategories || 0}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="font-semibold text-red-700">Categories in Use</p>
                    <p className="text-2xl font-bold text-red-800">{(deletableData as any)?.categoriesInUse || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="font-semibold text-green-700">Safe to Delete</p>
                    <p className="text-2xl font-bold text-green-800">{(deletableData as any)?.deletableCount || 0}</p>
                  </div>
                </div>
                
                {(deletableData as any)?.deletableCategories?.length > 0 ? (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-700">Categories you can safely delete:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(deletableData as any).deletableCategories.map((category: any) => (
                        <div key={category.id} className="flex items-center justify-between p-3 bg-green-50 rounded border">
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              setShowDeletableDialog(false);
                              handleDelete(category.id);
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-600">All categories are currently being used by products.</p>
                    <p className="text-sm text-gray-500 mt-1">You need to remove or change the category of products before deleting any category.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No data available</p>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowDeletableDialog(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Tags className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 text-center mb-6">
              {searchQuery ? "Try adjusting your search terms" : "Get started by creating your first category"}
            </p>
            <Button 
              className="bg-primary-500 text-white hover:bg-primary-600"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          filteredCategories.map((category: any) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center">
                  {/* Hierarchy indentation */}
                  {category.level > 0 && (
                    <div className="flex items-center mr-2 text-gray-400">
                      {Array.from({ length: category.level }).map((_, i) => (
                        <ChevronRight key={i} className="w-3 h-3" />
                      ))}
                    </div>
                  )}
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                {/* Show parent path */}
                {category.parentId && (
                  <div className="text-xs text-gray-500 mt-1">
                    {getParentPath(category.id, categories as any[])} &gt; <span className="font-medium">{category.name}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-20 bg-gray-100 rounded-lg mb-4">
                  <Tags className="w-8 h-8 text-gray-400" />
                </div>
                
                {/* Show description if available */}
                {category.description && (
                  <div className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                    {category.description}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    ID: {category.id} {category.level > 0 && <span className="text-xs">• Level {category.level + 1}</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleView(category)}
                      data-testid={`button-view-${category.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Category Dialog */}
      <Dialog open={!!viewingCategory} onOpenChange={(open) => {
        if (!open) {
          setViewingCategory(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Category Details
            </DialogTitle>
          </DialogHeader>
          
          {viewingCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category ID</label>
                  <p className="text-lg font-semibold">{viewingCategory.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category Name</label>
                  <p className="text-lg font-semibold">{viewingCategory.name}</p>
                </div>
              </div>
              
              {viewingCategory.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-lg">{viewingCategory.description}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Parent Category</label>
                <p className="text-lg">
                  {viewingCategory.parentId ? 
                    (categories as any[]).find((cat: any) => cat.id === viewingCategory.parentId)?.name || 'Unknown' 
                    : 'None (Root Category)'
                  }
                </p>
                {viewingCategory.parentId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Full path: {getParentPath(viewingCategory.id, categories as any[])} &gt; {viewingCategory.name}
                  </p>
                )}
              </div>

              {/* Show child categories */}
              {(() => {
                const children = (categories as any[]).filter((cat: any) => cat.parentId === viewingCategory.id);
                return children.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Child Categories ({children.length})</label>
                    <div className="mt-2 space-y-1">
                      {children.map((child: any) => (
                        <div key={child.id} className="flex items-center p-2 bg-gray-50 rounded">
                          <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium">{child.name}</span>
                          {child.description && (
                            <span className="text-sm text-gray-500 ml-2">• {child.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-center pt-4">
                <div className="flex items-center justify-center h-20 w-20 bg-gray-100 rounded-lg">
                  <Tags className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingCategory(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewingCategory(null);
                  handleEdit(viewingCategory);
                }} className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Category
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}