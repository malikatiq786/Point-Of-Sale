import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw, Plus, Calendar, DollarSign, Package, User, FileText } from "lucide-react";

// Currency formatting utility
const formatCurrency = (amount: number | string | null | undefined) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

export default function Returns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [returnData, setReturnData] = useState({
    saleId: "",
    reason: "",
    items: [{ productId: "", quantity: "", returnType: "refund" }]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update return status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ returnId, status }: { returnId: number; status: string }) => {
      const response = await fetch(`/api/returns/${returnId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update return status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Return status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update return status",
        variant: "destructive",
      });
    },
  });

  // Fetch returns
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["/api/returns"],
    retry: false,
  });

  // Fetch sales for return creation
  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales"],
    retry: false,
  });

  const createReturnMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create return");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Return processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      setShowCreateDialog(false);
      setReturnData({
        saleId: "",
        reason: "",
        items: [{ productId: "", quantity: "", returnType: "refund" }]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process return",
        variant: "destructive",
      });
    },
  });

  // Filter returns by search and date
  const filteredReturns = returns.filter((returnItem: any) => {
    const matchesSearch = 
      returnItem.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.saleId?.toString().includes(searchQuery) ||
      returnItem.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!dateFilter) return matchesSearch;
    
    const returnDate = new Date(returnItem.createdAt || returnItem.returnDate);
    const filterDate = new Date(dateFilter);
    
    return matchesSearch && 
           returnDate.toDateString() === filterDate.toDateString();
  });

  const getReturnStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-800' };
      case 'processed':
        return { label: 'Processed', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnData.saleId || !returnData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createReturnMutation.mutate(returnData);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
        <p className="text-gray-600">Process customer returns and refunds</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search returns..." 
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

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Process Return
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RotateCcw className="w-5 h-5 mr-2" />
            Returns History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RotateCcw className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No returns found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter ? "Try adjusting your search criteria" : "No returns processed yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((returnItem: any) => {
                const statusInfo = getReturnStatus(returnItem.status);
                return (
                  <div key={returnItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Return #{returnItem.id}
                        </h3>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Sale #{returnItem.saleId}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(returnItem.createdAt || returnItem.returnDate).toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {formatCurrency(returnItem.totalAmount)}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {returnItem.customerName || 'Walk-in Customer'}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Reason:</span> {returnItem.reason}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {returnItem.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ returnId: returnItem.id, status: 'approved' })}
                            disabled={updateStatusMutation.isPending}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            data-testid={`button-approve-${returnItem.id}`}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ returnId: returnItem.id, status: 'rejected' })}
                            disabled={updateStatusMutation.isPending}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            data-testid={`button-reject-${returnItem.id}`}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {returnItem.status === 'approved' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ returnId: returnItem.id, status: 'processed' })}
                          disabled={updateStatusMutation.isPending}
                          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          data-testid={`button-process-${returnItem.id}`}
                        >
                          Mark Processed
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          setShowViewDialog(true);
                        }}
                        data-testid={`button-view-details-${returnItem.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sale Transaction</Label>
                <Select value={returnData.saleId} onValueChange={(value) => setReturnData({ ...returnData, saleId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sale to return" />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.slice(0, 20).map((sale: any) => (
                      <SelectItem key={sale.id} value={sale.id.toString()}>
                        Sale #{sale.id} - {formatCurrency(sale.totalAmount)} ({new Date(sale.createdAt || sale.saleDate).toLocaleDateString('en-GB')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Return Type</Label>
                <Select value={returnData.items[0]?.returnType} onValueChange={(value) => setReturnData({ 
                  ...returnData, 
                  items: [{ ...returnData.items[0], returnType: value }] 
                })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">Full Refund</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Return Reason</Label>
              <Textarea
                value={returnData.reason}
                onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                placeholder="Enter reason for return (e.g., defective product, wrong size, customer changed mind)"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReturnMutation.isPending}>
                {createReturnMutation.isPending ? "Processing..." : "Process Return"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Return ID</Label>
                  <p className="text-sm"># {selectedReturn.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Sale ID</Label>
                  <p className="text-sm"># {selectedReturn.saleId}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Customer</Label>
                  <p className="text-sm">{selectedReturn.customerName || 'Walk-in Customer'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={getReturnStatus(selectedReturn.status).color}>
                    {getReturnStatus(selectedReturn.status).label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Return Amount</Label>
                  <p className="text-sm">{formatCurrency(selectedReturn.totalAmount)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date</Label>
                  <p className="text-sm">{new Date(selectedReturn.createdAt || selectedReturn.returnDate).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Return Reason</Label>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedReturn.reason}</p>
              </div>
              
              {selectedReturn.items && selectedReturn.items.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Return Items</Label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    {selectedReturn.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">Product ID: {item.productId}</span>
                        <span className="text-sm">Qty: {item.quantity}</span>
                        <span className="text-sm capitalize">{item.returnType || 'refund'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewDialog(false)}
                  data-testid="button-close-return-details"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}