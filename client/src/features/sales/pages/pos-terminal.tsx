import React, { useState, useRef, useEffect } from "react";
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
  User, Edit3, Edit, X, Check, Tag, Gift, AlertCircle, CheckCircle, Settings, Package, RotateCcw, Eye
} from "lucide-react";

interface CartItem {
  id: number | string; // Support composite IDs for variants
  productId: number;
  variantId?: number | null;
  name: string;
  baseName: string;
  variantName: string;
  price: number;
  quantity: number;
  total: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  category?: string;
  isVariant: boolean;
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRefs = useRef<{[key: number]: HTMLInputElement | null}>({});
  const discountInputRefs = useRef<{[key: number]: HTMLInputElement | null}>({});
  const priceInputRefs = useRef<{[key: number]: HTMLInputElement | null}>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'qr'>("cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [isChangeEditable, setIsChangeEditable] = useState(false);
  
  // Customer management state
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [showCustomerHistoryDialog, setShowCustomerHistoryDialog] = useState(false);
  const [showPaymentOnAccountDialog, setShowPaymentOnAccountDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSearchSuggestions, setCustomerSearchSuggestions] = useState<any[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomerSuggestionIndex, setSelectedCustomerSuggestionIndex] = useState(-1);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  
  // Discount and tax state
  const [discount, setDiscount] = useState<DiscountState>({ type: 'percentage', value: 0, applyTo: 'total' });
  const [taxRate, setTaxRate] = useState<number>(10); // 10% default tax

  // Fetch enabled taxes from dynamic tax system
  const { data: enabledTaxes = [] } = useQuery<any[]>({
    queryKey: ['/api/taxes/enabled'],
  });
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);
  
  // Item editing state
  const [editingPriceItem, setEditingPriceItem] = useState<number | null>(null);
  const [editingQuantityItem, setEditingQuantityItem] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [isTabPressed, setIsTabPressed] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);
  const [editDiscountValue, setEditDiscountValue] = useState<string>("");
  const [editingGlobalDiscount, setEditingGlobalDiscount] = useState<boolean>(false);
  const [editGlobalDiscountValue, setEditGlobalDiscountValue] = useState<string>("");
  const [editingTaxRate, setEditingTaxRate] = useState<boolean>(false);
  const [editTaxRateValue, setEditTaxRateValue] = useState<string>("");

  // Layout management state
  const [posLayout, setPosLayout] = useState<'grid' | 'search'>('grid');
  
  // Kitchen order state
  const [orderType, setOrderType] = useState<'sale' | 'dine-in' | 'takeaway' | 'delivery'>('sale');
  const [tableNumber, setTableNumber] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  
  // Hold invoice state
  const [heldInvoices, setHeldInvoices] = useState<Array<{id: string, cart: CartItem[], customer?: Customer, timestamp: Date}>>([]);
  const [showHoldInvoicesDialog, setShowHoldInvoicesDialog] = useState(false);
  
  // All sales dialog state
  const [showAllSalesDialog, setShowAllSalesDialog] = useState(false);
  const [showSaleDetailDialog, setShowSaleDetailDialog] = useState(false);
  const [selectedSaleForView, setSelectedSaleForView] = useState<any>(null);

  // Calculate total tax rate from enabled taxes
  const getTotalTaxRate = () => {
    return enabledTaxes.reduce((total: number, tax: any) => {
      return total + parseFloat(tax.rate || 0);
    }, 0);
  };

  // Get tax breakdown for display
  const getTaxBreakdown = () => {
    const totalAfterDiscount = getTotalAfterDiscount();
    return enabledTaxes.map((tax: any) => ({
      id: tax.id,
      name: tax.name,
      rate: parseFloat(tax.rate || 0),
      amount: totalAfterDiscount * (parseFloat(tax.rate || 0) / 100)
    }));
  };

  // Customer search functionality with autocomplete
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchQuery(value);
    
    if (value.trim().length > 0 && customers && customers.length > 0) {
      // Get customer suggestions based on partial matches
      const suggestions = customers.filter(customer => 
        customer.name.toLowerCase().includes(value.toLowerCase()) ||
        (customer.phone && customer.phone.toLowerCase().includes(value.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 6); // Limit to 6 suggestions
      
      setCustomerSearchSuggestions(suggestions);
      setShowCustomerSuggestions(suggestions.length > 0);
      setSelectedCustomerSuggestionIndex(-1);
    } else {
      setCustomerSearchSuggestions([]);
      setShowCustomerSuggestions(false);
      setSelectedCustomerSuggestionIndex(-1);
    }
  };

  // Customer search keyboard handler
  const handleCustomerSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showCustomerSuggestions || customerSearchSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCustomerSuggestionIndex(prev => 
          prev < customerSearchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCustomerSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : customerSearchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedCustomerSuggestionIndex >= 0 && selectedCustomerSuggestionIndex < customerSearchSuggestions.length) {
          const selectedCustomer = customerSearchSuggestions[selectedCustomerSuggestionIndex];
          selectCustomer(selectedCustomer);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowCustomerSuggestions(false);
        setSelectedCustomerSuggestionIndex(-1);
        if (selectedCustomerId) {
          const customer = customers?.find(c => c.id === selectedCustomerId);
          setCustomerSearchQuery(customer?.name || "");
        } else {
          setCustomerSearchQuery("");
        }
        break;
    }
  };

  // Select customer function
  const selectCustomer = (customer: any) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearchQuery(customer.name);
    setShowCustomerSuggestions(false);
    setSelectedCustomerSuggestionIndex(-1);
  };

  // Clear customer selection
  const clearCustomerSelection = () => {
    setSelectedCustomerId(null);
    setCustomerSearchQuery("");
    setShowCustomerSuggestions(false);
    setSelectedCustomerSuggestionIndex(-1);
  };

  // Enhanced search functionality with autocomplete and barcode scanner support
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Handle rapid barcode scanner input
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }
    
    // Check if this looks like a barcode (only numbers/letters, no spaces, longer than 4 chars)
    const isPossibleBarcode = /^[A-Za-z0-9]{4,}$/.test(value.trim());
    
    if (isPossibleBarcode) {
      setIsScanning(true);
      // Set a timeout to process barcode after scanner finishes
      const timeout = setTimeout(() => {
        processBarcodeScan(value.trim());
        setIsScanning(false);
      }, 100); // 100ms delay to allow scanner to finish
      setScanTimeout(timeout);
    } else {
      setIsScanning(false);
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
    setEditingQuantityItem(null);
    setEditingPriceItem(null);
    setEditingDiscount(null);
    setEditQuantity('');
    setEditPrice('');
    setEditDiscountValue('');
    setEditingGlobalDiscount(false);
    setEditGlobalDiscountValue('');
    setEditingTaxRate(false);
    setEditTaxRateValue('');
    toast({
      title: "Reset Complete",
      description: "All data has been cleared",
    });
  };

  // Update current time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll selected suggestion into view
  React.useEffect(() => {
    if (selectedSuggestionIndex >= 0 && showSuggestions) {
      const suggestionElement = document.querySelector(`[data-suggestion-index="${selectedSuggestionIndex}"]`);
      if (suggestionElement) {
        suggestionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedSuggestionIndex, showSuggestions]);

  // Scroll selected customer suggestion into view
  React.useEffect(() => {
    if (selectedCustomerSuggestionIndex >= 0 && showCustomerSuggestions) {
      const suggestionElement = document.querySelector(`[data-customer-suggestion-index="${selectedCustomerSuggestionIndex}"]`);
      if (suggestionElement) {
        suggestionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedCustomerSuggestionIndex, showCustomerSuggestions]);



  // Process barcode scan with enhanced logic
  const processBarcodeScan = (barcode: string) => {
    if (!products || products.length === 0) {
      toast({
        title: "Error",
        description: "No products available for scanning",
        variant: "destructive",
      });
      return;
    }
    
    // Look for exact barcode match first
    const exactMatch = products.find(product => 
      product.barcode && product.barcode.toLowerCase() === barcode.toLowerCase()
    );
    
    if (exactMatch) {
      addToCart(exactMatch);
      setSearchQuery('');
      setSearchResults([]);
      toast({
        title: "Item Scanned",
        description: `${exactMatch.name} added to cart`,
        variant: "default",
      });
      return;
    }
    
    // If no exact match, try partial matches
    const partialMatches = products.filter(product => 
      (product.barcode && product.barcode.toLowerCase().includes(barcode.toLowerCase())) ||
      product.name.toLowerCase().includes(barcode.toLowerCase())
    );
    
    if (partialMatches.length === 1) {
      addToCart(partialMatches[0]);
      setSearchQuery('');
      setSearchResults([]);
      toast({
        title: "Item Found",
        description: `${partialMatches[0].name} added to cart`,
        variant: "default",
      });
    } else if (partialMatches.length > 1) {
      setSearchResults(partialMatches);
      toast({
        title: "Multiple Items Found",
        description: `Found ${partialMatches.length} matching items`,
        variant: "default",
      });
    } else {
      setSearchResults([]);
      toast({
        title: "Item Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
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
      
      // Check if this is a barcode-like input
      const isPossibleBarcode = /^[A-Za-z0-9]{4,}$/.test(searchQuery.trim());
      
      if (isPossibleBarcode) {
        processBarcodeScan(searchQuery.trim());
        return;
      }
      
      // Regular text search
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

  // Auto-focus search input for barcode scanners (only for grid layout)
  useEffect(() => {
    const focusSearchInput = () => {
      // Only auto-focus if we're in grid layout and the input exists
      if (posLayout === 'grid' && searchInputRef.current && !searchInputRef.current.matches(':focus')) {
        searchInputRef.current.focus();
      }
    };
    
    // Focus on mount only for grid layout
    if (posLayout === 'grid') {
      focusSearchInput();
    }
    
    // Re-focus periodically to catch scanner input (only for grid layout)
    const interval = setInterval(() => {
      if (posLayout === 'grid') {
        focusSearchInput();
      }
    }, 1000);
    
    // Focus on any key press that's not in an input field (only for grid layout)
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Handle F2 key to focus search input (works in any layout)
      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }
      
      // Other key handling only for grid layout
      if (posLayout === 'grid' && !target.matches('input, textarea, select') && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyPress);
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [scanTimeout, posLayout]);

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
  
  // Currency notes breakdown state
  const [showNotesBreakdown, setShowNotesBreakdown] = useState(false);
  const [currencyNotes, setCurrencyNotes] = useState({
    note5000: 0,
    note1000: 0,
    note500: 0,
    note100: 0,
    note50: 0,
    note10: 0,
  });

  // Fetch all products with variants for POS
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ["pos-products"],
    queryFn: async () => {
      // Fetch products with their variants from new POS endpoint
      const response = await fetch("/api/products/pos/all", {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const productsWithVariants = await response.json();
      
      // Create searchable items: one for each variant (or base product if no variants)
      const searchableItems = [];
      
      productsWithVariants.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          // Create searchable items for each variant
          product.variants.forEach(variant => {
            searchableItems.push({
              id: `${product.id}-${variant.id}`, // Composite ID
              productId: product.id,
              variantId: variant.id,
              name: `${product.name} - ${variant.variantName}`,
              baseName: product.name,
              variantName: variant.variantName,
              barcode: product.barcode,
              description: product.description,
              price: variant.salePrice || product.price,
              salePrice: variant.salePrice,
              stock: variant.stock,
              category: product.category,
              brand: product.brand,
              unit: product.unit,
              isVariant: true,
              baseProduct: product
            });
          });
        } else {
          // No variants, use base product
          searchableItems.push({
            id: product.id,
            productId: product.id,
            variantId: null,
            name: product.name,
            baseName: product.name,
            variantName: 'Default',
            barcode: product.barcode,
            description: product.description,
            price: product.price,
            salePrice: product.price,
            stock: product.stock,
            category: product.category,
            brand: product.brand,
            unit: product.unit,
            isVariant: false,
            baseProduct: product
          });
        }
      });
      
      console.log(`Processed ${searchableItems.length} searchable items from ${productsWithVariants.length} products`);
      return searchableItems;
    },
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

  // Fetch customer ledger balance for all customers
  const { data: customerLedgerData } = useQuery<any[]>({
    queryKey: ['/api/customer-ledgers'],
  });
  
  // Fetch all sales data
  const { data: sales = [] } = useQuery<any[]>({
    queryKey: ['/api/sales'],
    retry: false,
  });

  // Fetch total sales count
  const { data: salesCount = 0 } = useQuery<number>({
    queryKey: ['/api/sales/count'],
    retry: false,
    select: (data: any) => data.count || 0,
  });

  // Initialize customer search query when customer is selected
  React.useEffect(() => {
    if (selectedCustomerId && customers) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setCustomerSearchQuery(customer.name);
      }
    } else {
      setCustomerSearchQuery("");
    }
  }, [selectedCustomerId, customers]);

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
  
  // Auto-fill opening balance when register is selected
  useEffect(() => {
    if (selectedRegisterId && selectedRegister) {
      const expectedBalance = parseFloat(String(selectedRegister.openingBalance));
      setCashDrawerBalance(expectedBalance);
      // Reset currency notes when changing register
      setCurrencyNotes({ note5000: 0, note1000: 0, note500: 0, note100: 0, note50: 0, note10: 0 });
    }
  }, [selectedRegisterId, selectedRegister]);
  
  // Calculate total from currency notes
  const calculateNotesTotal = () => {
    return (
      currencyNotes.note5000 * 5000 +
      currencyNotes.note1000 * 1000 +
      currencyNotes.note500 * 500 +
      currencyNotes.note100 * 100 +
      currencyNotes.note50 * 50 +
      currencyNotes.note10 * 10
    );
  };
  
  // Update cash drawer balance when notes change
  useEffect(() => {
    if (showNotesBreakdown) {
      setCashDrawerBalance(calculateNotesTotal());
    }
  }, [currencyNotes, showNotesBreakdown]);

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
      const response = await apiRequest("/api/sales", {
        method: "POST",
        body: JSON.stringify(saleData)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sale Completed",
        description: "Transaction processed successfully",
      });
      setCart([]);
      const customerId = selectedCustomerId;
      setSelectedCustomerId(null);
      setAmountReceived(0);
      // Reset kitchen order fields
      setOrderType('sale');
      setTableNumber('');
      setSpecialInstructions('');
      
      // Invalidate all relevant caches for auto-refresh
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] }); // Sales list and counter
      queryClient.invalidateQueries({ queryKey: ["/api/sales/count"] }); // Sales count
      queryClient.invalidateQueries({ queryKey: ["/api/customer-ledgers"] }); // Customer ledgers
      
      // If there was a customer, invalidate their sales history too
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/sales`] });
      }
    },
    onError: (error) => {
      toast({
        title: "Sale Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle Enter key in payment dialog to complete sale
  useEffect(() => {
    const handlePaymentDialogKeyPress = (e: KeyboardEvent) => {
      if (showPaymentDialog && e.key === 'Enter') {
        e.preventDefault();
        // Check if the complete sale button would be enabled
        const isDisabled = 
          processSaleMutation.isPending || 
          (paymentMethod === 'cash' && amountReceived <= 0) ||
          (!selectedCustomerId && paymentMethod === 'cash' && amountReceived < getGrandTotal());
        
        if (!isDisabled) {
          processSale();
        }
      }
    };

    if (showPaymentDialog) {
      document.addEventListener('keydown', handlePaymentDialogKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handlePaymentDialogKeyPress);
    };
  }, [showPaymentDialog, processSaleMutation.isPending, paymentMethod, amountReceived, selectedCustomerId]);

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
      const response = await apiRequest("/api/customers", {
        method: "POST",
        body: JSON.stringify(customerData)
      });
      return response.json();
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

  // Enhanced cart operations with variant support
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
    
    // Use composite ID for variants (productId-variantId) or regular ID for base products
    const cartId = product.isVariant ? product.id : product.id;
    const existingItem = cart.find(item => item.id === cartId);
    
    if (existingItem) {
      updateQuantity(cartId, 1);
      // Focus quantity input for existing item
      setTimeout(() => {
        setEditingQuantityItem(cartId);
        setEditQuantity((existingItem.quantity + 1).toString());
        // Force a re-render then focus
        setTimeout(() => {
          const quantityInput = quantityInputRefs.current[cartId];
          if (quantityInput) {
            quantityInput.focus();
            quantityInput.select();
          }
        }, 50);
      }, 150);
    } else {
      // Use variant price if available, otherwise use base product price
      const itemPrice = parseFloat(product.salePrice || product.price) || 0;
      
      const newItem: CartItem = {
        id: cartId,
        productId: product.productId,
        variantId: product.variantId,
        name: product.name, // Already includes variant name like "Product - Variant"
        baseName: product.baseName,
        variantName: product.variantName,
        price: itemPrice,
        quantity: 1,
        total: itemPrice,
        discount: 0,
        discountType: 'percentage',
        tax: 0,
        category: product.category?.name || 'General',
        isVariant: product.isVariant || false
      };
      setCart([...cart, newItem]);
      
      // Auto-focus quantity input for the newly added item
      setTimeout(() => {
        setEditingQuantityItem(cartId);
        setEditQuantity('1');
        // Force a re-render then focus
        setTimeout(() => {
          const quantityInput = quantityInputRefs.current[cartId];
          if (quantityInput) {
            quantityInput.focus();
            quantityInput.select();
          }
        }, 50);
      }, 150);
    }
  };

  const updateQuantity = (id: number | string, change: number) => {
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

        
        return { 
          ...item, 
          quantity: newQuantity, 
          total: afterDiscount

        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  // Set absolute quantity (not delta)
  const setAbsoluteQuantity = (id: number | string, absoluteQuantity: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, absoluteQuantity);
        const baseTotal = newQuantity * item.price;
        const discountAmount = item.discountType === 'percentage' 
          ? baseTotal * (item.discount || 0) / 100
          : (item.discount || 0);
        const afterDiscount = baseTotal - discountAmount;

        
        return { 
          ...item, 
          quantity: newQuantity, 
          total: afterDiscount

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

        
        return { 
          ...item, 
          price: newPrice,
          total: afterDiscount

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

        
        return { 
          ...item, 
          discount: discountValue,
          discountType,
          total: afterDiscount

        };
      }
      return item;
    }));
  }

  // Apply global discount to entire transaction
  const applyGlobalDiscount = (discountValue: number, type: 'percentage' | 'fixed') => {
    setDiscount({
      type: type,
      value: discountValue,
      applyTo: 'total'
    });
  };

  // Update tax rate
  const updateTaxRate = (newTaxRate: number) => {
    setTaxRate(Math.max(0, Math.min(100, newTaxRate))); // Ensure tax rate is between 0-100%
  };;

  const removeFromCart = (id: number | string) => {
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
    return getTotalAfterDiscount() * (getTotalTaxRate() / 100);
  };

  const getGrandTotal = () => {
    return getTotalAfterDiscount() + getTaxAmount();
  };

  const getChange = () => {
    return changeAmount > 0 ? changeAmount : Math.max(0, amountReceived - getGrandTotal());
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
        change: paymentMethod === 'cash' ? (changeAmount > 0 ? changeAmount : Math.max(0, paidAmount - grandTotal)) : 0
      }
    };

    const saleData = {
      totalAmount: grandTotal,
      paidAmount: paidAmount,
      subtotal: getSubtotal(),
      discountAmount: getItemDiscountTotal() + getGlobalDiscountAmount(),
      taxAmount: getTaxAmount(),
      taxRate: getTotalTaxRate(),
      taxes: getTaxBreakdown(),
      status: unpaidAmount > 0 ? "pending" : "completed",
      paymentMethod,
      customerId: selectedCustomerId || undefined,
      customer: selectedCustomer || { name: 'Walk-in Customer' },
      // Kitchen order fields
      orderType: orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : null,
      specialInstructions: (orderType === 'dine-in' || orderType === 'takeaway' || orderType === 'delivery') ? specialInstructions : null,
      // Set kitchen status for kitchen orders (dine-in, takeaway, delivery)
      kitchenStatus: (orderType === 'dine-in' || orderType === 'takeaway' || orderType === 'delivery') ? 'new' : null,
      items: cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
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
          description: `${formatCurrencyValue(unpaidAmount)} added to customer ledger`,
        });
      } else if (overpaidAmount > 0 && selectedCustomerId) {
        toast({
          title: "Overpayment Credit Added",
          description: `${formatCurrencyValue(overpaidAmount)} credit added to customer ledger`,
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

  const printCurrentCart = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "No items in cart to print",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = getSubtotal();
      const discountAmount = discount.applyTo === 'total' ? 
        (discount.type === 'percentage' ? subtotal * (discount.value / 100) : discount.value) : 0;
      const taxAmount = getTaxAmount();
      const total = getGrandTotal();
      
      const printContent = `
        <div class="center">
          <div class="bold text-lg">UNIVERSAL POS SYSTEM</div>
          <div>Point of Sale - Current Cart</div>
          <div class="divider"></div>
          <div>
            Date: ${new Date().toLocaleDateString()}<br/>
            Time: ${new Date().toLocaleTimeString()}<br/>
            Cashier: ${(user as any)?.name || 'System User'}
          </div>
          ${selectedCustomerId ? (() => {
            const customer = customers?.find(c => c.id === selectedCustomerId);
            return customer ? `
              <div>
                Customer: ${customer.name}<br/>
                ${customer.phone ? `Phone: ${customer.phone}<br/>` : ''}
                ${customer.email ? `Email: ${customer.email}<br/>` : ''}
              </div>
            ` : '';
          })() : ''}
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
            ${cart.map(item => `
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
            <span class="right">${formatCurrencyValue(subtotal)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="flex">
              <span>Discount:</span>
              <span class="right">-${formatCurrencyValue(discountAmount)}</span>
            </div>
          ` : ''}
          ${getTaxBreakdown().map(tax => `
          <div class="flex">
            <span>${tax.name} (${tax.rate}%):</span>
            <span class="right">${formatCurrencyValue(tax.amount)}</span>
          </div>`).join('')}
          ${getTaxBreakdown().length === 0 ? `
          <div class="flex">
            <span>Tax (0%):</span>
            <span class="right">${formatCurrencyValue(0)}</span>
          </div>` : ''}
          <div class="divider"></div>
          <div class="bold">
            <span>TOTAL:</span>
            <span class="right">${formatCurrencyValue(total)}</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="center">
          ** DRAFT - NOT A COMPLETED SALE **<br/>
          Current cart contents for review
        </div>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Cart Contents - ${new Date().toLocaleDateString()}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  line-height: 1.4; 
                  max-width: 300px; 
                  margin: 0 auto; 
                  padding: 10px; 
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { 
                  border-top: 1px dashed #000; 
                  margin: 8px 0; 
                  height: 1px; 
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 8px 0; 
                }
                th, td { 
                  padding: 2px 4px; 
                  text-align: left; 
                  border-bottom: 1px solid #ddd; 
                }
                th { 
                  font-weight: bold; 
                  background-color: #f5f5f5; 
                }
                .flex { 
                  display: flex; 
                  justify-content: space-between; 
                  margin: 2px 0; 
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        
        toast({
          title: "Cart Printed",
          description: "Current cart contents sent to printer",
        });
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: "Failed to print cart contents",
        variant: "destructive",
      });
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
    // If no invoice but cart has items, print current cart
    if (!lastInvoice && cart.length > 0) {
      printCurrentCart();
      return;
    }
    
    if (!lastInvoice) {
      toast({
        title: "Nothing to Print",
        description: "No invoice or cart items available to print",
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
          ${(selectedCustomerId || lastInvoice.customer) && lastInvoice.grandTotal > lastInvoice.payment.amountReceived ? `
            <div class="flex bold">
              <span>Remaining Balance:</span>
              <span class="right">${formatCurrencyValue(lastInvoice.grandTotal - lastInvoice.payment.amountReceived)}</span>
            </div>
          ` : ''}
        </div>

        <div class="divider"></div>
        
        ${(selectedCustomerId || lastInvoice.customer) ? (() => {
          const customerId = selectedCustomerId || lastInvoice.customer?.id;
          const customerLedgerForPrint = customerLedgerData?.filter(entry => entry.customerId === customerId) || [];
          
          const previousBalance = customerLedgerForPrint.reduce((balance: number, entry: any) => {
            const amount = parseFloat(entry.amount) || 0;
            return entry.type === 'debit' ? balance + amount : balance - amount;
          }, 0);
          
          const unpaidAmount = lastInvoice.grandTotal - lastInvoice.payment.amountReceived;
          const newBalance = previousBalance + unpaidAmount;
          
          console.log('Print Template Customer Balance:', { 
            customerId, 
            previousBalance, 
            unpaidAmount, 
            newBalance, 
            customerLedgerForPrint: customerLedgerForPrint?.length || 0 
          });
          
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
        {/* Stunning Modern Header */}
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-3xl shadow-2xl border border-slate-200/50 p-8 mb-6 backdrop-blur-sm">
          {/* Simplified Header - Only Action Buttons */}

          {/* Header with Register Info, Staff, and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            {/* Left: Register and Staff Info */}
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 backdrop-blur-sm rounded-xl px-4 py-2 border border-green-200">
                <span className="text-sm font-semibold text-green-800">
                  {selectedRegister?.name || 'Main Register'} - {formatCurrencyValue(cashDrawerBalance)}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={closeRegister}
                className="text-red-600 border-red-300 hover:bg-red-50 bg-white rounded-xl px-4 py-2 font-medium"
              >
                Close Register
              </Button>
              <div className="bg-blue-100 backdrop-blur-sm rounded-xl px-4 py-2 border border-blue-200">
                <span className="text-sm font-semibold text-blue-800">
                  {(user as any)?.name || 'System User'} • Staff
                </span>
              </div>
            </div>

            {/* Center: Layout Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-white/40 shadow-lg">
              <div className="flex bg-slate-100/50 rounded-xl p-1">
                <Button
                  variant={posLayout === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPosLayout('grid')}
                  className={`px-5 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    posLayout === 'grid' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transform scale-105' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <Package className="w-5 h-5 mr-2" />
                  Grid View
                </Button>
                <Button
                  variant={posLayout === 'search' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPosLayout('search')}
                  className={`px-5 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    posLayout === 'search' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transform scale-105' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search View
                </Button>
              </div>
            </div>

            {/* Right: Clear All */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-white/40 shadow-lg">
              <Button 
                variant="outline" 
                onClick={clearCart}
                className="text-red-600 border-red-300 hover:bg-red-50 bg-white/90 rounded-xl px-5 py-3 font-bold shadow-sm hover:shadow-md transition-all duration-200"
              >
                <X className="w-5 h-5 mr-2" />
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
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <label className="text-sm font-semibold text-gray-800">Find Customer By:</label>
                      <select className="text-sm border border-gray-300 px-3 py-2 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>Name</option>
                        <option>Phone</option>
                        <option>Email</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-800">Select Customer:</span>
                      <div className="relative">
                        <Input
                          placeholder="Walk-in Customer"
                          value={customerSearchQuery}
                          onChange={(e) => handleCustomerSearchChange(e.target.value)}
                          onKeyDown={handleCustomerSearchKeyDown}
                          onFocus={() => setShowCustomerSuggestions(customerSearchSuggestions.length > 0)}
                          onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                          className="text-sm border border-gray-300 px-4 py-2 rounded-lg bg-white shadow-sm w-56 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoComplete="off"
                        />
                        
                        {/* Walk-in Customer Button */}
                        {customerSearchQuery && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={clearCustomerSelection}
                            className="absolute right-1 top-1 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {/* Customer Autocomplete Suggestions Dropdown */}
                        {showCustomerSuggestions && customerSearchSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded-md mt-1 z-50 max-h-48 overflow-y-auto">
                            {customerSearchSuggestions.map((customer, index) => (
                              <div
                                key={customer.id}
                                data-customer-suggestion-index={index}
                                className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                                  index === selectedCustomerSuggestionIndex 
                                    ? 'bg-blue-100 border-blue-200' 
                                    : 'hover:bg-blue-50'
                                }`}
                                onClick={() => selectCustomer(customer)}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                    <div className="text-gray-500 text-xs">
                                      {customer.phone && <span>{customer.phone}</span>}
                                      {customer.email && customer.phone && <span> • </span>}
                                      {customer.email && <span>{customer.email}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg font-medium shadow-sm"
                      onClick={() => setShowAddCustomerDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Customer
                    </Button>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs px-2 py-1 h-6 rounded bg-white border-gray-300 hover:bg-gray-50 font-medium shadow-sm"
                        onClick={() => setShowCustomerHistoryDialog(true)}
                        disabled={!selectedCustomerId}
                      >
                        <User className="w-3 h-3 mr-1" />
                        History
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs px-2 py-1 h-6 rounded bg-blue-50 border-blue-300 hover:bg-blue-100 font-medium shadow-sm"
                        onClick={() => {
                          // Show all sales - default visible, not disabled
                          console.log('All Sales:', sales);
                          toast({
                            title: "All Sales",
                            description: `Showing ${salesCount || 0} total sales`,
                          });
                          setShowAllSalesDialog(true); // Show all sales dialog
                        }}
                      >
                        <Receipt className="w-3 h-3 mr-1" />
                        Sales ({salesCount || 0})
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-sm px-4 py-2 rounded-lg bg-white border-gray-300 hover:bg-gray-50 font-medium shadow-sm"
                      onClick={() => setShowPaymentOnAccountDialog(true)}
                      disabled={!selectedCustomerId}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
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

              {/* Kitchen Order Details Section */}
              <div className="bg-slate-50 border-b border-gray-400 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <label className="text-xs font-bold text-gray-700">Order Type:</label>
                      <Select value={orderType} onValueChange={(value: 'sale' | 'dine-in' | 'takeaway' | 'delivery') => setOrderType(value)}>
                        <SelectTrigger className="text-xs border border-gray-300 px-2 py-1 rounded bg-white shadow-sm w-28 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">Regular Sale</SelectItem>
                          <SelectItem value="dine-in">Dine-In</SelectItem>
                          <SelectItem value="takeaway">Takeaway</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Table Number - only show for dine-in */}
                    {orderType === 'dine-in' && (
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-bold text-gray-700">Table:</label>
                        <Input
                          placeholder="5"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="text-xs border border-gray-300 px-2 py-1 rounded bg-white shadow-sm w-16 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Order Status Badge */}
                  <Badge 
                    className={`px-2 py-1 text-xs font-medium ${
                      orderType === 'dine-in' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      orderType === 'takeaway' ? 'bg-green-100 text-green-700 border border-green-200' :
                      orderType === 'delivery' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {orderType === 'dine-in' ? 'Dine-In' :
                     orderType === 'takeaway' ? 'Takeaway' :
                     orderType === 'delivery' ? 'Delivery' : 'Regular Sale'}
                    {orderType === 'dine-in' && tableNumber && ` - Table ${tableNumber}`}
                  </Badge>
                </div>
                
                {/* Special Instructions - only show for kitchen orders */}
                {(orderType === 'dine-in' || orderType === 'takeaway' || orderType === 'delivery') && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Special Instructions for Kitchen:</label>
                    <textarea
                      placeholder="e.g. No onions, extra spicy, well done..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="text-xs border border-gray-300 px-2 py-1 rounded bg-white shadow-sm w-full h-12 focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                )}
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
                        ref={searchInputRef}
                        placeholder="Enter item code or scan barcode..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onKeyPress={handleSearchKeyPress}
                        onFocus={() => {
                          // Only show suggestions if there are any and user has typed something
                          if (searchQuery.trim() && searchSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className={`h-7 text-xs w-64 border-gray-300 ${isScanning ? 'bg-blue-50 border-blue-300' : ''}`}
                        autoComplete="off"
                        data-testid="pos-search-input"
                      />
                      {isScanning && (
                        <div className="absolute right-2 top-1 text-blue-600">
                          <QrCode className="w-5 h-5 animate-pulse" />
                        </div>
                      )}
                      
                      {/* Autocomplete Suggestions Dropdown */}
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded-md mt-1 z-50 max-h-64 overflow-y-auto">
                          {searchSuggestions.map((product, index) => (
                            <div
                              key={product.id}
                              data-suggestion-index={index}
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
                                  {formatCurrencyValue(parseFloat(product.price) || 0)}
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs px-3 py-1 h-7"
                      onClick={printInvoice}
                      disabled={!lastInvoice && cart.length === 0}
                    >
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
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Quantity</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Discount</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Price</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Sub Total</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 border-r border-gray-300 w-20">Sales Tax</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 w-20">Total</th>
                      <th className="text-center py-2 px-2 font-bold text-gray-800 w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length > 0 ? (
                      cart.map((item: CartItem, index: number) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-blue-50">
                          <td className="py-1 px-2 text-center border-r border-gray-200">{index + 1}</td>
                          <td className="py-1 px-2 border-r border-gray-200">{item.name}</td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">
                            <Input
                              type="text"
                              ref={(el) => quantityInputRefs.current[item.id] = el}
                              value={editingQuantityItem === item.id ? editQuantity : item.quantity.toString()}
                              onChange={(e) => {
                                if (editingQuantityItem !== item.id) {
                                  setEditingQuantityItem(item.id);
                                  setEditQuantity(e.target.value);
                                } else {
                                  setEditQuantity(e.target.value);
                                }
                              }}
                              onFocus={() => {
                                setEditingQuantityItem(item.id);
                                setEditQuantity(item.quantity.toString());
                              }}
                              onBlur={() => {
                                if (!isTabPressed) {
                                  const newQty = parseInt(editQuantity) || 1;
                                  setAbsoluteQuantity(item.id, newQty);
                                  setEditingQuantityItem(null);
                                  setEditQuantity('');
                                }
                                setIsTabPressed(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  setIsTabPressed(true);
                                  const newQty = parseInt(editQuantity) || 1;
                                  setAbsoluteQuantity(item.id, newQty);
                                  setEditingQuantityItem(null);
                                  setEditQuantity('');
                                  // Move to discount field
                                  setTimeout(() => {
                                    const discountInput = discountInputRefs.current[item.id];
                                    if (discountInput) {
                                      discountInput.focus();
                                      discountInput.select();
                                    }
                                  }, 50);
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const newQty = parseInt(editQuantity) || 1;
                                  setAbsoluteQuantity(item.id, newQty);
                                  setEditingQuantityItem(null);
                                  setEditQuantity('');
                                  // Complete sale when Enter is pressed
                                  setTimeout(() => setShowPaymentDialog(true), 100);
                                }
                              }}
                              className="w-16 h-5 text-center text-xs rounded"
                              data-testid={`quantity-input-${item.id}`}
                            />
                          </td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">
                            <Input
                              ref={(el) => discountInputRefs.current[item.id] = el}
                              value={editingDiscount === item.id ? editDiscountValue : 
                                ((item.discount && item.discount > 0) ? 
                                  `${item.discount}${item.discountType === 'percentage' ? '%' : ''}` : '')}
                              onChange={(e) => {
                                if (editingDiscount !== item.id) {
                                  setEditingDiscount(item.id);
                                  setEditDiscountValue(e.target.value);
                                } else {
                                  setEditDiscountValue(e.target.value);
                                }
                              }}
                              onFocus={() => {
                                setEditingDiscount(item.id);
                                setEditDiscountValue((item.discount && item.discount > 0) ? `${item.discount}${item.discountType === 'percentage' ? '%' : ''}` : '');
                              }}
                              onBlur={() => {
                                const value = parseFloat(editDiscountValue) || 0;
                                if (value > 0) {
                                  const isPercentage = editDiscountValue.includes('%');
                                  applyItemDiscount(item.id, value, isPercentage ? 'percentage' : 'fixed');
                                }
                                setEditingDiscount(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  const value = parseFloat(editDiscountValue) || 0;
                                  if (value > 0) {
                                    const isPercentage = editDiscountValue.includes('%');
                                    applyItemDiscount(item.id, value, isPercentage ? 'percentage' : 'fixed');
                                  }
                                  setEditingDiscount(null);
                                  // Move to price field of the same item by triggering edit mode
                                  setTimeout(() => {
                                    setEditingPriceItem(item.id);
                                    setEditPrice(item.price.toString());
                                    // Focus the input after state update
                                    setTimeout(() => {
                                      const priceInput = priceInputRefs.current[item.id];
                                      if (priceInput) {
                                        priceInput.focus();
                                        priceInput.select();
                                      }
                                    }, 0);
                                  }, 50);
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const value = parseFloat(editDiscountValue) || 0;
                                  if (value > 0) {
                                    const isPercentage = editDiscountValue.includes('%');
                                    applyItemDiscount(item.id, value, isPercentage ? 'percentage' : 'fixed');
                                  }
                                  setEditingDiscount(null);
                                  // Complete sale when Enter is pressed
                                  setTimeout(() => setShowPaymentDialog(true), 100);
                                }
                              }}
                              className="w-20 h-5 text-xs text-center rounded"
                              placeholder="0% or 0.00"
                              data-testid={`discount-input-${item.id}`}
                            />
                          </td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">
                            {editingPriceItem === item.id ? (
                              <Input
                                type="text"
                                ref={(el) => priceInputRefs.current[item.id] = el}
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                onBlur={() => {
                                  const newPrice = parseFloat(editPrice) || item.price;
                                  updateItemPrice(item.id, newPrice);
                                  setEditingPriceItem(null);
                                  setEditPrice('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Tab') {
                                    e.preventDefault();
                                    const newPrice = parseFloat(editPrice) || item.price;
                                    updateItemPrice(item.id, newPrice);
                                    setEditingPriceItem(null);
                                    setEditPrice('');
                                    // Focus back to search input for next product
                                    setTimeout(() => {
                                      if (searchInputRef.current) {
                                        searchInputRef.current.focus();
                                        searchInputRef.current.select();
                                      }
                                    }, 50);
                                  } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const newPrice = parseFloat(editPrice) || item.price;
                                    updateItemPrice(item.id, newPrice);
                                    setEditingPriceItem(null);
                                    setEditPrice('');
                                    // Complete sale when Enter is pressed
                                    setTimeout(() => setShowPaymentDialog(true), 100);
                                  }
                                }}
                                className="w-16 h-5 text-xs text-center rounded"
                                data-testid={`price-input-${item.id}`}
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => {
                                  setEditingPriceItem(item.id);
                                  setEditPrice(item.price.toString());
                                  // Focus the input after state update
                                  setTimeout(() => {
                                    const priceInput = priceInputRefs.current[item.id];
                                    if (priceInput) {
                                      priceInput.focus();
                                      priceInput.select();
                                    }
                                  }, 0);
                                }}
                                className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-xs"
                                data-testid={`price-display-${item.id}`}
                              >
                                {item.price.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">{item.total.toFixed(2)}</td>
                          <td className="py-1 px-2 text-center border-r border-gray-200">{(item.tax || (item.total * (taxRate / 100))).toFixed(2)}</td>
                          <td className="py-1 px-2 text-center">{(item.total + (item.tax || (item.total * (taxRate / 100)))).toFixed(2)}</td>
                          <td className="py-1 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:bg-red-50 w-5 h-5 p-0"
                              title="Remove Item"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : searchResults.length > 0 ? (
                      searchResults.map((product: any, index: number) => {
                        const price = parseFloat(product.price) || 0;
                        return (
                          <tr key={product.id} className="border-b border-gray-200 hover:bg-blue-50">
                            <td className="py-1 px-2 text-center border-r border-gray-200">{index + 1}</td>
                            <td className="py-1 px-2 border-r border-gray-200">{product.name}</td>
                            <td className="py-1 px-2 border-r border-gray-200">No Employee</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">1</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">0.00</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">{price.toFixed(2)}</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">{price.toFixed(2)}</td>
                            <td className="py-1 px-2 text-center border-r border-gray-200">{(price * (taxRate / 100)).toFixed(2)}</td>
                            <td className="py-1 px-2 text-center">{(price + (price * (taxRate / 100))).toFixed(2)}</td>
                            <td className="py-1 px-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addFromSearchResults(product)}
                                className="text-green-600 hover:bg-green-50 w-5 h-5 p-0"
                                title="Add to Cart"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : null}
                    
                    {/* Empty rows for better UX - always show 8 rows */}
                    {Array.from({ length: Math.max(3 - Math.max(cart.length, searchResults.length), 1) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-gray-200">
                        <td className="py-1 px-2 text-center border-r border-gray-200 text-gray-300">{cart.length + searchResults.length + index + 1}</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-gray-300">-</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-center text-gray-300">-</td>
                        <td className="py-1 px-2 text-center border-r border-gray-200 text-gray-300">-</td>
                        <td className="py-1 px-2 text-center border-r border-gray-200 text-gray-300">-</td>
                        <td className="py-1 px-2 text-center border-r border-gray-200 text-gray-300">-</td>
                        <td className="py-1 px-2 text-center border-r border-gray-200 text-gray-300">-</td>
                        <td className="py-1 px-2 text-center border-r border-gray-200 text-gray-300">-</td>
                        <td className="py-1 px-2 text-center text-gray-300">-</td>
                        <td className="py-1 px-2 text-center text-gray-300">-</td>
                      </tr>
                    ))}
                    
                    {/* No items message only when no cart items and no search results */}
                    {cart.length === 0 && searchResults.length === 0 && searchQuery && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center">
                          <div className="text-gray-500">No items found. Try different search terms.</div>
                        </td>
                      </tr>
                    )}
                    
                    {cart.length === 0 && searchResults.length === 0 && !searchQuery && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            {/* Company Logo in Empty Table Space */}
                            <div className="flex items-center space-x-4 mb-2">
                                <svg width="60" height="60" viewBox="0 0 80 80" className="drop-shadow-lg">
                                  <defs>
                                    <linearGradient id="tableLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#1e40af" />
                                      <stop offset="50%" stopColor="#3b82f6" />
                                      <stop offset="100%" stopColor="#60a5fa" />
                                    </linearGradient>
                                  </defs>
                                  <circle cx="40" cy="40" r="38" fill="url(#tableLogoGradient)" stroke="#f8fafc" strokeWidth="2"/>
                                  <path d="M20 25 L20 45 Q20 55 30 55 L50 55 Q60 55 60 45 L60 25" 
                                        stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
                                  <path d="M25 35 L25 65 M25 35 L40 35 Q50 35 50 45 Q50 55 40 55 L25 55" 
                                        stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
                                  <circle cx="65" cy="20" r="3" fill="white" opacity="0.8"/>
                                  <circle cx="15" cy="65" r="2" fill="white" opacity="0.6"/>
                                  <circle cx="70" cy="60" r="2" fill="white" opacity="0.7"/>
                                </svg>
                                <div className="text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <QrCode className="w-6 h-6 text-gray-600" />
                                    <span className="text-lg font-medium text-gray-700">Scan to add items</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Toolbar */}
              <div className="bg-gray-100 border-t border-gray-400 p-2">
                <div className="flex flex-col space-y-3">

                  {/* Stock and Purchase Price Info Boxes */}
                  {cart.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Stock Levels Box */}
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-2 py-2 rounded-lg shadow-lg text-center">
                        <div className="text-xs font-medium opacity-90 mb-1 flex items-center justify-center">
                          <Package className="w-3 h-3 mr-1" />
                          Stock Levels
                        </div>
                        <div className="text-sm font-bold">
                          {cart.slice(-1).map((item) => {
                            // Find the original product data to get stock info
                            const productData = products.find(p => 
                              (item.isVariant && p.id === `${item.productId}-${item.variantId}`) ||
                              (!item.isVariant && p.id === item.productId)
                            );
                            const remainingStock = productData ? productData.stock : 0;
                            
                            return (
                              <div key={item.id} className="text-white font-bold">
                                {remainingStock}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Purchase Price Box - Last Added Product */}
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-2 py-2 rounded-lg shadow-lg text-center">
                        <div className="text-xs font-medium opacity-90 mb-1 flex items-center justify-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Purchase Price
                        </div>
                        {cart.length > 0 && (() => {
                          const lastItem = cart[cart.length - 1];
                          const productData = products.find(p => 
                            (lastItem.isVariant && p.id === `${lastItem.productId}-${lastItem.variantId}`) ||
                            (!lastItem.isVariant && p.id === lastItem.productId)
                          );
                          const purchasePrice = productData?.baseProduct?.purchasePrice || productData?.purchasePrice || 0;
                          
                          return (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-white">
                                Cost: {formatCurrencyValue(purchasePrice)}
                              </div>
                              <div className="text-xs text-white opacity-90">
                                Profit: {formatCurrencyValue((lastItem.price - purchasePrice) * lastItem.quantity)}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Horizontal Totals Boxes */}
                  <div className="grid grid-cols-4 gap-2">
                    {/* Subtotal Box */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-center">
                      <div className="text-xs font-medium opacity-90 mb-1">Subtotal</div>
                      <div className="text-sm font-bold">{formatCurrencyValue(getSubtotal())}</div>
                    </div>

                    {/* Discount Box */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-3 py-2 rounded-lg shadow-lg text-center">
                      <div className="text-xs font-medium opacity-90 mb-1">Discount</div>
                      <div className="text-sm font-bold">
                        {editingGlobalDiscount ? (
                          <Input
                            value={editGlobalDiscountValue}
                            onChange={(e) => setEditGlobalDiscountValue(e.target.value)}
                            onBlur={() => {
                              const value = parseFloat(editGlobalDiscountValue) || 0;
                              if (value >= 0) {
                                const isPercentage = editGlobalDiscountValue.includes('%');
                                applyGlobalDiscount(value, isPercentage ? 'percentage' : 'fixed');
                              }
                              setEditingGlobalDiscount(false);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseFloat(editGlobalDiscountValue) || 0;
                                if (value >= 0) {
                                  const isPercentage = editGlobalDiscountValue.includes('%');
                                  applyGlobalDiscount(value, isPercentage ? 'percentage' : 'fixed');
                                }
                                setEditingGlobalDiscount(false);
                              }
                            }}
                            className="w-16 h-5 text-xs text-center bg-white text-black rounded"
                            placeholder="0% or 0.00"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="cursor-pointer hover:bg-orange-700 rounded px-1"
                            onClick={() => {
                              setEditingGlobalDiscount(true);
                              setEditGlobalDiscountValue(discount.value > 0 ? `${discount.value}${discount.type === 'percentage' ? '%' : ''}` : '');
                            }}
                          >
                            {(getItemDiscountTotal() + getGlobalDiscountAmount()) > 0 
                              ? `-${formatCurrencyValue(getItemDiscountTotal() + getGlobalDiscountAmount())}`
                              : formatCurrencyValue(0)
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tax Box */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-center">
                      <div className="text-xs font-medium opacity-90 mb-1 flex items-center justify-center">
                        Tax
                        {editingTaxRate ? (
                          <Input
                            value={editTaxRateValue}
                            onChange={(e) => setEditTaxRateValue(e.target.value)}
                            onBlur={() => {
                              const value = parseFloat(editTaxRateValue) || 10;
                              updateTaxRate(value);
                              setEditingTaxRate(false);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseFloat(editTaxRateValue) || 10;
                                updateTaxRate(value);
                                setEditingTaxRate(false);
                              }
                            }}
                            className="w-8 h-4 text-xs text-center bg-white text-black rounded ml-1"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="text-xs opacity-70 cursor-pointer hover:bg-blue-700 rounded px-1 ml-1"
                            onClick={() => {
                              setEditingTaxRate(true);
                              setEditTaxRateValue(taxRate.toString());
                            }}
                          >
                            ({taxRate}%)
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold">{formatCurrencyValue(getTaxAmount())}</div>
                    </div>

                    {/* Total Box */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg shadow-lg text-center">
                      <div className="text-xs font-medium opacity-90 mb-1">TOTAL</div>
                      <div className="text-lg font-bold">{formatCurrencyValue(getGrandTotal())}</div>
                      <div className="text-xs opacity-70 mt-1">Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex space-x-1 mt-2">
                  {/* Main Action Buttons */}
                  <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6 flex items-center hover:bg-blue-50">
                    <Gift className="w-3 h-3 mr-1 text-blue-600" />
                    F9-Gift Card
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs px-2 py-1 h-6 flex items-center hover:bg-green-50"
                    onClick={() => {
                      if (cart.length > 0) {
                        const holdId = `HOLD-${Date.now()}`;
                        const newHeldInvoice = {
                          id: holdId,
                          cart: [...cart],
                          customer: selectedCustomerId ? customers?.find(c => c.id === selectedCustomerId) : undefined,
                          timestamp: new Date()
                        };
                        setHeldInvoices(prev => [...prev, newHeldInvoice]);
                        setCart([]);
                        setSelectedCustomerId(null);
                        toast({
                          title: "Invoice Held",
                          description: `Invoice ${holdId} has been saved for later`,
                          variant: "default",
                        });
                      } else {
                        toast({
                          title: "Empty Cart",
                          description: "Add items to cart before holding invoice",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Receipt className="w-3 h-3 mr-1 text-green-600" />
                    F10-Hold Invoice
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs px-2 py-1 h-6 flex items-center hover:bg-blue-50"
                    onClick={() => setShowHoldInvoicesDialog(true)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1 text-blue-600" />
                    F11-Get Hold ({heldInvoices.length})
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
                    ref={searchInputRef}
                    placeholder="Search products by name, barcode, or category..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onKeyPress={handleSearchKeyPress}
                    className={`pl-10 h-12 text-lg rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isScanning ? 'bg-blue-50 border-blue-300' : ''}`}
                    autoComplete="off"
                    autoFocus
                  />
                  {isScanning && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600">
                      <QrCode className="w-6 h-6 animate-pulse" />
                    </div>
                  )}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 max-h-96 overflow-y-auto">
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
                              parseFloat(product.price) || 0
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
                          <th className="text-center py-2 px-2 text-sm font-medium text-gray-600">Discount</th>
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
                              <div className="flex items-center justify-center">
                                {editingItem === item.id ? (
                                  <Input
                                    type="text"
                                    ref={(el) => quantityInputRefs.current[item.id] = el}
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    onBlur={() => {
                                      const newQty = parseInt(editQuantity) || 1;
                                      setAbsoluteQuantity(item.id, newQty);
                                      setEditingPriceItem(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === '+') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newQty = parseInt(editQuantity) || 1;
                                        setAbsoluteQuantity(item.id, newQty);
                                        // Move to price editing
                                        setEditPrice(item.price.toString());
                                        setTimeout(() => {
                                          const priceInput = priceInputRefs.current[item.id];
                                          if (priceInput) {
                                            priceInput.focus();
                                            priceInput.select();
                                          }
                                        }, 150);
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Save quantity and add product to cart
                                        const newQty = parseInt(editQuantity) || 1;
                                        setAbsoluteQuantity(item.id, newQty);
                                        setEditingPriceItem(null);
                                        setEditQuantity('');
                                      }
                                    }}
                                    className="w-16 h-6 text-center text-sm rounded-lg"
                                    autoFocus
                                    data-testid={`quantity-input-${item.id}`}
                                  />
                                ) : (
                                  <span 
                                    className="w-16 text-center font-medium text-sm cursor-pointer hover:bg-gray-200 rounded px-2 py-1 min-w-[32px]"
                                    onClick={() => {
                                      setEditingQuantityItem(item.id);
                                      setEditQuantity(item.quantity.toString());
                                    }}
                                  >
                                    {item.quantity}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right">
                              {editingPriceItem === item.id ? (
                                <Input
                                  ref={(el) => priceInputRefs.current[item.id] = el}
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  onFocus={(e) => {
                                    // Set cursor to beginning after focus
                                    setTimeout(() => {
                                      const input = e.target as HTMLInputElement;
                                      input.setSelectionRange(0, 0);
                                    }, 10);
                                  }}
                                  onBlur={() => {
                                    const newPrice = parseFloat(editPrice) || item.price;
                                    updateItemPrice(item.id, newPrice);
                                    setEditingPriceItem(null);
                                    setEditPrice('');
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === '+') {
                                      e.preventDefault();
                                      const newPrice = parseFloat(editPrice) || item.price;
                                      updateItemPrice(item.id, newPrice);
                                      setEditingPriceItem(null);
                                      setEditPrice('');
                                      // Focus back to search input for next product
                                      setTimeout(() => searchInputRef.current?.focus(), 100);
                                    } else if (e.key === 'Tab') {
                                      e.preventDefault();
                                      // Save price and go back to search field
                                      const newPrice = parseFloat(editPrice) || item.price;
                                      updateItemPrice(item.id, newPrice);
                                      setEditingPriceItem(null);
                                      setEditPrice('');
                                      // Focus back to search input for next product
                                      setTimeout(() => {
                                        if (searchInputRef.current) {
                                          searchInputRef.current.focus();
                                          searchInputRef.current.select();
                                        }
                                      }, 50);
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      // Save price and complete sale
                                      const newPrice = parseFloat(editPrice) || item.price;
                                      updateItemPrice(item.id, newPrice);
                                      setEditingPriceItem(null);
                                      setEditPrice('');
                                      // Complete sale when Enter is pressed
                                      setTimeout(() => setShowPaymentDialog(true), 100);
                                    }
                                  }}
                                  className="w-20 h-6 text-xs text-right rounded"
                                  autoFocus
                                  data-testid={`price-input-${item.id}`}
                                />
                              ) : (
                                <span 
                                  className="text-sm font-medium cursor-pointer hover:bg-gray-200 rounded px-1"
                                  onClick={() => {
                                    setEditingPriceItem(item.id);
                                    setEditPrice(item.price.toString());
                                  }}
                                >
                                  {formatCurrencyValue(item.price)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              {editingDiscount === item.id ? (
                                <div className="flex flex-col space-y-1">
                                  <Input
                                    value={editDiscountValue}
                                    onChange={(e) => setEditDiscountValue(e.target.value)}
                                    onBlur={() => {
                                      const value = parseFloat(editDiscountValue) || 0;
                                      if (value > 0) {
                                        const isPercentage = editDiscountValue.includes('%');
                                        applyItemDiscount(item.id, value, isPercentage ? 'percentage' : 'fixed');
                                      }
                                      setEditingDiscount(null);
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        const value = parseFloat(editDiscountValue) || 0;
                                        if (value > 0) {
                                          const isPercentage = editDiscountValue.includes('%');
                                          applyItemDiscount(item.id, value, isPercentage ? 'percentage' : 'fixed');
                                        }
                                        setEditingDiscount(null);
                                      }
                                    }}
                                    className="w-20 h-6 text-xs text-center rounded"
                                    placeholder="0% or 0.00"
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <span 
                                  className="text-xs cursor-pointer hover:bg-gray-200 rounded px-1 py-1 min-w-[60px] inline-block"
                                  onClick={() => {
                                    setEditingDiscount(item.id);
                                    setEditDiscountValue((item.discount && item.discount > 0) ? `${item.discount}${item.discountType === 'percentage' ? '%' : ''}` : '');
                                  }}
                                >
                                  {(item.discount && item.discount > 0)
                                    ? (item.discountType === 'percentage' ? `${item.discount}%` : formatCurrencyValue(item.discount))
                                    : 'Click to add'
                                  }
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl"
                      onClick={() => setShowAddCustomerDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add New
                    </Button>
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
                            
                            {/* Customer Action Buttons for Grid Layout */}
                            <div className="flex space-x-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => setShowCustomerHistoryDialog(true)}
                              >
                                <User className="w-3 h-3 mr-1" />
                                History
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => setShowPaymentOnAccountDialog(true)}
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Payment
                              </Button>
                            </div>
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
                {/* Global Discount - Inline Editing */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm">
                    <Gift className="w-4 h-4 mr-2" />
                    Total Discount
                  </span>
                  {editingGlobalDiscount ? (
                    <Input
                      value={editGlobalDiscountValue}
                      onChange={(e) => setEditGlobalDiscountValue(e.target.value)}
                      onBlur={() => {
                        const value = parseFloat(editGlobalDiscountValue) || 0;
                        if (value >= 0) {
                          const isPercentage = editGlobalDiscountValue.includes('%');
                          applyGlobalDiscount(value, isPercentage ? 'percentage' : 'fixed');
                        }
                        setEditingGlobalDiscount(false);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = parseFloat(editGlobalDiscountValue) || 0;
                          if (value >= 0) {
                            const isPercentage = editGlobalDiscountValue.includes('%');
                            applyGlobalDiscount(value, isPercentage ? 'percentage' : 'fixed');
                          }
                          setEditingGlobalDiscount(false);
                        }
                      }}
                      className="w-24 h-8 text-sm text-center rounded-lg"
                      placeholder="0% or 0.00"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="text-blue-600 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
                      onClick={() => {
                        setEditingGlobalDiscount(true);
                        setEditGlobalDiscountValue(discount.value > 0 ? `${discount.value}${discount.type === 'percentage' ? '%' : ''}` : '');
                      }}
                    >
                      {discount.value > 0 ? 
                        (discount.type === 'percentage' ? `${discount.value}%` : formatCurrencyValue(discount.value)) 
                        : 'Click to add'
                      }
                    </span>
                  )}
                </div>

                {/* Tax Rate - Inline Editing */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tax Rate (%)</Label>
                  {editingTaxRate ? (
                    <Input
                      value={editTaxRateValue}
                      onChange={(e) => setEditTaxRateValue(e.target.value)}
                      onBlur={() => {
                        const value = parseFloat(editTaxRateValue) || 10;
                        updateTaxRate(value);
                        setEditingTaxRate(false);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = parseFloat(editTaxRateValue) || 10;
                          updateTaxRate(value);
                          setEditingTaxRate(false);
                        }
                      }}
                      className="w-20 h-8 text-sm text-center rounded-lg"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="w-20 h-8 text-sm text-center rounded-lg bg-gray-50 border flex items-center justify-center cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setEditingTaxRate(true);
                        setEditTaxRateValue(taxRate.toString());
                      }}
                    >
                      {taxRate}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Summary - Horizontal Layout */}
            <div className="grid grid-cols-4 gap-4">
              {/* Subtotal Box */}
              <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium opacity-90 mb-1">Subtotal</div>
                  <div className="text-lg font-bold">{formatCurrencyValue(getSubtotal())}</div>
                </CardContent>
              </Card>

              {/* Discount Box */}
              <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium opacity-90 mb-1">Discount</div>
                  <div className="text-lg font-bold">
                    {(getItemDiscountTotal() + getGlobalDiscountAmount()) > 0 
                      ? `-${formatCurrencyValue(getItemDiscountTotal() + getGlobalDiscountAmount())}`
                      : formatCurrencyValue(0)
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Tax Box */}
              <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium opacity-90 mb-1">
                    {getTaxBreakdown().length > 0 ? 
                      `Tax (${getTotalTaxRate()}%)` : 
                      'Tax (0%)'
                    }
                  </div>
                  <div className="text-lg font-bold">{formatCurrencyValue(getTaxAmount())}</div>
                </CardContent>
              </Card>

              {/* Total Box */}
              <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4 text-center">
                  <div className="text-xs font-medium opacity-90 mb-1">TOTAL</div>
                  <div className="text-xl font-bold">{formatCurrencyValue(getGrandTotal())}</div>
                </CardContent>
              </Card>
            </div>

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
          <DialogContent 
            className="max-w-md rounded-2xl" 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const isDisabled = 
                  processSaleMutation.isPending || 
                  (paymentMethod === 'cash' && amountReceived <= 0) ||
                  (!selectedCustomerId && paymentMethod === 'cash' && amountReceived < getGrandTotal());
                
                if (!isDisabled) {
                  processSale();
                }
              }
            }}
          >
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
                  {/* Tax Breakdown */}
                  {getTaxBreakdown().length > 0 && getTaxBreakdown().map((tax) => (
                    <div key={tax.id} className="flex justify-between text-sm">
                      <span>{tax.name} ({tax.rate}%):</span>
                      <span>{formatCurrencyValue(tax.amount)}</span>
                    </div>
                  ))}
                  {getTaxBreakdown().length === 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax (0%):</span>
                      <span>{formatCurrencyValue(0)}</span>
                    </div>
                  )}
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

                  {/* Change Amount - Editable */}
                  {amountReceived > 0 && (
                    <div className="bg-green-50 rounded-xl p-3 mt-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Change Due:</span>
                          <span className="text-lg font-bold text-green-800">
                            {formatCurrencyValue(Math.max(0, amountReceived - getGrandTotal()))}
                          </span>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-green-700">Edit Change Amount (Optional)</Label>
                          <Input
                            type="number"
                            value={changeAmount}
                            onChange={(e) => setChangeAmount(parseFloat(e.target.value) || 0)}
                            placeholder="Override change amount"
                            className="rounded-lg h-8 text-sm mt-1 bg-white"
                            step="0.01"
                          />
                          <div className="text-xs text-green-600 mt-1">
                            Leave at 0 to use calculated change: {formatCurrencyValue(Math.max(0, amountReceived - getGrandTotal()))}
                          </div>
                        </div>
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
                  {(selectedCustomerId || lastInvoice?.customer) && lastInvoice.grandTotal > lastInvoice.payment.amountReceived && (
                    <div className="flex justify-between bold text-red-600">
                      <span>Remaining Balance:</span>
                      <span>{formatCurrencyValue(lastInvoice.grandTotal - lastInvoice.payment.amountReceived)}</span>
                    </div>
                  )}
                </div>

                {/* Customer Balance Information Section */}
                {(selectedCustomerId || lastInvoice?.customer) && (
                  <div>
                    <div className="divider"></div>
                    <div className="space-y-1">
                      <div className="text-center text-sm font-bold">Customer Balance Status</div>
                      {(() => {
                        const customerId = selectedCustomerId || lastInvoice?.customer?.id;
                        const customerLedgerForInvoice = customerLedgerData?.filter(entry => entry.customerId === customerId) || [];
                        
                        const previousBalance = customerLedgerForInvoice.reduce((balance: number, entry: any) => {
                          const amount = parseFloat(entry.amount) || 0;
                          return entry.type === 'debit' ? balance + amount : balance - amount;
                        }, 0);
                        
                        const unpaidAmount = lastInvoice.grandTotal - lastInvoice.payment.amountReceived;
                        const newBalance = previousBalance + unpaidAmount;
                        
                        console.log('Invoice Balance Debug:', { customerId, customerLedgerForInvoice, previousBalance, unpaidAmount, newBalance });
                        
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
                  
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={!showNotesBreakdown ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowNotesBreakdown(false)}
                        className="flex-1"
                      >
                        Manual Amount
                      </Button>
                      <Button
                        type="button"
                        variant={showNotesBreakdown ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowNotesBreakdown(true)}
                        className="flex-1"
                      >
                        Count Notes
                      </Button>
                    </div>

                    {!showNotesBreakdown ? (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter actual cash amount"
                        value={cashDrawerBalance}
                        onChange={(e) => setCashDrawerBalance(parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedRegisterId && cashDrawerBalance > 0) {
                              openRegister(selectedRegisterId, cashDrawerBalance);
                            }
                          }
                        }}
                        className="text-lg font-semibold text-center"
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700">Currency Notes Breakdown</div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {[
                            { denomination: 5000, key: 'note5000' as keyof typeof currencyNotes },
                            { denomination: 1000, key: 'note1000' as keyof typeof currencyNotes },
                            { denomination: 500, key: 'note500' as keyof typeof currencyNotes },
                            { denomination: 100, key: 'note100' as keyof typeof currencyNotes },
                            { denomination: 50, key: 'note50' as keyof typeof currencyNotes },
                            { denomination: 10, key: 'note10' as keyof typeof currencyNotes },
                          ].map(({ denomination, key }) => (
                            <div key={denomination} className="flex items-center space-x-2">
                              <Label className="text-xs min-w-[50px]">Rs {denomination}</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={currencyNotes[key].toString()}
                                onChange={(e) => {
                                  // Only allow numbers
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setCurrencyNotes(prev => ({
                                    ...prev,
                                    [key]: parseInt(value) || 0
                                  }));
                                }}
                                onFocus={(e) => {
                                  // Place cursor at end, don't select all
                                  const input = e.target as HTMLInputElement;
                                  setTimeout(() => {
                                    const len = input.value.length;
                                    input.setSelectionRange(len, len);
                                  }, 0);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (selectedRegisterId && cashDrawerBalance > 0) {
                                      openRegister(selectedRegisterId, cashDrawerBalance);
                                    }
                                  }
                                }}
                                className="text-center h-8"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-500 min-w-[60px]">
                                = {formatCurrencyValue(currencyNotes[key] * denomination)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center font-semibold">
                            <span>Total Cash:</span>
                            <span className="text-lg">{formatCurrencyValue(calculateNotesTotal())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {!showNotesBreakdown 
                        ? "Tip: Use 'Count Notes' for easier cash counting with denominations"
                        : "Cash total calculated from notes count automatically"}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => openRegister(selectedRegisterId!, cashDrawerBalance)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      openRegister(selectedRegisterId!, cashDrawerBalance);
                    }
                  }}
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

        {/* Customer History Dialog */}
        <Dialog open={showCustomerHistoryDialog} onOpenChange={setShowCustomerHistoryDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Sales History
                {selectedCustomerId && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {customers?.find(c => c.id === selectedCustomerId)?.name}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <CustomerHistoryContent 
              customerId={selectedCustomerId} 
              showAllSales={false} 
              onViewSale={async (sale) => {
                // Fetch detailed sale items for the invoice
                try {
                  const itemsResponse = await fetch(`/api/sales/${sale.id}/items`);
                  if (itemsResponse.ok) {
                    const items = await itemsResponse.json();
                    // Format items for invoice display
                    const formattedItems = items.map((item: any) => ({
                      ...item,
                      productName: item.product?.name || item.productName || 'Unknown Product',
                      quantity: parseFloat(item.quantity || '0'),
                      price: parseFloat(item.price || '0'),
                      total: parseFloat(item.quantity || '0') * parseFloat(item.price || '0')
                    }));
                    
                    setSelectedSaleForView({
                      ...sale,
                      items: formattedItems
                    });
                  } else {
                    // Fallback to sale without items
                    setSelectedSaleForView({ ...sale, items: [] });
                  }
                } catch (error) {
                  console.error('Error fetching sale items:', error);
                  setSelectedSaleForView({ ...sale, items: [] });
                }
                setShowSaleDetailDialog(true);
              }}
              onEditLoadSale={(sale) => {
                if (sale.items && sale.items.length > 0) {
                  const cartItems = sale.items.map((item: any) => ({
                    id: item.id || `${item.productId}-${item.variantId || 'default'}`,
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.productName,
                    baseName: item.productName.split(' - ')[0],
                    variantName: item.productName.split(' - ')[1] || 'Default',
                    price: parseFloat(item.price || item.unitPrice || 0),
                    quantity: item.quantity,
                    total: parseFloat(item.total),
                    discount: item.discount || 0,
                    isVariant: !!item.variantId
                  }));
                  setCart(cartItems);
                  if (sale.customerId) {
                    setSelectedCustomerId(sale.customerId);
                  }
                  setShowCustomerHistoryDialog(false);
                  toast({
                    title: "Sale Loaded",
                    description: `Sale #${sale.id} loaded for editing with ${sale.items.length} items`,
                  });
                }
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Payment On Account Dialog */}
        <Dialog open={showPaymentOnAccountDialog} onOpenChange={setShowPaymentOnAccountDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment On Account
              </DialogTitle>
            </DialogHeader>
            
            <PaymentOnAccountContent 
              customerId={selectedCustomerId}
              customerLedger={customerLedger}
              onClose={() => setShowPaymentOnAccountDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* All Sales Dialog */}
        <Dialog open={showAllSalesDialog} onOpenChange={setShowAllSalesDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                All Sales ({salesCount || 0})
              </DialogTitle>
            </DialogHeader>
            
            <CustomerHistoryContent 
              customerId={null} 
              showAllSales={true} 
              onViewSale={async (sale) => {
                // Fetch detailed sale items for the invoice
                try {
                  const itemsResponse = await fetch(`/api/sales/${sale.id}/items`);
                  if (itemsResponse.ok) {
                    const items = await itemsResponse.json();
                    // Format items for invoice display
                    const formattedItems = items.map((item: any) => ({
                      ...item,
                      productName: item.product?.name || item.productName || 'Unknown Product',
                      quantity: parseFloat(item.quantity || '0'),
                      price: parseFloat(item.price || '0'),
                      total: parseFloat(item.quantity || '0') * parseFloat(item.price || '0')
                    }));
                    
                    setSelectedSaleForView({
                      ...sale,
                      items: formattedItems
                    });
                  } else {
                    // Fallback to sale without items
                    setSelectedSaleForView({ ...sale, items: [] });
                  }
                } catch (error) {
                  console.error('Error fetching sale items:', error);
                  setSelectedSaleForView({ ...sale, items: [] });
                }
                setShowSaleDetailDialog(true);
              }}
              onEditLoadSale={null}
            />
          </DialogContent>
        </Dialog>

        {/* Held Invoices Dialog */}
        <Dialog open={showHoldInvoicesDialog} onOpenChange={setShowHoldInvoicesDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Held Invoices ({heldInvoices.length})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {heldInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No held invoices found</p>
                  <p className="text-xs">Use F10 to hold current invoice</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {heldInvoices.map((heldInvoice) => (
                    <div key={heldInvoice.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{heldInvoice.id}</div>
                          <div className="text-sm text-gray-600">
                            {heldInvoice.timestamp.toLocaleString()}
                          </div>
                          {heldInvoice.customer && (
                            <div className="text-sm text-blue-600">
                              Customer: {heldInvoice.customer.name}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Load the held invoice back to cart
                              setCart([...heldInvoice.cart]);
                              if (heldInvoice.customer) {
                                setSelectedCustomerId(heldInvoice.customer.id);
                              }
                              // Remove from held invoices
                              setHeldInvoices(prev => prev.filter(inv => inv.id !== heldInvoice.id));
                              setShowHoldInvoicesDialog(false);
                              toast({
                                title: "Invoice Loaded",
                                description: `Invoice ${heldInvoice.id} has been loaded for editing`,
                              });
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Load & Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setHeldInvoices(prev => prev.filter(inv => inv.id !== heldInvoice.id));
                              toast({
                                title: "Invoice Deleted",
                                description: `Held invoice ${heldInvoice.id} has been removed`,
                              });
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-semibold mb-2">Items ({heldInvoice.cart.length}):</div>
                        {heldInvoice.cart.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{item.name} × {item.quantity}</span>
                            <span>{formatCurrencyValue(item.total)}</span>
                          </div>
                        ))}
                        {heldInvoice.cart.length > 3 && (
                          <div className="text-xs text-gray-500">
                            ... and {heldInvoice.cart.length - 3} more items
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrencyValue(heldInvoice.cart.reduce((sum, item) => sum + item.total, 0))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Sale Detail Modal */}
        <Dialog open={showSaleDetailDialog} onOpenChange={setShowSaleDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Sale #{selectedSaleForView?.id} - Invoice Details
                </div>
                <Badge variant={selectedSaleForView?.status === 'completed' ? 'default' : selectedSaleForView?.status === 'pending' ? 'destructive' : 'secondary'}>
                  {selectedSaleForView?.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            {selectedSaleForView && (
              <div className="space-y-6">
                {/* Sale Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Sale Information</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{new Date(selectedSaleForView.saleDate).toLocaleDateString()} at {new Date(selectedSaleForView.saleDate).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="capitalize">{selectedSaleForView.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-semibold">{formatCurrencyValue(selectedSaleForView.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount Paid:</span>
                          <span>{formatCurrencyValue(selectedSaleForView.paidAmount)}</span>
                        </div>
                        {parseFloat(selectedSaleForView.totalAmount) > parseFloat(selectedSaleForView.paidAmount) && (
                          <div className="flex justify-between text-red-600">
                            <span>Outstanding:</span>
                            <span>{formatCurrencyValue(parseFloat(selectedSaleForView.totalAmount) - parseFloat(selectedSaleForView.paidAmount))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Customer Information</h3>
                      <div className="space-y-1 text-sm">
                        {selectedSaleForView.customerName ? (
                          <>
                            <div className="flex justify-between">
                              <span>Name:</span>
                              <span>{selectedSaleForView.customerName}</span>
                            </div>
                            {selectedSaleForView.customerPhone && (
                              <div className="flex justify-between">
                                <span>Phone:</span>
                                <span>{selectedSaleForView.customerPhone}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500">Walk-in Customer</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="font-semibold mb-3">Sale Items ({selectedSaleForView.items?.length || 0})</h3>
                  {selectedSaleForView.items && selectedSaleForView.items.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold">#</th>
                            <th className="text-left py-3 px-4 font-semibold">Item Name</th>
                            <th className="text-center py-3 px-4 font-semibold">Quantity</th>
                            <th className="text-center py-3 px-4 font-semibold">Unit Price</th>
                            <th className="text-center py-3 px-4 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSaleForView.items.map((item: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="py-3 px-4">{index + 1}</td>
                              <td className="py-3 px-4">{item.productName}</td>
                              <td className="py-3 px-4 text-center">{item.quantity}</td>
                              <td className="py-3 px-4 text-center">{formatCurrencyValue(item.price)}</td>
                              <td className="py-3 px-4 text-center font-semibold">{formatCurrencyValue(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          {(() => {
                            // Calculate subtotal from item totals
                            const subtotal = selectedSaleForView.items?.reduce((sum: number, item: any) => 
                              sum + parseFloat(item.total || 0), 0) || 0;
                            
                            // Calculate tax amount (total - subtotal)
                            const totalAmount = parseFloat(selectedSaleForView.totalAmount || 0);
                            const taxAmount = totalAmount - subtotal;
                            const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;
                            
                            return (
                              <>
                                <tr>
                                  <td colSpan={4} className="py-2 px-4 text-right text-sm">Subtotal:</td>
                                  <td className="py-2 px-4 text-center text-sm">{formatCurrencyValue(subtotal)}</td>
                                </tr>
                                {taxAmount > 0 && (
                                  <tr>
                                    <td colSpan={4} className="py-2 px-4 text-right text-sm">
                                      Tax ({taxRate.toFixed(1)}%):
                                    </td>
                                    <td className="py-2 px-4 text-center text-sm">{formatCurrencyValue(taxAmount)}</td>
                                  </tr>
                                )}
                                <tr className="border-t-2">
                                  <td colSpan={4} className="py-3 px-4 text-right font-bold">Total:</td>
                                  <td className="py-3 px-4 text-center font-bold">{formatCurrencyValue(totalAmount)}</td>
                                </tr>
                              </>
                            );
                          })()}
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No items found in this sale</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Customer Dialog - Shared between both layouts */}
        <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Add New Customer
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="sharedNewCustomerName">Name *</Label>
                <Input
                  id="sharedNewCustomerName"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="sharedNewCustomerPhone">Phone</Label>
                <Input
                  id="sharedNewCustomerPhone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="sharedNewCustomerEmail">Email</Label>
                <Input
                  id="sharedNewCustomerEmail"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Email address"
                  className="rounded-xl"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    setShowAddCustomerDialog(false);
                    setNewCustomer({ name: "", phone: "", email: "" }); // Reset form
                  }}
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
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
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

// Customer History Component
function CustomerHistoryContent({ customerId, showAllSales, onEditLoadSale, onViewSale }: { customerId: number | null; showAllSales?: boolean; onEditLoadSale?: (sale: any) => void; onViewSale?: (sale: any) => void }) {
  const { formatCurrencyValue } = useCurrency();
  const { toast } = useToast();
  
  // Fetch customer sales history or all sales
  const { data: customerSales = [], isLoading } = useQuery<any[]>({
    queryKey: showAllSales ? ['/api/sales'] : [`/api/customers/${customerId}/sales`],
    enabled: showAllSales || !!customerId,
    retry: false,
  });

  if (!showAllSales && !customerId) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Please select a customer to view sales history</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading customer sales history...</p>
      </div>
    );
  }

  if (customerSales.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No sales history found for this customer</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Total Sales: {customerSales.length} • 
        Total Amount: {formatCurrencyValue(customerSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0))}
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {customerSales.map((sale: any) => (
          <Card key={sale.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">Sale #{sale.id}</div>
                <div className="text-sm text-gray-500">
                  {new Date(sale.saleDate).toLocaleDateString()} at {new Date(sale.saleDate).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrencyValue(sale.totalAmount)}</div>
                <Badge variant={sale.status === 'completed' ? 'default' : sale.status === 'pending' ? 'destructive' : 'secondary'}>
                  {sale.status}
                </Badge>
              </div>
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{sale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>{formatCurrencyValue(sale.paidAmount)}</span>
              </div>
              {parseFloat(sale.totalAmount) > parseFloat(sale.paidAmount) && (
                <div className="flex justify-between text-red-600">
                  <span>Outstanding:</span>
                  <span>{formatCurrencyValue(parseFloat(sale.totalAmount) - parseFloat(sale.paidAmount))}</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-semibold">Items: {sale.items?.length || 0}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 h-6 bg-blue-50 border-blue-300 hover:bg-blue-100"
                  onClick={() => {
                    if (onViewSale) {
                      onViewSale(sale);
                    }
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Sale
                </Button>
              </div>
              {sale.items && sale.items.length > 0 && (
                <div className="space-y-1">
                  {sale.items.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{formatCurrencyValue(item.total)}</span>
                    </div>
                  ))}
                  {sale.items.length > 3 && (
                    <div className="text-xs text-gray-500">
                      ... and {sale.items.length - 3} more items
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Payment On Account Component
function PaymentOnAccountContent({ 
  customerId, 
  customerLedger, 
  onClose 
}: { 
  customerId: number | null;
  customerLedger: any[];
  onClose: () => void;
}) {
  const { formatCurrencyValue } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [description, setDescription] = useState('');

  // Calculate current customer balance
  const currentBalance = customerLedger.reduce((balance: number, entry: any) => {
    const amount = parseFloat(entry.amount) || 0;
    return entry.type === 'debit' ? balance + amount : balance - amount;
  }, 0);

  const handlePayment = async () => {
    if (!customerId || paymentAmount <= 0) {
      toast({
        title: "Invalid Payment",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create credit entry in customer ledger
      const ledgerEntry = {
        customerId: customerId,
        amount: paymentAmount.toFixed(2),
        type: 'credit',
        reference: `PAYMENT-${Date.now()}`,
        description: description || 'Payment on account',
        paymentMethod: paymentMethod,
        date: new Date().toISOString().split('T')[0]
      };

      await apiRequest('POST', '/api/customer-ledgers', ledgerEntry);
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrencyValue(paymentAmount)} has been recorded`,
      });

      // Refresh customer ledger data
      queryClient.invalidateQueries({ queryKey: ['/api/customer-ledgers'] });
      
      // Reset form
      setPaymentAmount(0);
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!customerId) {
    return (
      <div className="text-center py-8">
        <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Please select a customer to process payment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-gray-600">Current Balance</div>
        <div className={`text-lg font-bold ${currentBalance > 0 ? 'text-red-600' : currentBalance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
          {currentBalance > 0 
            ? `${formatCurrencyValue(currentBalance)} (Due)`
            : currentBalance < 0 
              ? `${formatCurrencyValue(Math.abs(currentBalance))} (Credit)`
              : `${formatCurrencyValue(0)} (Clear)`}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Payment Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter payment amount"
            className="text-lg"
          />
        </div>

        <div>
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'mobile') => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="mobile">Mobile Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Description (Optional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Payment description"
          />
        </div>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={paymentAmount <= 0}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Record Payment
        </Button>
      </div>
    </div>
  );
}
