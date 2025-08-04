import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { KitchenLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, ChefHat, CheckCircle, AlertCircle, Utensils, Car, Home, Timer, Bell, Settings, Filter, Globe, UserCheck } from "lucide-react";
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
  isOnline?: boolean;
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
  const [selectedOrderType, setSelectedOrderType] = useState("all");
  const [selectedOrderSource, setSelectedOrderSource] = useState("all");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [previousNewOrderCount, setPreviousNewOrderCount] = useState(0);
  const [assigningRider, setAssigningRider] = useState<number | null>(null);
  const [selectedRider, setSelectedRider] = useState<string>("");
  const { formatCurrencyValue } = useCurrency();

  // Fetch kitchen orders
  const { data: orders = [], isLoading } = useQuery<KitchenOrder[]>({
    queryKey: [`/api/kitchen/orders/${selectedStatus}`],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    retry: false,
  });

  // Fetch delivery riders for assignment
  const { data: deliveryRiders = [] } = useQuery({
    queryKey: ["/api/delivery-riders/active"],
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

  // Assign rider mutation
  const assignRiderMutation = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: number; riderId: number }) => {
      const response = await fetch(`/api/orders/${orderId}/assign-rider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId }),
      });
      if (!response.ok) throw new Error('Failed to assign rider');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/orders"] });
      setAssigningRider(null);
      setSelectedRider("");
      toast({
        title: "Rider assigned",
        description: "Delivery rider has been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning rider",
        description: "Failed to assign rider. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to detect online orders
  const isOnlineOrder = (order: KitchenOrder) => {
    // Check if explicitly marked as online or if customer name suggests online ordering
    return order.isOnline || 
           (order.customer?.name && order.customer.name.toLowerCase().includes('online')) ||
           (order.id && order.id.toString().includes('online'));
  };

  // Helper function to handle rider assignment
  const handleAssignRider = () => {
    if (!selectedRider || !assigningRider) return;
    
    assignRiderMutation.mutate({
      orderId: assigningRider,
      riderId: parseInt(selectedRider)
    });
  };

  // Helper function to get assigned rider name
  const getAssignedRiderName = (order: any) => {
    if (!order.assignedRiderId) return null;
    const rider = deliveryRiders.find((r: any) => r.id === order.assignedRiderId);
    return rider?.name || "Unknown Rider";
  };

  // Filter orders based on selected status, order type, and source
  const filteredOrders = orders.filter(order => {
    const statusMatch = selectedStatus === "all" || order.kitchenStatus === selectedStatus;
    const typeMatch = selectedOrderType === "all" || order.orderType === selectedOrderType;
    const sourceMatch = selectedOrderSource === "all" || 
                       (selectedOrderSource === "online" && isOnlineOrder(order)) ||
                       (selectedOrderSource === "in-store" && !isOnlineOrder(order));
    return statusMatch && typeMatch && sourceMatch;
  });

  // Get order counts by status
  const statusCounts = {
    new: orders.filter(o => o.kitchenStatus === "new").length,
    preparing: orders.filter(o => o.kitchenStatus === "preparing").length,
    ready: orders.filter(o => o.kitchenStatus === "ready").length,
  };

  // Get order counts by type
  const typeCounts = {
    "dine-in": orders.filter(o => o.orderType === "dine-in").length,
    "takeaway": orders.filter(o => o.orderType === "takeaway").length,
    "delivery": orders.filter(o => o.orderType === "delivery").length,
  };

  // Get order counts by source
  const sourceCounts = {
    "online": orders.filter(o => isOnlineOrder(o)).length,
    "in-store": orders.filter(o => !isOnlineOrder(o)).length,
  };

  // Enhanced notification system for new orders with ring sound and vibration
  useEffect(() => {
    // Check if there are actually new orders (increased count)
    if (audioEnabled && statusCounts.new > previousNewOrderCount && statusCounts.new > 0) {
      console.log(`🔔 New kitchen order detected! Count increased from ${previousNewOrderCount} to ${statusCounts.new}`);
      
      // Play ring sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create a proper ring sound with multiple tones
        const playRingTone = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          // Fade in and out for smoother sound
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + duration - 0.05);
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        // Play a series of ring tones (like a phone ring)
        const now = audioContext.currentTime;
        // First ring: high-low pattern
        playRingTone(1000, now, 0.3);
        playRingTone(800, now + 0.3, 0.3);
        // Short pause
        // Second ring: high-low pattern
        playRingTone(1000, now + 0.8, 0.3);
        playRingTone(800, now + 1.1, 0.3);
        // Third ring for emphasis
        playRingTone(1200, now + 1.6, 0.4);
        
      } catch (error) {
        console.log('Audio notification failed, using fallback notification');
      }
      
      // Add vibration if supported
      try {
        if ('vibrate' in navigator) {
          // Vibration pattern: short-pause-short-pause-long
          navigator.vibrate([200, 100, 200, 100, 500]);
          console.log('📳 Vibration triggered for new kitchen order');
        } else {
          console.log('Vibration not supported on this device');
        }
      } catch (error) {
        console.log('Vibration failed:', error);
      }
      
      // Show enhanced toast notification
      toast({
        title: "🔔 New Kitchen Order!",
        description: `${statusCounts.new} new order${statusCounts.new > 1 ? 's' : ''} waiting to be prepared`,
        duration: 5000,
      });
    }
    
    // Update the previous count for next comparison
    setPreviousNewOrderCount(statusCounts.new);
  }, [statusCounts.new, audioEnabled, previousNewOrderCount, toast]);

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
    <KitchenLayout>
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-100 -mx-6 -mt-6 px-8 py-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-2xl shadow-lg ring-4 ring-red-50">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Kitchen Operations
              </h1>
              <p className="text-gray-500 text-sm font-medium">Live order management system</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`font-medium border-2 px-4 py-2 h-9 transition-all duration-200 ${
                audioEnabled 
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell className="h-4 w-4 mr-2" />
              {audioEnabled ? 'Notifications On' : 'Notifications Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-medium border-2 border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 h-9"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Streamlined Control Panel */}
      <div className="mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {/* Status Overview Cards */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Status Overview</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {[
                { 
                  key: "all", 
                  label: "Total Orders", 
                  count: orders.length, 
                  gradient: "from-blue-500 to-blue-600", 
                  ring: "ring-blue-100",
                  bg: "bg-blue-50",
                  icon: ChefHat 
                },
                { 
                  key: "new", 
                  label: "New Orders", 
                  count: statusCounts.new, 
                  gradient: "from-red-500 to-red-600", 
                  ring: "ring-red-100",
                  bg: "bg-red-50",
                  icon: AlertCircle 
                },
                { 
                  key: "preparing", 
                  label: "In Progress", 
                  count: statusCounts.preparing, 
                  gradient: "from-amber-500 to-amber-600", 
                  ring: "ring-amber-100",
                  bg: "bg-amber-50",
                  icon: Clock 
                },
                { 
                  key: "ready", 
                  label: "Ready to Serve", 
                  count: statusCounts.ready, 
                  gradient: "from-green-500 to-green-600", 
                  ring: "ring-green-100",
                  bg: "bg-green-50",
                  icon: CheckCircle 
                },
              ].map(({ key, label, count, gradient, ring, bg, icon: Icon }) => (
                <div
                  key={key}
                  onClick={() => setSelectedStatus(key)}
                  className={`cursor-pointer group transition-all duration-300 ${
                    selectedStatus === key 
                      ? `transform scale-105 shadow-lg` 
                      : "hover:transform hover:scale-102 hover:shadow-md"
                  }`}
                >
                  <div className={`relative overflow-hidden rounded-xl border-2 p-5 ${
                    selectedStatus === key 
                      ? `${bg} border-current shadow-lg ring-4 ${ring}` 
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ring-4 bg-gradient-to-br ${gradient} text-white ${ring}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm font-medium text-gray-600">{label}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-6">
            {/* Order Source Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Source</h3>
              <div className="flex space-x-2">
                {[
                  { key: "all", label: "All", count: orders.length },
                  { key: "online", label: "Online", count: sourceCounts["online"] },
                  { key: "in-store", label: "In-Store", count: sourceCounts["in-store"] },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedOrderSource(key)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
                      selectedOrderSource === key
                        ? "bg-red-50 border-red-200 text-red-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-xs">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Type Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Type</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "all", label: "All", count: orders.length, icon: ChefHat },
                  { key: "dine-in", label: "Dine", count: typeCounts["dine-in"], icon: Home },
                  { key: "takeaway", label: "Take", count: typeCounts["takeaway"], icon: Utensils },
                  { key: "delivery", label: "Delivery", count: typeCounts["delivery"], icon: Car },
                ].map(({ key, label, count, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedOrderType(key)}
                    className={`px-3 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-center ${
                      selectedOrderType === key
                        ? "bg-red-50 border-red-200 text-red-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm font-bold">{count}</div>
                    <div className="text-xs">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Order Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredOrders.map((order) => {
            const IconComponent = getOrderIcon(order.orderType);
            const timeSince = getTimeSinceOrder(order.saleDate);
            const priorityColor = getPriorityColor(order.saleDate);
            
            return (
              <div key={order.id} className={`relative group overflow-hidden bg-white rounded-xl border-2 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                priorityColor === 'border-l-red-500' ? 'border-red-200 bg-red-50' :
                priorityColor === 'border-l-yellow-500' ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200'
              }`}>
                {/* Priority Indicator */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  priorityColor === 'border-l-red-500' ? 'bg-red-500' :
                  priorityColor === 'border-l-yellow-500' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
                
                {/* Online Order Badge */}
                {isOnlineOrder(order) && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
                      <Globe className="h-3 w-3 mr-1" />
                      Online
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        order.orderType === 'dine-in' ? 'bg-blue-100 text-blue-600' :
                        order.orderType === 'takeaway' ? 'bg-green-100 text-green-600' :
                        order.orderType === 'delivery' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">#{order.id}</h3>
                        <p className="text-sm text-gray-500">
                          {order.orderType === 'dine-in' ? 'Dine-In' : 
                           order.orderType === 'takeaway' ? 'Takeaway' : 
                           order.orderType === 'delivery' ? 'Delivery' : 'Order'}
                          {order.tableNumber && ` • Table ${order.tableNumber}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      order.kitchenStatus === 'new' ? 'bg-red-100 text-red-800 ring-1 ring-red-200' :
                      order.kitchenStatus === 'preparing' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' :
                      order.kitchenStatus === 'ready' ? 'bg-green-100 text-green-800 ring-1 ring-green-200' :
                      'bg-gray-100 text-gray-800 ring-1 ring-gray-200'
                    }`}>
                      {order.kitchenStatus === 'new' && '🔥 '}
                      {order.kitchenStatus === 'preparing' && '👨‍🍳 '}
                      {order.kitchenStatus === 'ready' && '✅ '}
                      {order.kitchenStatus.charAt(0).toUpperCase() + order.kitchenStatus.slice(1)}
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Timer className="h-4 w-4 mr-2" />
                    <span>{timeSince}</span>
                    <div className="ml-auto text-lg font-bold text-gray-900">
                      {formatCurrencyValue(order.totalAmount)}
                    </div>
                  </div>
                
                  <div className="space-y-3">
                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-gray-700 mb-2 text-xs flex items-center">
                        <ChefHat className="h-4 w-4 mr-2" />
                        Items ({order.items.length})
                      </h4>
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium text-xs">
                              {item.productVariant.product.name}
                            </span>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-1 border-t border-gray-200">
                            +{order.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h5 className="text-xs font-semibold text-yellow-800 mb-1">Special Instructions</h5>
                            <p className="text-xs text-yellow-700">{order.specialInstructions}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Rider Assignment */}
                    {order.orderType === 'delivery' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                        <div className="flex items-start">
                          <UserCheck className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h5 className="text-xs font-semibold text-purple-800 mb-1">Delivery Rider</h5>
                            {getAssignedRiderName(order) ? (
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-purple-700 font-medium">{getAssignedRiderName(order)}</p>
                                <button
                                  onClick={() => {
                                    setAssigningRider(order.id);
                                    setSelectedRider("");
                                  }}
                                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors ml-2"
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-purple-700">No rider assigned</p>
                                <button
                                  onClick={() => {
                                    setAssigningRider(order.id);
                                    setSelectedRider("");
                                  }}
                                  className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors"
                                >
                                  Assign
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-1">
                      {order.kitchenStatus === 'new' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'preparing', estimatedTime: 15 })}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 font-semibold py-2 text-xs shadow-sm"
                        >
                          👨‍🍳 Start Cooking
                        </Button>
                      )}
                      
                      {order.kitchenStatus === 'preparing' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 font-semibold py-2 text-xs shadow-sm"
                        >
                          ✅ Mark Ready
                        </Button>
                      )}
                      
                      {order.kitchenStatus === 'ready' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'served' })}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 font-semibold py-2 text-xs shadow-sm"
                        >
                          🍽️ Mark Served
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-gray-100 rounded-full p-6 mb-6">
            <ChefHat className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-500 text-center max-w-md">
            Orders will appear here when they're received. The kitchen display updates automatically every 5 seconds.
          </p>
        </div>
      )}
    </KitchenLayout>
  );
}