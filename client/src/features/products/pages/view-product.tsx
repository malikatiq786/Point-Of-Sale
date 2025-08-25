import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Edit, Trash2, ShoppingCart, AlertTriangle, List, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function ViewProduct() {
  const { user } = useAuth();
  const { formatCurrencyValue } = useCurrency();
  const [location] = useLocation();
  const [expandedVariants, setExpandedVariants] = useState(false);
  
  // Extract product ID from URL path (/products/view/:id)
  const productId = location.split('/').pop();

  // Fetch product data
  const { data: product, isLoading: isLoadingProduct, error } = useQuery<any>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
    retry: false,
  });

  // Fetch product variants
  const { data: variants = [], isLoading: isLoadingVariants } = useQuery<any[]>({
    queryKey: [`/api/products/${productId}/variants`],
    enabled: !!productId,
    retry: false,
  });

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

  if (!product || error) {
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

  const isLowStock = product.stock <= (product.lowStockAlert || 0);
  const isMediumStock = product.stock <= (product.lowStockAlert || 0) * 2;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/products">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600">Product Details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/products/edit/${product.id}`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Product Name</label>
                <p className="font-semibold">{product.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Product ID</label>
                <p className="font-semibold">#{product.id}</p>
              </div>
            </div>

            {product.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}

            {product.barcode && (
              <div>
                <label className="text-sm font-medium text-gray-500">Barcode</label>
                <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{product.barcode}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                {product.category ? (
                  <Badge variant="secondary" className="mt-1">
                    {product.category.name}
                  </Badge>
                ) : (
                  <p className="text-gray-400 text-sm">No Category</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Brand</label>
                {product.brand ? (
                  <Badge variant="outline" className="mt-1">
                    {product.brand.name}
                  </Badge>
                ) : (
                  <p className="text-gray-400 text-sm">No Brand</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Unit</label>
                {product.unit ? (
                  <p className="font-medium">{product.unit.name} ({product.unit.shortName})</p>
                ) : (
                  <p className="text-gray-400 text-sm">No Unit</p>
                )}
              </div>
            </div>

            {product.image && (
              <div>
                <label className="text-sm font-medium text-gray-500">Product Image</label>
                <div className="mt-2">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Stock Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Stock</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xl font-bold ${
                    isLowStock 
                      ? 'text-red-600' 
                      : isMediumStock 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                  }`}>
                    {product.stock || 0}
                  </span>
                  <span className="text-gray-500">{product.unit?.shortName || 'units'}</span>
                  {isLowStock && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                {isLowStock && (
                  <p className="text-red-600 text-sm mt-1">⚠️ Low stock alert!</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Low Stock Alert</label>
                <p className="text-lg font-semibold text-gray-700 mt-1">
                  {product.lowStockAlert || 0} units
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Stock Status</span>
                <Badge 
                  variant={isLowStock ? "destructive" : isMediumStock ? "secondary" : "default"}
                  className={isLowStock ? "" : isMediumStock ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}
                >
                  {isLowStock ? "Low Stock" : isMediumStock ? "Medium Stock" : "In Stock"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Variants */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <List className="mr-2 h-5 w-5" />
              Product Variants & Pricing
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedVariants(!expandedVariants)}
            >
              {expandedVariants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expandedVariants ? 'Collapse' : 'Expand'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingVariants ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-gray-600">Loading variants...</span>
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No variants found for this product</p>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant: any, index: number) => (
                <div key={variant.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {variant.variantName || `Variant ${index + 1}`}
                    </h4>
                    <Badge variant="outline">
                      Stock: {variant.stock || 0} {product.unit?.shortName || 'units'}
                    </Badge>
                  </div>
                  
                  {expandedVariants && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Purchase Price</label>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrencyValue(parseFloat(variant.purchasePrice || '0'))}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Sale Price</label>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrencyValue(parseFloat(variant.salePrice || '0'))}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Wholesale Price</label>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrencyValue(parseFloat(variant.wholesalePrice || '0'))}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Shopkeeper Price</label>
                        <p className="text-lg font-bold text-purple-600">
                          {formatCurrencyValue(parseFloat(variant.retailPrice || '0'))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">Created</label>
              <p className="text-gray-700">
                {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-700">
                {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Times Sold</label>
              <p className="text-gray-700">{product.timesSold || 0}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Total Revenue</label>
              <p className="text-gray-700">
                {formatCurrencyValue(parseFloat(product.totalRevenue || '0'))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}