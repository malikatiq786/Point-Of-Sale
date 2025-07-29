import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import PosLayout from "@/layouts/app/pos-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, ShoppingCart, Minus, Plus, Trash2, CreditCard, DollarSign, 
  Smartphone, Percent, Calculator, Receipt, Printer, QrCode, 
  User, Edit3, X, Check, Tag, Gift, AlertCircle, CheckCircle, Settings
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  category?: string;
}

interface Customer {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
}

interface PaymentDetails {
  method: 'cash' | 'card' | 'mobile' | 'qr';
  amountReceived: number;
  change: number;
}

interface Register {
  id: number;
  name: string;
  code: string;
  branchId: number;
  branchName?: string;
  openingBalance: string | number; // Can be string from database
  currentBalance: string | number; // Can be string from database
  isActive: boolean;
  lastOpened?: string;
  lastClosed?: string;
}

interface DiscountState {
  type: 'percentage' | 'fixed';
  value: number;
  applyTo: 'total' | 'item';
}

interface InvoiceData {
  id: string;
  date: string;
  time: string;
  cashier: string;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  grandTotal: number;
  payment: PaymentDetails;
}

export default function POSTerminal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Core state
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'qr'>("cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  
  // Customer management state
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  
  // Discount and tax state
  const [discount, setDiscount] = useState<DiscountState>({ type: 'percentage', value: 0, applyTo: 'total' });
  const [taxRate, setTaxRate] = useState<number>(10); // 10% default tax
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);
  
  // Item editing state
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");

  // Register management state
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null);
  const [registerStatus, setRegisterStatus] = useState<'closed' | 'opening' | 'open'>('closed');
  const [cashDrawerBalance, setCashDrawerBalance] = useState(0);
  const [isRegisterSetupOpen, setIsRegisterSetupOpen] = useState(true); // Open by default

  // Fetch products
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: searchQuery ? ["/api/products?search=" + encodeURIComponent(searchQuery)] : ["/api/products"],
    retry: false,
  });

  // Fetch registers
  const { data: registers = [] } = useQuery<Register[]>({
    queryKey: ['/api/registers'],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Get selected register info
  const selectedRegister = registers.find((r) => r.id === selectedRegisterId);

  // Register opening balance validation
  const openRegister = (registerId: number, openingBalance: number) => {
    const register = registers.find((r) => r.id === registerId);
    if (!register) {
      toast({
        title: "Error",
        description: "Register not found",
        variant: "destructive",
      });
      return;
    }

    // Validate opening balance matches register's expected opening balance
    const expectedBalance = parseFloat(String(register.openingBalance));
    if (Math.abs(openingBalance - expectedBalance) > 0.01) {
      toast({
        title: "Opening Balance Mismatch",
        description: `Expected: $${expectedBalance.toFixed(2)}, Entered: $${openingBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setSelectedRegisterId(registerId);
    setCashDrawerBalance(openingBalance);
    setRegisterStatus('open');
    setIsRegisterSetupOpen(false);
    
    toast({
      title: "Register Opened",
      description: `${register.name} is now open with $${openingBalance.toFixed(2)}`,
    });
  };

  const closeRegister = () => {
    if (!selectedRegister) return;
    
    setSelectedRegisterId(null);
    setCashDrawerBalance(0);
    setRegisterStatus('closed');
    
    toast({
      title: "Register Closed",
      description: `${selectedRegister.name} has been closed`,
    });
    
    // Redirect to dashboard after closing register
    setTimeout(() => {
      setLocation('/');
    }, 1500); // Give time for toast to show
  };

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
      setSelectedCustomerId(null);
      setAmountReceived(0);
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

  // Create customer ledger entry mutation
  const createLedgerMutation = useMutation({
    mutationFn: async (ledgerData: any) => {
      await apiRequest("POST", "/api/customer-ledgers", ledgerData);
    },
    onSuccess: () => {
      toast({
        title: "Ledger Updated",
        description: "Customer balance has been updated",
      });
    },
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      return await apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Customer Added",
        description: "New customer has been added successfully",
      });
      setSelectedCustomerId(data.id);
      setNewCustomer({ name: "", phone: "", email: "" });
      setShowAddCustomerDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    },
  });

  // Enhanced cart operations
  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, 1);
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
        total: defaultPrice,
        discount: 0,
        discountType: 'percentage',
        tax: 0,
        category: product.category?.name || 'General'
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
        const baseTotal = newQuantity * item.price;
        const discountAmount = item.discountType === 'percentage' 
          ? baseTotal * (item.discount || 0) / 100
          : (item.discount || 0);
        const afterDiscount = baseTotal - discountAmount;
        const taxAmount = afterDiscount * (taxRate / 100);
        
        return { 
          ...item, 
          quantity: newQuantity, 
          total: afterDiscount + taxAmount,
          tax: taxAmount
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const updateItemPrice = (id: number, newPrice: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const baseTotal = item.quantity * newPrice;
        const discountAmount = item.discountType === 'percentage' 
          ? baseTotal * (item.discount || 0) / 100
          : (item.discount || 0);
        const afterDiscount = baseTotal - discountAmount;
        const taxAmount = afterDiscount * (taxRate / 100);
        
        return { 
          ...item, 
          price: newPrice,
          total: afterDiscount + taxAmount,
          tax: taxAmount
        };
      }
      return item;
    }));
  };

  const applyItemDiscount = (id: number, discountValue: number, discountType: 'percentage' | 'fixed') => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const baseTotal = item.quantity * item.price;
        const discountAmount = discountType === 'percentage' 
          ? baseTotal * discountValue / 100
          : discountValue;
        const afterDiscount = Math.max(0, baseTotal - discountAmount);
        const taxAmount = afterDiscount * (taxRate / 100);
        
        return { 
          ...item, 
          discount: discountValue,
          discountType,
          total: afterDiscount + taxAmount,
          tax: taxAmount
        };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Enhanced calculations
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const getItemDiscountTotal = () => {
    return cart.reduce((sum, item) => {
      const baseTotal = item.quantity * item.price;
      const discountAmount = item.discountType === 'percentage' 
        ? baseTotal * (item.discount || 0) / 100
        : (item.discount || 0);
      return sum + discountAmount;
    }, 0);
  };

  const getGlobalDiscountAmount = () => {
    const subtotal = getSubtotal() - getItemDiscountTotal();
    return discount.type === 'percentage' 
      ? subtotal * discount.value / 100
      : discount.value;
  };

  const getTotalAfterDiscount = () => {
    return Math.max(0, getSubtotal() - getItemDiscountTotal() - getGlobalDiscountAmount());
  };

  const getTaxAmount = () => {
    return getTotalAfterDiscount() * (taxRate / 100);
  };

  const getGrandTotal = () => {
    return getTotalAfterDiscount() + getTaxAmount();
  };

  const getChange = () => {
    return Math.max(0, amountReceived - getGrandTotal());
  };

  const processSale = async () => {
    if (registerStatus !== 'open' || !selectedRegister) {
      toast({
        title: "Register Closed",
        description: "Please open a register before processing sales",
        variant: "destructive",
      });
      setIsRegisterSetupOpen(true);
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before processing sale",
        variant: "destructive",
      });
      return;
    }

    const grandTotal = getGrandTotal();
    const isWalkInCustomer = !selectedCustomerId;
    const paidAmount = paymentMethod === 'cash' ? amountReceived : grandTotal;
    const unpaidAmount = grandTotal - paidAmount;
    
    // Validation for walk-in customers: must pay in full
    if (isWalkInCustomer && paymentMethod === 'cash' && paidAmount < grandTotal) {
      toast({
        title: "Payment Required",
        description: "Walk-in customers must pay the full amount",
        variant: "destructive",
      });
      return;
    }

    // For registered customers with partial payment, validate customer selection
    if (unpaidAmount > 0 && !selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for partial payments",
        variant: "destructive",
      });
      return;
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    
    // Generate invoice data
    const invoiceData: InvoiceData = {
      id: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      cashier: (user as any)?.name || 'Cashier',
      customer: selectedCustomer || { name: 'Walk-in Customer' },
      items: cart,
      subtotal: getSubtotal(),
      totalDiscount: getItemDiscountTotal() + getGlobalDiscountAmount(),
      tax: getTaxAmount(),
      grandTotal: grandTotal,
      payment: {
        method: paymentMethod,
        amountReceived: paidAmount,
        change: paymentMethod === 'cash' ? Math.max(0, paidAmount - grandTotal) : 0
      }
    };

    const saleData = {
      totalAmount: grandTotal,
      paidAmount: paidAmount,
      status: unpaidAmount > 0 ? "pending" : "completed",
      paymentMethod,
      customerId: selectedCustomerId,
      customer: selectedCustomer || { name: 'Walk-in Customer' },
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        price: item.price,
        discount: item.discount,
        total: item.total
      }))
    };

    try {
      // Process the sale
      await processSaleMutation.mutateAsync(saleData);
      
      // If there's an unpaid amount and customer is selected, create ledger entry
      if (unpaidAmount > 0 && selectedCustomerId) {
        const ledgerData = {
          customerId: selectedCustomerId,
          amount: unpaidAmount.toFixed(2),
          type: 'debit',
          reference: invoiceData.id,
          description: `Unpaid amount for sale ${invoiceData.id}`
        };
        
        await createLedgerMutation.mutateAsync(ledgerData);
        
        toast({
          title: "Partial Payment Processed",
          description: `$${unpaidAmount.toFixed(2)} added to customer ledger`,
        });
      }
      
      // Store invoice for printing
      setLastInvoice(invoiceData);
      setShowInvoice(true);
      
      // Reset form
      setDiscount({ type: 'percentage', value: 0, applyTo: 'total' });
      setShowPaymentDialog(false);
      
    } catch (error) {
      console.error('Transaction processing error:', error);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId(null);
    setAmountReceived(0);
    setDiscount({ type: 'percentage', value: 0, applyTo: 'total' });
  };

  const printInvoice = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'height=600,width=400');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { text-align: left; padding: 2px 4px; }
                .qty { width: 20px; }
                .price { width: 60px; text-align: right; }
                .total { width: 60px; text-align: right; }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <PosLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className={`max-w-7xl mx-auto ${registerStatus !== 'open' ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 rounded-full p-3">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Modern POS Terminal</h1>
                <p className="text-gray-500">Advanced point of sale system with full features</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Register Status */}
              <div className="flex items-center space-x-2">
                {registerStatus === 'open' && selectedRegister ? (
                  <Badge variant="default" className="bg-green-500 text-white px-3 py-1">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {selectedRegister.name} - ${cashDrawerBalance.toFixed(2)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 px-3 py-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Register Closed
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => registerStatus === 'open' ? closeRegister() : setIsRegisterSetupOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>{registerStatus === 'open' ? 'Close Register' : 'Open Register'}</span>
                </Button>
              </div>
              
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 px-3 py-1">
                {(user as any)?.name || 'Cashier'} • Staff
              </Badge>
              <Button 
                variant="outline" 
                onClick={clearCart}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search products by name, barcode, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Available Products
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
                    ))
                  ) : (
                    products.map((product: any) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        onClick={() => addToCart(product)}
                        className="h-auto p-4 rounded-xl border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center space-y-2"
                      >
                        <div className="text-sm font-semibold text-center truncate w-full">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.category?.name || 'General'}
                        </div>
                        <div className="text-sm font-bold text-blue-600">
                          ${(product.category?.name === 'Electronics' ? 599.99 : 
                             product.category?.name === 'Food & Beverages' ? 2.99 :
                             product.category?.name === 'Clothing' ? 79.99 : 19.99).toFixed(2)}
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shopping Cart Table */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Cart Items ({cart.length} items)
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Subtotal: ${getSubtotal().toFixed(2)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Cart is empty</p>
                    <p className="text-xs">Add products to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">Product</th>
                          <th className="text-center py-2 px-2 text-sm font-medium text-gray-600">Qty</th>
                          <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">Price</th>
                          <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">Total</th>
                          <th className="text-center py-2 px-2 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <div>
                                <div className="font-medium text-sm text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.category}</div>
                                {item.discount && item.discount > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    -{item.discountType === 'percentage' ? `${item.discount}%` : `$${item.discount}`} discount
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-6 h-6 p-0 rounded-full"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                
                                {editingItem === item.id ? (
                                  <Input
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    onBlur={() => {
                                      const newQty = parseInt(editQuantity) || 1;
                                      updateQuantity(item.id, newQty - item.quantity);
                                      setEditingItem(null);
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        const newQty = parseInt(editQuantity) || 1;
                                        updateQuantity(item.id, newQty - item.quantity);
                                        setEditingItem(null);
                                      }
                                    }}
                                    className="w-12 h-6 text-center text-sm rounded-lg"
                                    autoFocus
                                  />
                                ) : (
                                  <span 
                                    className="w-8 text-center font-medium text-sm cursor-pointer hover:bg-gray-200 rounded px-1 min-w-[32px]"
                                    onClick={() => {
                                      setEditingItem(item.id);
                                      setEditQuantity(item.quantity.toString());
                                    }}
                                  >
                                    {item.quantity}
                                  </span>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-6 h-6 p-0 rounded-full"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right">
                              {editingItem === item.id ? (
                                <Input
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  onBlur={() => {
                                    const newPrice = parseFloat(editPrice) || item.price;
                                    updateItemPrice(item.id, newPrice);
                                    setEditingItem(null);
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const newPrice = parseFloat(editPrice) || item.price;
                                      updateItemPrice(item.id, newPrice);
                                      setEditingItem(null);
                                    }
                                  }}
                                  className="w-20 h-6 text-xs text-right rounded"
                                  autoFocus
                                />
                              ) : (
                                <span 
                                  className="text-sm font-medium cursor-pointer hover:bg-gray-200 rounded px-1"
                                  onClick={() => {
                                    setEditingItem(item.id);
                                    setEditPrice(item.price.toString());
                                  }}
                                >
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="font-semibold text-sm text-gray-900">
                                ${item.total.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <div className="flex justify-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const discountValue = prompt(`Enter discount for ${item.name}:`);
                                    if (discountValue) {
                                      const isPercentage = discountValue.includes('%');
                                      const value = parseFloat(discountValue.replace('%', ''));
                                      if (!isNaN(value)) {
                                        applyItemDiscount(item.id, value, isPercentage ? 'percentage' : 'fixed');
                                      }
                                    }
                                  }}
                                  className="text-blue-600 hover:bg-blue-50 w-6 h-6 p-0"
                                  title="Apply Discount"
                                >
                                  <Percent className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-red-500 hover:bg-red-50 w-6 h-6 p-0"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Cart & Checkout */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Select Customer</Label>
                    <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          <Plus className="w-4 h-4 mr-1" />
                          Add New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newCustomerName">Name *</Label>
                            <Input
                              id="newCustomerName"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                              placeholder="Customer name"
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newCustomerPhone">Phone</Label>
                            <Input
                              id="newCustomerPhone"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                              placeholder="Phone number"
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newCustomerEmail">Email</Label>
                            <Input
                              id="newCustomerEmail"
                              value={newCustomer.email}
                              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                              placeholder="Email address"
                              className="rounded-xl"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => setShowAddCustomerDialog(false)}
                              variant="outline"
                              className="flex-1 rounded-xl"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => {
                                if (newCustomer.name.trim()) {
                                  addCustomerMutation.mutate(newCustomer);
                                }
                              }}
                              disabled={!newCustomer.name.trim() || addCustomerMutation.isPending}
                              className="flex-1 rounded-xl"
                            >
                              {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Customer Search */}
                  <Input
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="rounded-xl"
                  />
                  
                  <Select 
                    value={selectedCustomerId?.toString() || "walk-in"} 
                    onValueChange={(value) => setSelectedCustomerId(value === "walk-in" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers
                        .filter((customer) => 
                          customerSearchQuery === "" || 
                          customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                          (customer.phone && customer.phone.includes(customerSearchQuery))
                        )
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id!.toString()}>
                            {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Display selected customer info */}
                  <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg">
                    {selectedCustomerId ? (
                      (() => {
                        const customer = customers.find(c => c.id === selectedCustomerId);
                        return customer ? (
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            {customer.phone && <div className="text-gray-600">{customer.phone}</div>}
                            {customer.email && <div className="text-gray-600">{customer.email}</div>}
                            <div className="text-xs text-blue-600 mt-1">✓ Partial payments allowed</div>
                          </div>
                        ) : null;
                      })()
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">Walk-in Customer</div>
                        <div className="text-xs text-orange-600 mt-1">⚠ Full payment required</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Discount & Tax Controls */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Global Discount */}
                <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl justify-between">
                      <span className="flex items-center">
                        <Gift className="w-4 h-4 mr-2" />
                        Total Discount
                      </span>
                      <span className="text-blue-600">
                        {discount.value > 0 ? 
                          (discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`) 
                          : 'None'
                        }
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Apply Total Discount</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Discount Type</Label>
                        <Select value={discount.type} onValueChange={(value: 'percentage' | 'fixed') => 
                          setDiscount({ ...discount, type: value })
                        }>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          value={discount.value}
                          onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                          placeholder={discount.type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                          className="rounded-xl"
                        />
                      </div>
                      <Button 
                        onClick={() => setShowDiscountDialog(false)}
                        className="w-full rounded-xl"
                      >
                        Apply Discount
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Tax Rate */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-sm text-center rounded-lg"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Total Summary */}
            <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm opacity-90">
                    <span>Subtotal:</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  {(getItemDiscountTotal() + getGlobalDiscountAmount()) > 0 && (
                    <div className="flex justify-between text-sm opacity-90">
                      <span>Total Discounts:</span>
                      <span>-${(getItemDiscountTotal() + getGlobalDiscountAmount()).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm opacity-90">
                    <span>Tax ({taxRate}%):</span>
                    <span>${getTaxAmount().toFixed(2)}</span>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between text-xl font-bold">
                    <span>TOTAL:</span>
                    <span>${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cash')}
                    className="rounded-xl"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className="rounded-xl"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('mobile')}
                    className="rounded-xl"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Mobile
                  </Button>
                  <Button
                    variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('qr')}
                    className="rounded-xl"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </Button>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Amount Received</Label>
                      <Input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                        placeholder="Enter amount received"
                        className="rounded-xl h-12 text-lg text-center"
                        step="0.01"
                      />
                    </div>
                    {amountReceived > 0 && (
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Change Due:</span>
                          <span className="text-lg font-bold text-green-800">
                            ${getChange().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Amount Buttons for Cash */}
                {paymentMethod === 'cash' && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[5, 10, 20, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmountReceived(amountReceived + amount)}
                        className="rounded-lg text-xs"
                      >
                        +${amount}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountReceived(getGrandTotal())}
                      className="rounded-lg text-xs col-span-1 bg-blue-50 text-blue-600 border-blue-200"
                    >
                      Exact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Process Sale Button */}
            <Button
              onClick={processSale}
              disabled={cart.length === 0 || processSaleMutation.isPending}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
            >
              {processSaleMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <Check className="w-6 h-6 mr-2" />
                  Complete Sale
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Invoice Modal */}
        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Sale Complete</span>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={printInvoice}
                  className="rounded-xl"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            {lastInvoice && (
              <div ref={printRef} className="space-y-4">
                <div className="text-center border-b pb-4">
                  <div className="bold text-lg">UNIVERSAL POS SYSTEM</div>
                  <div className="text-sm">Modern Point of Sale</div>
                  <div className="divider"></div>
                  <div className="text-sm">
                    Invoice: {lastInvoice.id}<br/>
                    Date: {lastInvoice.date} {lastInvoice.time}<br/>
                    Cashier: {lastInvoice.cashier}
                  </div>
                  {lastInvoice.customer && (
                    <div className="text-sm">
                      Customer: {lastInvoice.customer.name}<br/>
                      {lastInvoice.customer.phone && `Phone: ${lastInvoice.customer.phone}`}
                    </div>
                  )}
                  <div className="divider"></div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="qty center">Qty</th>
                      <th className="price">Price</th>
                      <th className="total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="center">{item.quantity}</td>
                        <td className="right">${item.price.toFixed(2)}</td>
                        <td className="right">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="divider"></div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${lastInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {lastInvoice.totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${lastInvoice.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${lastInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="divider"></div>
                  <div className="flex justify-between bold text-lg">
                    <span>TOTAL:</span>
                    <span>${lastInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="divider"></div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{lastInvoice.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Received:</span>
                    <span>${lastInvoice.payment.amountReceived.toFixed(2)}</span>
                  </div>
                  {lastInvoice.payment.change > 0 && (
                    <div className="flex justify-between bold">
                      <span>Change:</span>
                      <span>${lastInvoice.payment.change.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="divider"></div>
                <div className="center text-sm">
                  Thank you for your business!<br/>
                  Please come again
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Register Setup Dialog - Required on POS Terminal Load */}
        <Dialog open={isRegisterSetupOpen} onOpenChange={(open) => {
          // Only allow closing if register is open
          if (!open && registerStatus === 'open') {
            setIsRegisterSetupOpen(false);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-lg">
                <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
                Register Setup Required
              </DialogTitle>
              <div className="text-sm text-gray-600 mt-2">
                You must open a register with verified opening balance before using the POS terminal.
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Select Register</Label>
                <Select 
                  value={selectedRegisterId?.toString() || ""} 
                  onValueChange={(value) => setSelectedRegisterId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a register" />
                  </SelectTrigger>
                  <SelectContent>
                    {registers
                      .filter((register) => register.isActive)
                      .map((register) => (
                      <SelectItem key={register.id} value={register.id.toString()}>
                        {register.name} ({register.branchName}) - Expected: ${parseFloat(String(register.openingBalance)).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRegisterId && (
                <div>
                  <Label>Opening Balance Verification</Label>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Expected Opening Balance:</strong> ${parseFloat(String(selectedRegister?.openingBalance || 0)).toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Please count the cash drawer and confirm this amount matches
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter actual cash amount"
                      value={cashDrawerBalance}
                      onChange={(e) => setCashDrawerBalance(parseFloat(e.target.value) || 0)}
                      className="text-lg font-semibold text-center"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => openRegister(selectedRegisterId!, cashDrawerBalance)}
                  disabled={!selectedRegisterId || cashDrawerBalance === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Open Register & Start POS
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </PosLayout>
  );
}
