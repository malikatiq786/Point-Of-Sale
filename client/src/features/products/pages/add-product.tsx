import { useState } from "react";
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
import { Link } from "wouter";

export default function AddProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    barcode: "",
    categoryId: "",
    brandId: "",
    unitId: "",
    purchasePrice: "",
    salePrice: "",
    wholesalePrice: "",
    retailPrice: "",
    stock: "",
    lowStockAlert: "",
    image: ""
  });

  const [variants, setVariants] = useState([
    { variantName: "Default", initialStock: "0" }
  ]);

  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);

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

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/products', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] }); // Invalidate POS products cache
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setFormData({
        name: "",
        description: "",
        barcode: "",
        categoryId: "",
        brandId: "",
        unitId: "",
        purchasePrice: "",
        salePrice: "",
        wholesalePrice: "",
        retailPrice: "",
        stock: "",
        lowStockAlert: "",
        image: ""
      });
      setVariants([{ variantName: "Default", initialStock: "0" }]);
      setSelectedWarehouses([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
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

  // Variant management functions
  const addVariant = () => {
    setVariants(prev => [...prev, { variantName: "", initialStock: "0" }]);
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

    // Check if warehouses are selected when there's initial stock
    const totalInitialStock = variants.reduce((sum, variant) => sum + (parseInt(variant.initialStock) || 0), 0);
    if (totalInitialStock > 0 && selectedWarehouses.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one warehouse to distribute the initial stock",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      brandId: formData.brandId ? parseInt(formData.brandId) : null,
      unitId: formData.unitId ? parseInt(formData.unitId) : null,
      price: formData.salePrice ? parseFloat(formData.salePrice) : 0, // Use sale price as main price
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : 0,
      wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : 0,
      retailPrice: formData.retailPrice ? parseFloat(formData.retailPrice) : 0,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      lowStockAlert: formData.lowStockAlert ? parseInt(formData.lowStockAlert) : 0,
      variants: variants.map(variant => ({
        variantName: variant.variantName || "Default",
        initialStock: parseInt(variant.initialStock) || 0
      })),
      selectedWarehouses: selectedWarehouses
    };

    createProductMutation.mutate(productData);
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600">Create a new product with complete details and relationships</p>
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
                  <div key={index} className="flex items-end space-x-4 p-4 border rounded-lg">
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
                      <Label htmlFor={`variant-stock-${index}`}>Initial Stock</Label>
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
                ))}
              </CardContent>
            </Card>

            {/* Warehouse Selection */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Warehouse className="mr-2 h-5 w-5" />
                    Select Warehouses for Stock Distribution
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={selectAllWarehouses}
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      onClick={deselectAllWarehouses}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which warehouses should receive the initial stock. Stock will be distributed evenly among selected warehouses.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {warehouses.map((warehouse: any) => (
                    <div 
                      key={warehouse.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWarehouses.includes(warehouse.id.toString()) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleWarehouse(warehouse.id.toString())}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedWarehouses.includes(warehouse.id.toString())}
                          onChange={() => toggleWarehouse(warehouse.id.toString())}
                          className="rounded"
                        />
                        <div>
                          <div className="font-medium text-sm">{warehouse.name}</div>
                          <div className="text-xs text-gray-500">{warehouse.location}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedWarehouses.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ No warehouses selected. Stock will not be created until you select at least one warehouse.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing & Stock */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price ($) *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price ($) *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => handleInputChange('salePrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Wholesale Qty Price ($)</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.wholesalePrice}
                    onChange={(e) => handleInputChange('wholesalePrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retailPrice">Single Piece Shopkeeper Price ($)</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.retailPrice}
                    onChange={(e) => handleInputChange('retailPrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock">Total Stock (Auto-calculated)</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                    disabled
                    className="bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500">
                    This field is automatically calculated from variant initial stock totals
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
            disabled={createProductMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}