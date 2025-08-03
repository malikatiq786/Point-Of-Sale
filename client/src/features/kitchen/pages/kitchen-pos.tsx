import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, ChefHat, CheckCircle, AlertCircle, Utensils, Car, Home, Timer, Bell, Settings, Filter } from "lucide-react";
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
      // Simple beep sound using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (error) {
        // Fallback - silent notification if audio fails
        console.log('New kitchen order notification');
      }
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
      case 'dine-in': return "bg-blue-100 text-blue-700 border border-blue-200";
      case 'takeaway': return "bg-green-100 text-green-700 border border-green-200";
      case 'delivery': return "bg-purple-100 text-purple-700 border border-purple-200";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case 'preparing': return "bg-gradient-to-r from-amber-500 to-amber-600 text-white";
      case 'ready': return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case 'served': return "bg-gradient-to-r from-slate-500 to-slate-600 text-white";
      default: return "bg-gradient-to-r from-slate-400 to-slate-500 text-white";
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
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 -mx-6 -mt-6 px-6 pt-4 pb-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-0.5">
                Kitchen Dashboard
              </h1>
              <p className="text-slate-300 text-sm">Real-time order management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 text-xs px-2 py-1 h-7 ${
                audioEnabled ? 'bg-white/20' : 'bg-transparent'
              }`}
            >
              <Bell className="h-3 w-3 mr-1" />
              {audioEnabled ? 'On' : 'Off'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-2 py-1 h-7"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Status Filter Tabs */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <span className="text-slate-700 font-medium text-sm">Filter by Status</span>
          </div>
          <div className="text-xs text-slate-500">Updates every 5s</div>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: "all", label: "All Orders", count: orders.length, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50", textColor: "text-blue-700", icon: ChefHat },
            { key: "new", label: "New Orders", count: statusCounts.new, color: "from-red-500 to-red-600", bgColor: "bg-red-50", textColor: "text-red-700", icon: AlertCircle },
            { key: "preparing", label: "Preparing", count: statusCounts.preparing, color: "from-amber-500 to-amber-600", bgColor: "bg-amber-50", textColor: "text-amber-700", icon: Clock },
            { key: "ready", label: "Ready to Serve", count: statusCounts.ready, color: "from-green-500 to-green-600", bgColor: "bg-green-50", textColor: "text-green-700", icon: CheckCircle },
          ].map(({ key, label, count, color, bgColor, textColor, icon: Icon }) => (
            <Card
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`cursor-pointer transition-all duration-200 border hover:shadow-lg transform hover:-translate-y-0.5 ${
                selectedStatus === key 
                  ? `${bgColor} border-current ${textColor} shadow-md scale-102` 
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    selectedStatus === key 
                      ? `bg-gradient-to-r ${color} text-white` 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className={`text-xl font-bold ${
                    selectedStatus === key ? textColor : "text-slate-900"
                  }`}>
                    {count}
                  </div>
                </div>
                <div className={`font-medium text-sm ${
                  selectedStatus === key ? textColor : "text-slate-700"
                }`}>
                  {label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Compact Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse h-56">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-5 bg-slate-200 rounded-full w-12"></div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-3/4 mt-2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-slate-200 rounded"></div>
                <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                <div className="h-8 bg-slate-200 rounded mt-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const IconComponent = getOrderIcon(order.orderType);
            const timeSince = getTimeSinceOrder(order.saleDate);
            const priorityColor = getPriorityColor(order.saleDate);
            
            return (
              <Card key={order.id} className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 border bg-white hover:bg-slate-50 transform hover:-translate-y-1 ${priorityColor} shadow-sm`}>
                {/* Priority indicator */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${priorityColor.replace('border-l-', 'bg-')}`}></div>
                
                <CardHeader className="pb-3 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${getOrderColor(order.orderType).replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <IconComponent className={`h-3.5 w-3.5 ${getOrderColor(order.orderType)}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 mb-0.5">
                          Order #{order.id}
                        </CardTitle>
                        <div className="flex items-center space-x-1">
                          <Badge className={`text-xs font-medium px-2 py-0.5 border-0 ${getOrderColor(order.orderType)}`}>
                            {order.orderType === 'dine-in' ? 'Dine-In' : 
                             order.orderType === 'takeaway' ? 'Takeaway' : 
                             order.orderType === 'delivery' ? 'Delivery' : 'Sale'}
                            {order.tableNumber && ` - T${order.tableNumber}`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs font-semibold px-2 py-1 border-0 ${getStatusColor(order.kitchenStatus)}`}>
                        {order.kitchenStatus.charAt(0).toUpperCase() + order.kitchenStatus.slice(1)}
                      </Badge>
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <Timer className="mr-1 h-3 w-3" />
                        {timeSince}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-4 space-y-3">
                    {/* Order Items */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <h4 className="font-medium text-slate-700 mb-2 flex items-center text-sm">
                        <Utensils className="h-3 w-3 mr-1" />
                        Items
                      </h4>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-white rounded p-2 shadow-sm">
                            <span className="font-medium text-slate-800 text-sm">
                              {item.productVariant.product.name}
                            </span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              {item.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-800 mb-1 text-sm">Special Instructions</p>
                            <p className="text-xs text-amber-700">
                              {order.specialInstructions}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer & Total */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                      <div>
                        {order.customer && (
                          <div className="text-xs text-slate-600 mb-1">
                            <span className="font-medium text-slate-700">Customer:</span> {order.customer.name}
                          </div>
                        )}
                        <div className="text-lg font-bold text-slate-900">
                          {formatCurrencyValue(parseFloat(order.totalAmount || '0'))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-1.5 pt-1">
                      {order.kitchenStatus === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            orderId: order.id, 
                            status: 'preparing',
                            estimatedTime: 15 
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-200 h-8 text-sm"
                        >
                          <Clock className="mr-1 h-3 w-3" />
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
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-200 h-8 text-sm"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
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
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-200 h-8 text-sm"
                        >
                          <Utensils className="mr-1 h-3 w-3" />
                          Mark Served
                        </Button>
                      )}
                    </div>
                  </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {selectedStatus === "all" ? "No Active Orders" : `No ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Orders`}
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {selectedStatus === "all" 
              ? "New orders will appear here in real-time as they come in from the POS system" 
              : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} orders will be displayed here when available`}
          </p>
        </div>
      )}
    </AppLayout>
  );
}