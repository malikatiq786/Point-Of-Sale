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

  // Custom login endpoint that bypasses Replit auth for development
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for:', email);
      
      // Get user from database with role information
      const user = await storage.getUserByEmail(email);
      console.log('Found user:', user);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // For development, we'll skip password verification
      // In production, you'd verify the password hash here
      
      // Store user in session
      req.session.user = user;
      console.log('User logged in:', user);
      
      res.json({ 
        message: 'Login successful', 
        user: user 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: any, res) => {
    const user = req.session?.user;
    console.log('User logged out:', user?.name || 'Unknown user');
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Get current user (modified to use session)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check session first
      if (req.session?.user) {
        return res.json(req.session.user);
      }
      
      // Fallback to Replit auth if available
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUserWithRole(userId);
        return res.json(user);
      }
      
      res.status(401).json({ message: 'Not authenticated' });
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
  
  // Customers storage
  let customersStorage: any[] = [
    {
      id: 1,
      name: "John Smith",
      phone: "+1-555-0123",
      email: "john.smith@email.com",
      address: "123 Main St, City, State 12345"
    },
    {
      id: 2,
      name: "Jane Doe",
      phone: "+1-555-0456",
      email: "jane.doe@email.com",
      address: "456 Oak Ave, City, State 67890"
    },
    {
      id: 3,
      name: "Mike Johnson",
      phone: "+1-555-0789",
      email: "mike.johnson@email.com",
      address: "789 Pine St, City, State 11111"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      phone: "+1-555-0987",
      email: "sarah.wilson@email.com",
      address: "321 Elm St, City, State 22222"
    }
  ];

  // Suppliers storage
  let suppliersStorage: any[] = [
    {
      id: 1,
      name: "ABC Supplies Co",
      phone: "+1-555-1001",
      email: "contact@abcsupplies.com",
      address: "100 Industrial Dr, Business Park"
    },
    {
      id: 2,
      name: "Tech Solutions Inc",
      phone: "+1-555-1002",
      email: "sales@techsolutions.com",
      address: "200 Technology Blvd, Tech Center"
    }
  ];
  
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
      const customer = customersStorage.find((c: any) => c.id == customerId) || { name: 'Walk-in Customer' };
      
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

  // Customers API
  app.get('/api/customers', (req, res) => {
    console.log('Fetching customers, total:', customersStorage.length);
    res.json(customersStorage);
  });

  app.post('/api/customers', (req, res) => {
    try {
      const { name, phone, email, address } = req.body;
      
      const customerData = {
        id: Date.now(),
        name: name || '',
        phone: phone || '',
        email: email || '',
        address: address || ''
      };

      customersStorage.push(customerData);
      console.log('Customer created:', customerData);
      res.status(201).json(customerData);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });

  // Suppliers API
  app.get('/api/suppliers', (req, res) => {
    console.log('Fetching suppliers, total:', suppliersStorage.length);
    res.json(suppliersStorage);
  });

  app.post('/api/suppliers', (req, res) => {
    try {
      const { name, phone, email, address } = req.body;
      
      const supplierData = {
        id: Date.now(),
        name: name || '',
        phone: phone || '',
        email: email || '',
        address: address || ''
      };

      suppliersStorage.push(supplierData);
      console.log('Supplier created:', supplierData);
      res.status(201).json(supplierData);
    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({ message: 'Failed to create supplier' });
    }
  });

  // Customer Ledgers API
  let customerLedgersStorage: any[] = [
    {
      id: 1,
      customerId: 1,
      customerName: "John Smith",
      amount: "500.00",
      type: "debit",
      reference: "INV-001",
      description: "Invoice for services rendered",
      date: "2025-07-28",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      customerId: 1,
      customerName: "John Smith",
      amount: "250.00",
      type: "credit",
      reference: "PAY-001",
      description: "Payment received against invoice",
      date: "2025-07-27",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      customerId: 2,
      customerName: "Jane Doe",
      amount: "750.00",
      type: "debit",
      reference: "INV-002",
      description: "Product purchase invoice",
      date: "2025-07-26",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 4,
      customerId: 2,
      customerName: "Jane Doe",
      amount: "400.00",
      type: "credit",
      reference: "PAY-002",
      description: "Partial payment received",
      date: "2025-07-25",
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  app.get('/api/customer-ledgers', (req, res) => {
    console.log('Fetching customer ledgers, total:', customerLedgersStorage.length);
    const sortedLedgers = customerLedgersStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedLedgers);
  });

  app.post('/api/customer-ledgers', (req, res) => {
    try {
      const { customerId, amount, type, reference, description } = req.body;
      
      // Get customer data for the ledger entry
      const customer = customersStorage.find((c: any) => c.id == customerId) || { name: 'Unknown Customer' };
      
      const ledgerData = {
        id: Date.now(),
        customerId: parseInt(customerId),
        customerName: customer.name,
        amount: amount,
        type,
        reference: reference || '',
        description: description || '',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      customerLedgersStorage.unshift(ledgerData);
      console.log('Customer ledger entry created:', ledgerData);
      res.status(201).json(ledgerData);
    } catch (error) {
      console.error('Create customer ledger error:', error);
      res.status(500).json({ message: 'Failed to create customer ledger entry' });
    }
  });

  // Supplier Ledgers API
  let supplierLedgersStorage: any[] = [
    {
      id: 1,
      supplierId: 1,
      supplierName: "ABC Supplies Co",
      amount: "1200.00",
      type: "debit",
      reference: "PO-001",
      description: "Purchase order for inventory",
      date: "2025-07-28",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      supplierId: 1,
      supplierName: "ABC Supplies Co",
      amount: "600.00",
      type: "credit",
      reference: "PAY-SUP-001",
      description: "Payment made to supplier",
      date: "2025-07-27",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      supplierId: 2,
      supplierName: "XYZ Materials Ltd",
      amount: "2500.00",
      type: "debit",
      reference: "PO-002",
      description: "Raw materials purchase",
      date: "2025-07-26",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 4,
      supplierId: 2,
      supplierName: "XYZ Materials Ltd",
      amount: "1500.00",
      type: "credit",
      reference: "PAY-SUP-002",
      description: "Advance payment to supplier",
      date: "2025-07-25",
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  app.get('/api/supplier-ledgers', (req, res) => {
    console.log('Fetching supplier ledgers, total:', supplierLedgersStorage.length);
    const sortedLedgers = supplierLedgersStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedLedgers);
  });

  app.post('/api/supplier-ledgers', (req, res) => {
    try {
      const { supplierId, amount, type, reference, description } = req.body;
      
      // Get supplier data for the ledger entry
      const supplier = suppliersStorage.find((s: any) => s.id == supplierId) || { name: 'Unknown Supplier' };
      
      const ledgerData = {
        id: Date.now(),
        supplierId: parseInt(supplierId),
        supplierName: supplier.name,
        amount: amount,
        type,
        reference: reference || '',
        description: description || '',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      supplierLedgersStorage.unshift(ledgerData);
      console.log('Supplier ledger entry created:', ledgerData);
      res.status(201).json(ledgerData);
    } catch (error) {
      console.error('Create supplier ledger error:', error);
      res.status(500).json({ message: 'Failed to create supplier ledger entry' });
    }
  });

  // HR Modules APIs
  
  // Employees API
  let employeesStorage: any[] = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@company.com",
      phone: "+1-555-0101",
      position: "Software Engineer",
      salary: "75000",
      hireDate: "2023-01-15",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      phone: "+1-555-0102",
      position: "Marketing Manager",
      salary: "68000",
      hireDate: "2023-03-20",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike.davis@company.com",
      phone: "+1-555-0103",
      position: "Sales Representative",
      salary: "55000",
      hireDate: "2023-06-10",
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: "Emily Wilson",
      email: "emily.wilson@company.com",
      phone: "+1-555-0104",
      position: "HR Specialist",
      salary: "62000",
      hireDate: "2023-02-05",
      createdAt: new Date().toISOString()
    }
  ];

  app.get('/api/employees', (req, res) => {
    console.log('Fetching employees, total:', employeesStorage.length);
    const sortedEmployees = employeesStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedEmployees);
  });

  app.post('/api/employees', (req, res) => {
    try {
      const { name, email, phone, position, salary, hireDate } = req.body;
      
      const employeeData = {
        id: Date.now(),
        name,
        email,
        phone: phone || '',
        position: position || '',
        salary: salary || '',
        hireDate: hireDate || '',
        createdAt: new Date().toISOString()
      };

      employeesStorage.unshift(employeeData);
      console.log('Employee created:', employeeData);
      res.status(201).json(employeeData);
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({ message: 'Failed to create employee' });
    }
  });

  // Attendance API
  let attendanceStorage: any[] = [
    {
      id: 1,
      employeeId: 1,
      employeeName: "John Smith",
      employeePosition: "Software Engineer",
      date: "2025-07-28",
      checkIn: "09:00",
      checkOut: "17:30",
      status: "present",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: "Sarah Johnson",
      employeePosition: "Marketing Manager",
      date: "2025-07-28",
      checkIn: "08:45",
      checkOut: "17:15",
      status: "present",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: "Mike Davis",
      employeePosition: "Sales Representative",
      date: "2025-07-28",
      checkIn: "",
      checkOut: "",
      status: "absent",
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      employeeId: 4,
      employeeName: "Emily Wilson",
      employeePosition: "HR Specialist",
      date: "2025-07-28",
      checkIn: "09:15",
      checkOut: "17:45",
      status: "late",
      createdAt: new Date().toISOString()
    }
  ];

  app.get('/api/attendance', (req, res) => {
    console.log('Fetching attendance records, total:', attendanceStorage.length);
    const sortedAttendance = attendanceStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedAttendance);
  });

  app.post('/api/attendance', (req, res) => {
    try {
      const { employeeId, date, checkIn, checkOut, status } = req.body;
      
      // Get employee data for the attendance record
      const employee = employeesStorage.find(e => e.id == employeeId) || { name: 'Unknown Employee', position: 'Unknown' };
      
      const attendanceData = {
        id: Date.now(),
        employeeId: parseInt(employeeId),
        employeeName: employee.name,
        employeePosition: employee.position,
        date,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        status,
        createdAt: new Date().toISOString()
      };

      attendanceStorage.unshift(attendanceData);
      console.log('Attendance record created:', attendanceData);
      res.status(201).json(attendanceData);
    } catch (error) {
      console.error('Create attendance error:', error);
      res.status(500).json({ message: 'Failed to create attendance record' });
    }
  });

  // Payroll API
  let payrollStorage: any[] = [
    {
      id: 1,
      employeeId: 1,
      employeeName: "John Smith",
      employeePosition: "Software Engineer",
      baseSalary: "75000",
      overtime: "500",
      bonuses: "1000",
      deductions: "200",
      netSalary: "76300",
      month: 7,
      year: 2025,
      status: "paid",
      notes: "Regular monthly salary",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: "Sarah Johnson",
      employeePosition: "Marketing Manager",
      baseSalary: "68000",
      overtime: "300",
      bonuses: "800",
      deductions: "150",
      netSalary: "68950",
      month: 7,
      year: 2025,
      status: "pending",
      notes: "Monthly salary with performance bonus",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: "Mike Davis",
      employeePosition: "Sales Representative",
      baseSalary: "55000",
      overtime: "200",
      bonuses: "1500",
      deductions: "100",
      netSalary: "56600",
      month: 7,
      year: 2025,
      status: "processing",
      notes: "Salary with sales commission",
      createdAt: new Date().toISOString()
    }
  ];

  app.get('/api/payroll', (req, res) => {
    console.log('Fetching payroll records, total:', payrollStorage.length);
    const sortedPayroll = payrollStorage.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedPayroll);
  });

  app.post('/api/payroll', (req, res) => {
    try {
      const { employeeId, baseSalary, overtime, bonuses, deductions, month, year, notes } = req.body;
      
      // Get employee data for the payroll record
      const employee = employeesStorage.find(e => e.id == employeeId) || { name: 'Unknown Employee', position: 'Unknown' };
      
      // Calculate net salary
      const base = parseFloat(baseSalary || '0');
      const ot = parseFloat(overtime || '0');
      const bonus = parseFloat(bonuses || '0');
      const deduct = parseFloat(deductions || '0');
      const net = base + ot + bonus - deduct;
      
      const payrollData = {
        id: Date.now(),
        employeeId: parseInt(employeeId),
        employeeName: employee.name,
        employeePosition: employee.position,
        baseSalary: baseSalary,
        overtime: overtime || '0',
        bonuses: bonuses || '0',
        deductions: deductions || '0',
        netSalary: net.toFixed(2),
        month: parseInt(month),
        year: parseInt(year),
        status: 'pending',
        notes: notes || '',
        createdAt: new Date().toISOString()
      };

      payrollStorage.unshift(payrollData);
      console.log('Payroll record created:', payrollData);
      res.status(201).json(payrollData);
    } catch (error) {
      console.error('Create payroll error:', error);
      res.status(500).json({ message: 'Failed to create payroll record' });
    }
  });

  app.patch('/api/payroll/:id/process', (req, res) => {
    try {
      const payrollId = parseInt(req.params.id);
      const payrollIndex = payrollStorage.findIndex(p => p.id === payrollId);
      
      if (payrollIndex === -1) {
        return res.status(404).json({ message: 'Payroll record not found' });
      }
      
      payrollStorage[payrollIndex].status = 'paid';
      console.log('Payroll payment processed for ID:', payrollId);
      res.json(payrollStorage[payrollIndex]);
    } catch (error) {
      console.error('Process payroll error:', error);
      res.status(500).json({ message: 'Failed to process payroll payment' });
    }
  });

  // Authentication APIs (placed before the generic MVC routes to avoid conflicts)
  
  // Mock user database with role-based access
  const usersDatabase = [
    {
      id: 1,
      email: "malikatiq@gmail.com",
      password: "admin123", // In production, this should be hashed
      name: "Malik Atiq",
      role: "Super Admin",
      permissions: ["all"], // Super admin has all permissions
      avatar: null
    },
    {
      id: 2,
      email: "owner@company.com",
      password: "owner123",
      name: "Business Owner",
      role: "Admin/Owner", 
      permissions: ["business_management", "inventory", "sales", "finance", "hr", "reports"],
      avatar: null
    },
    {
      id: 3,
      email: "manager@company.com",
      password: "manager123",
      name: "Store Manager",
      role: "Manager",
      permissions: ["inventory", "sales", "customers", "suppliers", "reports"],
      avatar: null
    },
    {
      id: 4,
      email: "cashier@company.com", 
      password: "cashier123",
      name: "POS Cashier",
      role: "Cashier",
      permissions: ["pos", "sales", "customers_basic"],
      avatar: null
    },
    {
      id: 5,
      email: "accountant@company.com",
      password: "accountant123", 
      name: "Financial Accountant",
      role: "Accountant",
      permissions: ["finance", "expenses", "accounting", "reports_financial"],
      avatar: null
    },
    {
      id: 6,
      email: "warehouse@company.com",
      password: "warehouse123",
      name: "Warehouse Staff", 
      role: "Warehouse Staff",
      permissions: ["inventory", "stock_management", "transfers", "reports_inventory"],
      avatar: null
    }
  ];

  // Current logged-in user session storage
  let currentUser: any = null;

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user in mock database
      const user = usersDatabase.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Set current user session
      currentUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar
      };

      console.log('User logged in:', currentUser);
      
      res.json({ 
        message: 'Login successful',
        user: currentUser
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/user', (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      res.json(currentUser);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    try {
      const loggedOutUser = currentUser?.name || 'Unknown user';
      currentUser = null;
      
      console.log('User logged out:', loggedOutUser);
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  app.get('/api/auth/logout', (req, res) => {
    try {
      const loggedOutUser = currentUser?.name || 'Unknown user';
      currentUser = null;
      
      console.log('User logged out:', loggedOutUser);
      res.redirect('/');
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Registers storage and API
  let registersStorage: any[] = [
    {
      id: 1,
      name: "Main Register",
      code: "REG-001",
      branchId: 1,
      branchName: "Main Branch",
      openingBalance: "1000.00",
      currentBalance: "1250.00",
      isActive: true,
      lastOpened: new Date(Date.now() - 3600000).toISOString(),
      lastClosed: null
    },
    {
      id: 2,
      name: "Secondary Register",
      code: "REG-002", 
      branchId: 1,
      branchName: "Main Branch",
      openingBalance: "500.00",
      currentBalance: "675.00",
      isActive: false,
      lastOpened: new Date(Date.now() - 86400000).toISOString(),
      lastClosed: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 3,
      name: "Express Counter",
      code: "REG-003",
      branchId: 2,
      branchName: "West Branch",
      openingBalance: "750.00",
      currentBalance: "920.00",
      isActive: false, 
      lastOpened: new Date(Date.now() - 172800000).toISOString(),
      lastClosed: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  app.get('/api/registers', (req, res) => {
    console.log('Fetching registers, total:', registersStorage.length);
    res.json(registersStorage);
  });

  app.post('/api/registers', (req, res) => {
    try {
      const { name, code, branchId, openingBalance } = req.body;
      
      const registerData = {
        id: Date.now(),
        name: name,
        code: code || `REG-${Date.now()}`,
        branchId: parseInt(branchId),
        branchName: "Main Branch", // Default branch name
        openingBalance: openingBalance || "0.00",
        currentBalance: openingBalance || "0.00",
        isActive: false,
        lastOpened: null,
        lastClosed: null
      };

      registersStorage.push(registerData);
      console.log('Register created:', registerData);
      res.status(201).json(registerData);
    } catch (error) {
      console.error('Create register error:', error);
      res.status(500).json({ message: 'Failed to create register' });
    }
  });

  app.patch('/api/registers/:id/open', (req, res) => {
    try {
      const registerId = parseInt(req.params.id);
      const { openingBalance } = req.body;
      
      const registerIndex = registersStorage.findIndex(r => r.id === registerId);
      if (registerIndex === -1) {
        return res.status(404).json({ message: 'Register not found' });
      }
      
      // Close all other registers first
      registersStorage.forEach(r => {
        if (r.id !== registerId && r.isActive) {
          r.isActive = false;
          r.lastClosed = new Date().toISOString();
        }
      });
      
      // Open the selected register
      registersStorage[registerIndex].isActive = true;
      registersStorage[registerIndex].lastOpened = new Date().toISOString();
      registersStorage[registerIndex].lastClosed = null;
      if (openingBalance !== undefined) {
        registersStorage[registerIndex].currentBalance = openingBalance;
      }
      
      console.log('Register opened:', registersStorage[registerIndex]);
      res.json(registersStorage[registerIndex]);
    } catch (error) {
      console.error('Open register error:', error);
      res.status(500).json({ message: 'Failed to open register' });
    }
  });

  app.patch('/api/registers/:id/close', (req, res) => {
    try {
      const registerId = parseInt(req.params.id);
      const { closingBalance } = req.body;
      
      const registerIndex = registersStorage.findIndex(r => r.id === registerId);
      if (registerIndex === -1) {
        return res.status(404).json({ message: 'Register not found' });
      }
      
      registersStorage[registerIndex].isActive = false;
      registersStorage[registerIndex].lastClosed = new Date().toISOString();
      if (closingBalance !== undefined) {
        registersStorage[registerIndex].currentBalance = closingBalance;
      }
      
      console.log('Register closed:', registersStorage[registerIndex]);
      res.json(registersStorage[registerIndex]);
    } catch (error) {
      console.error('Close register error:', error);
      res.status(500).json({ message: 'Failed to close register' });
    }
  });

  // Sales storage and API
  let salesStorage: any[] = [
    {
      id: 1,
      customerId: 1,
      customerName: "John Smith",
      totalAmount: "299.99",
      paidAmount: "299.99",
      status: "completed",
      paymentMethod: "card",
      saleDate: new Date(Date.now() - 86400000).toISOString(),
      items: [
        {
          productId: 4,
          productName: "Samsung Galaxy S23",
          quantity: 1,
          unitPrice: "299.99",
          price: "299.99",
          total: "299.99"
        }
      ]
    },
    {
      id: 2,
      customerId: 2,
      customerName: "Jane Doe",
      totalAmount: "129.99",
      paidAmount: "100.00",
      status: "pending",
      paymentMethod: "cash",
      saleDate: new Date(Date.now() - 172800000).toISOString(),
      items: [
        {
          productId: 5,
          productName: "Nike Air Max",
          quantity: 1,
          unitPrice: "129.99",
          price: "129.99",
          total: "129.99"
        }
      ]
    }
  ];

  // Sales API endpoints
  app.get('/api/sales', (req, res) => {
    console.log('Fetching sales, total:', salesStorage.length);
    const sortedSales = salesStorage.sort((a, b) => 
      new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    );
    res.json(sortedSales);
  });

  // Customer sales history endpoint
  app.get('/api/customers/:customerId/sales', (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      console.log('Fetching sales for customer ID:', customerId);
      
      // Filter sales by customer ID
      const customerSales = salesStorage.filter(sale => sale.customerId === customerId);
      
      // Sort by date descending (most recent first)
      const sortedCustomerSales = customerSales.sort((a, b) => 
        new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      );
      
      console.log(`Found ${sortedCustomerSales.length} sales for customer ${customerId}`);
      res.json(sortedCustomerSales);
    } catch (error) {
      console.error('Error fetching customer sales:', error);
      res.status(500).json({ message: 'Failed to fetch customer sales' });
    }
  });

  app.post('/api/sales', async (req, res) => {
    try {
      console.log('SIMPLE SALES API: Received request body:', JSON.stringify(req.body, null, 2));
      const { totalAmount, paidAmount, status, paymentMethod, customerId, customer, items, orderType, tableNumber, specialInstructions, kitchenStatus } = req.body;
      
      console.log('SIMPLE SALES API: Processing sale:', { totalAmount, paidAmount, status, paymentMethod, customerId, items: items?.length, orderType, tableNumber });
      
      // Validate required fields
      if (!totalAmount || !paidAmount || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields: totalAmount, paidAmount, items' });
      }
      
      // Validate each item has required fields
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice || !item.price || !item.total) {
          return res.status(400).json({ message: 'Each item must have productId, quantity, unitPrice, price, and total' });
        }
      }
      
      // Create sale in database for kitchen integration
      const dbSaleData = {
        customerId: customerId || null,
        userId: (req.session as any)?.user?.id || null,
        totalAmount: totalAmount.toString(),
        paidAmount: paidAmount.toString(),
        status: status || 'completed',
        orderType: orderType || 'sale',
        tableNumber: tableNumber || null,
        kitchenStatus: kitchenStatus || (orderType && orderType !== 'sale' ? 'new' : null),
        specialInstructions: specialInstructions || null,
      };
      
      console.log('SIMPLE SALES API: Creating sale in database:', dbSaleData);
      const dbSale = await storage.createSale(dbSaleData);
      
      const saleData: any = {
        id: dbSale.id,
        customerId: customerId || null,
        customerName: customer?.name || customersStorage.find((c: any) => c.id == customerId)?.name || 'Walk-in Customer',
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        status: status || 'completed',
        paymentMethod: paymentMethod || 'cash',
        orderType: orderType || 'sale',
        tableNumber: tableNumber || null,
        kitchenStatus: kitchenStatus || (orderType && orderType !== 'sale' ? 'new' : null),
        specialInstructions: specialInstructions || null,
        saleDate: new Date().toISOString(),
        items: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName || `Product ${item.productId}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.price,
          total: item.total,
          discount: item.discount || 0
        }))
      };

      salesStorage.unshift(saleData);
      
      // Handle customer ledger entries based on payment difference
      const totalAmountFloat = parseFloat(totalAmount);
      const paidAmountFloat = parseFloat(paidAmount);
      const difference = totalAmountFloat - paidAmountFloat;
      
      if (difference > 0 && customerId) {
        // Customer owes money - create debit entry for unpaid amount
        const ledgerEntry = {
          id: Date.now() + 1,
          customerId: parseInt(customerId),
          customerName: saleData.customerName,
          amount: difference.toFixed(2),
          type: "debit",
          reference: `SALE-${saleData.id}`,
          description: "Unpaid amount from sale",
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        
        customerLedgersStorage.unshift(ledgerEntry);
        console.log('Customer ledger entry created for unpaid amount:', ledgerEntry);
      } else if (difference < 0 && customerId) {
        // Customer overpaid - create credit entry for overpayment
        const overpaidAmount = Math.abs(difference);
        const creditEntry = {
          id: Date.now() + 1,
          customerId: parseInt(customerId),
          customerName: saleData.customerName,
          amount: overpaidAmount.toFixed(2),
          type: "credit",
          reference: `SALE-${saleData.id}`,
          description: "Overpayment credit from sale",
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        
        customerLedgersStorage.unshift(creditEntry);
        console.log('Customer ledger entry created for overpayment:', creditEntry);
        
        // Add overpayment info to sale data for frontend reference
        saleData.overpaymentAmount = overpaidAmount.toFixed(2);
        saleData.changeAmount = overpaidAmount.toFixed(2);
      }
      
      console.log('SIMPLE SALES API: Sale created successfully:', saleData);
      console.log('SIMPLE SALES API: Database sale ID:', dbSale.id);
      res.status(201).json(saleData);
    } catch (error) {
      console.error('SIMPLE SALES API: Create sale error:', error);
      console.error('SIMPLE SALES API: Error stack:', (error as Error).stack);
      res.status(500).json({ message: 'Failed to process sale' });
    }
  });

  // Use new MVC routes (after auth routes to avoid conflicts) - COMPLETELY DISABLED to use simple endpoints
  // app.use('/api', apiRoutes);

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

  // Product routes with pagination (path parameters)
  app.get("/api/products/:page/:limit", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = req.params;
      const { search } = req.query;
      let products;
      let totalCount = 0;
      
      if (search) {
        products = await storage.searchProducts(search as string);
        totalCount = products.length;
        res.json({
          products,
          pagination: {
            page: 1,
            limit: products.length,
            total: totalCount,
            totalPages: 1
          }
        });
      } else {
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const offset = (pageNum - 1) * limitNum;
        
        products = await storage.getProducts(limitNum, offset);
        totalCount = await storage.getProductsCount();
        
        console.log(`Fetching products - Page: ${pageNum}, Limit: ${limitNum}, Offset: ${offset}, Total: ${totalCount}`);
        console.log(`Products returned: ${products.length}`);
        if (products.length > 0) {
          console.log(`First product sample:`, {
            id: products[0].id,
            name: products[0].name,
            category: products[0].category,
            brand: products[0].brand
          });
        }
        
        const response = {
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limitNum)
          }
        };
        
        console.log(`API Response structure:`, {
          productsCount: response.products.length,
          pagination: response.pagination
        });
        
        res.json(response);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Product routes (fallback for query parameters)
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { search, limit, page } = req.query;
      let products;
      let totalCount = 0;
      
      if (search) {
        products = await storage.searchProducts(search as string);
        totalCount = products.length;
      } else {
        const limitNum = limit ? parseInt(limit as string) : 50;
        const pageNum = page ? parseInt(page as string) : 1;
        const offset = (pageNum - 1) * limitNum;
        
        products = await storage.getProducts(limitNum, offset);
        totalCount = await storage.getProductsCount();
      }
      
      res.json({
        products,
        pagination: {
          page: search ? 1 : (page ? parseInt(page as string) : 1),
          limit: search ? products.length : (limit ? parseInt(limit as string) : 50),
          total: totalCount,
          totalPages: search ? 1 : Math.ceil(totalCount / (limit ? parseInt(limit as string) : 50))
        }
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Product DELETE endpoint
  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    console.log("=== DELETE PRODUCT ENDPOINT CALLED ===");
    
    try {
      const productId = parseInt(req.params.id);
      console.log(`Raw product ID from params: ${req.params.id}, parsed: ${productId}`);
      
      if (isNaN(productId)) {
        console.log("Invalid product ID - not a number");
        return res.status(400).json({ message: "Invalid product ID" });
      }

      console.log(`ROUTE: Attempting to delete product: ${productId}`);
      
      // Check if product exists before deletion
      const productsBeforeDelete = await storage.getProductsCount();
      console.log(`ROUTE: Total products before delete: ${productsBeforeDelete}`);
      
      // Perform the deletion
      console.log(`ROUTE: Calling storage.deleteProduct(${productId})`);
      await storage.deleteProduct(productId);
      console.log(`ROUTE: storage.deleteProduct() completed`);
      
      // Check count after deletion to verify it worked
      const productsAfterDelete = await storage.getProductsCount();
      console.log(`ROUTE: Total products after delete: ${productsAfterDelete}`);
      
      if (productsAfterDelete < productsBeforeDelete) {
        console.log(`ROUTE: SUCCESS - Product ${productId} successfully deleted from database`);
      } else {
        console.log(`ROUTE: WARNING - Product ${productId} may not have been deleted - counts are the same`);
      }
      
      res.json({ 
        message: "Product deleted successfully",
        productId: productId,
        beforeCount: productsBeforeDelete,
        afterCount: productsAfterDelete
      });
    } catch (error) {
      console.error("ROUTE: Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
  });

  // Customer routes - DISABLED (using simple in-memory version above)
  // app.get("/api/customers", isAuthenticated, async (req, res) => {
  //   try {
  //     const customers = await storage.getCustomers();
  //     res.json(customers);
  //   } catch (error) {
  //     console.error("Error fetching customers:", error);
  //     res.status(500).json({ message: "Failed to fetch customers" });
  //   }
  // });

  // app.post("/api/customers", isAuthenticated, async (req: any, res) => {
  //   try {
  //     const validatedData = insertCustomerSchema.parse(req.body);
  //     const customer = await storage.createCustomer(validatedData);
      
  //     // Log activity
  //     await storage.logActivity(
  //       req.user.claims.sub,
  //       `Created customer: ${customer.name}`,
  //       req.ip
  //     );
      
  //     res.json(customer);
  //   } catch (error) {
  //     console.error("Error creating customer:", error);
  //     res.status(500).json({ message: "Failed to create customer" });
  //   }
  // });

  // Sales routes - DISABLED (using simple in-memory version above)
  // app.get("/api/sales", isAuthenticated, async (req, res) => {
  //   try {
  //     const sales = await storage.getSales();
  //     res.json(sales);
  //   } catch (error) {
  //     console.error("Error fetching sales:", error);
  //     res.status(500).json({ message: "Failed to fetch sales" });
  //   }
  // });

  // app.post("/api/sales", isAuthenticated, async (req: any, res) => {
  //   try {
  //     const saleData = {
  //       ...req.body,
  //       userId: req.user.claims.sub,
  //       saleDate: new Date(),
  //       status: 'completed'
  //     };
      
  //     const sale = await storage.createSale(saleData);
      
  //     // Log activity
  //     await storage.logActivity(
  //       req.user.claims.sub,
  //       `Completed sale: $${sale.totalAmount}`,
  //       req.ip
  //     );
      
  //     res.json(sale);
  //   } catch (error) {
  //     console.error("Error creating sale:", error);
  //     res.status(500).json({ message: "Failed to create sale" });
  //   }
  // });

  // Product management routes
  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const { name, brandId } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: "Product name is required" });
      }
      
      if (!brandId) {
        return res.status(400).json({ message: "Brand is required" });
      }

      // Check if product with this name and brand already exists
      const exists = await storage.checkProductExists(name, brandId);
      if (exists) {
        return res.status(400).json({ 
          message: "A product with this name already exists for the selected brand. Please choose a different name or brand." 
        });
      }

      const product = await storage.createProduct(req.body);
      
      // Log activity - handle both user formats
      const userId = req.user?.claims?.sub || req.user?.id || "system";
      await storage.logActivity(
        userId,
        `Created product: ${product.name}`,
        req.ip
      );
      
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const products = await storage.getProducts(1, 0); // Get all products to find the one
      const allProducts = await storage.getProducts(200, 0); // Get more products to ensure we find it
      
      const product = allProducts.find((p: any) => p.id === productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.put("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { 
        name, 
        description, 
        barcode, 
        categoryId, 
        brandId, 
        unitId, 
        price, 
        stock, 
        lowStockAlert, 
        image 
      } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: "Product name is required" });
      }
      
      if (!brandId) {
        return res.status(400).json({ message: "Brand is required" });
      }

      // Check if another product with this name and brand already exists (excluding current product)
      const exists = await storage.checkProductExistsExcluding(name, brandId, productId);
      if (exists) {
        return res.status(400).json({ 
          message: "A product with this name already exists for the selected brand. Please choose a different name or brand." 
        });
      }

      // Prepare update data with proper type conversion
      const updateData = {
        name: name.trim(),
        description: description || null,
        barcode: barcode || null,
        categoryId: categoryId || null,
        brandId: brandId,
        unitId: unitId || null,
        price: price ? parseFloat(price) : 0,
        stock: stock ? parseInt(stock) : 0,
        lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : 0,
        image: image || null
      };

      const product = await storage.updateProduct(productId, updateData);
      
      // Log activity - handle both user formats
      const userId = req.user?.claims?.sub || req.user?.id || "system";
      await storage.logActivity(
        userId,
        `Updated product: ${product.name}`,
        req.ip
      );
      
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
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
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      // Check if category with this name already exists
      const existingCategories = await storage.getCategories();
      const existingCategory = existingCategories.find(category => 
        category.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingCategory) {
        return res.status(400).json({ message: "Category already added" });
      }

      const category = await storage.createCategory(req.body);
      
      // Log activity - handle both user formats
      const userId = req.user?.claims?.sub || req.user?.id || "system";
      await storage.logActivity(
        userId,
        `Created category: ${category.name}`,
        req.ip
      );
      
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      // Check if another category with this name already exists (excluding current category)
      const existingCategories = await storage.getCategories();
      const existingCategory = existingCategories.find(category => 
        category.id !== categoryId && category.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingCategory) {
        return res.status(400).json({ message: "Category already added" });
      }

      const category = await storage.updateCategory(categoryId, req.body);
      
      // Log activity - handle both user formats
      const userId = req.user?.claims?.sub || req.user?.id || "system";
      await storage.logActivity(
        userId,
        `Updated category: ${category.name}`,
        req.ip
      );
      
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      await storage.deleteCategory(categoryId);
      
      // Log activity - handle both user formats
      const userId = req.user?.claims?.sub || req.user?.id || "system";
      await storage.logActivity(
        userId,
        `Deleted category with ID: ${categoryId}`,
        req.ip
      );
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      
      // Check if it's a foreign key constraint error
      if (error.code === '23503') {
        return res.status(400).json({ 
          message: "Cannot delete category. It is being used by one or more products. Please remove or change the category of those products first." 
        });
      }
      
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Get categories that can be safely deleted (no products associated)
  app.get("/api/categories/deletable", isAuthenticated, async (req, res) => {
    try {
      // Get all categories
      const allCategories = await storage.getCategories();
      
      // Get all products to check which categories are in use
      const allProducts = await storage.getProducts();
      const usedCategoryIds = new Set(
        allProducts
          .filter(product => product.categoryId !== null)
          .map(product => product.categoryId)
      );
      
      // Filter categories that are not being used by any products
      const deletableCategories = allCategories.filter(category => 
        !usedCategoryIds.has(category.id)
      );
      
      res.json({
        deletableCategories,
        totalCategories: allCategories.length,
        categoriesInUse: usedCategoryIds.size,
        deletableCount: deletableCategories.length
      });
    } catch (error) {
      console.error("Error fetching deletable categories:", error);
      res.status(500).json({ message: "Failed to fetch deletable categories" });
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

  app.post("/api/brands", isAuthenticated, async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Brand name is required" });
      }

      // Check if brand with this name already exists
      const existingBrands = await storage.getBrands();
      const existingBrand = existingBrands.find(brand => 
        brand.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingBrand) {
        return res.status(400).json({ message: "Brand name already exists" });
      }

      const brand = await storage.createBrand({ name, description });
      res.json(brand);
    } catch (error) {
      console.error("Error creating brand:", error);
      // Handle unique constraint violation from database
      if (error.message && error.message.includes('unique')) {
        return res.status(400).json({ message: "Brand name already exists" });
      }
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  app.put("/api/brands/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Brand name is required" });
      }

      // Check if another brand with this name already exists (excluding current brand)
      const existingBrands = await storage.getBrands();
      const existingBrand = existingBrands.find(brand => 
        brand.name.toLowerCase() === name.toLowerCase() && 
        brand.id !== parseInt(id)
      );
      
      if (existingBrand) {
        return res.status(400).json({ message: "Brand name already exists" });
      }

      const brand = await storage.updateBrand(parseInt(id), { name, description });
      res.json(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      // Handle unique constraint violation from database
      if (error.message && error.message.includes('unique')) {
        return res.status(400).json({ message: "Brand name already exists" });
      }
      res.status(500).json({ message: "Failed to update brand" });
    }
  });

  app.delete("/api/brands/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBrand(parseInt(id));
      res.json({ message: "Brand deleted successfully" });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  // Units routes  
  app.get("/api/units", isAuthenticated, async (req, res) => {
    try {
      const units = await storage.getUnits();
      console.log("Fetching units, total:", units.length);
      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  // Units storage for in-memory persistence
  let unitsStorage: any[] = [
    { id: 1, name: "Each", shortName: "ea" },
    { id: 2, name: "Pounds", shortName: "lbs" },
    { id: 3, name: "Kilograms", shortName: "kg" },
    { id: 4, name: "Meters", shortName: "m" },
    { id: 5, name: "Liters", shortName: "L" },
    { id: 6, name: "Pieces", shortName: "pcs" },
    { id: 7, name: "Bottles", shortName: "btl" },
    { id: 8, name: "Boxes", shortName: "box" }
  ];

  app.post("/api/units", isAuthenticated, async (req, res) => {
    try {
      const { name, shortName, symbol } = req.body;
      const unitShortName = shortName || symbol;
      
      if (!name) {
        return res.status(400).json({ message: "Unit name is required" });
      }
      
      if (!unitShortName) {
        return res.status(400).json({ message: "Unit short name is required" });
      }

      // Check if unit with this name already exists
      const existingUnitByName = unitsStorage.find(unit => 
        unit.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingUnitByName) {
        return res.status(400).json({ message: "Unit name already exists" });
      }

      // Check if unit with this short name already exists
      const existingUnitByShortName = unitsStorage.find(unit => 
        unit.shortName.toLowerCase() === unitShortName.toLowerCase()
      );
      
      if (existingUnitByShortName) {
        return res.status(400).json({ message: "Unit short name already exists" });
      }

      const unitData = {
        id: Date.now(),
        name: name,
        shortName: unitShortName,
      };
      unitsStorage.push(unitData);
      console.log("Unit created:", unitData);
      res.status(201).json(unitData);
    } catch (error) {
      console.error("Error creating unit:", error);
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  app.put("/api/units/:id", isAuthenticated, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unitIndex = unitsStorage.findIndex(u => u.id === unitId);
      
      if (unitIndex === -1) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const { name, shortName, symbol } = req.body;
      const unitShortName = shortName || symbol;
      
      if (!name) {
        return res.status(400).json({ message: "Unit name is required" });
      }
      
      if (!unitShortName) {
        return res.status(400).json({ message: "Unit short name is required" });
      }

      // Check if another unit with this name already exists (excluding current unit)
      const existingUnitByName = unitsStorage.find(unit => 
        unit.id !== unitId && unit.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingUnitByName) {
        return res.status(400).json({ message: "Unit name already exists" });
      }

      // Check if another unit with this short name already exists (excluding current unit)
      const existingUnitByShortName = unitsStorage.find(unit => 
        unit.id !== unitId && unit.shortName.toLowerCase() === unitShortName.toLowerCase()
      );
      
      if (existingUnitByShortName) {
        return res.status(400).json({ message: "Unit short name already exists" });
      }
      
      unitsStorage[unitIndex] = {
        ...unitsStorage[unitIndex],
        name: name,
        shortName: unitShortName,
      };
      
      console.log("Unit updated:", unitsStorage[unitIndex]);
      res.json(unitsStorage[unitIndex]);
    } catch (error) {
      console.error("Error updating unit:", error);
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  app.delete("/api/units/:id", isAuthenticated, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const unitIndex = unitsStorage.findIndex(u => u.id === unitId);
      
      if (unitIndex === -1) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      const deletedUnit = unitsStorage.splice(unitIndex, 1)[0];
      console.log("Unit deleted:", deletedUnit);
      res.json({ message: "Unit deleted successfully" });
    } catch (error) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ message: "Failed to delete unit" });
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

  // Currency management routes
  let currenciesStorage: any[] = [
    {
      id: 1,
      code: "PKR",
      name: "Pakistani Rupee",
      symbol: "Rs",
      exchangeRate: 1.000000,
      isActive: true,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      code: "USD",
      name: "US Dollar",
      symbol: "$",
      exchangeRate: 0.0035,
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      code: "EUR",
      name: "Euro",
      symbol: "€",
      exchangeRate: 0.0032,
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  app.get("/api/currencies", isAuthenticated, async (req, res) => {
    console.log("Fetching currencies, total:", currenciesStorage.length);
    res.json(currenciesStorage);
  });

  app.post("/api/currencies", isAuthenticated, async (req, res) => {
    try {
      // If setting as default, unset other defaults
      if (req.body.isDefault) {
        currenciesStorage.forEach(c => c.isDefault = false);
      }
      
      const currency = {
        id: Date.now(),
        code: req.body.code.toUpperCase(),
        name: req.body.name,
        symbol: req.body.symbol,
        exchangeRate: parseFloat(req.body.exchangeRate || "1.000000"),
        isActive: req.body.isActive !== false,
        isDefault: req.body.isDefault || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      currenciesStorage.push(currency);
      console.log("Currency created:", currency);
      res.status(201).json(currency);
    } catch (error) {
      console.error("Error creating currency:", error);
      res.status(500).json({ message: "Failed to create currency" });
    }
  });

  app.put("/api/currencies/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currencyIndex = currenciesStorage.findIndex(c => c.id === id);
      
      if (currencyIndex === -1) {
        return res.status(404).json({ error: "Currency not found" });
      }
      
      // If setting as default, unset other defaults
      if (req.body.isDefault) {
        currenciesStorage.forEach(c => c.isDefault = false);
      }
      
      const updatedCurrency = {
        ...currenciesStorage[currencyIndex],
        code: req.body.code?.toUpperCase() || currenciesStorage[currencyIndex].code,
        name: req.body.name || currenciesStorage[currencyIndex].name,
        symbol: req.body.symbol || currenciesStorage[currencyIndex].symbol,
        exchangeRate: parseFloat(req.body.exchangeRate || currenciesStorage[currencyIndex].exchangeRate),
        isActive: req.body.isActive !== undefined ? req.body.isActive : currenciesStorage[currencyIndex].isActive,
        isDefault: req.body.isDefault !== undefined ? req.body.isDefault : currenciesStorage[currencyIndex].isDefault,
        updatedAt: new Date().toISOString(),
      };
      
      currenciesStorage[currencyIndex] = updatedCurrency;
      console.log("Currency updated:", updatedCurrency);
      res.json(updatedCurrency);
    } catch (error) {
      console.error("Error updating currency:", error);
      res.status(500).json({ message: "Failed to update currency" });
    }
  });

  app.delete("/api/currencies/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currencyIndex = currenciesStorage.findIndex(c => c.id === id);
      
      if (currencyIndex === -1) {
        return res.status(404).json({ error: "Currency not found" });
      }
      
      // Prevent deletion of default currency
      if (currenciesStorage[currencyIndex].isDefault) {
        return res.status(400).json({ error: "Cannot delete default currency" });
      }
      
      const deletedCurrency = currenciesStorage.splice(currencyIndex, 1)[0];
      console.log("Currency deleted:", deletedCurrency);
      res.json({ message: "Currency deleted successfully", currency: deletedCurrency });
    } catch (error) {
      console.error("Error deleting currency:", error);
      res.status(500).json({ message: "Failed to delete currency" });
    }
  });

  // Initialize sample data route
  app.post("/api/initialize-sample-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "system";
      await initializeSampleData(userId);
      res.json({ message: "Sample data initialized successfully" });
    } catch (error) {
      console.error("Error initializing sample data:", error);
      res.status(500).json({ message: "Failed to initialize sample data" });
    }
  });

  // Kitchen POS routes - Added directly here since apiRoutes is disabled
  app.get('/api/kitchen/orders/:status?', isAuthenticated, async (req: any, res: any) => {
    try {
      const status = req.params.status;
      
      // Get all sales with kitchen data from database
      const allSales = await storage.getAllSales();
      
      // Filter for kitchen orders (non-sale types and non-completed status)
      let kitchenOrders = allSales.filter((sale: any) => {
        // Include orders that have kitchen-specific order types or non-completed kitchen status
        return sale.orderType && sale.orderType !== 'sale' && sale.kitchenStatus && sale.kitchenStatus !== 'completed';
      });
      
      // Apply status filter
      if (status && status !== 'all') {
        kitchenOrders = kitchenOrders.filter((order: any) => order.kitchenStatus === status);
      }
      
      // Format orders for frontend
      const formattedOrders = kitchenOrders.map((order: any) => ({
        id: order.id,
        orderType: order.orderType || 'sale',
        tableNumber: order.tableNumber,
        kitchenStatus: order.kitchenStatus || 'new',
        saleDate: order.saleDate,
        totalAmount: order.totalAmount || '0.00',
        specialInstructions: order.specialInstructions,
        estimatedTime: order.estimatedTime,
        customer: { name: order.customer?.name || 'Walk-in Customer' },
        items: order.items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity?.toString() || '1',
          productVariant: {
            product: { name: item.product?.name || 'Unknown Item' }
          }
        })) || []
      }));
      
      res.json(formattedOrders);
    } catch (error) {
      console.error('Kitchen orders error:', error);
      res.status(500).json({ message: 'Failed to fetch kitchen orders' });
    }
  });

  // Kitchen order status update route
  app.patch('/api/kitchen/orders/:id/status', isAuthenticated, async (req: any, res: any) => {
    try {
      const orderId = parseInt(req.params.id);
      const { kitchenStatus, estimatedTime } = req.body;
      
      const updatedOrder = await storage.updateSaleKitchenStatus(orderId, kitchenStatus, estimatedTime);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Update kitchen order status error:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Online menu endpoint (public - no auth required)
  app.get('/api/online/menu', async (req, res) => {
    try {
      const products = await storage.getMenuProducts();
      console.log('Fetching menu products, found:', products.length);
      res.json(products);
    } catch (error) {
      console.error('Get menu error:', error);
      res.status(500).json({ message: 'Failed to get menu' });
    }
  });

  // Online customer authentication middleware
  const isOnlineAuthenticated = (req: any, res: any, next: any) => {
    if (req.session?.onlineCustomer) {
      return next();
    }
    return res.status(401).json({ message: 'Not authenticated' });
  };

  // =========================================
  // ✅ ONLINE RESTAURANT ENDPOINTS PROPERLY INTEGRATED
  // =========================================

  // Online customer registration
  app.post('/api/online/register', async (req, res) => {
    try {
      const { name, email, phone, password, address } = req.body;
      
      // Check if customer already exists
      const existingCustomer = await storage.getOnlineCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      const customer = await storage.createOnlineCustomer({
        name,
        email,
        phone,
        password,
        address
      });
      
      // Store customer in session
      (req.session as any).onlineCustomer = customer;
      
      res.status(201).json({
        message: 'Registration successful',
        customer: { id: customer.id, name: customer.name, email: customer.email }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Online customer login
  app.post('/api/online/login', async (req, res) => {
    console.log('🔐 Online login request received:', { email: req.body?.email });
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      console.log('🔍 Authenticating customer:', email);
      const customer = await storage.authenticateOnlineCustomer(email, password);
      
      if (!customer) {
        console.log('❌ Authentication failed for:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ Customer authenticated:', { id: customer.id, name: customer.name });
      
      // Store customer in session
      (req.session as any).onlineCustomer = customer;
      
      const response = {
        message: 'Login successful',
        customer: { id: customer.id, name: customer.name, email: customer.email }
      };
      
      console.log('📤 Sending login response:', response);
      res.json(response);
    } catch (error) {
      console.error('💥 Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Online customer logout
  app.post('/api/online/logout', (req: any, res) => {
    delete req.session.onlineCustomer;
    res.json({ message: 'Logout successful' });
  });

  // Get current online customer
  app.get('/api/online/me', isOnlineAuthenticated, (req: any, res) => {
    const customer = req.session.onlineCustomer;
    res.json({ id: customer.id, name: customer.name, email: customer.email });
  });

  // Get menu (public - no auth required)
  app.get('/api/online/menu', async (req, res) => {
    try {
      // Check if online ordering is enabled
      const onlineOrderingSetting = await storage.getSetting('online_ordering_enabled');
      if (onlineOrderingSetting?.value !== 'true') {
        return res.status(503).json({ message: 'Online ordering is currently disabled' });
      }
      
      const products = await storage.getMenuProducts();
      console.log('Fetching menu products, found:', products.length);
      res.json(products);
    } catch (error) {
      console.error('Get menu error:', error);
      res.status(500).json({ message: 'Failed to get menu' });
    }
  });

  // Get categories (public - no auth required)
  app.get('/api/online/categories', async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Failed to get categories' });
    }
  });

  // Get cart items
  app.get('/api/online/cart', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const customer = req.session.onlineCustomer;
      const cartItems = await storage.getCartItems(customer.id);
      res.json(cartItems);
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ message: 'Failed to get cart items' });
    }
  });

  // Add to cart
  app.post('/api/online/cart', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const customer = req.session.onlineCustomer;
      const { productId, quantity, specialInstructions } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required' });
      }
      
      // Get product details to get the price
      const products = await storage.getMenuProducts();
      const product = products.find(p => p.id === parseInt(productId));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      console.log('🛒 Adding to cart:', {
        onlineCustomerId: customer.id,
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        price: product.price
      });
      
      const cartItem = await storage.addToCart({
        onlineCustomerId: customer.id,
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        price: product.price || "0"
      });
      
      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({ message: 'Failed to add item to cart' });
    }
  });

  // Update cart item
  app.put('/api/online/cart/:id', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quantity, specialInstructions } = req.body;
      
      const updatedItem = await storage.updateCartItem(parseInt(id), parseInt(quantity), specialInstructions);
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({ message: 'Failed to update cart item' });
    }
  });

  app.delete('/api/online/cart/:id', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(parseInt(id));
      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({ message: 'Failed to remove item from cart' });
    }
  });

  // Place online order
  app.post('/api/online/orders', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const customer = req.session.onlineCustomer;
      const { orderType, specialInstructions, deliveryAddress, customerPhone } = req.body;
      
      // Get cart items
      const cartItems = await storage.getCartItems(customer.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      
      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      
      // Create sale record
      const saleData = {
        onlineCustomerId: customer.id,
        customerName: customer.name,
        customerPhone: customerPhone || customer.phone,
        totalAmount: totalAmount.toString(),
        paidAmount: totalAmount.toString(),
        status: 'completed',
        orderType: orderType || 'takeaway',
        orderSource: 'online',
        kitchenStatus: ['dine-in', 'takeaway', 'delivery'].includes(orderType) ? 'new' : null,
        specialInstructions,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
      };
      
      const sale = await storage.createSale(saleData);
      
      // Clear cart
      await storage.clearCart(customer.id);
      
      // Log activity
      await storage.logActivity(
        `online-${customer.id}`,
        `Online order placed: Rs ${totalAmount} (${orderType})`,
        req.ip
      );
      
      res.status(201).json({
        message: 'Order placed successfully',
        orderId: sale.id,
        totalAmount,
        estimatedTime: 30 // Default 30 minutes
      });
    } catch (error) {
      console.error('Place order error:', error);
      res.status(500).json({ message: 'Failed to place order' });
    }
  });

  // Admin: Toggle online ordering
  app.post('/api/admin/toggle-online-ordering', isAuthenticated, async (req, res) => {
    try {
      const { enabled } = req.body;
      await storage.updateSetting('online_ordering_enabled', enabled ? 'true' : 'false');
      
      res.json({ 
        message: `Online ordering ${enabled ? 'enabled' : 'disabled'}`,
        enabled 
      });
    } catch (error) {
      console.error('Toggle online ordering error:', error);
      res.status(500).json({ message: 'Failed to toggle online ordering' });
    }
  });

  // Admin: Get online ordering status
  app.get('/api/admin/online-ordering-status', isAuthenticated, async (req, res) => {
    try {
      const setting = await storage.getSetting('online_ordering_enabled');
      const enabled = setting?.value === 'true';
      res.json({ enabled });
    } catch (error) {
      console.error('Get online ordering status error:', error);
      res.status(500).json({ message: 'Failed to get status' });
    }
  });

  // =========================================
  // 🚗 Delivery Rider Management Routes
  // =========================================

  // Get all delivery riders
  app.get('/api/delivery-riders', isAuthenticated, async (req, res) => {
    try {
      const riders = await storage.getDeliveryRiders();
      res.json(riders);
    } catch (error) {
      console.error('Get delivery riders error:', error);
      res.status(500).json({ message: 'Failed to fetch delivery riders' });
    }
  });

  // Get active delivery riders (for assignment dropdown)
  app.get('/api/delivery-riders/active', isAuthenticated, async (req, res) => {
    try {
      const riders = await storage.getActiveDeliveryRiders();
      res.json(riders);
    } catch (error) {
      console.error('Get active delivery riders error:', error);
      res.status(500).json({ message: 'Failed to fetch active delivery riders' });
    }
  });

  // Get single delivery rider
  app.get('/api/delivery-riders/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const rider = await storage.getDeliveryRider(parseInt(id));
      if (!rider) {
        return res.status(404).json({ message: 'Delivery rider not found' });
      }
      res.json(rider);
    } catch (error) {
      console.error('Get delivery rider error:', error);
      res.status(500).json({ message: 'Failed to fetch delivery rider' });
    }
  });

  // Create new delivery rider
  app.post('/api/delivery-riders', isAuthenticated, async (req, res) => {
    try {
      const riderData = req.body;
      const rider = await storage.createDeliveryRider(riderData);
      res.status(201).json(rider);
    } catch (error) {
      console.error('Create delivery rider error:', error);
      res.status(500).json({ message: 'Failed to create delivery rider' });
    }
  });

  // Update delivery rider
  app.put('/api/delivery-riders/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const rider = await storage.updateDeliveryRider(parseInt(id), updateData);
      res.json(rider);
    } catch (error) {
      console.error('Update delivery rider error:', error);
      res.status(500).json({ message: 'Failed to update delivery rider' });
    }
  });

  // Delete delivery rider
  app.delete('/api/delivery-riders/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDeliveryRider(parseInt(id));
      res.json({ message: 'Delivery rider deleted successfully' });
    } catch (error) {
      console.error('Delete delivery rider error:', error);
      res.status(500).json({ message: 'Failed to delete delivery rider' });
    }
  });

  // =========================================
  // 📦 Rider Assignment Routes
  // =========================================

  // Assign rider to order
  app.post('/api/orders/:saleId/assign-rider', isAuthenticated, async (req: any, res) => {
    try {
      const { saleId } = req.params;
      const { riderId } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!riderId) {
        return res.status(400).json({ message: 'Rider ID is required' });
      }

      const assignment = await storage.assignRiderToOrder(
        parseInt(saleId),
        parseInt(riderId),
        userId
      );
      
      res.status(201).json({
        message: 'Rider assigned successfully',
        assignment
      });
    } catch (error) {
      console.error('Assign rider error:', error);
      res.status(500).json({ message: 'Failed to assign rider to order' });
    }
  });

  // Update rider assignment status
  app.put('/api/rider-assignments/:assignmentId/status', isAuthenticated, async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { status, notes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const assignment = await storage.updateRiderAssignmentStatus(
        parseInt(assignmentId),
        status,
        notes
      );
      
      res.json({
        message: 'Assignment status updated successfully',
        assignment
      });
    } catch (error) {
      console.error('Update assignment status error:', error);
      res.status(500).json({ message: 'Failed to update assignment status' });
    }
  });

  // Get rider assignments
  app.get('/api/rider-assignments', isAuthenticated, async (req, res) => {
    try {
      const { riderId, saleId } = req.query;
      const assignments = await storage.getRiderAssignments(
        riderId ? parseInt(riderId as string) : undefined,
        saleId ? parseInt(saleId as string) : undefined
      );
      res.json(assignments);
    } catch (error) {
      console.error('Get rider assignments error:', error);
      res.status(500).json({ message: 'Failed to fetch rider assignments' });
    }
  });

  // Get order assignment
  app.get('/api/orders/:saleId/assignment', isAuthenticated, async (req, res) => {
    try {
      const { saleId } = req.params;
      const assignment = await storage.getOrderAssignment(parseInt(saleId));
      res.json(assignment || null);
    } catch (error) {
      console.error('Get order assignment error:', error);
      res.status(500).json({ message: 'Failed to fetch order assignment' });
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

  // Initialize default currencies
  const existingCurrencies = await storage.getCurrencies();
  if (existingCurrencies.length === 0) {
    const defaultCurrencies = [
      {
        code: "PKR",
        name: "Pakistani Rupee", 
        symbol: "Rs",
        exchangeRate: "1.000000",
        isActive: true,
        isDefault: true,
      },
      {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        exchangeRate: "0.0035", // 1 PKR = 0.0035 USD (approximate)
        isActive: true,
        isDefault: false,
      },
      {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        exchangeRate: "0.0032", // 1 PKR = 0.0032 EUR (approximate)
        isActive: true,
        isDefault: false,
      }
    ];
    
    for (const currency of defaultCurrencies) {
      await storage.createCurrency(currency);
    }
  }

  // Online customer authentication middleware
  const isOnlineAuthenticated = (req: any, res: any, next: any) => {
    if (req.session?.onlineCustomer) {
      return next();
    }
    return res.status(401).json({ message: 'Not authenticated' });
  };

  // =========================================
  // ✅ ONLINE RESTAURANT ENDPOINTS PROPERLY INTEGRATED
  // =========================================

  // Online customer registration
  app.post('/api/online/register', async (req, res) => {
    try {
      const { name, email, phone, password, address } = req.body;
      
      // Check if customer already exists
      const existingCustomer = await storage.getOnlineCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      const customer = await storage.createOnlineCustomer({
        name,
        email,
        phone,
        password,
        address
      });
      
      // Store customer in session
      (req.session as any).onlineCustomer = customer;
      
      res.status(201).json({
        message: 'Registration successful',
        customer: { id: customer.id, name: customer.name, email: customer.email }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Online customer login
  app.post('/api/online/login', async (req, res) => {
    console.log('🔐 Online login request received:', { email: req.body?.email });
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      console.log('🔍 Authenticating customer:', email);
      const customer = await storage.authenticateOnlineCustomer(email, password);
      
      if (!customer) {
        console.log('❌ Authentication failed for:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ Customer authenticated:', { id: customer.id, name: customer.name });
      
      // Store customer in session
      (req.session as any).onlineCustomer = customer;
      
      const response = {
        message: 'Login successful',
        customer: { id: customer.id, name: customer.name, email: customer.email }
      };
      
      console.log('📤 Sending login response:', response);
      res.json(response);
    } catch (error) {
      console.error('💥 Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Online customer logout
  app.post('/api/online/logout', (req: any, res) => {
    delete req.session.onlineCustomer;
    res.json({ message: 'Logout successful' });
  });

  // Get current online customer
  app.get('/api/online/me', isOnlineAuthenticated, (req: any, res) => {
    const customer = req.session.onlineCustomer;
    res.json({ id: customer.id, name: customer.name, email: customer.email });
  });

  // Get menu (public - no auth required)
  app.get('/api/online/menu', async (req, res) => {
    try {
      // Check if online ordering is enabled
      const onlineOrderingSetting = await storage.getSetting('online_ordering_enabled');
      if (onlineOrderingSetting?.value !== 'true') {
        return res.status(503).json({ message: 'Online ordering is currently disabled' });
      }
      
      const products = await storage.getMenuProducts();
      console.log('Fetching menu products, found:', products.length);
      res.json(products);
    } catch (error) {
      console.error('Get menu error:', error);
      res.status(500).json({ message: 'Failed to get menu' });
    }
  });

  // Get menu categories (public)
  app.get('/api/online/categories', async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Failed to get categories' });
    }
  });

  // Cart operations
  app.get('/api/online/cart', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.session.onlineCustomer.id;
      const cartItems = await storage.getCartItems(customerId);
      res.json(cartItems);
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ message: 'Failed to get cart' });
    }
  });

  app.post('/api/online/cart', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.session.onlineCustomer.id;
      const { productId, quantity, price } = req.body;
      
      const cartItem = await storage.addToCart({
        onlineCustomerId: customerId,
        productId,
        quantity,
        price
      });
      
      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({ message: 'Failed to add to cart' });
    }
  });

  app.put('/api/online/cart/:id', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      const updatedItem = await storage.updateCartItem(parseInt(id), quantity);
      res.json(updatedItem);
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({ message: 'Failed to update cart item' });
    }
  });

  app.delete('/api/online/cart/:id', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(parseInt(id));
      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({ message: 'Failed to remove item from cart' });
    }
  });

  // Place online order
  app.post('/api/online/orders', isOnlineAuthenticated, async (req: any, res) => {
    try {
      const customer = req.session.onlineCustomer;
      const { orderType, specialInstructions, deliveryAddress, customerPhone } = req.body;
      
      // Get cart items
      const cartItems = await storage.getCartItems(customer.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      
      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      
      // Create sale record
      const saleData = {
        onlineCustomerId: customer.id,
        customerName: customer.name,
        customerPhone: customerPhone || customer.phone,
        totalAmount: totalAmount.toString(),
        paidAmount: totalAmount.toString(),
        status: 'completed',
        orderType: orderType || 'takeaway',
        orderSource: 'online',
        kitchenStatus: ['dine-in', 'takeaway', 'delivery'].includes(orderType) ? 'new' : null,
        specialInstructions,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
      };
      
      const sale = await storage.createSale(saleData);
      
      // Clear cart
      await storage.clearCart(customer.id);
      
      // Log activity
      await storage.logActivity(
        `online-${customer.id}`,
        `Online order placed: Rs ${totalAmount} (${orderType})`,
        req.ip
      );
      
      res.status(201).json({
        message: 'Order placed successfully',
        orderId: sale.id,
        totalAmount,
        estimatedTime: 30 // Default 30 minutes
      });
    } catch (error) {
      console.error('Place order error:', error);
      res.status(500).json({ message: 'Failed to place order' });
    }
  });

  // Admin: Toggle online ordering
  app.post('/api/admin/toggle-online-ordering', isAuthenticated, async (req, res) => {
    try {
      const { enabled } = req.body;
      await storage.updateSetting('online_ordering_enabled', enabled ? 'true' : 'false');
      
      res.json({ 
        message: `Online ordering ${enabled ? 'enabled' : 'disabled'}`,
        enabled 
      });
    } catch (error) {
      console.error('Toggle online ordering error:', error);
      res.status(500).json({ message: 'Failed to toggle online ordering' });
    }
  });

  // Admin: Get online ordering status
  app.get('/api/admin/online-ordering-status', isAuthenticated, async (req, res) => {
    try {
      const setting = await storage.getSetting('online_ordering_enabled');
      const enabled = setting?.value === 'true';
      res.json({ enabled });
    } catch (error) {
      console.error('Get online ordering status error:', error);
      res.status(500).json({ message: 'Failed to get status' });
    }
  });


  // Log the initialization
  await storage.logActivity(
    userId,
    "Initialized sample data: categories, brands, products, and customers",
    "system"
  );
}
