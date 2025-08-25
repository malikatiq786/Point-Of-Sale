import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Receipt, Eye, Calendar, DollarSign, User, Package, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const { formatCurrencyValue } = useCurrency();

  // Fetch sales
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/sales"],
    retry: false,
  });

  // Fetch sale items for expanded sale
  const { data: saleItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/sales", expandedSale, "items"],
    enabled: !!expandedSale,
    retry: false,
  });

  const filteredSales = sales.filter((sale: any) => {
    const matchesSearch = sale.id?.toString().includes(searchQuery) ||
      sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !dateFilter || 
      (sale.saleDate && format(new Date(sale.saleDate), 'yyyy-MM-dd') === dateFilter);
    
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600">View and manage all sales transactions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search sales..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter ? "Try adjusting your search criteria" : "No sales transactions yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale: any) => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Sale #{sale.id}
                          </h3>
                          <Badge className={`${getStatusColor(sale.status)} px-2 py-1 text-xs font-medium`}>
                            {sale.status || 'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {sale.saleDate ? format(new Date(sale.saleDate), 'MMM dd, yyyy HH:mm') : 'No date'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{sale.customerName || sale.customer?.name || 'Walk-in Customer'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Receipt className="w-4 h-4" />
                            <span>Cashier: {sale.user?.name || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">
                              {formatCurrencyValue(parseFloat(sale.totalAmount || '0'))}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Collapsible open={expandedSale === sale.id} onOpenChange={() => 
                          setExpandedSale(expandedSale === sale.id ? null : sale.id)
                        }>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {expandedSale === sale.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              View Details
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      </div>
                    </div>
                    
                    {/* Sale Items Details - Expandable */}
                    <Collapsible open={expandedSale === sale.id}>
                      <CollapsibleContent className="pt-4 border-t border-gray-200">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4" />
                            <h4 className="font-semibold text-gray-900">Sale Items</h4>
                          </div>
                          
                          {itemsLoading ? (
                            <div className="space-y-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white p-3 rounded-md animate-pulse">
                                  <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : saleItems.length > 0 ? (
                            <div className="space-y-2">
                              {saleItems.map((item: any, index: number) => (
                                <div key={index} className="bg-white p-3 rounded-md border">
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-medium text-gray-900">
                                          {item.product?.name || 'Unknown Product'}
                                        </h5>
                                        {item.variant?.variantName && (
                                          <Badge variant="secondary" className="text-xs">
                                            {item.variant.variantName}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex gap-4 text-sm text-gray-600">
                                        {item.product?.categoryName && (
                                          <span>Category: {item.product.categoryName}</span>
                                        )}
                                        {item.product?.brandName && (
                                          <span>Brand: {item.product.brandName}</span>
                                        )}
                                        {item.product?.barcode && (
                                          <span>Code: {item.product.barcode}</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600">
                                          {parseFloat(item.quantity || '0')} × {formatCurrencyValue(parseFloat(item.price || '0'))}
                                        </span>
                                      </div>
                                      <div className="font-semibold text-gray-900">
                                        {formatCurrencyValue(parseFloat(item.quantity || '0') * parseFloat(item.price || '0'))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="border-t pt-2 mt-3">
                                <div className="flex justify-between font-semibold text-gray-900">
                                  <span>Total:</span>
                                  <span>{formatCurrencyValue(parseFloat(sale.totalAmount || '0'))}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No items found for this sale</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}