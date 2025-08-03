import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, ChefHat, CheckCircle, AlertCircle, Utensils, Car, Home, Timer } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface KitchenOrder {
  id: number;
  orderType: string;
  tableNumber?: string;
  kitchenStatus: string;
  saleDate: string;
  totalAmount: string;
  specialInstructions?: string;
  estimatedTime?: number;
  customer?: {
    name: string;
  };
  items: {
    id: number;
    quantity: string;
    productVariant: {
      product: {
        name: string;
      };
    };
  }[];
}

export default function KitchenPOS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { formatCurrencyValue } = useCurrency();

  // Fetch kitchen orders
  const { data: orders = [], isLoading } = useQuery<KitchenOrder[]>({
    queryKey: [`/api/kitchen/orders/${selectedStatus}`],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    retry: false,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, estimatedTime }: { orderId: number; status: string; estimatedTime?: number }) => {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitchenStatus: status, estimatedTime }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/orders"] });
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter orders based on selected status
  const filteredOrders = orders.filter(order => {
    if (selectedStatus === "all") return true;
    return order.kitchenStatus === selectedStatus;
  });

  // Get order counts by status
  const statusCounts = {
    new: orders.filter(o => o.kitchenStatus === "new").length,
    preparing: orders.filter(o => o.kitchenStatus === "preparing").length,
    ready: orders.filter(o => o.kitchenStatus === "ready").length,
  };

  // Play notification sound for new orders
  useEffect(() => {
    if (audioEnabled && statusCounts.new > 0) {
      // Simple audio notification (can be enhanced with actual sound files)
      const audio = new Audio('data:audio/wav;base64,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');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  }, [statusCounts.new, audioEnabled]);

  const getOrderIcon = (orderType: string) => {
    switch (orderType) {
      case 'dine-in': return Home;
      case 'takeaway': return Utensils;
      case 'delivery': return Car;
      default: return ChefHat;
    }
  };

  const getOrderColor = (orderType: string) => {
    switch (orderType) {
      case 'dine-in': return "bg-blue-100 text-blue-600";
      case 'takeaway': return "bg-green-100 text-green-600";
      case 'delivery': return "bg-purple-100 text-purple-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return "bg-red-100 text-red-700 border-red-200";
      case 'preparing': return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case 'ready': return "bg-green-100 text-green-700 border-green-200";
      case 'served': return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getTimeSinceOrder = (orderDate: string) => {
    const now = new Date();
    const orderTime = new Date(orderDate);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m ago`;
  };

  const getPriorityColor = (orderDate: string) => {
    const now = new Date();
    const orderTime = new Date(orderDate);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes > 30) return "border-l-red-500";
    if (diffInMinutes > 15) return "border-l-yellow-500";
    return "border-l-green-500";
  };

  return (
    <AppLayout>
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <ChefHat className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Kitchen POS
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Order management and kitchen operations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={audioEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="text-xs sm:text-sm"
            >
              {audioEnabled ? "🔊" : "🔇"} Sound
            </Button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-800 rounded-xl">
          {[
            { key: "all", label: "All Orders", count: orders.length, color: "bg-blue-600 hover:bg-blue-700" },
            { key: "new", label: "New", count: statusCounts.new, color: "bg-red-600 hover:bg-red-700" },
            { key: "preparing", label: "Preparing", count: statusCounts.preparing, color: "bg-amber-600 hover:bg-amber-700" },
            { key: "ready", label: "Ready", count: statusCounts.ready, color: "bg-green-600 hover:bg-green-700" },
          ].map(({ key, label, count, color }) => (
            <Button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`flex items-center space-x-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                selectedStatus === key 
                  ? `${color} text-white shadow-lg transform scale-105` 
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <Badge 
                  className={`text-xs px-2 py-0.5 min-w-[20px] h-5 font-bold ${
                    selectedStatus === key 
                      ? "bg-white/20 text-white" 
                      : "bg-slate-600 text-gray-200"
                  }`}
                >
                  {count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-8 bg-gray-200 rounded mt-4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredOrders.map((order) => {
            const IconComponent = getOrderIcon(order.orderType);
            const timeSince = getTimeSinceOrder(order.saleDate);
            const priorityColor = getPriorityColor(order.saleDate);
            
            return (
              <Card key={order.id} className={`hover:shadow-xl transition-all duration-300 border-l-4 ${priorityColor} bg-white hover:bg-gray-50 transform hover:-translate-y-1`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
                      <IconComponent className="mr-2 h-4 w-4" />
                      Order #{order.id}
                    </CardTitle>
                    <Badge className={`text-xs font-semibold px-3 py-1 ${getStatusColor(order.kitchenStatus)}`}>
                      {order.kitchenStatus.charAt(0).toUpperCase() + order.kitchenStatus.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs font-medium px-2 py-1 ${getOrderColor(order.orderType)}`}>
                        {order.orderType === 'dine-in' ? 'Dine-In' : 
                         order.orderType === 'takeaway' ? 'Takeaway' : 
                         order.orderType === 'delivery' ? 'Delivery' : 'Sale'}
                        {order.tableNumber && ` - Table ${order.tableNumber}`}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Timer className="mr-1 h-3 w-3" />
                      {timeSince}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="flex-1 truncate">
                            {item.quantity}x {item.productVariant.product.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">
                            <strong>Special Instructions:</strong><br />
                            {order.specialInstructions}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Customer Info */}
                    {order.customer && (
                      <div className="text-xs text-gray-600">
                        <strong>Customer:</strong> {order.customer.name}
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="text-sm font-semibold text-gray-900">
                      Total: {formatCurrencyValue(parseFloat(order.totalAmount || '0'))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 pt-2">
                      {order.kitchenStatus === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: order.id, 
                            status: 'preparing',
                            estimatedTime: 15 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Start Preparing
                        </Button>
                      )}
                      
                      {order.kitchenStatus === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: order.id, 
                            status: 'ready' 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Ready
                        </Button>
                      )}
                      
                      {order.kitchenStatus === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: order.id, 
                            status: 'served' 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          <Utensils className="mr-2 h-4 w-4" />
                          Mark Served
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedStatus === "all" ? "No orders found" : `No ${selectedStatus} orders`}
          </h3>
          <p className="text-gray-500">
            {selectedStatus === "all" 
              ? "Orders will appear here when they are placed" 
              : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} orders will appear here`}
          </p>
        </div>
      )}
    </AppLayout>
  );
}