import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Save } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function EditProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Extract product ID from URL path (/products/edit/:id)
  const productId = location.split('/').pop();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    barcode: "",
    categoryId: "none",
    brandId: "none",
    unitId: "none",
    price: "",
    stock: "",
    lowStockAlert: "",
    image: ""
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Fetch brands
  const { data: brands = [] } = useQuery<any[]>({
    queryKey: ["/api/brands"],
    retry: false,
  });

  // Fetch units
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["/api/units"],
    retry: false,
  });

  // Fetch existing product data
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery<any>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
    retry: false,
  });

  // Update form data when product is loaded
  useEffect(() => {
    if (existingProduct) {
      setFormData({
        name: existingProduct.name || "",
        description: existingProduct.description || "",
        barcode: existingProduct.barcode || "",
        categoryId: existingProduct.categoryId ? existingProduct.categoryId.toString() : "none",
        brandId: existingProduct.brandId ? existingProduct.brandId.toString() : "none",
        unitId: existingProduct.unitId ? existingProduct.unitId.toString() : "none",
        price: existingProduct.price?.toString() || "",
        stock: existingProduct.stock?.toString() || "",
        lowStockAlert: existingProduct.lowStockAlert?.toString() || "",
        image: existingProduct.image || ""
      });
    }
  }, [existingProduct]);

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/products/${productId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['products-'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      // Redirect back to products page
      setLocation('/products');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.brandId || formData.brandId === "none") {
      toast({
        title: "Validation Error",
        description: "Brand is required",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...formData,
      categoryId: formData.categoryId && formData.categoryId !== "none" ? parseInt(formData.categoryId) : null,
      brandId: formData.brandId && formData.brandId !== "none" ? parseInt(formData.brandId) : null,
      unitId: formData.unitId && formData.unitId !== "none" ? parseInt(formData.unitId) : null,
      price: formData.price ? parseFloat(formData.price) : 0,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      lowStockAlert: formData.lowStockAlert ? parseInt(formData.lowStockAlert) : 0,
    };

    updateProductMutation.mutate(productData);
  };

  if (isLoadingProduct) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!existingProduct) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Product not found</p>
            <Link href="/products">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update product information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Enter barcode"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => handleInputChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label htmlFor="brandId">Brand *</Label>
                <Select 
                  value={formData.brandId} 
                  onValueChange={(value) => handleInputChange('brandId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand: any) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit</Label>
                <Select 
                  value={formData.unitId} 
                  onValueChange={(value) => handleInputChange('unitId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Unit</SelectItem>
                    {units.map((unit: any) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name} ({unit.shortName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Low Stock Alert */}
              <div className="space-y-2">
                <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                <Input
                  id="lowStockAlert"
                  type="number"
                  min="0"
                  value={formData.lowStockAlert}
                  onChange={(e) => handleInputChange('lowStockAlert', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="Enter image URL"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/products">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateProductMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </AppLayout>
  );
}