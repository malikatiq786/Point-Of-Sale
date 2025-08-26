import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Search, ShoppingBag, Eye, Calendar, DollarSign, Truck, Plus, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Purchases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch purchases
  const { data: purchases = [], isLoading, error } = useQuery({
    queryKey: ["/api/purchases"],
    retry: false,
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true,
  });



  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: ({ purchaseId, status }: { purchaseId: number; status: string }) =>
      apiRequest(`/api/purchases/${purchaseId}/status`, { method: 'PATCH', body: JSON.stringify({ status }), headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update purchase status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (purchaseId: number, status: string) => {
    statusUpdateMutation.mutate({ purchaseId, status });
  };

  const filteredPurchases = purchases.filter((purchase: any) => {
    const matchesSearch = purchase.id?.toString().includes(searchQuery) ||
      purchase.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !dateFilter || 
      (purchase.purchaseDate && format(new Date(purchase.purchaseDate), 'yyyy-MM-dd') === dateFilter);
    
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': 
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
        <p className="text-gray-600">Manage supplier orders and inventory purchases</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder="Search purchases..." 
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
            className="w-full sm:w-auto"
          />

          <Link href="/purchases/add">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </Link>
        </div>
      </div>
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
          ) : filteredPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchases found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter ? "Try adjusting your search criteria" : "No purchase orders yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPurchases.map((purchase: any) => (
                <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Purchase #{purchase.id}
                          </h3>
                          <Badge className={`${getStatusColor(purchase.status)} px-2 py-1 text-xs font-medium`}>
                            {purchase.status || 'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {purchase.purchaseDate ? format(new Date(purchase.purchaseDate), 'MMM dd, yyyy') : 'No date'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Truck className="w-4 h-4" />
                            <span>{purchase.supplier?.name || 'Unknown Supplier'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <ShoppingBag className="w-4 h-4" />
                            <span>Items: {purchase.itemCount || 0}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">
                              ${parseFloat(purchase.totalAmount || '0').toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {purchase.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleStatusUpdate(purchase.id, 'approved')}
                              data-testid={`button-approve-purchase-${purchase.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleStatusUpdate(purchase.id, 'rejected')}
                              data-testid={`button-reject-purchase-${purchase.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/purchases/${purchase.id}`, '_self')}
                          data-testid={`button-view-purchase-${purchase.id}`}
                        >
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
    </AppLayout>
  );
}