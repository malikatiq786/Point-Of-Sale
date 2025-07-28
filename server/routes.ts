import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertCustomerSchema, insertSaleSchema } from "@shared/schema";
import { apiRoutes } from "./src/routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithRole(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // In-memory storage for returns
  let returnsStorage: any[] = [
    {
      id: 1,
      saleId: 1,
      reason: "Defective product - screen cracked on arrival",
      status: "processed",
      totalAmount: "599.99",
      customerName: "John Smith",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{ productName: "Samsung Galaxy S23", quantity: 1 }]
    },
    {
      id: 2,
      saleId: 2,
      reason: "Wrong size ordered",
      status: "pending",
      totalAmount: "129.99",
      customerName: "Jane Doe",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{ productName: "Nike Air Max", quantity: 1 }]
    },
    {
      id: 3,
      saleId: 3,
      reason: "Customer changed mind - no longer needed",
      status: "approved",
      totalAmount: "89.99",
      customerName: "Mike Johnson",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{ productName: "Sony Headphones", quantity: 1 }]
    }
  ];

  // Returns routes
  app.get('/api/returns', isAuthenticated, async (req: any, res: any) => {
    try {
      console.log('MAIN ROUTES: Fetching returns, current storage has:', returnsStorage.length, 'items');
      const sortedReturns = [...returnsStorage].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      console.log('MAIN ROUTES: Returning sorted returns:', sortedReturns.map(r => ({ id: r.id, reason: r.reason })));
      res.json(sortedReturns);
    } catch (error) {
      console.error('Get returns error:', error);
      res.status(500).json({ message: 'Failed to fetch returns' });
    }
  });

  app.post('/api/returns', isAuthenticated, async (req: any, res: any) => {
    try {
      const salesData = [
        { id: 1, totalAmount: "599.99", customer: { name: "John Smith" }},
        { id: 2, totalAmount: "129.99", customer: { name: "Jane Doe" }},
        { id: 3, totalAmount: "89.99", customer: { name: "Mike Johnson" }},
        { id: 4, totalAmount: "49.99", customer: { name: "Sarah Wilson" }}
      ];
      
      const saleId = parseInt(req.body.saleId);
      const sale = salesData.find(s => s.id === saleId);
      
      const returnData = {
        id: Date.now(),
        saleId: saleId,
        reason: req.body.reason,
        items: req.body.items || [],
        status: "pending",
        totalAmount: sale?.totalAmount || "0.00",
        customerName: sale?.customer?.name || "Walk-in Customer",
        createdAt: new Date().toISOString()
      };
      
      returnsStorage.push(returnData);
      
      console.log('MAIN ROUTES: Return created and added to storage:', returnData);
      console.log('MAIN ROUTES: Total returns in storage:', returnsStorage.length);
      res.status(201).json(returnData);
    } catch (error) {
      console.error('Create return error:', error);
      res.status(500).json({ message: 'Failed to create return' });
    }
  });

  // Financial modules APIs
  
  // Payments API
  let paymentsStorage: any[] = [
    {
      id: 1,
      customerId: 1,
      customerName: "John Smith",
      amount: "250.00",
      paymentMethod: "card",
      paymentType: "received",
      paymentDate: "2025-07-28",
      status: "completed",
      description: "Payment for invoice #INV-001",
      reference: "TXN-12345",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      customerId: 2,
      customerName: "Jane Doe",
      amount: "180.50",
      paymentMethod: "cash",
      paymentType: "received",
      paymentDate: "2025-07-27",
      status: "completed",
      description: "Cash payment for services",
      reference: "",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      customerId: 3,
      customerName: "Mike Johnson",
      amount: "95.75",
      paymentMethod: "bank_transfer",
      paymentType: "refund",
      paymentDate: "2025-07-26",
      status: "pending",
      description: "Refund for returned items",
      reference: "REF-789",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  app.get('/api/payments', (req, res) => {
    console.log('Fetching payments, total:', paymentsStorage.length);
    const sortedPayments = paymentsStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedPayments);
  });

  app.post('/api/payments', (req, res) => {
    try {
      const { customerId, amount, paymentMethod, paymentType, description, reference } = req.body;
      
      // Get customer data for the payment
      const customer = customersStorage.find(c => c.id == customerId) || { name: 'Walk-in Customer' };
      
      const paymentData = {
        id: Date.now(),
        customerId: parseInt(customerId),
        customerName: customer.name,
        amount: amount,
        paymentMethod,
        paymentType,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: description || '',
        reference: reference || '',
        createdAt: new Date().toISOString()
      };

      paymentsStorage.unshift(paymentData);
      console.log('Payment created:', paymentData);
      res.status(201).json(paymentData);
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  // Accounts API
  let accountsStorage: any[] = [
    {
      id: 1,
      name: "Cash in Hand",
      accountCode: "1001",
      accountType: "asset",
      openingBalance: "5000.00",
      currentBalance: "7250.00",
      description: "Cash register and petty cash",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Accounts Receivable",
      accountCode: "1200",
      accountType: "asset", 
      openingBalance: "2500.00",
      currentBalance: "3100.00",
      description: "Outstanding customer invoices",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Sales Revenue",
      accountCode: "4001",
      accountType: "revenue",
      openingBalance: "0.00",
      currentBalance: "15750.00",
      description: "Revenue from product sales",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: "Office Rent",
      accountCode: "5001",
      accountType: "expense",
      openingBalance: "0.00",
      currentBalance: "3000.00",
      description: "Monthly office rent expense",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      name: "Accounts Payable",
      accountCode: "2001",
      accountType: "liability",
      openingBalance: "1500.00",
      currentBalance: "2200.00",
      description: "Outstanding supplier invoices",
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  app.get('/api/accounts', (req, res) => {
    console.log('Fetching accounts, total:', accountsStorage.length);
    res.json(accountsStorage);
  });

  app.post('/api/accounts', (req, res) => {
    try {
      const { name, accountCode, accountType, description, openingBalance, isActive } = req.body;
      
      const accountData = {
        id: Date.now(),
        name,
        accountCode,
        accountType,
        openingBalance: openingBalance || "0.00",
        currentBalance: openingBalance || "0.00",
        description: description || '',
        isActive: isActive !== false,
        createdAt: new Date().toISOString()
      };

      accountsStorage.push(accountData);
      console.log('Account created:', accountData);
      res.status(201).json(accountData);
    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  // Transactions API  
  let transactionsStorage: any[] = [
    {
      id: 1,
      accountId: 1,
      accountName: "Cash in Hand",
      amount: "250.00",
      transactionType: "income",
      transactionDate: "2025-07-28",
      description: "Cash sale payment received",
      reference: "SALE-001",
      createdBy: "John Cashier",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      accountId: 4,
      accountName: "Office Rent", 
      amount: "1500.00",
      transactionType: "expense",
      transactionDate: "2025-07-27",
      description: "Monthly office rent payment",
      reference: "RENT-JUL25",
      createdBy: "Admin User",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      accountId: 3,
      accountName: "Sales Revenue",
      amount: "450.00",
      transactionType: "income",
      transactionDate: "2025-07-26",
      description: "Product sales revenue",
      reference: "SALE-002",
      createdBy: "Jane Cashier",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 4,
      accountId: 1,
      accountName: "Cash in Hand",
      amount: "120.00",
      transactionType: "expense",
      transactionDate: "2025-07-25",
      description: "Office supplies purchase",
      reference: "EXP-001",
      createdBy: "Admin User",
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  app.get('/api/transactions', (req, res) => {
    console.log('Fetching transactions, total:', transactionsStorage.length);
    const sortedTransactions = transactionsStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedTransactions);
  });

  // Reports API
  app.get('/api/reports', (req, res) => {
    const { reportType, dateFrom, dateTo, period } = req.query;
    
    console.log('Generating report:', { reportType, dateFrom, dateTo, period });
    
    // Sample report data - in real implementation, this would query the database
    const reportData = {
      reportType: reportType || 'profit_loss',
      period: period || 'monthly',
      dateFrom: dateFrom || '2025-01-01',
      dateTo: dateTo || '2025-07-28',
      summary: {
        totalRevenue: 125400,
        totalExpenses: 67200,
        netProfit: 58200,
        profitMargin: 0.464
      },
      monthlyData: [
        { month: 'Jan', income: 12000, expenses: 8000, profit: 4000 },
        { month: 'Feb', income: 15000, expenses: 9000, profit: 6000 },
        { month: 'Mar', income: 18000, expenses: 11000, profit: 7000 },
        { month: 'Apr', income: 16000, expenses: 12000, profit: 4000 },
        { month: 'May', income: 20000, expenses: 13000, profit: 7000 },
        { month: 'Jun', income: 22000, expenses: 14000, profit: 8000 },
      ],
      expenseBreakdown: [
        { category: 'Rent', amount: 3000 },
        { category: 'Utilities', amount: 800 },
        { category: 'Supplies', amount: 1200 },
        { category: 'Marketing', amount: 1500 },
        { category: 'Other', amount: 900 }
      ],
      generatedAt: new Date().toISOString()
    };
    
    res.json(reportData);
  });

  // Use new MVC routes
  app.use('/api', apiRoutes);

  // Legacy routes for compatibility (will be gradually migrated)
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/activities", isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/dashboard/top-products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getTopProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ message: "Failed to fetch top products" });
    }
  });

  app.get("/api/dashboard/recent-transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getRecentTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Product routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { search, limit } = req.query;
      let products;
      
      if (search) {
        products = await storage.searchProducts(search as string);
      } else {
        products = await storage.getProducts(limit ? parseInt(limit as string) : undefined);
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      
      // Log activity
      await storage.logActivity(
        req.user.claims.sub,
        `Created customer: ${customer.name}`,
        req.ip
      );
      
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Sales routes
  app.get("/api/sales", isAuthenticated, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", isAuthenticated, async (req: any, res) => {
    try {
      const saleData = {
        ...req.body,
        userId: req.user.claims.sub,
        saleDate: new Date(),
        status: 'completed'
      };
      
      const sale = await storage.createSale(saleData);
      
      // Log activity
      await storage.logActivity(
        req.user.claims.sub,
        `Completed sale: $${sale.totalAmount}`,
        req.ip
      );
      
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Product management routes
  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const product = await storage.createProduct(req.body);
      
      // Log activity
      await storage.logActivity(
        req.user.claims.sub,
        `Created product: ${product.name}`,
        req.ip
      );
      
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Category routes
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const category = await storage.createCategory(req.body);
      
      // Log activity
      await storage.logActivity(
        req.user.claims.sub,
        `Created category: ${category.name}`,
        req.ip
      );
      
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Brand routes
  app.get("/api/brands", isAuthenticated, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  // Other module routes with placeholder implementations
  app.get("/api/stock", isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/purchases", isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Initialize sample data route
  app.post("/api/initialize-sample-data", isAuthenticated, async (req: any, res) => {
    try {
      await initializeSampleData(req.user.claims.sub);
      res.json({ message: "Sample data initialized successfully" });
    } catch (error) {
      console.error("Error initializing sample data:", error);
      res.status(500).json({ message: "Failed to initialize sample data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSampleData(userId: string) {
  // Create sample categories
  const categories = await Promise.all([
    storage.createCategory({ name: "Electronics" }),
    storage.createCategory({ name: "Food & Beverages" }),
    storage.createCategory({ name: "Clothing" }),
    storage.createCategory({ name: "Books & Media" }),
    storage.createCategory({ name: "Home & Garden" }),
  ]);

  // Create sample brands
  const brands = await Promise.all([
    storage.createBrand({ name: "Samsung" }),
    storage.createBrand({ name: "Apple" }),
    storage.createBrand({ name: "Nike" }),
    storage.createBrand({ name: "Coca-Cola" }),
    storage.createBrand({ name: "Generic" }),
  ]);

  // Create sample products
  const sampleProducts = [
    {
      name: "Samsung Galaxy S23",
      description: "Latest Samsung smartphone with advanced camera",
      categoryId: categories[0].id,
      brandId: brands[0].id,
    },
    {
      name: "iPhone 15",
      description: "Apple's newest iPhone with USB-C",
      categoryId: categories[0].id,
      brandId: brands[1].id,
    },
    {
      name: "Nike Air Max",
      description: "Comfortable running shoes",
      categoryId: categories[2].id,
      brandId: brands[2].id,
    },
    {
      name: "Coca Cola 330ml",
      description: "Classic cola soft drink",
      categoryId: categories[1].id,
      brandId: brands[3].id,
    },
    {
      name: "Wireless Headphones",
      description: "Bluetooth wireless headphones",
      categoryId: categories[0].id,
      brandId: brands[4].id,
    },
    {
      name: "Coffee Mug",
      description: "Ceramic coffee mug",
      categoryId: categories[4].id,
      brandId: brands[4].id,
    },
    {
      name: "Notebook A4",
      description: "Lined notebook for writing",
      categoryId: categories[3].id,
      brandId: brands[4].id,
    },
    {
      name: "Energy Drink",
      description: "High caffeine energy drink",
      categoryId: categories[1].id,
      brandId: brands[4].id,
    },
  ];

  await Promise.all(
    sampleProducts.map((product) => storage.createProduct(product))
  );

  // Create some sample customers
  const sampleCustomers = [
    {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0101",
      address: "123 Main St, City, State 12345",
    },
    {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1-555-0102",
      address: "456 Oak Ave, City, State 12346",
    },
    {
      name: "Mike Wilson",
      email: "mike.wilson@email.com",
      phone: "+1-555-0103",
      address: "789 Pine Rd, City, State 12347",
    },
  ];

  await Promise.all(
    sampleCustomers.map((customer) => storage.createCustomer(customer))
  );

  // Log the initialization
  await storage.logActivity(
    userId,
    "Initialized sample data: categories, brands, products, and customers",
    "system"
  );
}
