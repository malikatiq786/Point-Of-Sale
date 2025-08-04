import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Package, Eye, Filter, X, ChevronLeft, ChevronRight, Settings, Warehouse } from "lucide-react";
import { Link } from "wouter";
import { useCurrency } from "@/hooks/useCurrency";

export default function Products() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustment, setAdjustment] = useState({ type: "increase", quantity: "", reason: "" });
  const { formatCurrencyValue } = useCurrency();

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('DELETE', `/api/products/${productId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully.",
      });
      // Force immediate refetch of current page data
      queryClient.refetchQueries({ queryKey: [`products-${currentPage}-${itemsPerPage}`] });
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      // Invalidate any cached product queries with different pagination
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0]?.toString().startsWith('products-') || false
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
      console.error('Delete product error:', error);
    },
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (adjustmentData: any) => {
      const response = await fetch("/api/stock/adjustments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          warehouseId: 1, // Default to main warehouse
          reason: adjustmentData.reason,
          items: [{
            productName: selectedProduct?.name,
            quantity: adjustmentData.quantityChange,
            previousQuantity: Math.round(parseFloat(selectedProduct?.stock || '0')),
            newQuantity: Math.round(parseFloat(selectedProduct?.stock || '0')) + adjustmentData.quantityChange
          }]
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create stock adjustment");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock adjusted successfully and logged in adjustments history",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/adjustments"] });
      queryClient.refetchQueries({ queryKey: [`products-${currentPage}-${itemsPerPage}`] });
      setShowAdjustDialog(false);
      setAdjustment({ type: "increase", quantity: "", reason: "" });
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust stock",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product);
    setShowAdjustDialog(true);
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustment.quantity || !adjustment.reason) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const quantityChange = adjustment.type === "increase" 
      ? parseInt(adjustment.quantity) 
      : -parseInt(adjustment.quantity);

    adjustStockMutation.mutate({
      quantityChange,
      reason: adjustment.reason,
    });
  };

  // Fetch products with pagination
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: [`products-${currentPage}-${itemsPerPage}`],
    queryFn: async () => {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/products/${currentPage}/${itemsPerPage}?_t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-cache' // Disable browser caching
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      return response.json();
    },
    retry: false,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache the data
  });

  console.log('Products Query:', {
    queryKey: `products-${currentPage}-${itemsPerPage}`,
    loading: isLoading,
    error: error,
    response: productsResponse,
    productsCount: productsResponse?.products?.length || 0
  });

  const products = productsResponse?.products || [];
  const pagination = productsResponse?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };


  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Fetch brands for filter dropdown
  const { data: brands = [] } = useQuery({
    queryKey: ["/api/brands"],
    retry: false,
  });

  // Filter products based on all filter criteria
  const filteredProducts = products.filter((product: any) => {
    // Search query filter
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = !categoryFilter || categoryFilter === "all" || product.category?.id?.toString() === categoryFilter;

    // Brand filter
    const matchesBrand = !brandFilter || brandFilter === "all" || product.brand?.id?.toString() === brandFilter;

    // Stock filter
    const matchesStock = !stockFilter || stockFilter === "all" ||
      (stockFilter === "in-stock" && product.stock > 0) ||
      (stockFilter === "out-of-stock" && product.stock === 0) ||
      (stockFilter === "low-stock" && product.stock <= (product.lowStockAlert || 0) && product.stock > 0);

    // Price filter
    const price = parseFloat(product.price || '0');
    const matchesPrice = !priceFilter || priceFilter === "all" ||
      (priceFilter === "under-10" && price < 10) ||
      (priceFilter === "10-50" && price >= 10 && price <= 50) ||
      (priceFilter === "50-100" && price > 50 && price <= 100) ||
      (priceFilter === "over-100" && price > 100);

    return matchesSearch && matchesCategory && matchesBrand && matchesStock && matchesPrice;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setStockFilter("all");
    setPriceFilter("all");
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || 
    (categoryFilter && categoryFilter !== "all") || 
    (brandFilter && brandFilter !== "all") || 
    (stockFilter && stockFilter !== "all") || 
    (priceFilter && priceFilter !== "all");

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600">Manage your product inventory</p>
      </div>

      {/* Search and Add Product */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-96">
          <Input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Link href="/products/add">
          <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm font-medium">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(categories as any[]).map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Brand</label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {(brands as any[]).map((brand: any) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Stock Status</label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Price Range</label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-10">Under Rs 10</SelectItem>
                  <SelectItem value="10-50">Rs 10 - Rs 50</SelectItem>
                  <SelectItem value="50-100">Rs 50 - Rs 100</SelectItem>
                  <SelectItem value="over-100">Over Rs 100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchQuery}"
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {categoryFilter && categoryFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {(categories as any[]).find((c: any) => c.id.toString() === categoryFilter)?.name}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setCategoryFilter("all")}
                    />
                  </Badge>
                )}
                {brandFilter && brandFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Brand: {(brands as any[]).find((b: any) => b.id.toString() === brandFilter)?.name}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setBrandFilter("all")}
                    />
                  </Badge>
                )}
                {stockFilter && stockFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Stock: {stockFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setStockFilter("all")}
                    />
                  </Badge>
                )}
                {priceFilter && priceFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Price: {priceFilter.replace('-', ' - $').replace('under', 'Under $').replace('over', 'Over $')}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setPriceFilter("all")}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
                ))}
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Low Stock Alert</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any, index: number) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category?.name ? (
                        <Badge variant="secondary" className="text-xs">
                          {product.category.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No Category</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.brand?.name ? (
                        <Badge variant="outline" className="text-xs">
                          {product.brand.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No Brand</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {formatCurrencyValue(parseFloat(product.price || '0'))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          product.stock <= (product.lowStockAlert || 0) 
                            ? 'text-red-600' 
                            : product.stock <= (product.lowStockAlert || 0) * 2 
                              ? 'text-yellow-600' 
                              : 'text-gray-900'
                        }`}>
                          {product.stock || 0}
                        </span>
                        <span className="text-gray-500 text-sm">units</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {product.lowStockAlert || 0} units
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAdjustStock(product)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Adjust
                        </Button>
                        <Link href={`/products/view/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/products/edit/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                        let pageNumber;
                        if (pagination.totalPages <= 5) {
                          pageNumber = index + 1;
                        } else if (pagination.page <= 3) {
                          pageNumber = index + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNumber = pagination.totalPages - 4 + index;
                        } else {
                          pageNumber = pagination.page - 2 + index;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={pagination.page === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
              </p>
              <Link href="/products/add">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Adjust Stock - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitAdjustment} className="space-y-4">
            {/* Product Information with Brand and Category */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Product</Label>
                <p className="font-semibold text-gray-900">{selectedProduct?.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Category</Label>
                  {selectedProduct?.category ? (
                    <Badge variant="secondary" className="mt-1">
                      {selectedProduct.category.name}
                    </Badge>
                  ) : (
                    <p className="text-gray-400 text-sm">No Category</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Brand</Label>
                  {selectedProduct?.brand ? (
                    <Badge variant="outline" className="mt-1">
                      {selectedProduct.brand.name}
                    </Badge>
                  ) : (
                    <p className="text-gray-400 text-sm">No Brand</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Stock</Label>
                  <p className="text-lg font-bold text-blue-600">{selectedProduct?.stock || 0} units</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Warehouse</Label>
                  <div className="flex items-center mt-1">
                    <Warehouse className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-700">Main Warehouse</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustment.type} onValueChange={(value) => setAdjustment({...adjustment, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select adjustment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase Stock</SelectItem>
                  <SelectItem value="decrease">Decrease Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input 
                type="number" 
                placeholder="Enter quantity" 
                value={adjustment.quantity}
                onChange={(e) => setAdjustment({...adjustment, quantity: e.target.value})}
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                New stock will be: {selectedProduct?.stock + (adjustment.type === "increase" ? parseInt(adjustment.quantity || '0') : -parseInt(adjustment.quantity || '0'))} units
              </p>
            </div>

            <div>
              <Label>Reason</Label>
              <Textarea 
                placeholder="Enter reason for adjustment" 
                value={adjustment.reason}
                onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAdjustDialog(false);
                  setAdjustment({ type: "increase", quantity: "", reason: "" });
                  setSelectedProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={adjustStockMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {adjustStockMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}