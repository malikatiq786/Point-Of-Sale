import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Receipt, Eye, Calendar, DollarSign, User, Package, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Fetch sales
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/sales"],
    retry: false,
  });

  const filteredSales = sales.filter((sale: any) => {
    const matchesSearch = sale.id?.toString().includes(searchQuery) ||
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
                            <span>{sale.customer?.name || 'Walk-in Customer'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Receipt className="w-4 h-4" />
                            <span>Cashier: {sale.user?.name || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">
                              ${parseFloat(sale.totalAmount || '0').toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
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