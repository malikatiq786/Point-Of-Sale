import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Warehouse, AlertTriangle, Plus, Minus } from "lucide-react";

export default function Stock() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch stock data
  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ["/api/stock"],
    retry: false,
  });

  const filteredStock = stockItems.filter((stock: any) =>
    stock.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.warehouseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
              <p className="text-sm text-gray-500">Monitor and manage inventory levels</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search stock..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              
              <Button className="bg-primary-500 text-white hover:bg-primary-600">
                <Plus className="w-4 h-4 mr-2" />
                Stock Adjustment
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Warehouse className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock records found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery ? "Try adjusting your search terms" : "Stock levels will appear here once products are added"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStock.map((stock: any) => {
                const stockStatus = getStockStatus(parseFloat(stock.quantity || '0'));
                
                return (
                  <Card key={stock.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {stock.productName || 'Unknown Product'}
                            </h3>
                            <Badge className={`${stockStatus.color} px-2 py-1 text-xs font-medium`}>
                              {stockStatus.status}
                            </Badge>
                            {parseFloat(stock.quantity || '0') <= 10 && (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Warehouse className="w-4 h-4" />
                              <span>{stock.warehouseName || 'Main Warehouse'}</span>
                            </div>
                            
                            <div>
                              <span className="font-medium">Current Stock: </span>
                              <span className="font-bold text-gray-900">
                                {parseFloat(stock.quantity || '0').toFixed(0)} units
                              </span>
                            </div>
                            
                            <div>
                              <span className="font-medium">SKU: </span>
                              <span>{stock.sku || stock.id}</span>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              Last Updated: Today
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Minus className="w-4 h-4" />
                            Reduce
                          </Button>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}