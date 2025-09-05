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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Printer, FileText, Package, QrCode, Eye, Plus, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useCurrency } from "@/hooks/useCurrency";
import { formatBarcodeForDisplay, validateEAN13Barcode } from "@/utils/barcode";
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import JsBarcode from 'jsbarcode';

export default function BarcodeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
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
            return key.startsWith('products-barcodes-') || key.startsWith('product-variants');
          }
        }),
        queryClient.refetchQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0]?.toString() || '';
            return key.startsWith('products-barcodes-') || key.startsWith('product-variants');
          }
        })
      ]);
      toast({
        title: "Data Refreshed",
        description: "Product and barcode data has been updated.",
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

  // Fetch products with barcode information
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: [`products-barcodes-${currentPage}-${itemsPerPage}`, new Date().toISOString().split('T')[0]], // Add date to ensure fresh data
    queryFn: async () => {
      const timestamp = new Date().getTime();
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
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const products = productsResponse?.products || [];

  // Fetch product variants with barcodes data
  const { data: variantsData = [] } = useQuery({
    queryKey: [`product-variants-barcodes`, new Date().toISOString().split('T')[0]], // Add date to ensure fresh data
    queryFn: async () => {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/product-variants/barcodes?_t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch variants: ${response.status}`);
      }
      
      return response.json();
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Transform variants data - now we get variant barcodes directly
  const productVariants = variantsData.map((variant: any) => {
    return {
      id: variant.productId, // Use product ID for compatibility
      variantId: variant.id, // Unique variant ID
      productVariantId: variant.id,
      name: variant.productName || 'Unknown Product',
      variantName: variant.variantName || 'Default',
      barcode: variant.barcode, // Now using variant barcode
      price: variant.salePrice || variant.retailPrice || '0',
      category: { 
        id: variant.categoryId,
        name: variant.categoryName || 'N/A' 
      },
      brand: { 
        id: variant.brandId,
        name: variant.brandName || 'N/A' 
      },
      unit: {
        id: variant.unitId,
        name: variant.unitName || 'N/A'
      },
      quantity: 0, // Will be updated if we fetch stock data
      warehouseName: 'N/A',
      location: 'N/A',
      displayName: `${variant.productName || 'Unknown'} - ${variant.variantName || 'Default'}`
    };
  });

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

  // Filter product variants based on search and filters
  const filteredProducts = productVariants.filter((variant: any) => {
    const matchesSearch = !searchQuery || 
      variant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.variantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.barcode?.includes(searchQuery) ||
      variant.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || categoryFilter === "all" || variant.category?.id?.toString() === categoryFilter;
    const matchesBrand = !brandFilter || brandFilter === "all" || variant.brand?.id?.toString() === brandFilter;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Selection handlers (using variantId for unique identification)
  const handleSelectProduct = (variantId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, variantId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== variantId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVariantIds = filteredProducts.map((variant: any) => variant.variantId);
      setSelectedProducts(allVariantIds);
    } else {
      setSelectedProducts([]);
    }
  };

  const isAllSelected = filteredProducts.length > 0 && 
    filteredProducts.every((variant: any) => selectedProducts.includes(variant.variantId));

  // Quantity handlers
  const handleQuantityChange = (variantId: number, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [variantId]: Math.max(0, quantity)
    }));
  };

  const getQuantity = (variantId: number) => {
    return quantities[variantId] || 0; // Default to 0 if not set
  };

  // Generate barcode images
  const generateBarcodeImage = async (barcodeText: string, format: string = 'CODE128'): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      try {
        JsBarcode(canvas, barcodeText, {
          format: format,
          width: 2,
          height: 60,
          displayValue: false,
          margin: 0
        });
        resolve(canvas.toDataURL());
      } catch (error) {
        console.error('Error generating barcode:', error);
        resolve('');
      }
    });
  };


  // Export to PDF function with visual barcodes
  const exportBarcodesPDF = async () => {
    const selectedProductData = filteredProducts.filter((variant: any) => 
      selectedProducts.length === 0 ? true : selectedProducts.includes(variant.variantId)
    );

    if (selectedProductData.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to print barcodes for.",
        variant: "destructive",
      });
      return;
    }

    // Expand selected products based on quantities
    const expandedProductData: any[] = [];
    selectedProductData.forEach((variant: any) => {
      const quantity = getQuantity(variant.variantId);
      for (let i = 0; i < quantity; i++) {
        expandedProductData.push({
          ...variant,
          copyNumber: i + 1
        });
      }
    });

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Product Barcode Labels', pageWidth / 2, 20, { align: 'center' });
    
    // Layout configuration
    const cols = 3;
    const rows = 4;
    const labelWidth = (pageWidth - 40) / cols;
    const labelHeight = (pageHeight - 60) / rows;
    const startX = 20;
    const startY = 40;
    
    let currentProduct = 0;
    
    for (let page = 0; currentProduct < expandedProductData.length; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      
      for (let row = 0; row < rows && currentProduct < expandedProductData.length; row++) {
        for (let col = 0; col < cols && currentProduct < expandedProductData.length; col++) {
          const variant = expandedProductData[currentProduct];
          const x = startX + col * labelWidth;
          const y = startY + row * labelHeight;
          
          // Draw border
          pdf.setLineWidth(0.5);
          pdf.rect(x, y, labelWidth, labelHeight);
          
          // Product name with variant
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          const displayName = variant.displayName.length > 22 ? variant.displayName.substring(0, 22) + '...' : variant.displayName;
          pdf.text(displayName, x + labelWidth/2, y + 12, { align: 'center' });
          
          // Generate and add barcode image
          try {
            const barcodeImage = await generateBarcodeImage(variant.barcode || 'NO_BARCODE', 'CODE128');
            if (barcodeImage) {
              pdf.addImage(barcodeImage, 'PNG', x + 10, y + 18, labelWidth - 20, 25);
            }
          } catch (error) {
            console.error('Error adding barcode to PDF:', error);
          }
          
          // Barcode number
          pdf.setFontSize(8);
          pdf.setFont(undefined, 'normal');
          pdf.text(formatBarcodeForDisplay(variant.barcode || 'NO_BARCODE'), x + labelWidth/2, y + 50, { align: 'center' });
          
          // Price and category
          pdf.setFontSize(7);
          pdf.text(`${formatCurrencyValue(parseFloat(variant.price || '0'))}`, x + labelWidth/2, y + 58, { align: 'center' });
          pdf.text(`${variant.category?.name || 'N/A'}`, x + labelWidth/2, y + 65, { align: 'center' });
          
          currentProduct++;
        }
      }
    }

    pdf.save(`barcode-labels-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    const totalLabels = expandedProductData.length;
    toast({
      title: "PDF Generated", 
      description: `${totalLabels} barcode labels generated for ${selectedProductData.length} product variants.`,
    });
  };

  // Print barcodes function with visual barcodes
  const printBarcodes = async () => {
    const selectedProductData = filteredProducts.filter((variant: any) => 
      selectedProducts.length === 0 ? true : selectedProducts.includes(variant.variantId)
    );

    if (selectedProductData.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to print barcodes for.",
        variant: "destructive",
      });
      return;
    }

    // Expand selected products based on quantities
    const expandedProductData: any[] = [];
    selectedProductData.forEach((variant: any) => {
      const quantity = getQuantity(variant.variantId);
      for (let i = 0; i < quantity; i++) {
        expandedProductData.push({
          ...variant,
          copyNumber: i + 1
        });
      }
    });

    let productsHTML = '';
    
    // Generate barcode labels in grid format (3 columns)
    for (let i = 0; i < expandedProductData.length; i += 3) {
      productsHTML += '<div class="barcode-row">';
      
      for (let j = 0; j < 3 && (i + j) < expandedProductData.length; j++) {
        const variant = expandedProductData[i + j];
        const formattedBarcode = formatBarcodeForDisplay(variant.barcode || '');
        
        // Generate barcode image as base64
        const canvas = document.createElement('canvas');
        let barcodeImageData = '';
        try {
          JsBarcode(canvas, variant.barcode || 'NO_BARCODE', {
            format: 'CODE128',
            width: 2,
            height: 60,
            displayValue: false,
            margin: 0
          });
          barcodeImageData = canvas.toDataURL();
        } catch (error) {
          console.error('Error generating barcode for print:', error);
        }
        
        const displayName = variant.displayName.length > 18 ? variant.displayName.substring(0, 18) + '...' : variant.displayName;
        
        productsHTML += `
          <div class="barcode-label">
            <div class="label-header">
              <h4>${displayName}</h4>
            </div>
            
            <div class="barcode-visual">
              ${barcodeImageData ? `<img src="${barcodeImageData}" alt="Barcode" class="barcode-img">` : ''}
            </div>
            
            <div class="barcode-number">${formattedBarcode}</div>
            
            <div class="product-info">
              <div class="price">${formatCurrencyValue(parseFloat(variant.price || '0'))}</div>
              <div class="category">${variant.category?.name || 'N/A'}</div>
            </div>
          </div>
        `;
      }
      
      productsHTML += '</div>';
    }

    const printContent = `
      <html>
        <head>
          <title>Product Barcode Labels</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              font-size: 10px; 
              background: white;
            }
            h1 { 
              text-align: center; 
              color: #333; 
              margin-bottom: 30px; 
              font-size: 18px;
            }
            .barcode-row { 
              display: flex; 
              margin-bottom: 20px; 
              gap: 10px;
            }
            .barcode-label { 
              flex: 1; 
              border: 2px solid #333; 
              padding: 10px; 
              text-align: center; 
              background: white;
              min-height: 200px;
              page-break-inside: avoid;
            }
            .label-header h4 { 
              margin: 0 0 8px 0; 
              font-size: 12px; 
              font-weight: bold; 
              color: #333;
              text-transform: uppercase;
            }
            .barcode-visual { 
              margin: 10px 0; 
              min-height: 70px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-img { 
              max-width: 100%; 
              height: auto;
            }
            .barcode-number { 
              font-size: 11px; 
              font-weight: bold; 
              font-family: 'Courier New', monospace; 
              letter-spacing: 1px; 
              margin: 8px 0;
              color: #000;
            }
            .product-info { 
              margin: 8px 0; 
              font-size: 9px;
            }
            .price { 
              font-weight: bold; 
              color: #22c55e; 
              font-size: 11px;
            }
            .category { 
              color: #666; 
              margin-top: 2px;
            }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .barcode-label { page-break-inside: avoid; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <h1>Product Barcode Labels</h1>
          ${productsHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait a bit for images to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }

    const totalLabels = expandedProductData.length;
    toast({
      title: "Print Dialog Opened",
      description: `${totalLabels} barcode labels prepared for ${selectedProductData.length} product variants.`,
    });
  };

  // Print single variant function
  const printSingleVariant = async (variant: any) => {
    const expandedProductData = [{
      ...variant,
      copyNumber: 1
    }];

    let productsHTML = '';
    
    // Generate barcode label
    productsHTML += '<div class="barcode-row">';
    
    const barcodeImage = await generateBarcodeImage(variant.barcode || 'NO_BARCODE', 'CODE128');
    
    productsHTML += `
      <div class="barcode-label">
        <div class="label-header">
          <h4>${variant.displayName}</h4>
        </div>
        <div class="barcode-visual">
          ${barcodeImage ? `<img src="${barcodeImage}" alt="Barcode" class="barcode-img" />` : '<div>No barcode available</div>'}
        </div>
        <div class="barcode-number">${formatBarcodeForDisplay(variant.barcode || 'NO_BARCODE')}</div>
        <div class="product-info">
          <div class="price">${formatCurrencyValue(parseFloat(variant.price || '0'))}</div>
          <div class="category">${variant.category?.name || 'N/A'}</div>
        </div>
      </div>
    `;
    
    productsHTML += '</div>';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Single Product Barcode Label</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              font-size: 10px; 
              background: white;
            }
            h1 { 
              text-align: center; 
              color: #333; 
              margin-bottom: 30px; 
              font-size: 18px;
            }
            .barcode-row { 
              display: flex; 
              justify-content: center;
              margin-bottom: 20px; 
              gap: 10px;
            }
            .barcode-label { 
              width: 300px;
              border: 2px solid #333; 
              padding: 20px; 
              text-align: center; 
              background: white;
              min-height: 200px;
              page-break-inside: avoid;
            }
            .label-header h4 { 
              margin: 0 0 15px 0; 
              font-size: 14px; 
              font-weight: bold; 
              color: #333;
              text-transform: uppercase;
            }
            .barcode-visual { 
              margin: 15px 0; 
              min-height: 70px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-img { 
              max-width: 100%; 
              height: auto;
            }
            .barcode-number { 
              font-size: 12px; 
              font-weight: bold; 
              font-family: 'Courier New', monospace; 
              letter-spacing: 1px; 
              margin: 15px 0;
              color: #000;
            }
            .product-info { 
              margin: 15px 0; 
              font-size: 10px;
            }
            .price { 
              font-weight: bold; 
              color: #22c55e; 
              font-size: 14px;
              margin-bottom: 8px;
            }
            .category { 
              color: #666; 
              margin-top: 5px;
            }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .barcode-label { page-break-inside: avoid; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <h1>Product Barcode Label</h1>
          ${productsHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait a bit for images to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }

    toast({
      title: "Print Dialog Opened",
      description: `Barcode label prepared for ${variant.displayName}.`,
    });
  };

  // Print variant with specified quantity
  const printVariantWithQuantity = async (variant: any) => {
    const quantity = getQuantity(variant.variantId);
    
    if (quantity === 0) {
      toast({
        title: "No labels to print",
        description: "Please enter a quantity greater than 0 in the Labels column.",
        variant: "destructive",
      });
      return;
    }

    // Create multiple copies based on quantity
    const expandedProductData: any[] = [];
    for (let i = 0; i < quantity; i++) {
      expandedProductData.push({
        ...variant,
        copyNumber: i + 1
      });
    }

    let productsHTML = '';
    
    // Generate barcode labels in grid format (3 columns)
    for (let i = 0; i < expandedProductData.length; i += 3) {
      productsHTML += '<div class="barcode-row">';
      
      for (let j = i; j < Math.min(i + 3, expandedProductData.length); j++) {
        const currentVariant = expandedProductData[j];
        const barcodeImage = await generateBarcodeImage(currentVariant.barcode || 'NO_BARCODE', 'CODE128');
        
        productsHTML += `
          <div class="barcode-label">
            <div class="label-header">
              <h4>${currentVariant.displayName}</h4>
            </div>
            <div class="barcode-visual">
              ${barcodeImage ? `<img src="${barcodeImage}" alt="Barcode" class="barcode-img" />` : '<div>No barcode available</div>'}
            </div>
            <div class="barcode-number">${formatBarcodeForDisplay(currentVariant.barcode || 'NO_BARCODE')}</div>
            <div class="product-info">
              <div class="price">${formatCurrencyValue(parseFloat(currentVariant.price || '0'))}</div>
              <div class="category">${currentVariant.category?.name || 'N/A'}</div>
            </div>
          </div>
        `;
      }
      
      productsHTML += '</div>';
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Product Barcode Labels (${quantity})</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              font-size: 10px; 
              background: white;
            }
            h1 { 
              text-align: center; 
              color: #333; 
              margin-bottom: 30px; 
              font-size: 18px;
            }
            .barcode-row { 
              display: flex; 
              margin-bottom: 20px; 
              gap: 10px;
            }
            .barcode-label { 
              flex: 1; 
              border: 2px solid #333; 
              padding: 10px; 
              text-align: center; 
              background: white;
              min-height: 200px;
              page-break-inside: avoid;
            }
            .label-header h4 { 
              margin: 0 0 8px 0; 
              font-size: 12px; 
              font-weight: bold; 
              color: #333;
              text-transform: uppercase;
            }
            .barcode-visual { 
              margin: 10px 0; 
              min-height: 70px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-img { 
              max-width: 100%; 
              height: auto;
            }
            .barcode-number { 
              font-size: 11px; 
              font-weight: bold; 
              font-family: 'Courier New', monospace; 
              letter-spacing: 1px; 
              margin: 8px 0;
              color: #000;
            }
            .product-info { 
              margin: 8px 0; 
              font-size: 9px;
            }
            .price { 
              font-weight: bold; 
              color: #22c55e; 
              font-size: 11px;
            }
            .category { 
              color: #666; 
              margin-top: 2px;
            }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .barcode-label { page-break-inside: avoid; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <h1>Product Barcode Labels (${quantity} copies)</h1>
          ${productsHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait a bit for images to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }

    toast({
      title: "Print Dialog Opened",
      description: `${quantity} barcode label(s) prepared for ${variant.displayName}.`,
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
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
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
              Product Variant Barcodes ({filteredProducts.length})
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
                    <TableHead>Product & Variant</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Labels</TableHead>
                    <TableHead>Print</TableHead>
                    <TableHead>Warehouse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((variant: any, index: number) => (
                    <TableRow key={variant.variantId} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(variant.variantId)}
                          onCheckedChange={(checked) => handleSelectProduct(variant.variantId, checked as boolean)}
                          data-testid={`checkbox-variant-${variant.variantId}`}
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
                            <div className="font-semibold text-gray-900">{variant.name}</div>
                            <div className="text-sm text-blue-600 font-medium">
                              {variant.variantName}
                            </div>
                            {variant.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {variant.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {variant.category?.name ? (
                          <Badge variant="secondary" className="text-xs">
                            {variant.category.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No Category</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {variant.brand?.name ? (
                          <Badge variant="outline" className="text-xs">
                            {variant.brand.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No Brand</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {formatBarcodeForDisplay(variant.barcode || '')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {validateEAN13Barcode(variant.barcode || '') ? (
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
                          {formatCurrencyValue(parseFloat(variant.price || '0'))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          parseFloat(variant.quantity || '0') <= 10 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {variant.quantity || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(variant.variantId, Math.max(0, getQuantity(variant.variantId) - 1))}
                            className="h-8 w-8 p-0"
                            title="Decrease quantity"
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={getQuantity(variant.variantId)}
                            onChange={(e) => handleQuantityChange(variant.variantId, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center"
                            data-testid={`input-quantity-${variant.variantId}`}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(variant.variantId, getQuantity(variant.variantId) + 1)}
                            className="h-8 w-8 p-0"
                            title="Increase quantity"
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printVariantWithQuantity(variant)}
                          className="h-8 px-3"
                          title={`Print ${getQuantity(variant.variantId)} label(s)`}
                          disabled={getQuantity(variant.variantId) === 0}
                          data-testid={`button-print-quantity-${variant.variantId}`}
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          Print
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {variant.warehouseName}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No product variants with barcodes found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || categoryFilter !== "all" || brandFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Add products with variants and barcodes to get started"}
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