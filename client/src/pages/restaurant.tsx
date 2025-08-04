import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Plus, Minus, X, User, LogOut, MapPin, Clock, Phone } from "lucide-react";

interface OnlineCustomer {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  categoryId: number;
  category: { id: number; name: string } | null;
}

interface CartItem {
  id: number;
  onlineCustomerId: number;
  productId: number;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
    description: string;
    price: string;
    image: string;
  };
}

function useOnlineAuth() {
  const { data: customer, isLoading } = useQuery<OnlineCustomer | null>({
    queryKey: ["/api/online/me"],
    retry: false,
    throwOnError: false,
  });

  return {
    customer,
    isLoading,
    isAuthenticated: !!customer,
  };
}

function LoginModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch("/api/online/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online/me"] });
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/online/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online/me"] });
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({ email: formData.email, password: formData.password });
    } else {
      registerMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Welcome back! Please login to continue." : "Create an account to place orders."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <Input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Textarea
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loginMutation.isPending || registerMutation.isPending}
              >
                {isLogin ? "Login" : "Create Account"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RestaurantHeader({ customer, onLoginClick, onLogout }: {
  customer: OnlineCustomer | null | undefined;
  onLoginClick: () => void;
  onLogout: () => void;
}) {
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/online/cart"],
    enabled: !!customer,
  });

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/restaurant">
              <h1 className="text-2xl font-bold text-gray-900">Delicious Eats</h1>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/restaurant" className="text-gray-700 hover:text-gray-900">Menu</Link>
            <Link href="/restaurant/about" className="text-gray-700 hover:text-gray-900">About</Link>
            <Link href="/restaurant/contact" className="text-gray-700 hover:text-gray-900">Contact</Link>
          </nav>

          <div className="flex items-center space-x-4">
            {customer ? (
              <>
                <Link href="/restaurant/cart" className="relative">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{customer.name}</span>
                  <Button variant="ghost" size="sm" onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={onLoginClick} size="sm">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function RestaurantApp() {
  const [location] = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { customer, isLoading } = useOnlineAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the sub-path after /restaurant
  const getSubPath = (fullPath: string) => {
    if (fullPath === "/restaurant") return "/restaurant";
    if (fullPath.startsWith("/restaurant/")) return fullPath;
    return "/restaurant";
  };

  const currentPath = getSubPath(location);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/online/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online/me"] });
      queryClient.removeQueries({ queryKey: ["/api/online/cart"] });
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantHeader
        customer={customer}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {}}
      />

      <main>
        {currentPath === "/restaurant" && <MenuPage customer={customer} onLoginRequired={() => setShowLoginModal(true)} />}
        {currentPath === "/restaurant/cart" && <CartPage customer={customer} />}
        {currentPath === "/restaurant/about" && <AboutPage />}
        {currentPath === "/restaurant/contact" && <ContactPage />}
      </main>
    </div>
  );
}

function MenuPage({ customer, onLoginRequired }: { customer: OnlineCustomer | null | undefined; onLoginRequired: () => void }) {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/online/menu"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; price: string }) => {
      const response = await fetch("/api/online/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online/cart"] });
      toast({
        title: "Success",
        description: "Item added to cart!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (product: Product) => {
    if (!customer) {
      onLoginRequired();
      return;
    }

    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      price: product.price,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const categoryName = product.category?.name || "Other";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
        <p className="text-xl text-gray-600">Fresh, delicious food delivered to your door</p>
      </div>

      {/* Menu Categories */}
      {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
        <div key={categoryName} className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{categoryName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                {product.image && (
                  <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <span className="text-lg font-bold text-green-600">Rs {product.price}</span>
                  </div>
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  )}
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    disabled={addToCartMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Menu items will be available soon!</p>
        </div>
      )}
    </div>
  );
}

function CartPage({ customer }: { customer: OnlineCustomer | null | undefined }) {
  const [location, setLocation] = useLocation();
  const [orderType, setOrderType] = useState("takeaway");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/online/cart"],
    enabled: !!customer,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateCartMutation = useMutation({
    mutationFn: async (data: { id: number; quantity: number }) => {
      const response = await fetch(`/api/online/cart/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: data.quantity }),
      });
      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online/cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/online/cart/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error('Failed to remove cart item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online/cart"] });
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/online/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/online/cart"] });
      toast({
        title: "Order Placed!",
        description: `Your order #${data.orderId} has been placed successfully. Estimated delivery time: ${data.estimatedTime} minutes.`,
      });
      setLocation("/restaurant");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!customer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Please login to view your cart.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCartMutation.mutate(item.id);
    } else {
      updateCartMutation.mutate({ id: item.id, quantity: newQuantity });
    }
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;

    placeOrderMutation.mutate({
      orderType,
      specialInstructions,
      deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
      customerPhone,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link href="/restaurant">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Items</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-gray-600">Rs {item.price} each</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromCartMutation.mutate(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["takeaway", "delivery", "dine-in"].map((type) => (
                    <Button
                      key={type}
                      variant={orderType === type ? "default" : "outline"}
                      onClick={() => setOrderType(type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {orderType === "delivery" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your delivery address"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Your contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests or dietary requirements"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs {total.toFixed(2)}</span>
              </div>
              {orderType === "delivery" && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>Rs 50.00</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>Rs {(total + (orderType === "delivery" ? 50 : 0)).toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handlePlaceOrder}
              className="w-full mt-4"
              disabled={placeOrderMutation.isPending || (orderType === "delivery" && !deliveryAddress)}
            >
              {placeOrderMutation.isPending ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About Delicious Eats</h1>
      <div className="prose max-w-none">
        <p className="text-lg text-gray-600 mb-6">
          Welcome to Delicious Eats, where we bring you the finest cuisine with fresh ingredients and authentic flavors.
          Our team of expert chefs creates memorable dining experiences, whether you're dining in, taking away, or having
          your meal delivered to your doorstep.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-8">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-primary-600" />
            <h3 className="text-lg font-semibold mb-2">Fast Service</h3>
            <p className="text-gray-600">Quick preparation and delivery without compromising quality</p>
          </div>
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-primary-600" />
            <h3 className="text-lg font-semibold mb-2">Wide Delivery</h3>
            <p className="text-gray-600">We deliver to most areas in the city</p>
          </div>
          <div className="text-center">
            <Phone className="h-12 w-12 mx-auto mb-4 text-primary-600" />
            <h3 className="text-lg font-semibold mb-2">Great Support</h3>
            <p className="text-gray-600">24/7 customer service for all your needs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-primary-600" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-primary-600" />
              <span>123 Food Street, Culinary District, City 12345</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-primary-600" />
              <div>
                <p>Monday - Friday: 11:00 AM - 10:00 PM</p>
                <p>Saturday - Sunday: 12:00 PM - 11:00 PM</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Send us a Message</h2>
          <form className="space-y-4">
            <Input placeholder="Your Name" />
            <Input type="email" placeholder="Your Email" />
            <Textarea placeholder="Your Message" rows={4} />
            <Button className="w-full">Send Message</Button>
          </form>
        </div>
      </div>
    </div>
  );
}