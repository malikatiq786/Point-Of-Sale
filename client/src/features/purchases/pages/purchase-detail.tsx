import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  ArrowLeft, Calendar, Truck, User, DollarSign, Package,
  CheckCircle, Clock, XCircle
} from 'lucide-react';
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PurchaseDetail() {
  const params = useParams();
  const purchaseId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch purchase details
  const { data: purchase, isLoading } = useQuery({
    queryKey: ["/api/purchases", purchaseId],
    enabled: !!purchaseId,
    retry: false,
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: ({ purchaseId, status }: { purchaseId: number; status: string }) =>
      apiRequest('PATCH', `/api/purchases/${purchaseId}/status`, { status }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases", purchaseId] });
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

  const handleStatusUpdate = (status: string) => {
    if (purchaseId) {
      statusUpdateMutation.mutate({ purchaseId: parseInt(purchaseId), status });
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!purchase) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase not found</h3>
          <p className="text-gray-500 mb-4">The requested purchase order could not be found.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Purchase Order #{purchase.id}
              </h1>
              <p className="text-gray-600">Purchase order details and items</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(purchase.status)}
            <Badge className={`${getStatusColor(purchase.status)} px-3 py-1`}>
              {purchase.status || 'Unknown'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Purchase Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Purchase Date</p>
                    <p className="font-semibold">
                      {purchase.purchaseDate 
                        ? format(new Date(purchase.purchaseDate), 'MMM dd, yyyy') 
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Supplier</p>
                    <p className="font-semibold">{purchase.supplier?.name || 'Unknown'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-semibold">User #{purchase.userId}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold text-lg">
                      ${parseFloat(purchase.totalAmount || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Items */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Items</CardTitle>
            </CardHeader>
            <CardContent>
              {purchase.items && purchase.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.productId && (
                              <p className="text-sm text-gray-500">ID: {item.productId}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          ${parseFloat(item.costPrice || item.unitPrice || '0').toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${parseFloat(item.total || '0').toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items found for this purchase</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {purchase.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={statusUpdateMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Purchase
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={statusUpdateMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Purchase
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Truck className="w-4 h-4 mr-2" />
                Track Delivery
              </Button>
            </CardContent>
          </Card>

          {/* Purchase Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span>${parseFloat(purchase.totalAmount || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span className="text-lg">${parseFloat(purchase.totalAmount || '0').toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}