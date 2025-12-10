import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Package, Eye, Filter, X, ChevronLeft, ChevronRight, Settings, Warehouse, Check, FileText, Printer, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useCurrency } from "@/hooks/useCurrency";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Product image component with state-based fallback
function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Package className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

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
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [adjustment, setAdjustment] = useState({ type: "increase", quantity: "", reason: "" });
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrencyValue } = useCurrency();

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Invalidate all relevant queries to force fresh data
      await Promise.all([
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0]?.toString() || '';
            return key.startsWith('products-') || key.startsWith('products-search-');
          }
        }),
        queryClient.refetchQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0]?.toString() || '';
            return key.startsWith('products-') || key.startsWith('products-search-');
          }
        })
      ]);
      toast({
        title: "Data Refreshed",
        description: "Product data has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest(`/api/products/${productId}`, { method: 'DELETE' });
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

  // Bulk delete product mutation
  const bulkDeleteProductMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await apiRequest('/api/products/bulk', { method: 'DELETE', body: JSON.stringify({ productIds }), headers: { 'Content-Type': 'application/json' } });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Products deleted",
        description: `Successfully deleted ${data.deletedCount} out of ${data.totalRequested} products.`,
      });
      // Clear selected products
      setSelectedProducts([]);
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
        description: "Failed to delete products. Please try again.",
        variant: "destructive",
      });
      console.error('Bulk delete products error:', error);
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
            productId: selectedProduct?.id,
            productVariantId: selectedVariant?.id,
            productName: selectedProduct?.name,
            variantName: selectedVariant?.variantName,
            quantity: adjustmentData.quantityChange,
            previousQuantity: Math.round(parseFloat(selectedVariant?.stock || '0')),
            newQuantity: Math.round(parseFloat(selectedVariant?.stock || '0')) + adjustmentData.quantityChange
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
      setSelectedVariant(null);
      setProductVariants([]);
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

  const handleAdjustStock = async (product: any) => {
    setSelectedProduct(product);
    setLoadingVariants(true);
    setShowAdjustDialog(true);
    
    try {
      // Fetch variants for this product
      const response = await fetch(`/api/products/${product.id}/variants`);
      if (response.ok) {
        const variants = await response.json();
        setProductVariants(variants);
        // Auto-select first variant if available
        if (variants.length > 0) {
          setSelectedVariant(variants[0]);
        }
      } else {
        console.error('Failed to fetch variants');
        setProductVariants([]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      setProductVariants([]);
    } finally {
      setLoadingVariants(false);
    }
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

    if (!selectedVariant) {
      toast({
        title: "Error", 
        description: "Please select a variant to adjust",
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

  // Selection handlers
  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProductIds = filteredProducts.map((product: any) => product.id);
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to delete.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products? This action cannot be undone.`)) {
      bulkDeleteProductMutation.mutate(selectedProducts);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || 
    (categoryFilter && categoryFilter !== "all") || 
    (brandFilter && brandFilter !== "all") || 
    (stockFilter && stockFilter !== "all") || 
    (priceFilter && priceFilter !== "all");

  // Fetch products - use search API when searching, pagination when browsing
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: hasActiveFilters ? 
      [`products-search-${searchQuery}-${categoryFilter}-${brandFilter}-${stockFilter}-${priceFilter}`, new Date().toISOString().split('T')[0]] : 
      [`products-${currentPage}-${itemsPerPage}`, new Date().toISOString().split('T')[0]], // Add date to ensure fresh data
    queryFn: async () => {
      const timestamp = new Date().getTime();
      
      if (hasActiveFilters) {
        // When searching/filtering, get ALL matching products from database
        const searchParams = new URLSearchParams();
        if (searchQuery) searchParams.append('search', searchQuery);
        if (categoryFilter && categoryFilter !== 'all') searchParams.append('categoryId', categoryFilter);
        if (brandFilter && brandFilter !== 'all') searchParams.append('brandId', brandFilter);
        searchParams.append('_t', timestamp.toString());
        
        const response = await fetch(`/api/products?${searchParams.toString()}`, {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to search products: ${response.status}`);
        }
        
        const allProducts = await response.json();
        // Return in the same format as paginated response for consistency
        return {
          products: allProducts,
          pagination: {
            page: 1,
            limit: allProducts.length,
            total: allProducts.length,
            totalPages: 1
          }
        };
      } else {
        // When browsing without filters, use pagination
        const response = await fetch(`/api/products/${currentPage}/${itemsPerPage}?_t=${timestamp}`, {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        return response.json();
      }
    },
    retry: false,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache the data
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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

  // Filter products based on remaining filter criteria
  // Note: search, category, and brand filters are handled by API when hasActiveFilters is true
  const filteredProducts = products.filter((product: any) => {
    // Stock filter (only applied on frontend as API doesn't handle it yet)
    const matchesStock = !stockFilter || stockFilter === "all" ||
      (stockFilter === "in-stock" && product.stock > 0) ||
      (stockFilter === "out-of-stock" && product.stock === 0) ||
      (stockFilter === "low-stock" && product.stock <= (product.lowStockAlert || 0) && product.stock > 0);

    // Price filter (only applied on frontend as API doesn't handle it yet)
    const price = parseFloat(product.price || '0');
    const matchesPrice = !priceFilter || priceFilter === "all" ||
      (priceFilter === "under-10" && price < 10) ||
      (priceFilter === "10-50" && price >= 10 && price <= 50) ||
      (priceFilter === "50-100" && price > 50 && price <= 100) ||
      (priceFilter === "over-100" && price > 100);

    // If we're using the search API (hasActiveFilters), search/category/brand are already filtered
    // If we're using pagination (no active filters), apply all filters on frontend
    if (hasActiveFilters) {
      return matchesStock && matchesPrice;
    } else {
      // Apply all filters on frontend for paginated results
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !categoryFilter || categoryFilter === "all" || product.category?.id?.toString() === categoryFilter;
      const matchesBrand = !brandFilter || brandFilter === "all" || product.brand?.id?.toString() === brandFilter;

      return matchesSearch && matchesCategory && matchesBrand && matchesStock && matchesPrice;
    }
  });

  // Check if all visible products are selected
  const isAllSelected = filteredProducts.length > 0 && 
    filteredProducts.every((product: any) => selectedProducts.includes(product.id));
  const isIndeterminate = selectedProducts.length > 0 && !isAllSelected;

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setStockFilter("all");
    setPriceFilter("all");
    setCurrentPage(1);
  };

  // Export to PDF function
  const exportToPDF = async () => {
    const pdf = new jsPDF();
    let currentY = 20;

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Products Inventory Report', 15, currentY);
    currentY += 10;

    // Summary
    pdf.setFontSize(10);
    pdf.text(`Total Products: ${filteredProducts.length}`, 15, currentY);
    currentY += 8;
    const totalValue = filteredProducts.reduce((sum: number, product: any) => {
      return sum + (parseFloat(product.price || '0') * parseFloat(product.stock || '0'));
    }, 0);
    pdf.text(`Total Inventory Value: ${formatCurrencyValue(totalValue)}`, 15, currentY);
    currentY += 15;

    // Process each product with its variants
    for (const product of filteredProducts) {
      // Fetch variants for each product
      let variants = [];
      try {
        const response = await fetch(`/api/products/${product.id}/variants`);
        if (response.ok) {
          variants = await response.json();
        }
      } catch (error) {
        console.error('Error fetching variants for product', product.id, error);
      }

      if (currentY > 250) { // Add new page if needed
        pdf.addPage();
        currentY = 20;
      }

      // Product header
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${product.name}`, 15, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.text(`Category: ${product.category?.name || 'N/A'}`, 15, currentY);
      pdf.text(`Brand: ${product.brand?.name || 'N/A'}`, 110, currentY);
      currentY += 6;
      pdf.text(`Barcode: ${product.barcode || 'N/A'}`, 15, currentY);
      pdf.text(`Unit: ${product.unit?.name || 'N/A'}`, 110, currentY);
      currentY += 10;

      // Variants table
      if (variants.length > 0) {
        const variantsData = variants.map((variant: any) => [
          variant.variantName || 'Default',
          parseFloat(variant.stock || '0').toString(),
          formatCurrencyValue(parseFloat(variant.purchasePrice || '0')),
          formatCurrencyValue(parseFloat(variant.salePrice || '0')),
          formatCurrencyValue(parseFloat(variant.wholesalePrice || '0')),
          formatCurrencyValue(parseFloat(variant.retailPrice || '0')),
          formatCurrencyValue(parseFloat(variant.stock || '0') * parseFloat(variant.salePrice || '0'))
        ]);

        autoTable(pdf, {
          startY: currentY,
          head: [['Variant', 'Stock', 'Purchase Price', 'Sale Price', 'Wholesale', 'Retail', 'Total Value']],
          body: variantsData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 15, right: 15 },
          tableWidth: 'auto'
        });

        currentY = (pdf as any).lastAutoTable.finalY + 15;
      } else {
        pdf.text('No variants found for this product', 15, currentY);
        currentY += 10;
      }
    }

    pdf.save(`products-inventory-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Print function
  const printReport = async () => {
    let productsHTML = '';
    
    for (const product of filteredProducts) {
      // Fetch variants for each product
      let variants = [];
      try {
        const response = await fetch(`/api/products/${product.id}/variants`);
        if (response.ok) {
          variants = await response.json();
        }
      } catch (error) {
        console.error('Error fetching variants for product', product.id, error);
      }
      
      productsHTML += `
        <div class="product-section">
          <div class="product-header">
            <h3>${product.name}</h3>
            <div class="product-info">
              <div><strong>Category:</strong> ${product.category?.name || 'N/A'}</div>
              <div><strong>Brand:</strong> ${product.brand?.name || 'N/A'}</div>
              <div><strong>Barcode:</strong> ${product.barcode || 'N/A'}</div>
              <div><strong>Unit:</strong> ${product.unit?.name || 'N/A'}</div>
            </div>
          </div>
          
          ${variants.length > 0 ? `
            <table class="variants-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Stock</th>
                  <th>Purchase Price</th>
                  <th>Sale Price</th>
                  <th>Wholesale Price</th>
                  <th>Retail Price</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                ${variants.map((variant: any) => `
                  <tr>
                    <td>${variant.variantName || 'Default'}</td>
                    <td>${parseFloat(variant.stock || '0')}</td>
                    <td>${formatCurrencyValue(parseFloat(variant.purchasePrice || '0'))}</td>
                    <td>${formatCurrencyValue(parseFloat(variant.salePrice || '0'))}</td>
                    <td>${formatCurrencyValue(parseFloat(variant.wholesalePrice || '0'))}</td>
                    <td>${formatCurrencyValue(parseFloat(variant.retailPrice || '0'))}</td>
                    <td>${formatCurrencyValue(parseFloat(variant.stock || '0') * parseFloat(variant.salePrice || '0'))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="no-variants">No variants found for this product</p>'}
        </div>
      `;
    }

    const totalValue = filteredProducts.reduce((sum: number, product: any) => {
      return sum + (parseFloat(product.price || '0') * parseFloat(product.stock || '0'));
    }, 0);

    const printContent = `
      <html>
        <head>
          <title>Products Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; margin-bottom: 10px; }
            .summary { text-align: center; margin-bottom: 20px; padding: 10px; background-color: #f0f9ff; border-radius: 5px; }
            .product-section { margin-bottom: 30px; page-break-inside: avoid; }
            .product-header { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
            .product-header h3 { margin: 0 0 10px 0; color: #22c55e; }
            .product-info { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
            .variants-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .variants-table th, .variants-table td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; }
            .variants-table th { background-color: #22c55e; color: white; font-weight: bold; }
            .variants-table td:nth-child(2), .variants-table td:nth-child(3), .variants-table td:nth-child(4), .variants-table td:nth-child(5), .variants-table td:nth-child(6), .variants-table td:nth-child(7) { text-align: right; }
            .no-variants { text-align: center; color: #666; font-style: italic; }
            @media print { 
              body { margin: 0; } 
              .product-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Products Inventory Report</h1>
          <div class="summary">
            <strong>Total Products:</strong> ${filteredProducts.length} | <strong>Total Inventory Value:</strong> ${formatCurrencyValue(totalValue)}
          </div>
          ${productsHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Link href="/products/add">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Products ({filteredProducts.length})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Export Buttons */}
              {selectedProducts.length === 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={printReport}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              )}
              
              {/* Bulk Actions */}
              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteProductMutation.isPending}
                    data-testid="button-bulk-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {bulkDeleteProductMutation.isPending ? 'Deleting...' : `Delete ${selectedProducts.length}`}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProducts([])}
                    data-testid="button-clear-selection"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
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
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        data-testid={`checkbox-product-${product.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <ProductImage src={product.image} alt={product.name} />
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
              
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <Label className="text-sm font-medium text-gray-600">Unit</Label>
                  {selectedProduct?.unit ? (
                    <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                      {selectedProduct.unit.shortName || selectedProduct.unit.name}
                    </Badge>
                  ) : (
                    <p className="text-gray-400 text-sm">No Unit</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Total Product Stock</Label>
                <p className="text-lg font-bold text-blue-600">
                  {selectedProduct?.stock || 0} {selectedProduct?.unit?.shortName || selectedProduct?.unit?.name || 'units'}
                </p>
              </div>
            </div>

            {/* Variant Selection */}
            {loadingVariants ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading variants...</span>
              </div>
            ) : productVariants.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900">Select Variant to Adjust</Label>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {productVariants.map((variant: any) => (
                    <div 
                      key={variant.id} 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedVariant?.id === variant.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 ${
                            selectedVariant?.id === variant.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedVariant?.id === variant.id && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{variant.variantName || 'Default'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {variant.stock} {selectedProduct?.unit?.shortName || 'units'}
                          </p>
                          <p className="text-xs text-gray-500">Current Stock</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Selected Variant Stock:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {selectedVariant?.stock || 0} {selectedProduct?.unit?.shortName || 'units'}
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Warehouse className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-700">Main Warehouse</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No variants found for this product</p>
                <p className="text-sm">Stock adjustment not available</p>
              </div>
            )}

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
              {selectedVariant && (
                <p className="text-xs text-gray-500 mt-1">
                  New stock will be: {(selectedVariant?.stock || 0) + (adjustment.type === "increase" ? parseInt(adjustment.quantity || '0') : -parseInt(adjustment.quantity || '0'))} {selectedProduct?.unit?.shortName || selectedProduct?.unit?.name || 'units'}
                </p>
              )}
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
                  setSelectedVariant(null);
                  setProductVariants([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={adjustStockMutation.isPending || !selectedVariant || productVariants.length === 0}
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