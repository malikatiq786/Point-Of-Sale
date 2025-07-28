import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, ShoppingCart, Minus, Plus, Trash2, CreditCard, DollarSign, Smartphone } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export default function POSTerminal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products", { search: searchQuery }],
    retry: false,
  });

  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      await apiRequest("POST", "/api/sales", saleData);
    },
    onSuccess: () => {
      toast({
        title: "Sale Completed",
        description: "Transaction processed successfully",
      });
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Sale Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      // Set default price based on product category
      const defaultPrice = product.category?.name === 'Electronics' ? 599.99 : 
                           product.category?.name === 'Food & Beverages' ? 2.99 :
                           product.category?.name === 'Clothing' ? 79.99 : 19.99;
      
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: defaultPrice,
        quantity: 1,
        total: defaultPrice
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity === 0) {
          return null;
        }
        return { ...item, quantity: newQuantity, total: newQuantity * item.price };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const processSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before processing sale",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      totalAmount: getCartTotal(),
      paidAmount: getCartTotal(),
      status: "completed"
    };

    processSaleMutation.mutate(saleData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-soft border-0 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POS Terminal</h1>
              <p className="text-gray-500">Process sales quickly and efficiently</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200">
                {user?.role?.name || 'Cashier'}
              </Badge>
              <Button variant="outline" onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle>Product Selection</CardTitle>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search products or scan barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                        <div className="h-20 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {products.map((product: any) => (
                      <Card 
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 border-transparent hover:border-primary-200"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="w-full h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-600">
                              {product.name?.charAt(0) || 'P'}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{product.name}</h4>
                          <p className="text-xs text-gray-500 mb-2">{product.category?.name || 'General'}</p>
                          <p className="text-lg font-bold text-primary-600">$999.99</p>
                          <Badge variant="outline" className="text-xs text-success-600 bg-success-50">
                            In Stock
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No products found</p>
                    <p className="text-sm">Try adjusting your search query</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shopping Cart */}
          <div className="lg:col-span-1">
            <Card className="shadow-soft border-0 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Shopping Cart</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length > 0 ? (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                              <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-600 h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium min-w-[20px] text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="font-semibold text-gray-900">${item.total.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (8.5%):</span>
                        <span className="font-medium">${(getCartTotal() * 0.085).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-3">
                        <span>Total:</span>
                        <span className="text-primary-600">${(getCartTotal() * 1.085).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={paymentMethod === "cash" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentMethod("cash")}
                          className="flex-col space-y-1 h-auto py-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs">Cash</span>
                        </Button>
                        <Button
                          variant={paymentMethod === "card" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentMethod("card")}
                          className="flex-col space-y-1 h-auto py-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span className="text-xs">Card</span>
                        </Button>
                        <Button
                          variant={paymentMethod === "digital" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentMethod("digital")}
                          className="flex-col space-y-1 h-auto py-2"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span className="text-xs">Digital</span>
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={processSale}
                        disabled={processSaleMutation.isPending}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                      >
                        {processSaleMutation.isPending ? "Processing..." : "Process Payment"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setCart([])}
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Cart is empty</p>
                    <p className="text-sm">Add products to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
