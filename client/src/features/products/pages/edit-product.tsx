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
import { ArrowLeft, Package, Save, Plus, Minus, List, Warehouse } from "lucide-react";
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
    categoryId: "",
    brandId: "",
    unitId: "",
    stock: "",
    lowStockAlert: "",
    image: ""
  });

  const [variants, setVariants] = useState([
    { 
      variantName: "Default", 
      initialStock: "0",
      purchasePrice: "",
      salePrice: "",
      wholesalePrice: "",
      retailPrice: ""
    }
  ]);

  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [variantErrors, setVariantErrors] = useState<{ [key: number]: string }>({});

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["/api/brands"],
    retry: false,
  });

  // Fetch units
  const { data: units = [] } = useQuery({
    queryKey: ["/api/units"],
    retry: false,
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  // Fetch existing product data
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery<any>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
    retry: false,
  });

  // Fetch product variants
  const { data: existingVariants = [], isLoading: isLoadingVariants } = useQuery<any[]>({
    queryKey: [`/api/products/${productId}/variants`],
    enabled: !!productId,
    retry: false,
  });

  // Update form data when product data is loaded
  useEffect(() => {
    if (existingProduct && existingVariants.length > 0) {
      setFormData({
        name: existingProduct.name || "",
        description: existingProduct.description || "",
        barcode: existingProduct.barcode || "",
        categoryId: existingProduct.category?.id ? existingProduct.category.id.toString() : "",
        brandId: existingProduct.brand?.id ? existingProduct.brand.id.toString() : "",
        unitId: existingProduct.unit?.id ? existingProduct.unit.id.toString() : "",
        stock: existingProduct.stock?.toString() || "",
        lowStockAlert: existingProduct.lowStockAlert?.toString() || "",
        image: existingProduct.image || ""
      });

      // Set variants from existing data
      if (existingVariants.length > 0) {
        setVariants(existingVariants.map(variant => ({
          variantName: variant.variantName || "Default",
          initialStock: variant.stock?.toString() || "0",
          purchasePrice: variant.purchasePrice?.toString() || "",
          salePrice: variant.salePrice?.toString() || "",
          wholesalePrice: variant.wholesalePrice?.toString() || "",
          retailPrice: variant.retailPrice?.toString() || ""
        })));
      }
    }
  }, [existingProduct, existingVariants]);

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/products/${productId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stock'] });
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

  // Validate variant pricing
  const validateVariantPrices = (variant: any, index: number) => {
    const purchasePrice = parseFloat(variant.purchasePrice) || 0;
    const salePrice = parseFloat(variant.salePrice) || 0;
    const wholesalePrice = parseFloat(variant.wholesalePrice) || 0;
    const retailPrice = parseFloat(variant.retailPrice) || 0;
    
    let errorMessage = "";
    
    if (salePrice > 0 && purchasePrice > 0 && salePrice <= purchasePrice) {
      errorMessage = "Sale price must be greater than purchase price";
    } else if (wholesalePrice > 0 && purchasePrice > 0 && wholesalePrice <= purchasePrice) {
      errorMessage = "Wholesale price must be greater than purchase price";
    } else if (retailPrice > 0 && purchasePrice > 0 && retailPrice <= purchasePrice) {
      errorMessage = "Shopkeeper price must be greater than purchase price";
    }
    
    if (errorMessage) {
      setVariantErrors(prev => ({
        ...prev,
        [index]: errorMessage
      }));
      return false;
    } else {
      setVariantErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
      return true;
    }
  };

  // Variant management functions
  const addVariant = () => {
    setVariants(prev => [...prev, { 
      variantName: "", 
      initialStock: "0",
      purchasePrice: "",
      salePrice: "",
      wholesalePrice: "",
      retailPrice: ""
    }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(prev => {
        const updated = prev.filter((_, i) => i !== index);
        
        // Recalculate total stock after removing variant
        const totalStock = updated.reduce((sum, variant) => 
          sum + (parseInt(variant.initialStock) || 0), 0
        );
        setFormData(prevFormData => ({
          ...prevFormData,
          stock: totalStock.toString()
        }));
        
        return updated;
      });
    }
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants(prev => {
      const updated = prev.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      );
      
      // Auto-calculate total stock when variant stock changes
      if (field === 'initialStock') {
        const totalStock = updated.reduce((sum, variant) => 
          sum + (parseInt(variant.initialStock) || 0), 0
        );
        setFormData(prevFormData => ({
          ...prevFormData,
          stock: totalStock.toString()
        }));
      }
      
      // Validate prices when any price field changes
      if (field === 'purchasePrice' || field === 'salePrice' || field === 'wholesalePrice' || field === 'retailPrice') {
        const updatedVariant = updated[index];
        validateVariantPrices(updatedVariant, index);
      }
      
      return updated;
    });
  };

  // Warehouse selection functions
  const toggleWarehouse = (warehouseId: string) => {
    setSelectedWarehouses(prev => 
      prev.includes(warehouseId) 
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const selectAllWarehouses = () => {
    setSelectedWarehouses(warehouses.map((w: any) => w.id.toString()));
  };

  const deselectAllWarehouses = () => {
    setSelectedWarehouses([]);
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

    // Validate all variant prices before submission
    let hasValidationErrors = false;
    variants.forEach((variant, index) => {
      if (!validateVariantPrices(variant, index)) {
        hasValidationErrors = true;
      }
    });
    
    if (hasValidationErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix price validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    // Calculate average prices from all variants (for main product price)
    const avgSalePrice = variants.reduce((sum, v) => sum + (parseFloat(v.salePrice) || 0), 0) / variants.length;
    
    const productData = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      brandId: formData.brandId ? parseInt(formData.brandId) : null,
      unitId: formData.unitId ? parseInt(formData.unitId) : null,
      price: avgSalePrice, // Use average sale price as main price
      purchasePrice: 0, // Will be set per variant
      salePrice: avgSalePrice,
      wholesalePrice: 0, // Will be set per variant
      retailPrice: 0, // Will be set per variant
      stock: formData.stock ? parseInt(formData.stock) : 0,
      lowStockAlert: formData.lowStockAlert ? parseInt(formData.lowStockAlert) : 0,
      variants: variants.map(variant => ({
        variantName: variant.variantName || "Default",
        initialStock: parseInt(variant.initialStock) || 0,
        purchasePrice: parseFloat(variant.purchasePrice) || 0,
        salePrice: parseFloat(variant.salePrice) || 0,
        wholesalePrice: parseFloat(variant.wholesalePrice) || 0,
        retailPrice: parseFloat(variant.retailPrice) || 0
      })),
      selectedWarehouses: selectedWarehouses
    };

    updateProductMutation.mutate(productData);
  };

  if (isLoadingProduct || isLoadingVariants) {
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
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600">Update product details and variant pricing</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select value={formData.brandId} onValueChange={(value) => handleInputChange('brandId', value)}>
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
                  
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={formData.unitId} onValueChange={(value) => handleInputChange('unitId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.shortName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Product Variants */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <List className="mr-2 h-5 w-5" />
                    Product Variants
                  </div>
                  <Button
                    type="button"
                    onClick={addVariant}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Variant
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-end space-x-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`variant-name-${index}`}>Variant Name</Label>
                        <Input
                          id={`variant-name-${index}`}
                          type="text"
                          value={variant.variantName}
                          onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                          placeholder={index === 0 ? "Default" : `Variant ${index + 1}`}
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label htmlFor={`variant-stock-${index}`}>Current Stock</Label>
                        <Input
                          id={`variant-stock-${index}`}
                          type="number"
                          min="0"
                          value={variant.initialStock}
                          onChange={(e) => updateVariant(index, 'initialStock', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeVariant(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Variant Pricing */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`variant-purchase-${index}`}>Purchase Price *</Label>
                        <Input
                          id={`variant-purchase-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.purchasePrice}
                          onChange={(e) => updateVariant(index, 'purchasePrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-sale-${index}`}>Sale Price *</Label>
                        <Input
                          id={`variant-sale-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.salePrice}
                          onChange={(e) => updateVariant(index, 'salePrice', e.target.value)}
                          placeholder="0.00"
                          className={variantErrors[index] ? "border-red-500" : ""}
                        />
                        {variantErrors[index] && variantErrors[index].includes('Sale') && (
                          <p className="text-sm text-red-500 mt-1">{variantErrors[index]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-wholesale-${index}`}>Wholesale Price</Label>
                        <Input
                          id={`variant-wholesale-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.wholesalePrice}
                          onChange={(e) => updateVariant(index, 'wholesalePrice', e.target.value)}
                          placeholder="0.00"
                          className={variantErrors[index] && variantErrors[index].includes('Wholesale') ? "border-red-500" : ""}
                        />
                        {variantErrors[index] && variantErrors[index].includes('Wholesale') && (
                          <p className="text-sm text-red-500 mt-1">{variantErrors[index]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-retail-${index}`}>Shopkeeper Price</Label>
                        <Input
                          id={`variant-retail-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.retailPrice}
                          onChange={(e) => updateVariant(index, 'retailPrice', e.target.value)}
                          placeholder="0.00"
                          className={variantErrors[index] && variantErrors[index].includes('Shopkeeper') ? "border-red-500" : ""}
                        />
                        {variantErrors[index] && variantErrors[index].includes('Shopkeeper') && (
                          <p className="text-sm text-red-500 mt-1">{variantErrors[index]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Stock & Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Stock & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Total Stock (Auto-calculated)</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    readOnly
                    className="bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="This field is automatically calculated from variant stock totals"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This field is automatically calculated from variant stock totals
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    value={formData.lowStockAlert}
                    onChange={(e) => handleInputChange('lowStockAlert', e.target.value)}
                    placeholder="10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
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
      </form>
    </AppLayout>
  );
}