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
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Printer, FileText, Package, QrCode, Eye, Plus } from "lucide-react";
import { Link } from "wouter";
import { useCurrency } from "@/hooks/useCurrency";
import { formatBarcodeForDisplay, validateEAN13Barcode } from "@/utils/barcode";
import jsPDF from 'jspdf';
import { format } from 'date-fns';

export default function BarcodeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const { formatCurrencyValue } = useCurrency();

  // Fetch products with barcode information
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: [`products-barcodes-${currentPage}-${itemsPerPage}`],
    queryFn: async () => {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/products/${currentPage}/${itemsPerPage}?_t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      return response.json();
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const products = productsResponse?.products || [];

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

  // Filter products based on search and filters
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery) ||
      product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || categoryFilter === "all" || product.category?.id?.toString() === categoryFilter;
    const matchesBrand = !brandFilter || brandFilter === "all" || product.brand?.id?.toString() === brandFilter;

    // Only show products that have barcodes
    const hasBarcode = product.barcode && product.barcode.trim() !== "";

    return matchesSearch && matchesCategory && matchesBrand && hasBarcode;
  });

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

  const isAllSelected = filteredProducts.length > 0 && 
    filteredProducts.every((product: any) => selectedProducts.includes(product.id));

  // Export to PDF function
  const exportBarcodesPDF = () => {
    const selectedProductData = filteredProducts.filter((product: any) => 
      selectedProducts.length === 0 ? true : selectedProducts.includes(product.id)
    );

    if (selectedProductData.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to print barcodes for.",
        variant: "destructive",
      });
      return;
    }

    const pdf = new jsPDF();
    let currentY = 20;
    const pageHeight = pdf.internal.pageSize.height;

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Product Barcodes Report', 15, currentY);
    currentY += 15;

    // Summary
    pdf.setFontSize(10);
    pdf.text(`Total Products: ${selectedProductData.length}`, 15, currentY);
    pdf.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 120, currentY);
    currentY += 20;

    // Process each product
    for (const product of selectedProductData) {
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = 20;
      }

      // Product info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${product.name}`, 15, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.text(`Category: ${product.category?.name || 'N/A'}`, 15, currentY);
      pdf.text(`Brand: ${product.brand?.name || 'N/A'}`, 110, currentY);
      currentY += 6;
      
      pdf.text(`Price: ${formatCurrencyValue(parseFloat(product.price || '0'))}`, 15, currentY);
      pdf.text(`Stock: ${product.stock || 0}`, 110, currentY);
      currentY += 10;

      // Barcode
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      const formattedBarcode = formatBarcodeForDisplay(product.barcode);
      pdf.text(`Barcode: ${formattedBarcode}`, 15, currentY);
      
      // Barcode validation indicator
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      if (validateEAN13Barcode(product.barcode)) {
        pdf.setTextColor(0, 128, 0);
        pdf.text('✓ Valid EAN-13', 150, currentY);
      } else {
        pdf.setTextColor(255, 0, 0);
        pdf.text('⚠ Invalid Format', 150, currentY);
      }
      pdf.setTextColor(0, 0, 0);
      
      currentY += 20;
      
      // Add separator line
      pdf.setLineWidth(0.1);
      pdf.line(15, currentY, 195, currentY);
      currentY += 10;
    }

    pdf.save(`barcodes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: `Barcode PDF generated for ${selectedProductData.length} products.`,
    });
  };

  // Print barcodes function
  const printBarcodes = () => {
    const selectedProductData = filteredProducts.filter((product: any) => 
      selectedProducts.length === 0 ? true : selectedProducts.includes(product.id)
    );

    if (selectedProductData.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to print barcodes for.",
        variant: "destructive",
      });
      return;
    }

    let productsHTML = '';
    
    for (const product of selectedProductData) {
      const formattedBarcode = formatBarcodeForDisplay(product.barcode);
      const isValidBarcode = validateEAN13Barcode(product.barcode);
      
      productsHTML += `
        <div class="barcode-item">
          <div class="product-header">
            <h3>${product.name}</h3>
            <div class="product-details">
              <span>${product.category?.name || 'N/A'} • ${product.brand?.name || 'N/A'}</span>
              <span>Price: ${formatCurrencyValue(parseFloat(product.price || '0'))} • Stock: ${product.stock || 0}</span>
            </div>
          </div>
          
          <div class="barcode-section">
            <div class="barcode-number">${formattedBarcode}</div>
            <div class="barcode-status ${isValidBarcode ? 'valid' : 'invalid'}">
              ${isValidBarcode ? '✓ Valid EAN-13' : '⚠ Invalid Format'}
            </div>
          </div>
        </div>
      `;
    }

    const printContent = `
      <html>
        <head>
          <title>Product Barcodes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; margin-bottom: 20px; }
            .barcode-item { margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .product-header h3 { margin: 0 0 5px 0; color: #22c55e; font-size: 16px; }
            .product-details { color: #666; font-size: 11px; line-height: 1.4; }
            .barcode-section { margin-top: 15px; text-align: center; }
            .barcode-number { font-size: 24px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px; margin-bottom: 10px; }
            .barcode-status { font-size: 10px; font-weight: bold; }
            .barcode-status.valid { color: #22c55e; }
            .barcode-status.invalid { color: #ef4444; }
            @media print { 
              body { margin: 0; } 
              .barcode-item { page-break-inside: avoid; margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>Product Barcodes</h1>
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

    toast({
      title: "Print Dialog Opened",
      description: `Barcode print dialog opened for ${selectedProductData.length} products.`,
    });
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barcode Management</h1>
            <p className="text-gray-600">Manage and print product barcodes</p>
          </div>
          
          <Link href="/products/add">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-96">
          <Input 
            type="text" 
            placeholder="Search products or barcodes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
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

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-48">
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
      </div>

      {/* Barcode Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Product Barcodes ({filteredProducts.length})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Export Buttons */}
              <Button variant="outline" size="sm" onClick={exportBarcodesPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={printBarcodes}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              
              {/* Selection Info */}
              {selectedProducts.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedProducts.length} selected
                </span>
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
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
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
                        <div className="font-mono text-sm">
                          {formatBarcodeForDisplay(product.barcode)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {validateEAN13Barcode(product.barcode) ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Invalid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {formatCurrencyValue(parseFloat(product.price || '0'))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          product.stock <= (product.lowStockAlert || 0) 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {product.stock || 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products with barcodes found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || categoryFilter !== "all" || brandFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Add products with barcodes to get started"}
              </p>
              <Link href="/products/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}