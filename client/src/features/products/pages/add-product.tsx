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
import { ArrowLeft, Package, Save, Plus, Minus, List, Warehouse, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { generateProductBarcode, validateEAN13Barcode, formatBarcodeForDisplay } from "@/utils/barcode";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function AddProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
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
      barcode: generateProductBarcode(), // Auto-generate barcode for each variant
      image: "",
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

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/products', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] }); // Invalidate POS products cache
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Invalidate all paginated product queries (products page)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.startsWith('products-') || key.startsWith('products-search-');
        }
      });
      
      // Invalidate barcode management queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.startsWith('products-barcodes-');
        }
      });
      
      // Invalidate stock/variants queries
      queryClient.invalidateQueries({ queryKey: ['/api/stock'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0]?.toString() || '';
          return key.startsWith('product-variants');
        }
      });
      setFormData({
        name: "",
        description: "",
        barcode: generateProductBarcode(), // Auto-generate new barcode after successful creation
        categoryId: "",
        brandId: "",
        unitId: "",
        stock: "",
        lowStockAlert: "",
        image: ""
      });
      setVariants([{ 
        variantName: "Default", 
        initialStock: "0",
        purchasePrice: "",
        salePrice: "",
        wholesalePrice: "",
        retailPrice: ""
      }]);
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
      barcode: generateProductBarcode(), // Auto-generate unique barcode for new variant
      image: "",
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
    setSelectedWarehouses((warehouses as any[]).map((w: any) => w.id.toString()));
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
        barcode: variant.barcode, // Include variant-level barcode
        image: variant.image || "",
        initialStock: parseInt(variant.initialStock) || 0,
        purchasePrice: parseFloat(variant.purchasePrice) || 0,
        salePrice: parseFloat(variant.salePrice) || 0,
        wholesalePrice: parseFloat(variant.wholesalePrice) || 0,
        retailPrice: parseFloat(variant.retailPrice) || 0
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor={`variant-name-${index}`}>Variant Name</Label>
                        <Input
                          id={`variant-name-${index}`}
                          type="text"
                          value={variant.variantName}
                          onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                          placeholder={index === 0 ? "Default" : `Variant ${index + 1}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-barcode-${index}`}>Barcode</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`variant-barcode-${index}`}
                            type="text"
                            value={formatBarcodeForDisplay(variant.barcode)}
                            onChange={(e) => updateVariant(index, 'barcode', e.target.value.replace(/\s/g, ''))}
                            placeholder="Enter barcode or use auto-generated"
                            className="font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateVariant(index, 'barcode', generateProductBarcode())}
                            className="px-3 whitespace-nowrap"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                        {variant.barcode && !validateEAN13Barcode(variant.barcode) && (
                          <p className="text-sm text-yellow-600">⚠ Invalid barcode format</p>
                        )}
                        {variant.barcode && validateEAN13Barcode(variant.barcode) && (
                          <p className="text-sm text-green-600">✓ Valid barcode format</p>
                        )}
                      </div>
                      <div className="space-y-2">
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
                    
                    {/* Variant Image Upload - Full width at the end */}
                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-4">
                        <Label htmlFor={`variant-image-${index}`}>Variant Image</Label>
                        <div className="flex flex-col items-center space-y-4">
                          {variant.image && (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                              <img 
                                src={variant.image}
                                alt={`${variant.variantName} image`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Image load error:', variant.image);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', variant.image);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => updateVariant(index, 'image', '')}
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
                                // Extract the object path from the upload URL
                                const urlParts = uploadURL.split('/');
                                const bucketIndex = urlParts.findIndex(part => part.startsWith('replit-objstore'));
                                if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                                  const objectPath = urlParts.slice(bucketIndex + 1).join('/').split('?')[0];
                                  const servingURL = `/objects/${objectPath}`;
                                  console.log("Serving URL:", servingURL);
                                  updateVariant(index, 'image', servingURL);
                                } else {
                                  // Fallback to original URL if parsing fails
                                  updateVariant(index, 'image', uploadURL);
                                }
                                
                                toast({
                                  title: "Success",
                                  description: "Image uploaded successfully",
                                });
                              }
                            }}
                          >
                            📷 Upload Image
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>
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