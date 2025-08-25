import { useState, useEffect } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Search, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

interface PurchaseItem {
  productId: number;
  productName: string;
  productVariantId: number;
  variantName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export default function AddPurchase() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  // Fetch variants for a specific product
  const fetchProductVariants = async (productId: number) => {
    if (productVariantsMap[productId]) {
      return productVariantsMap[productId];
    }
    
    try {
      const response = await apiRequest('GET', `/api/products/${productId}/variants`);
      const variants = Array.isArray(response) ? response : [];
      setProductVariantsMap(prev => ({ ...prev, [productId]: variants }));
      return variants;
    } catch (error) {
      console.error('Error fetching variants:', error);
      return [];
    }
  };

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    retry: false,
  });

  // Fetch products for search
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Product variants state
  const [productVariantsMap, setProductVariantsMap] = useState<{[key: number]: any[]}>({});

  // Type cast the data to ensure TypeScript compatibility
  const typedProducts = (products as any[]);
  const typedSuppliers = (suppliers as any[]);

  const createPurchaseMutation = useMutation({
    mutationFn: (purchaseData: any) => apiRequest("POST", "/api/purchases", purchaseData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      setLocation("/purchases");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase",
        variant: "destructive",
      });
    },
  });

  const addVariant = (variant: any, product: any) => {
    const existingItem = items.find(item => 
      item.productId === product.id && item.productVariantId === variant.id
    );
    
    if (existingItem) {
      updateQuantity(product.id, variant.id, existingItem.quantity + 1);
    } else {
      const newItem: PurchaseItem = {
        productId: product.id,
        productName: product.name,
        productVariantId: variant.id,
        variantName: variant.variantName,
        quantity: 1,
        costPrice: parseFloat(variant.purchasePrice || '0'),
        total: parseFloat(variant.purchasePrice || '0')
      };
      setItems([...items, newItem]);
    }
    setShowProductSearch(false);
    setSearchQuery("");
  };

  const updateQuantity = (productId: number, variantId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeVariant(productId, variantId);
      return;
    }

    setItems(items.map(item => 
      item.productId === productId && item.productVariantId === variantId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.costPrice }
        : item
    ));
  };

  const updateCostPrice = (productId: number, variantId: number, newCostPrice: number) => {
    setItems(items.map(item => 
      item.productId === productId && item.productVariantId === variantId
        ? { ...item, costPrice: newCostPrice, total: item.quantity * newCostPrice }
        : item
    ));
  };

  const removeVariant = (productId: number, variantId: number) => {
    setItems(items.filter(item => 
      !(item.productId === productId && item.productVariantId === variantId)
    ));
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.total, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierId) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    createPurchaseMutation.mutate({
      supplierId: parseInt(supplierId),
      items: items.map(item => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        costPrice: item.costPrice
      })),
      totalAmount: getTotalAmount()
    });
  };

  // ProductWithVariants component
  const ProductWithVariants = ({ product, onAddVariant }: any) => {
    const [variants, setVariants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showVariants, setShowVariants] = useState(false);

    const loadVariants = async () => {
      setIsLoading(true);
      console.log('Loading variants for product:', product.id);
      const productVariants = await fetchProductVariants(product.id);
      console.log('Received variants:', productVariants);
      const variantsArray = Array.isArray(productVariants) ? productVariants : [];
      console.log('Setting variants array:', variantsArray);
      setVariants(variantsArray);
      setIsLoading(false);
    };

    const handleToggleVariants = () => {
      setShowVariants(!showVariants);
      if (!showVariants) {
        loadVariants();
      }
    };

    return (
      <div className="border-b last:border-b-0">
        <div 
          className="p-3 hover:bg-gray-50 cursor-pointer"
          onClick={handleToggleVariants}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-gray-500">
                {product.category?.name} • Total Stock: {product.stock}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">View Variants</p>
              <Button variant="outline" size="sm">
                {showVariants ? 'Hide' : 'Show'} Variants
              </Button>
            </div>
          </div>
        </div>
        
        {showVariants && (
          <div className="bg-gray-50 border-t">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">Loading variants...</div>
            ) : variants.length > 0 ? (
              variants.map((variant: any) => (
                <div 
                  key={variant.id}
                  className="p-3 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
                  onClick={() => onAddVariant(variant, product)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-sm">{variant.variantName}</h4>
                      <p className="text-xs text-gray-500">
                        Stock: {variant.stock} • Purchase: ${parseFloat(variant.purchasePrice || '0').toFixed(2)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">No variants found</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredProducts = typedProducts.filter((product: any) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-2">
          <Link href="/purchases">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Purchases
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
        <p className="text-gray-600">Add products to create a new purchase order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {typedSuppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card>
          <CardHeader>
            <CardTitle>Add Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products to add..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowProductSearch(e.target.value.length > 0);
                  }}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              {showProductSearch && filteredProducts.length > 0 && (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map((product: any) => (
                    <ProductWithVariants 
                      key={product.id} 
                      product={product} 
                      onAddVariant={addVariant}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Purchase Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No products added yet</p>
                <p className="text-sm text-gray-400">Search and add products above</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={`${item.productId}-${item.productVariantId}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">
                            Variant: {item.variantName} • ID: {item.productId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.productVariantId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, item.productVariantId, parseInt(e.target.value) || 0)}
                            className="w-20 text-center"
                            min="1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.productVariantId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.costPrice}
                          onChange={(e) => updateCostPrice(item.productId, item.productVariantId, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          step="0.01"
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${item.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariant(item.productId, item.productVariantId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Total and Submit */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl font-semibold">
                Total Amount: ${getTotalAmount().toFixed(2)}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link href="/purchases">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createPurchaseMutation.isPending || items.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createPurchaseMutation.isPending ? "Creating..." : "Create Purchase Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </AppLayout>
  );
}