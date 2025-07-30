import React, { useState, useRef } from "react";
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
import { useCurrency } from "@/hooks/useCurrency";
import { 
  Search, ShoppingCart, Minus, Plus, Trash2, CreditCard, DollarSign, 
  Smartphone, Percent, Calculator, Receipt, Printer, QrCode, 
  User, Edit3, X, Check, Tag, Gift, AlertCircle, CheckCircle, Settings, Package, RotateCcw
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
  const { formatCurrencyValue, defaultCurrency } = useCurrency();
  
  // Core state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'qr'>("cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [isChangeEditable, setIsChangeEditable] = useState(false);
  
  // Customer management state
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

  // Layout management state
  const [posLayout, setPosLayout] = useState<'grid' | 'search'>('grid');

  // Enhanced search functionality with autocomplete
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim().length > 0 && products && products.length > 0) {
      // Get suggestions based on partial matches
      const suggestions = products.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(value.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(value.toLowerCase())) ||
        (product.category?.name && product.category.name.toLowerCase().includes(value.toLowerCase())) ||
        (product.brand?.name && product.brand.name.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 8); // Limit to 8 suggestions
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Enhanced search keyboard handler
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
          const selectedProduct = searchSuggestions[selectedSuggestionIndex];
          addToCart(selectedProduct);
          setSearchQuery("");
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        setSearchQuery("");
        break;
    }
  };

  // Global keyboard shortcuts handler
  const handleGlobalKeyPress = (e: KeyboardEvent) => {
    // Only handle shortcuts when not in input fields
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'enter':
        e.preventDefault();
        if (cart.length > 0 && registerStatus === 'open') {
          // Open payment dialog for amount entry
          setShowPaymentDialog(true);
          // Set default amount to grand total for quick processing
          setAmountReceived(getGrandTotal());
        } else if (cart.length === 0) {
          toast({
            title: "Empty Cart",
            description: "Add items to cart before completing sale",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Register Closed",
            description: "Please open a register before processing sales",
            variant: "destructive",
          });
        }
        break;
      case 'escape':
        e.preventDefault();
        resetAll();
        break;
      case 'f2':
        e.preventDefault();
        setShowDiscountDialog(true);
        break;
      case 'f3':
        e.preventDefault();
        if (cart.length > 0) {
          removeFromCart(cart[cart.length - 1].id);
        }
        break;
      case 'f8':
        e.preventDefault();
        triggerSearch();
        break;
    }
  };

  // Reset all function
  const resetAll = () => {
    setCart([]);
    setSearchQuery('');
    setSearchResults([]);
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setSelectedCustomerId(null);
    setAmountReceived(0);
    setChangeAmount(0);
    setDiscount({ type: 'percentage', value: 0, applyTo: 'total' });
    setShowPaymentDialog(false);
    setShowDiscountDialog(false);
    setShowCustomerDialog(false);
    setShowInvoice(false);
    toast({
      title: "Reset Complete",
      description: "All data has been cleared",
    });
  };

  // Add global keyboard listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyPress);
    return () => document.removeEventListener('keydown', handleGlobalKeyPress);
  }, [cart]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      
      if (!products || products.length === 0) {
        console.log('No products available for search');
        return;
      }
      
      const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.category?.name && product.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.brand?.name && product.brand.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      console.log(`Search for "${searchQuery}" found ${filteredProducts.length} products`);
      setSearchResults(filteredProducts);
      setShowSuggestions(false);
      
      // If exactly one result, automatically add to cart and clear search
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchResults([]);
        setSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Manual search trigger for Find Now button
  const triggerSearch = () => {
    if (searchQuery.trim()) {
      handleSearchKeyPress({ key: 'Enter', preventDefault: () => {} } as any);
    }
  };

  // Select suggestion and add to cart or search
  const selectSuggestion = (product: any) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    addToCart(product);
    setSearchQuery(''); // Clear after adding
  };

  const addFromSearchResults = (product: any) => {
    addToCart(product);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Register management state
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(null);
  const [registerStatus, setRegisterStatus] = useState<'closed' | 'opening' | 'open'>('closed');
  const [cashDrawerBalance, setCashDrawerBalance] = useState(0);
  const [isRegisterSetupOpen, setIsRegisterSetupOpen] = useState(true); // Show register setup when closed

  // Fetch all products (no server-side search)
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
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

  // Fetch customer ledger balance for selected customer
  const { data: customerLedgerData } = useQuery<any[]>({
    queryKey: ['/api/customer-ledgers'],
    enabled: !!selectedCustomerId,
  });

  // Filter customer ledger for selected customer
  const customerLedger = customerLedgerData?.filter(entry => entry.customerId === selectedCustomerId) || [];

  // Calculate customer's current balance (debit - credit)
  const getCustomerBalance = () => {
    if (!selectedCustomerId || !Array.isArray(customerLedger) || customerLedger.length === 0) {
      console.log('Customer Balance Debug: No ledger data', { selectedCustomerId, customerLedger });
      return 0;
    }
    
    const balance = customerLedger.reduce((balance: number, entry: any) => {
      const amount = parseFloat(entry.amount) || 0;
      return entry.type === 'debit' ? balance + amount : balance - amount;
    }, 0);
    
    console.log('Customer Balance Debug: Calculated balance', { selectedCustomerId, customerLedger, balance });
    return balance;
  };

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
        description: `Expected: ${formatCurrencyValue(expectedBalance)}, Entered: ${formatCurrencyValue(openingBalance)}`,
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
      description: `${register.name} is now open with ${formatCurrencyValue(openingBalance)}`,
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
    if (registerStatus !== 'open') {
      toast({
        title: "Register Closed",
        description: "Please open a register before adding products to cart",
        variant: "destructive",
      });
      setIsRegisterSetupOpen(true);
      return;
    }
    
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
    if (isChangeEditable) {
      return changeAmount;
    }
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
    const overpaidAmount = paidAmount > grandTotal ? paidAmount - grandTotal : 0;
    
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
      
      // Handle ledger entries - both underpayment and overpayment are handled by the backend
      if (unpaidAmount > 0 && selectedCustomerId) {
        toast({
          title: "Partial Payment Processed",
          description: `$${unpaidAmount.toFixed(2)} added to customer ledger`,
        });
      } else if (overpaidAmount > 0 && selectedCustomerId) {
        toast({
          title: "Overpayment Credit Added",
          description: `$${overpaidAmount.toFixed(2)} credit added to customer ledger`,
        });
      }
      
      // Store invoice for printing
      setLastInvoice(invoiceData);
      setShowInvoice(true);
      
      // Auto-print invoice
      setTimeout(() => {
        printInvoice();
        toast({
          title: "Sale Completed!",
          description: `Invoice ${invoiceData.id} processed. Press ESC to start new sale.`,
        });
      }, 500);
      
      // Reset form but keep cart for review
      setDiscount({ type: 'percentage', value: 0, applyTo: 'total' });
      setAmountReceived(0);
      setChangeAmount(0);
      setIsChangeEditable(false);
      setShowPaymentDialog(false);
      
    } catch (error) {
      console.error('Transaction processing error:', error);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId(null);
    setAmountReceived(0);
    setChangeAmount(0);
    setIsChangeEditable(false);
    setDiscount({ type: 'percentage', value: 0, applyTo: 'total' });
  };

  const printInvoice = () => {
    if (!lastInvoice) {
      toast({
        title: "No Invoice",
        description: "No invoice available to print",
        variant: "destructive",
      });
      return;
    }

    try {
      const printContent = `
        <div class="center">
          <div class="bold text-lg">UNIVERSAL POS SYSTEM</div>
          <div>Modern Point of Sale</div>
          <div class="divider"></div>
          <div>
            Invoice: ${lastInvoice.id}<br/>
            Date: ${lastInvoice.date} ${lastInvoice.time}<br/>
            Cashier: ${lastInvoice.cashier}
          </div>
          ${lastInvoice.customer ? `
            <div>
              Customer: ${lastInvoice.customer.name}<br/>
              ${lastInvoice.customer.phone ? `Phone: ${lastInvoice.customer.phone}<br/>` : ''}
              ${selectedCustomerId ? (() => {
                const balance = getCustomerBalance();
                console.log('Print Customer Balance Debug:', { selectedCustomerId, customerLedger, balance });
                if (balance !== 0) {
                  return `Previous Balance: ${balance > 0 
                    ? `${formatCurrencyValue(balance)} (Due)`
                    : `${formatCurrencyValue(Math.abs(balance))} (Credit)`}<br/>`;
                } else {
                  return `Previous Balance: ${formatCurrencyValue(0)} (Clear)<br/>`;
                }
              })() : ''}
            </div>
          ` : ''}
          <div class="divider"></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="center">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lastInvoice.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="center">${item.quantity}</td>
                <td class="right">${formatCurrencyValue(item.price)}</td>
                <td class="right">${formatCurrencyValue(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>
        
        <div>
          <div class="flex">
            <span>Subtotal:</span>
            <span class="right">${formatCurrencyValue(lastInvoice.subtotal)}</span>
          </div>
          ${lastInvoice.totalDiscount > 0 ? `
            <div class="flex">
              <span>Discount:</span>
              <span class="right">-${formatCurrencyValue(lastInvoice.totalDiscount)}</span>
            </div>
          ` : ''}
          <div class="flex">
            <span>Tax:</span>
            <span class="right">${formatCurrencyValue(lastInvoice.tax)}</span>
          </div>
          <div class="divider"></div>
          <div class="bold">
            <span>TOTAL:</span>
            <span class="right">${formatCurrencyValue(lastInvoice.grandTotal)}</span>
          </div>
        </div>

        <div class="divider"></div>
        
        <div>
          <div class="flex">
            <span>Payment (${lastInvoice.payment.method}):</span>
            <span class="right">${formatCurrencyValue(lastInvoice.payment.amountReceived)}</span>
          </div>
          ${lastInvoice.payment.change > 0 ? `
            <div class="flex">
              <span>Change:</span>
              <span class="right">${formatCurrencyValue(lastInvoice.payment.change)}</span>
            </div>
          ` : ''}
        </div>

        <div class="divider"></div>
        
        ${selectedCustomerId ? (() => {
          const previousBalance = getCustomerBalance();
          const unpaidAmount = lastInvoice.grandTotal - lastInvoice.payment.amountReceived;
          const newBalance = previousBalance + unpaidAmount;
          
          return `
            <div>
              <div class="center bold">CUSTOMER BALANCE STATUS</div>
              <div class="flex">
                <span>Previous Balance:</span>
                <span class="right">
                  ${previousBalance > 0 
                    ? `${formatCurrencyValue(previousBalance)} (Due)`
                    : previousBalance < 0 
                      ? `${formatCurrencyValue(Math.abs(previousBalance))} (Credit)`
                      : `${formatCurrencyValue(0)} (Clear)`}
                </span>
              </div>
              ${unpaidAmount > 0 ? `
                <div class="flex">
                  <span>This Sale (Unpaid):</span>
                  <span class="right">+${formatCurrencyValue(unpaidAmount)}</span>
                </div>
              ` : ''}
              <div class="divider"></div>
              <div class="bold flex">
                <span>NEW BALANCE:</span>
                <span class="right">
                  ${newBalance > 0 
                    ? `${formatCurrencyValue(newBalance)} (Due)`
                    : newBalance < 0 
                      ? `${formatCurrencyValue(Math.abs(newBalance))} (Credit)`
                      : `${formatCurrencyValue(0)} (Clear)`}
                </span>
              </div>
            </div>
          `;
        })() : ''}

        <div class="center" style="margin-top: 20px;">
          <div>Thank you for your business!</div>
          <div>Visit us again</div>
        </div>
      `;

      const printWindow = window.open('', '', 'height=600,width=400');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${lastInvoice.id}</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { text-align: left; padding: 2px 4px; border-bottom: 1px solid #eee; }
                .flex { display: flex; justify-content: space-between; margin: 2px 0; }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        
        toast({
          title: "Invoice Printed",
          description: "Invoice sent to printer successfully",
        });
      } else {
        toast({
          title: "Print Failed",
          description: "Unable to open print window",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: "Failed to print invoice",
        variant: "destructive",
      });
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
              {/* Layout Switcher */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={posLayout === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPosLayout('grid')}
                  className={`px-3 py-1 text-xs ${posLayout === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Package className="w-4 h-4 mr-1" />
                  Grid View
                </Button>
                <Button
                  variant={posLayout === 'search' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPosLayout('search')}
                  className={`px-3 py-1 text-xs ${posLayout === 'search' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Search View
                </Button>
              </div>
              
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

        {/* Traditional POS Layout - Full Width */}
        {posLayout === 'search' ? (
          <div className="w-full">
            {/* Full Traditional POS Interface - No Sidebar */}
            <div className="bg-white border border-gray-400 rounded-none shadow-sm min-h-96">
              {/* Top Customer Selection Bar */}
              <div className="bg-gray-100 border-b border-gray-400 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-bold text-gray-700">Find Customer By:</label>
                      <select className="text-xs border border-gray-300 px-2 py-1 rounded">
                        <option>Name</option>
                        <option>Phone</option>
                        <option>Email</option>
                      </select>
                      <span className="text-xs font-bold text-gray-700">Select Customer</span>
                      <select 
                        value={selectedCustomerId || ''} 
                        onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                        className="text-xs border border-gray-300 px-3 py-1 rounded w-48"
                      >
                        <option value="">Walk-in Customer</option>
                        {customers?.map((customer: any) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Customer Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                      onClick={() => setShowAddCustomerDialog(true)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Customer
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1">
                      <User className="w-3 h-3 mr-1" />
                      Customer History
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Payment On Account
                    </Button>
                  </div>
                </div>
                
                {/* Customer Details Row */}
                <div className="flex items-center mt-2 text-xs">
                  <span className="font-bold text-gray-700 mr-2">Customer:</span>
                  <span className="mr-6">
                    {selectedCustomerId 
                      ? customers?.find(c => c.id === selectedCustomerId)?.name || 'Unknown Customer'
                      : 'Walk-in Customer'
                    }
                  </span>
                  <span className="font-bold text-gray-700 mr-2">ID:</span>
                  <span className="mr-6">{selectedCustomerId || 'N/A'}</span>
                  <span className="font-bold text-gray-700 mr-2">Phone:</span>
                  <span className="mr-6">
                    {selectedCustomerId 
                      ? customers?.find(c => c.id === selectedCustomerId)?.phone || '-'
                      : '-'
                    }
                  </span>
                  <span className="font-bold text-gray-700 mr-2">Email:</span>
                  <span>
                    {selectedCustomerId 
                      ? customers?.find(c => c.id === selectedCustomerId)?.email || '-'
                      : '-'
                    }
                  </span>
                </div>
                <div className="text-xs mt-1">
                  <span className="font-bold text-gray-700 mr-2">Address:</span>
                  <span>
                    {selectedCustomerId 
                      ? customers?.find(c => c.id === selectedCustomerId)?.email || 'No email provided'
                      : 'No email for walk-in customer'
                    }
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-gray-50 border-b border-gray-400 p-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-gray-700">Find Item</label>
                    <select className="text-xs border border-gray-300 px-2 py-1 rounded">
                      <option>Scan Code</option>
                      <option>Item Name</option>
                      <option>Barcode</option>
                    </select>
                    <div className="relative">
                      <Input
                        placeholder="Enter item code or scan barcode..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="h-7 text-xs w-64 border-gray-300"
                        autoComplete="off"
                      />
                      
                      {/* Autocomplete Suggestions Dropdown */}
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded-md mt-1 z-50 max-h-64 overflow-y-auto">
                          {searchSuggestions.map((product, index) => (
                            <div
                              key={product.id}
                              className={`px-3 py-2 cursor-pointer text-xs border-b border-gray-100 last:border-b-0 ${
                                index === selectedSuggestionIndex 
                                  ? 'bg-blue-100 border-blue-200' 
                                  : 'hover:bg-blue-50'
                              }`}
                              onClick={() => selectSuggestion(product)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-gray-500 text-xs">
                                    {product.category?.name} • {product.brand?.name}
                                    {product.barcode && <span> • {product.barcode}</span>}
                                  </div>
                                </div>
                                <div className="text-blue-600 font-medium">
                                  {product.category?.name === 'Electronics' ? '$599.99' : 
                                   product.category?.name === 'Food & Beverages' ? '$2.99' :
                                   product.category?.name === 'Clothing' ? '$79.99' : '$19.99'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="text-xs px-3 py-1 h-7" onClick={triggerSearch}>
                      Find Now
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7" onClick={triggerSearch}>
                      <Search className="w-3 h-3 mr-1" />
                      F8-Search
                    </Button>
                  </div>
                  
                  {/* Right Side Buttons */}
                  <div className="flex items-center space-x-2 ml-auto">
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7">
                      <Receipt className="w-3 h-3 mr-1" />
                      No Sale
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7">
                      <Printer className="w-3 h-3 mr-1" />
                      Print
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7" onClick={() => setPosLayout('grid')}>
                      <X className="w-3 h-3 mr-1" />
                      Exit
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-400">
                      <th className="text-left py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-12">Line</th>
                      <th className="text-left py-2 px-2 font-bold text-gray-800 border-r border-gray-300">Item Name</th>
                      <th className="text-left py-2 px-2 font-bold text-gray-800 border-r border-gray-300">Employee Name</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Quantity</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Discount</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Price</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Sub Total</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Sales Tax</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 w-20">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length > 0 ? (
                      cart.map((item: CartItem, index: number) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-blue-50">
                          <td className="py-1 px-2 text-center border-r border-gray-200">{index + 1}</td>
                          <td className="py-1 px-2 border-r border-gray-200">{item.name}</td>
                          <td className="py-1 px-2 border-r border-gray-200">No Employee</td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">{item.quantity}</td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">0.00</td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">{item.price.toFixed(2)}</td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">{item.total.toFixed(2)}</td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">{(item.total * 0.1).toFixed(2)}</td>
                          <td className="py-1 px-2 text-center">{(item.total + item.total * 0.1).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : searchResults.length > 0 ? (
                      searchResults.map((product: any, index: number) => {
                        const price = product.category?.name === 'Electronics' ? 599.99 : 
                                     product.category?.name === 'Food & Beverages' ? 2.99 :
                                     product.category?.name === 'Clothing' ? 79.99 : 19.99;
                        return (
                          <tr key={product.id} className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer" onClick={() => addFromSearchResults(product)}>
                            <td className="py-1 px-2 text-center border-r border-gray-200">{index + 1}</td>
                            <td className="py-1 px-2 border-r border-gray-200">{product.name}</td>
                            <td className="py-1 px-2 border-r border-gray-200">No Employee</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">1</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">0.00</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">{price.toFixed(2)}</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">{price.toFixed(2)}</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">{(price * 0.1).toFixed(2)}</td>
                            <td className="py-1 px-2 text-center">{(price + price * 0.1).toFixed(2)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-500">
                          {searchQuery ? 'No items found. Try different search terms.' : 'Enter item code or scan barcode to add items'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Toolbar */}
              <div className="bg-gray-100 border-t border-gray-400 p-2">
                <div className="flex justify-between">
                  {/* Left Side Buttons */}
                  <div className="flex space-x-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold">Line:</span>
                      <input type="number" defaultValue="3" className="w-8 h-6 text-xs text-center border border-gray-300" />
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs px-2 py-1 h-6 flex items-center hover:bg-blue-50"
                      onClick={() => setShowDiscountDialog(true)}
                    >
                      <div className="w-3 h-3 bg-blue-600 mr-1"></div>
                      F2-Discount
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs px-2 py-1 h-6 flex items-center hover:bg-red-50"
                      onClick={() => cart.length > 0 && removeFromCart(cart[cart.length - 1].id)}
                    >
                      <X className="w-3 h-3 mr-1 text-red-600" />
                      F3-Delete Line
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6 flex items-center hover:bg-green-50">
                      <RotateCcw className="w-3 h-3 mr-1 text-green-600" />
                      F4-Refund
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs px-2 py-1 h-6 flex items-center hover:bg-orange-50"
                      onClick={resetAll}
                    >
                      <Tag className="w-3 h-3 mr-1 text-orange-600" />
                      F5-Reset All
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6 flex items-center hover:bg-green-50">
                      <DollarSign className="w-3 h-3 mr-1 text-green-600" />
                      F6-Payout
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6 flex items-center hover:bg-blue-50">
                      <Calculator className="w-3 h-3 mr-1 text-blue-600" />
                      F7-Enter Qty
                    </Button>
                  </div>

                  {/* Right Side - Enhanced Totals */}
                  <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 text-white px-6 py-4 rounded-lg shadow-lg border border-blue-700">
                    <div className="space-y-3 min-w-[200px]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-100">Subtotal</span>
                        <span className="text-xl font-bold text-white">{formatCurrencyValue(getSubtotal())}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-100">Discount</span>
                        <span className="text-lg font-semibold text-green-300">-{formatCurrencyValue(getItemDiscountTotal() + getGlobalDiscountAmount())}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-100">Sales Tax (10%)</span>
                        <span className="text-lg font-semibold text-yellow-300">{formatCurrencyValue(getTaxAmount())}</span>
                      </div>
                      <div className="border-t border-blue-600 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-100">TOTAL</span>
                          <span className="text-3xl font-bold text-white tracking-wider">{formatCurrencyValue(getGrandTotal())}</span>
                        </div>
                      </div>
                      <div className="text-center mt-3">
                        <div className="text-xs text-blue-200">Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Row of Buttons */}
                <div className="flex space-x-1 mt-2">
                  <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6 flex items-center hover:bg-blue-50">
                    <Gift className="w-3 h-3 mr-1 text-blue-600" />
                    F9-Gift Card
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6 flex items-center hover:bg-green-50">
                    <Receipt className="w-3 h-3 mr-1 text-green-600" />
                    F10-Hold Invoice
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6 flex items-center hover:bg-blue-50">
                    <CheckCircle className="w-3 h-3 mr-1 text-blue-600" />
                    F11-Get Hold
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs px-4 py-1 h-6 flex items-center bg-green-600 hover:bg-green-700 text-white font-bold"
                    onClick={() => {
                      if (cart.length > 0) {
                        setShowPaymentDialog(true);
                      } else {
                        toast({
                          title: "Empty Cart",
                          description: "Add items to cart before completing sale",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    ENTER-Complete Sale
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs px-2 py-1 h-6 flex items-center bg-red-600 hover:bg-red-700 text-white border-red-600"
                    onClick={resetAll}
                  >
                    <X className="w-3 h-3 mr-1" />
                    ESC-Reset All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Grid Layout with Sidebar
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
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 h-12 text-lg rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="off"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Grid Layout - Products Grid */}
            <div>
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
                            {formatCurrencyValue(
                              product.category?.name === 'Electronics' ? 599.99 : 
                              product.category?.name === 'Food & Beverages' ? 2.99 :
                              product.category?.name === 'Clothing' ? 79.99 : 19.99
                            )}
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>





            {/* Shopping Cart Table */}
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Cart Items ({cart.length} items)
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Subtotal: {formatCurrencyValue(getSubtotal())}
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
                                    -{item.discountType === 'percentage' ? `${item.discount}%` : formatCurrencyValue(item.discount)} discount
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
                                  {formatCurrencyValue(item.price)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="font-semibold text-sm text-gray-900">
                                {formatCurrencyValue(item.total)}
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
                  
                  {/* Customer Dropdown Selection */}
                  <Select 
                    value={selectedCustomerId?.toString() || "walk-in"} 
                    onValueChange={(value) => setSelectedCustomerId(value === "walk-in" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select customer or walk-in sale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Sale (No Customer)</SelectItem>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            {customer.phone && (
                              <span className="text-xs text-gray-500">{customer.phone}</span>
                            )}
                          </div>
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
                          (discount.type === 'percentage' ? `${discount.value}%` : formatCurrencyValue(discount.value)) 
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
                            <SelectItem value="fixed">Fixed Amount ({defaultCurrency.symbol})</SelectItem>
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
                    <span>{formatCurrencyValue(getSubtotal())}</span>
                  </div>
                  {(getItemDiscountTotal() + getGlobalDiscountAmount()) > 0 && (
                    <div className="flex justify-between text-sm opacity-90">
                      <span>Total Discounts:</span>
                      <span>-{formatCurrencyValue(getItemDiscountTotal() + getGlobalDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm opacity-90">
                    <span>Tax ({taxRate}%):</span>
                    <span>{formatCurrencyValue(getTaxAmount())}</span>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between text-xl font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrencyValue(getGrandTotal())}</span>
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
                          <div className="flex items-center space-x-2">
                            {isChangeEditable ? (
                              <Input
                                type="number"
                                value={changeAmount}
                                onChange={(e) => setChangeAmount(parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-sm text-center"
                                step="0.01"
                              />
                            ) : (
                              <span className="text-lg font-bold text-green-800">
                                {formatCurrencyValue(getChange())}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!isChangeEditable) {
                                  setChangeAmount(getChange());
                                }
                                setIsChangeEditable(!isChangeEditable);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {amountReceived > getGrandTotal() && selectedCustomerId && (
                          <div className="text-xs text-blue-600 mt-1">
                            Overpayment will be added as credit to customer ledger
                          </div>
                        )}
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
                        +{formatCurrencyValue(amount)}
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
              disabled={cart.length === 0 || processSaleMutation.isPending || registerStatus !== 'open'}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
            >
              {processSaleMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : registerStatus !== 'open' ? (
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  Register Closed
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
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Processing
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrencyValue(getSubtotal())}</span>
                  </div>
                  {(getItemDiscountTotal() + getGlobalDiscountAmount()) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrencyValue(getItemDiscountTotal() + getGlobalDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax ({taxRate}%):</span>
                    <span>{formatCurrencyValue(getTaxAmount())}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrencyValue(getGrandTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <Label className="text-sm font-medium">Payment Method</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cash')}
                    className="rounded-xl"
                    size="sm"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className="rounded-xl"
                    size="sm"
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('mobile')}
                    className="rounded-xl"
                    size="sm"
                  >
                    <Smartphone className="w-4 h-4 mr-1" />
                    Mobile
                  </Button>
                  <Button
                    variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('qr')}
                    className="rounded-xl"
                    size="sm"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    QR Code
                  </Button>
                </div>
              </div>

              {/* Cash Payment Amount Input */}
              {paymentMethod === 'cash' && (
                <div>
                  <Label className="text-sm font-medium">Amount Received</Label>
                  <Input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount received"
                    className="rounded-xl h-12 text-lg text-center mt-2"
                    step="0.01"
                    autoFocus
                  />
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[10, 20, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmountReceived(amount)}
                        className="rounded-lg text-xs"
                      >
                        {formatCurrencyValue(amount)}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountReceived(getGrandTotal())}
                      className="rounded-lg text-xs col-span-2 bg-blue-50 text-blue-600 border-blue-200"
                    >
                      Exact Amount
                    </Button>
                  </div>

                  {/* Change Calculation */}
                  {amountReceived > 0 && (
                    <div className="bg-green-50 rounded-xl p-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Change Due:</span>
                        <span className="text-lg font-bold text-green-800">
                          {formatCurrencyValue(Math.max(0, amountReceived - getGrandTotal()))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Info Display */}
              {selectedCustomerId && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="text-sm text-blue-700">
                    Customer: {customers?.find(c => c.id === selectedCustomerId)?.name}
                  </div>
                  {paymentMethod === 'cash' && amountReceived < getGrandTotal() && (
                    <div className="text-xs text-blue-600 mt-1">
                      Remaining balance will be added to customer ledger
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setAmountReceived(0);
                  }}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={processSale}
                  disabled={
                    processSaleMutation.isPending || 
                    (paymentMethod === 'cash' && amountReceived <= 0) ||
                    (!selectedCustomerId && paymentMethod === 'cash' && amountReceived < getGrandTotal())
                  }
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  {processSaleMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      Complete Sale
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                      {lastInvoice.customer.phone && `Phone: ${lastInvoice.customer.phone}`}<br/>
                      {selectedCustomerId && (
                        <div className="mt-1 text-xs text-blue-700">
                          Previous Balance: {(() => {
                            const balance = getCustomerBalance();
                            console.log('Invoice Customer Balance Debug:', { selectedCustomerId, customerLedger, balance });
                            if (balance > 0) {
                              return `${formatCurrencyValue(balance)} (Due)`;
                            } else if (balance < 0) {
                              return `${formatCurrencyValue(Math.abs(balance))} (Credit)`;
                            } else {
                              return `${formatCurrencyValue(0)} (Clear)`;
                            }
                          })()}
                        </div>
                      )}
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
                        <td className="right">{formatCurrencyValue(item.price)}</td>
                        <td className="right">{formatCurrencyValue(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="divider"></div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrencyValue(lastInvoice.subtotal)}</span>
                  </div>
                  {lastInvoice.totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrencyValue(lastInvoice.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrencyValue(lastInvoice.tax)}</span>
                  </div>
                  <div className="divider"></div>
                  <div className="flex justify-between bold text-lg">
                    <span>TOTAL:</span>
                    <span>{formatCurrencyValue(lastInvoice.grandTotal)}</span>
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
                    <span>{formatCurrencyValue(lastInvoice.payment.amountReceived)}</span>
                  </div>
                  {lastInvoice.payment.change > 0 && (
                    <div className="flex justify-between bold">
                      <span>Change:</span>
                      <span>{formatCurrencyValue(lastInvoice.payment.change)}</span>
                    </div>
                  )}
                </div>

                {/* Customer Balance Information Section */}
                {selectedCustomerId && (
                  <div>
                    <div className="divider"></div>
                    <div className="space-y-1">
                      <div className="text-center text-sm font-bold">Customer Balance Status</div>
                      {(() => {
                        const previousBalance = getCustomerBalance();
                        const unpaidAmount = lastInvoice.grandTotal - lastInvoice.payment.amountReceived;
                        const newBalance = previousBalance + unpaidAmount;
                        
                        return (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Previous Balance:</span>
                              <span className={previousBalance > 0 ? 'text-red-600 font-semibold' : previousBalance < 0 ? 'text-green-600 font-semibold' : ''}>
                                {previousBalance > 0 
                                  ? `${formatCurrencyValue(previousBalance)} (Due)`
                                  : previousBalance < 0 
                                    ? `${formatCurrencyValue(Math.abs(previousBalance))} (Credit)`
                                    : `${formatCurrencyValue(0)} (Clear)`}
                              </span>
                            </div>
                            {unpaidAmount > 0 && (
                              <div className="flex justify-between">
                                <span>This Sale (Unpaid):</span>
                                <span className="text-red-600 font-semibold">+{formatCurrencyValue(unpaidAmount)}</span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-base">
                              <span>New Balance:</span>
                              <span className={newBalance > 0 ? 'text-red-600' : newBalance < 0 ? 'text-green-600' : ''}>
                                {newBalance > 0 
                                  ? `${formatCurrencyValue(newBalance)} (Due)`
                                  : newBalance < 0 
                                    ? `${formatCurrencyValue(Math.abs(newBalance))} (Credit)`
                                    : `${formatCurrencyValue(0)} (Clear)`}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="divider"></div>
                <div className="center text-sm">
                  Thank you for your business!<br/>
                  Please come again
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Register Setup Dialog - Required when register is closed */}
        <Dialog open={isRegisterSetupOpen} onOpenChange={(open) => {
          // Only allow closing if register is open
          if (!open && registerStatus === 'open') {
            setIsRegisterSetupOpen(false);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-lg">
                <AlertCircle className="w-6 h-6 mr-2 text-orange-500" />
                {registerStatus === 'closed' ? 'Register Setup Required' : 'Opening Register...'}
              </DialogTitle>
              <div className="text-sm text-gray-600 mt-2">
                {registerStatus === 'closed' 
                  ? 'Please open a register with verified opening balance to start using the POS terminal.'
                  : 'Verifying register balance and initializing POS system...'}
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
                        {register.name} ({register.branchName}) - Expected: {formatCurrencyValue(parseFloat(String(register.openingBalance)))}
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
                      <strong>Expected Opening Balance:</strong> {formatCurrencyValue(parseFloat(String(selectedRegister?.openingBalance || 0)))}
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
                  disabled={!selectedRegisterId || cashDrawerBalance === 0 || registerStatus === 'opening'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {registerStatus === 'opening' ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Opening Register...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Open Register & Start POS
                    </>
                  )}
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
