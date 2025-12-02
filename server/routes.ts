import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { purchases, purchaseItems } from '@shared/schema';
import { setupAuth, isAuthenticated } from "./customAuth";
import { z } from "zod";
import { insertCustomerSchema, insertSaleSchema } from "@shared/schema";
import { apiRoutes } from "./src/routes/index";
import { db } from "./db";
import { units } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Import authentication routes
  const authRoutes = await import('./authRoutes');
  app.use(authRoutes.default);

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

  // DISABLED: Old mock returns routes - using database-backed MVC routes instead
  /*
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
  */

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

  // Customers API - Removed old hardcoded routes, using database-backed routes from apiRoutes instead

  // Suppliers API - Removed old hardcoded routes, using database-backed routes from apiRoutes instead

  // Customer Ledgers API - REMOVED: Now handled by proper MVC structure in /server/src/routes/
  // let customerLedgersStorage: any[] = [];

  // app.get('/api/customer-ledgers', (req, res) => {
  //   console.log('Fetching customer ledgers, total:', customerLedgersStorage.length);
  //   const sortedLedgers = customerLedgersStorage.sort((a, b) => 
  //     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //   );
  //   res.json(sortedLedgers);
  // });

  // app.post('/api/customer-ledgers', (req, res) => {
  //   try {
  //     const { customerId, amount, type, reference, description } = req.body;
  //     
  //     // Get customer data for the ledger entry
  //     const customer = customersStorage.find((c: any) => c.id == customerId) || { name: 'Unknown Customer' };
  //     
  //     const ledgerData = {
  //       id: Date.now(),
  //       customerId: parseInt(customerId),
  //       customerName: customer.name,
  //       amount: amount,
  //       type,
  //       reference: reference || '',
  //       description: description || '',
  //       date: new Date().toISOString().split('T')[0],
  //       createdAt: new Date().toISOString()
  //     };

  //     customerLedgersStorage.unshift(ledgerData);
  //     console.log('Customer ledger entry created:', ledgerData);
  //     res.status(201).json(ledgerData);
  //   } catch (error) {
  //     console.error('Create customer ledger error:', error);
  //     res.status(500).json({ message: 'Failed to create customer ledger entry' });
  //   }
  // });

  // Supplier Ledgers API - REMOVED: Now handled by proper MVC structure in /server/src/routes/
  // let supplierLedgersStorage: any[] = [];

  // app.get('/api/supplier-ledgers', (req, res) => {
  //   console.log('Fetching supplier ledgers, total:', supplierLedgersStorage.length);
  //   const sortedLedgers = supplierLedgersStorage.sort((a, b) => 
  //     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //   );
  //   res.json(sortedLedgers);
  // });

  // app.post('/api/supplier-ledgers', (req, res) => {
  //   try {
  //     const { supplierId, amount, type, reference, description } = req.body;
  //     
  //     // Get supplier data for the ledger entry
  //     const supplier = suppliersStorage.find((s: any) => s.id == supplierId) || { name: 'Unknown Supplier' };
  //     
  //     const ledgerData = {
  //       id: Date.now(),
  //       supplierId: parseInt(supplierId),
  //       supplierName: supplier.name,
  //       amount: amount,
  //       type,
  //       reference: reference || '',
  //       description: description || '',
  //       date: new Date().toISOString().split('T')[0],
  //       createdAt: new Date().toISOString()
  //     };

  //     supplierLedgersStorage.unshift(ledgerData);
  //     console.log('Supplier ledger entry created:', ledgerData);
  //     res.status(201).json(ledgerData);
  //   } catch (error) {
  //     console.error('Create supplier ledger error:', error);
  //     res.status(500).json({ message: 'Failed to create supplier ledger entry' });
  //   }
  // });

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

  app.put('/api/employees/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, email, phone, position, salary, hireDate } = req.body;
      
      const employeeIndex = employeesStorage.findIndex(emp => emp.id === id);
      
      if (employeeIndex === -1) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const updatedEmployee = {
        ...employeesStorage[employeeIndex],
        name: name || employeesStorage[employeeIndex].name,
        email: email || employeesStorage[employeeIndex].email,
        phone: phone || employeesStorage[employeeIndex].phone,
        position: position || employeesStorage[employeeIndex].position,
        salary: salary || employeesStorage[employeeIndex].salary,
        hireDate: hireDate || employeesStorage[employeeIndex].hireDate,
        updatedAt: new Date().toISOString()
      };

      employeesStorage[employeeIndex] = updatedEmployee;
      console.log('Employee updated:', updatedEmployee);
      res.json(updatedEmployee);
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({ message: 'Failed to update employee' });
    }
  });

  app.delete('/api/employees/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeIndex = employeesStorage.findIndex(emp => emp.id === id);
      
      if (employeeIndex === -1) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const deletedEmployee = employeesStorage.splice(employeeIndex, 1)[0];
      console.log('Employee deleted:', deletedEmployee.name);
      res.json({ message: 'Employee deleted successfully', employee: deletedEmployee });
    } catch (error) {
      console.error('Delete employee error:', error);
      res.status(500).json({ message: 'Failed to delete employee' });
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

  app.patch('/api/registers/:id/close', async (req, res) => {
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
      
      // Check if close register backup is enabled and trigger backup
      try {
        const { db } = await import('./db');
        const { settings } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [backupSetting] = await db.select()
          .from(settings)
          .where(eq(settings.key, 'close_register_backup'))
          .limit(1);
        
        if (backupSetting && backupSetting.value === 'true') {
          console.log('Close register backup is enabled, triggering automatic backup...');
          
          // Import the createAutomaticBackup function from the API routes
          const { createAutomaticBackup } = await import('./src/routes/index');
          
          // Trigger automatic backup in the background
          const registerName = registersStorage[registerIndex].name;
          const description = `Automatic backup on register close: ${registerName} (${new Date().toLocaleString()})`;
          const userId = req.user?.id;
          
          createAutomaticBackup(description, userId)
            .then((success) => {
              if (success) {
                console.log('Automatic backup completed successfully after register close');
              } else {
                console.error('Automatic backup failed after register close');
              }
            })
            .catch((error) => {
              console.error('Error during automatic backup after register close:', error);
            });
        }
      } catch (backupError) {
        console.error('Error checking/triggering backup on register close:', backupError);
        // Don't fail the register close if backup fails
      }
      
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
  // DISABLED: Old mock sales route - using database-backed MVC routes instead
  // app.get('/api/sales', (req, res) => {
  //   console.log('Fetching sales, total:', salesStorage.length);
  //   const sortedSales = salesStorage.sort((a, b) => 
  //     new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  //   );
  //   res.json(sortedSales);
  // });

  // DISABLED: Customer sales history endpoint - using database-backed MVC route instead
  // app.get('/api/customers/:customerId/sales', (req, res) => {
  //   try {
  //     const customerId = parseInt(req.params.customerId);
  //     console.log('Fetching sales for customer ID:', customerId);
  //     
  //     // Filter sales by customer ID
  //     const customerSales = salesStorage.filter(sale => sale.customerId === customerId);
  //     
  //     // Sort by date descending (most recent first)
  //     const sortedCustomerSales = customerSales.sort((a, b) => 
  //       new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  //     );
  //     
  //     console.log(`Found ${sortedCustomerSales.length} sales for customer ${customerId}`);
  //     res.json(sortedCustomerSales);
  //   } catch (error) {
  //     console.error('Error fetching customer sales:', error);
  //     res.status(500).json({ message: 'Failed to fetch customer sales' });
  //   }
  // });

  // DISABLED: Old mock sales POST route - using database-backed MVC routes instead  
  /*
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
  */

  // Stock Adjustments API - Working with simple product system
  app.get('/api/stock/adjustments', isAuthenticated, async (req, res) => {
    try {
      const adjustments = await storage.getStockAdjustments();
      res.json(adjustments);
    } catch (error) {
      console.error('Error fetching stock adjustments:', error);
      res.status(500).json({ message: 'Failed to fetch stock adjustments' });
    }
  });

  app.post('/api/stock/adjustments', isAuthenticated, async (req, res) => {
    try {
      console.log('Stock adjustment request received:', req.body);
      
      const { warehouseId = 1, reason, items } = req.body;
      
      if (!reason || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Reason and items are required' });
      }

      // Get current user for tracking
      const userId = req.session?.user?.id || req.user?.claims?.sub || "1";
      
      const adjustmentData = {
        warehouseId,
        userId,
        reason,
        items
      };

      const adjustment = await storage.createStockAdjustment(adjustmentData);
      console.log('Stock adjustment created successfully:', adjustment);
      
      res.status(201).json({ 
        message: 'Stock adjustment created successfully',
        data: adjustment 
      });
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      res.status(500).json({ message: 'Failed to create stock adjustment' });
    }
  });

  // TEST ENDPOINT VERIFIED WORKING - Database returns 17 sales for John Smith
  // Customer sales repository and service both working correctly

  // Use new MVC routes (after auth routes to avoid conflicts) - COMPLETELY DISABLED to use simple endpoints
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

  // Product BULK DELETE endpoint (must be before the single delete route)
  app.delete("/api/products/bulk", isAuthenticated, async (req, res) => {
    console.log("=== BULK DELETE PRODUCTS ENDPOINT CALLED ===");
    
    try {
      const { productIds } = req.body;
      console.log(`Raw product IDs from body:`, productIds);
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        console.log("Invalid product IDs - not an array or empty");
        return res.status(400).json({ message: "Invalid product IDs. Must be a non-empty array." });
      }

      // Validate all IDs are numbers
      const validIds = productIds.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
      if (validIds.length === 0) {
        console.log("No valid product IDs found");
        return res.status(400).json({ message: "No valid product IDs provided" });
      }

      console.log(`ROUTE: Attempting to delete ${validIds.length} products:`, validIds);
      
      // Check count before deletion
      const productsBeforeDelete = await storage.getProductsCount();
      console.log(`ROUTE: Total products before bulk delete: ${productsBeforeDelete}`);
      
      let deletedCount = 0;
      const errors = [];

      // Delete each product
      for (const productId of validIds) {
        try {
          console.log(`ROUTE: Deleting product ${productId}`);
          await storage.deleteProduct(productId);
          deletedCount++;
        } catch (error) {
          console.error(`ROUTE: Error deleting product ${productId}:`, error);
          errors.push({ productId, error: error.message });
        }
      }
      
      // Check count after deletion
      const productsAfterDelete = await storage.getProductsCount();
      console.log(`ROUTE: Total products after bulk delete: ${productsAfterDelete}`);
      console.log(`ROUTE: Successfully deleted ${deletedCount} out of ${validIds.length} products`);
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} out of ${validIds.length} products`,
        deletedCount,
        totalRequested: validIds.length,
        beforeCount: productsBeforeDelete,
        afterCount: productsAfterDelete,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("ROUTE: Error in bulk delete products:", error);
      res.status(500).json({ message: "Failed to delete products", error: error.message });
    }
  });

  // Product Variants with Barcodes endpoint
  app.get("/api/product-variants/barcodes", isAuthenticated, async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          pv.id as variant_id,
          p.name as product_name,
          pv.variant_name,
          p.barcode,
          pv.sale_price,
          pv.retail_price,
          c.id as category_id,
          c.name as category_name,
          b.id as brand_id,
          b.name as brand_name,
          u.id as unit_id,
          u.name as unit_name,
          u.short_name as unit_short_name
        FROM product_variants pv
        INNER JOIN products p ON pv.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN units u ON p.unit_id = u.id
        ORDER BY p.id DESC, pv.id DESC
      `);
      
      const rows = Array.isArray(result) ? result : (result.rows || []);
      
      const formatted = rows.map((row: any) => ({
        productId: row.product_id,
        id: row.variant_id,
        variantId: row.variant_id,
        productVariantId: row.variant_id,
        productName: row.product_name,
        variantName: row.variant_name,
        barcode: row.barcode,
        salePrice: row.sale_price,
        retailPrice: row.retail_price,
        categoryId: row.category_id,
        categoryName: row.category_name,
        brandId: row.brand_id,
        brandName: row.brand_name,
        unitId: row.unit_id,
        unitName: row.unit_name,
        unitShortName: row.unit_short_name
      }));
      
      console.log(`Fetching product variants with barcodes, total: ${formatted.length}`);
      res.json(formatted);
    } catch (error) {
      console.error("Error fetching product variants with barcodes:", error);
      res.status(500).json({ message: "Failed to fetch product variants" });
    }
  });

  // Update product barcode endpoint
  app.put("/api/products/:id/barcode", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { barcode } = req.body;
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      if (!barcode) {
        return res.status(400).json({ message: "Barcode is required" });
      }
      
      const [updated] = await db
        .update(products)
        .set({ barcode })
        .where(eq(products.id, productId))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating product barcode:", error);
      res.status(500).json({ message: "Failed to update barcode" });
    }
  });

  // Product DELETE endpoint (single product)
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

  // Bulk delete categories (must come BEFORE the :id route)
  app.delete("/api/categories/bulk-delete", isAuthenticated, async (req: any, res) => {
    console.log('=== BULK DELETE START ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { categoryIds } = req.body;
      
      console.log('Received bulk delete request with body:', req.body);
      console.log('CategoryIds type:', typeof categoryIds, 'Value:', categoryIds);
      console.log('CategoryIds as JSON:', JSON.stringify(categoryIds));
      
      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ message: "Category IDs array is required" });
      }

      // Validate all IDs are numbers and filter out invalid ones
      const validIds: number[] = [];
      for (let i = 0; i < categoryIds.length; i++) {
        const id = categoryIds[i];
        console.log(`Processing ID at index ${i}:`, id, 'Type:', typeof id);
        
        // More robust validation
        if (id !== null && id !== undefined && id !== '' && id !== 'NaN') {
          let parsed: number;
          
          if (typeof id === 'number') {
            parsed = id;
          } else if (typeof id === 'string') {
            // Trim whitespace and check if it's a valid number string
            const trimmed = id.trim();
            if (trimmed === '' || trimmed === 'NaN' || trimmed === 'undefined' || trimmed === 'null') {
              console.log(`Skipping invalid ID: "${trimmed}"`);
              continue;
            }
            parsed = parseInt(trimmed, 10);
          } else {
            console.log(`Skipping non-numeric ID of type ${typeof id}:`, id);
            continue;
          }
          
          console.log('Parsed value:', parsed, 'isNaN:', isNaN(parsed), 'isFinite:', isFinite(parsed));
          
          // Ensure it's a positive integer
          if (!isNaN(parsed) && isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
            validIds.push(parsed);
            console.log(`Added valid ID: ${parsed}`);
          } else {
            console.log(`Rejected invalid ID: ${parsed} (original: ${id})`);
          }
        } else {
          console.log(`Skipping null/undefined/empty ID at index ${i}:`, id);
        }
      }
        
      if (validIds.length === 0) {
        console.log('No valid IDs found after validation');
        return res.status(400).json({ message: "No valid category IDs provided" });
      }
      
      console.log('Original categoryIds:', categoryIds);
      console.log('Valid parsed IDs:', validIds);

      console.log(`Attempting to delete ${validIds.length} categories:`, validIds);
      
      let deletedCount = 0;
      const errors: any[] = [];

      // Delete each category individually with additional validation
      for (const categoryId of validIds) {
        try {
          // Double-check that categoryId is still valid before deletion
          if (!Number.isInteger(categoryId) || categoryId <= 0) {
            console.error(`Invalid category ID detected before deletion: ${categoryId}`);
            errors.push({ 
              categoryId, 
              error: "Invalid category ID format" 
            });
            continue;
          }
          
          console.log(`Deleting category ${categoryId} (type: ${typeof categoryId})`);
          await storage.deleteCategory(categoryId);
          deletedCount++;
          console.log(`Successfully deleted category ${categoryId}`);
        } catch (error: any) {
          console.error(`Error deleting category ${categoryId}:`, error);
          
          // Handle foreign key constraint errors more gracefully
          if (error.code === '23503') {
            errors.push({ 
              categoryId, 
              error: "Category is being used by products" 
            });
          } else {
            errors.push({ categoryId, error: error.message || 'Unknown error' });
          }
        }
      }
      
      // Log activity for successful deletions
      if (deletedCount > 0) {
        const userId = req.user?.claims?.sub || req.user?.id || "system";
        await storage.logActivity(
          userId,
          `Bulk deleted ${deletedCount} categories`,
          req.ip
        );
      }
      
      console.log(`Successfully deleted ${deletedCount} out of ${validIds.length} categories`);
      console.log('=== BULK DELETE END ===');
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} out of ${validIds.length} categories`,
        deletedCount,
        totalRequested: validIds.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error in bulk delete categories:", error);
      res.status(500).json({ message: "Failed to delete categories", error: error.message || 'Unknown error' });
    }
  });

  // Single category delete (must come AFTER the bulk-delete route)
  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // Validate the parsed ID
      if (isNaN(categoryId) || !isFinite(categoryId) || categoryId <= 0 || !Number.isInteger(categoryId)) {
        console.error("Invalid category ID received:", req.params.id, "Parsed as:", categoryId);
        return res.status(400).json({ 
          message: "Invalid category ID provided" 
        });
      }
      
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
      console.log("Creating brand with name:", name);
      
      if (!name) {
        return res.status(400).json({ message: "Brand name is required" });
      }

      // Check if brand with this name already exists
      const existingBrands = await storage.getBrands();
      console.log("Existing brands:", existingBrands.map(b => b.name));
      
      const existingBrand = existingBrands.find(brand => 
        brand.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingBrand) {
        console.log("Found existing brand:", existingBrand.name);
        return res.status(400).json({ message: "Brand name already exists" });
      }

      console.log("No existing brand found, creating new one");
      const brand = await storage.createBrand({ name, description });
      res.status(201).json(brand);
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

  // Bulk delete brands (must come BEFORE the :id route)
  app.delete("/api/brands/bulk-delete", isAuthenticated, async (req: any, res) => {
    console.log('=== BULK DELETE BRANDS START ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { brandIds } = req.body;
      
      console.log('Received bulk delete request with body:', req.body);
      console.log('BrandIds type:', typeof brandIds, 'Value:', brandIds);
      console.log('BrandIds as JSON:', JSON.stringify(brandIds));
      
      if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
        return res.status(400).json({ message: "Brand IDs array is required" });
      }

      // Validate all IDs are numbers and filter out invalid ones
      const validIds: number[] = [];
      for (let i = 0; i < brandIds.length; i++) {
        const id = brandIds[i];
        console.log(`Processing ID at index ${i}:`, id, 'Type:', typeof id);
        
        // More robust validation
        if (id !== null && id !== undefined && id !== '' && id !== 'NaN') {
          let parsed: number;
          
          if (typeof id === 'number') {
            parsed = id;
          } else if (typeof id === 'string') {
            // Trim whitespace and check if it's a valid number string
            const trimmed = id.trim();
            if (trimmed === '' || trimmed === 'NaN' || trimmed === 'undefined' || trimmed === 'null') {
              console.log(`Skipping invalid ID: "${trimmed}"`);
              continue;
            }
            parsed = parseInt(trimmed, 10);
          } else {
            console.log(`Skipping non-numeric ID of type ${typeof id}:`, id);
            continue;
          }
          
          console.log('Parsed value:', parsed, 'isNaN:', isNaN(parsed), 'isFinite:', isFinite(parsed));
          
          // Ensure it's a positive integer
          if (!isNaN(parsed) && isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
            validIds.push(parsed);
            console.log(`Added valid ID: ${parsed}`);
          } else {
            console.log(`Rejected invalid ID: ${parsed} (original: ${id})`);
          }
        } else {
          console.log(`Skipping null/undefined/empty ID at index ${i}:`, id);
        }
      }
        
      if (validIds.length === 0) {
        console.log('No valid IDs found after validation');
        return res.status(400).json({ message: "No valid brand IDs provided" });
      }
      
      console.log('Original brandIds:', brandIds);
      console.log('Valid parsed IDs:', validIds);

      console.log(`Attempting to delete ${validIds.length} brands:`, validIds);
      
      let deletedCount = 0;
      const errors: any[] = [];

      // Delete each brand individually with additional validation
      for (const brandId of validIds) {
        try {
          // Double-check that brandId is still valid before deletion
          if (!Number.isInteger(brandId) || brandId <= 0) {
            console.error(`Invalid brand ID detected before deletion: ${brandId}`);
            errors.push({ 
              brandId, 
              error: "Invalid brand ID format" 
            });
            continue;
          }
          
          console.log(`Deleting brand ${brandId} (type: ${typeof brandId})`);
          await storage.deleteBrand(brandId);
          deletedCount++;
          console.log(`Successfully deleted brand ${brandId}`);
        } catch (error: any) {
          console.error(`Error deleting brand ${brandId}:`, error);
          
          // Handle foreign key constraint errors more gracefully
          if (error.code === '23503') {
            errors.push({ 
              brandId, 
              error: "Brand is being used by products" 
            });
          } else {
            errors.push({ brandId, error: error.message || 'Unknown error' });
          }
        }
      }
      
      // Log activity for successful deletions
      if (deletedCount > 0) {
        const userId = req.user?.claims?.sub || req.user?.id || "system";
        await storage.logActivity(
          userId,
          `Bulk deleted ${deletedCount} brands`,
          req.ip
        );
      }
      
      console.log(`Successfully deleted ${deletedCount} out of ${validIds.length} brands`);
      console.log('=== BULK DELETE BRANDS END ===');
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} out of ${validIds.length} brands`,
        deletedCount,
        totalRequested: validIds.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error in bulk delete brands:", error);
      res.status(500).json({ message: "Failed to delete brands", error: error.message || 'Unknown error' });
    }
  });

  // Single brand delete (must come AFTER the bulk-delete route)
  app.delete("/api/brands/:id", isAuthenticated, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      
      // Validate the parsed ID
      if (isNaN(brandId) || !isFinite(brandId) || brandId <= 0 || !Number.isInteger(brandId)) {
        console.error("Invalid brand ID received:", req.params.id, "Parsed as:", brandId);
        return res.status(400).json({ 
          message: "Invalid brand ID provided" 
        });
      }
      
      await storage.deleteBrand(brandId);
      res.json({ message: "Brand deleted successfully" });
    } catch (error) {
      console.error("Error deleting brand:", error);
      
      // Check if it's a foreign key constraint error
      if (error.code === '23503') {
        return res.status(400).json({ 
          message: "Cannot delete brand. It is being used by one or more products. Please remove or change the brand of those products first." 
        });
      }
      
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  // Units routes - handled by MVC routes in src/routes/index.ts
  // The /api/units endpoints are now handled by the router in server/src/routes/index.ts

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
      const existingUnits = await storage.getUnits();
      const existingUnitByName = existingUnits.find(unit => 
        unit.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingUnitByName) {
        return res.status(400).json({ message: "Unit name already exists" });
      }

      // Check if unit with this short name already exists
      const existingUnitByShortName = existingUnits.find(unit => 
        unit.shortName && unit.shortName.toLowerCase() === unitShortName.toLowerCase()
      );
      
      if (existingUnitByShortName) {
        return res.status(400).json({ message: "Unit short name already exists" });
      }

      const unit = await storage.createUnit({
        name: name,
        shortName: unitShortName,
        type: req.body.type || 'count',
        description: req.body.description || null,
      });
      console.log("Unit created:", unit);
      res.status(201).json(unit);
    } catch (error) {
      console.error("Error creating unit:", error);
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  app.put("/api/units/:id", isAuthenticated, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const { name, shortName, symbol } = req.body;
      const unitShortName = shortName || symbol;
      
      if (!name) {
        return res.status(400).json({ message: "Unit name is required" });
      }
      
      if (!unitShortName) {
        return res.status(400).json({ message: "Unit short name is required" });
      }

      // Check if another unit with this name already exists (excluding current unit)
      const existingUnits = await storage.getUnits();
      const existingUnitByName = existingUnits.find(unit => 
        unit.id !== unitId && unit.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingUnitByName) {
        return res.status(400).json({ message: "Unit name already exists" });
      }

      // Check if another unit with this short name already exists (excluding current unit)
      const existingUnitByShortName = existingUnits.find(unit => 
        unit.id !== unitId && unit.shortName && unit.shortName.toLowerCase() === unitShortName.toLowerCase()
      );
      
      if (existingUnitByShortName) {
        return res.status(400).json({ message: "Unit short name already exists" });
      }
      
      const unit = await storage.updateUnit(unitId, {
        name: name,
        shortName: unitShortName,
        type: req.body.type || 'count',
        description: req.body.description || null,
      });
      
      console.log("Unit updated:", unit);
      res.json(unit);
    } catch (error) {
      console.error("Error updating unit:", error);
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  // Bulk delete units (must come BEFORE the :id route)
  app.delete("/api/units/bulk-delete", isAuthenticated, async (req: any, res) => {
    console.log('=== BULK DELETE UNITS START ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { unitIds } = req.body;
      
      console.log('Received bulk delete request with body:', req.body);
      console.log('UnitIds type:', typeof unitIds, 'Value:', unitIds);
      console.log('UnitIds as JSON:', JSON.stringify(unitIds));
      
      if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
        return res.status(400).json({ message: "Unit IDs array is required" });
      }

      // Validate all IDs are numbers and filter out invalid ones
      const validIds: number[] = [];
      for (let i = 0; i < unitIds.length; i++) {
        const id = unitIds[i];
        console.log(`Processing ID at index ${i}:`, id, 'Type:', typeof id);
        
        // More robust validation
        if (id !== null && id !== undefined && id !== '' && id !== 'NaN') {
          let parsed: number;
          
          if (typeof id === 'number') {
            parsed = id;
          } else if (typeof id === 'string') {
            // Trim whitespace and check if it's a valid number string
            const trimmed = id.trim();
            if (trimmed === '' || trimmed === 'NaN' || trimmed === 'undefined' || trimmed === 'null') {
              console.log(`Skipping invalid ID: "${trimmed}"`);
              continue;
            }
            parsed = parseInt(trimmed, 10);
          } else {
            console.log(`Skipping non-numeric ID of type ${typeof id}:`, id);
            continue;
          }
          
          console.log('Parsed value:', parsed, 'isNaN:', isNaN(parsed), 'isFinite:', isFinite(parsed));
          
          // Ensure it's a positive integer
          if (!isNaN(parsed) && isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
            validIds.push(parsed);
            console.log(`Added valid ID: ${parsed}`);
          } else {
            console.log(`Rejected invalid ID: ${parsed} (original: ${id})`);
          }
        } else {
          console.log(`Skipping null/undefined/empty ID at index ${i}:`, id);
        }
      }
        
      if (validIds.length === 0) {
        console.log('No valid IDs found after validation');
        return res.status(400).json({ message: "No valid unit IDs provided" });
      }
      
      console.log('Original unitIds:', unitIds);
      console.log('Valid parsed IDs:', validIds);

      console.log(`Attempting to delete ${validIds.length} units:`, validIds);
      
      let deletedCount = 0;
      const errors: any[] = [];

      // Delete each unit individually with additional validation
      for (const unitId of validIds) {
        try {
          // Double-check that unitId is still valid before deletion
          if (!Number.isInteger(unitId) || unitId <= 0) {
            console.error(`Invalid unit ID detected before deletion: ${unitId}`);
            errors.push({ 
              unitId, 
              error: "Invalid unit ID format" 
            });
            continue;
          }
          
          console.log(`Deleting unit ${unitId} (type: ${typeof unitId})`);
          await storage.deleteUnit(unitId);
          deletedCount++;
          console.log(`Successfully deleted unit ${unitId}`);
        } catch (error: any) {
          console.error(`Error deleting unit ${unitId}:`, error);
          
          // Handle foreign key constraint errors more gracefully
          if (error.code === '23503') {
            errors.push({ 
              unitId, 
              error: "Unit is being used by products" 
            });
          } else {
            errors.push({ unitId, error: error.message || 'Unknown error' });
          }
        }
      }
      
      // Log activity for successful deletions
      if (deletedCount > 0) {
        const userId = req.user?.claims?.sub || req.user?.id || "system";
        await storage.logActivity(
          userId,
          `Bulk deleted ${deletedCount} units`,
          req.ip
        );
      }
      
      console.log(`Successfully deleted ${deletedCount} out of ${validIds.length} units`);
      console.log('=== BULK DELETE UNITS END ===');
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} out of ${validIds.length} units`,
        deletedCount,
        totalRequested: validIds.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error in bulk delete units:", error);
      res.status(500).json({ message: "Failed to delete units", error: error.message || 'Unknown error' });
    }
  });

  // Single unit delete (must come AFTER the bulk-delete route)
  app.delete("/api/units/:id", isAuthenticated, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      
      // Validate the parsed ID
      if (isNaN(unitId) || !isFinite(unitId) || unitId <= 0 || !Number.isInteger(unitId)) {
        console.error("Invalid unit ID received:", req.params.id, "Parsed as:", unitId);
        return res.status(400).json({ 
          message: "Invalid unit ID provided" 
        });
      }
      
      await storage.deleteUnit(unitId);
      console.log("Unit deleted:", unitId);
      res.json({ message: "Unit deleted successfully" });
    } catch (error) {
      console.error("Error deleting unit:", error);
      
      // Check if it's a foreign key constraint error
      if (error.code === '23503') {
        return res.status(400).json({ 
          message: "Cannot delete unit. It is being used by one or more products. Please remove or change the unit of those products first." 
        });
      }
      
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });

  // Stock Management routes
  app.get("/api/stock", isAuthenticated, async (req, res) => {
    try {
      // Query stock data directly from database with accurate calculations
      const stockResult = await db.execute(sql`
        SELECT 
          p.id,
          p.name as product_name,
          p.category_id,
          p.brand_id,
          p.unit_id,
          c.name as category_name,
          b.name as brand_name,
          u.name as unit_name,
          u.short_name as unit_short_name,
          pv.id as variant_id,
          pv.variant_name,
          COALESCE(SUM(CAST(s.quantity AS INTEGER)), 0) as total_quantity,
          1 as warehouse_id
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN units u ON p.unit_id = u.id
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        LEFT JOIN stock s ON pv.id = s.product_variant_id AND s.warehouse_id = 1
        GROUP BY p.id, p.name, p.category_id, p.brand_id, p.unit_id, c.name, b.name, u.name, u.short_name, pv.id, pv.variant_name
        ORDER BY p.id, pv.id
      `);
      
      // Transform raw query results into the expected format
      const stockDataMap = new Map();
      for (const row of stockResult) {
        const key = row.id;
        if (!stockDataMap.has(key)) {
          stockDataMap.set(key, {
            id: row.id,
            productName: row.product_name,
            quantity: 0, // Will be calculated as sum of variants
            warehouseId: row.warehouse_id,
            warehouseName: "Main Warehouse",
            categoryName: row.category_name,
            brandName: row.brand_name,
            unitName: row.unit_name,
            unitShortName: row.unit_short_name,
            variants: []
          });
        }
        
        const product = stockDataMap.get(key);
        if (row.variant_id) {
          product.variants.push({
            variantId: row.variant_id,
            variantName: row.variant_name,
            quantity: row.total_quantity
          });
          product.quantity += row.total_quantity;
        }
      }
      
      const stockData = Array.from(stockDataMap.values());
      console.log(`Fetching stock data, total items: ${stockData.length}`);
      res.json(stockData);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });


  app.post("/api/stock/adjustments", isAuthenticated, async (req, res) => {
    try {
      const { warehouseId, reason, items } = req.body;
      const userId = req.user?.claims?.sub;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No items to adjust" });
      }

      console.log('Creating stock adjustment:', {
        warehouseId,
        reason,
        items,
        userId
      });

      const adjustment = await storage.createStockAdjustment({
        warehouseId: warehouseId || 1,
        userId,
        reason,
        items
      });

      res.json(adjustment);
    } catch (error) {
      console.error("Error creating stock adjustment:", error);
      res.status(500).json({ message: "Failed to create stock adjustment" });
    }
  });

  app.get("/api/stock/adjustments", isAuthenticated, async (req, res) => {
    try {
      const adjustments = await storage.getStockAdjustments();
      console.log(`Fetching stock adjustments, total: ${adjustments.length}`);
      res.json(adjustments);
    } catch (error) {
      console.error("Error fetching stock adjustments:", error);
      res.status(500).json({ message: "Failed to fetch stock adjustments" });
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

  app.post("/api/purchases", isAuthenticated, async (req, res) => {
    try {
      console.log('Creating purchase with data:', req.body);
      
      if (!req.body.supplierId) {
        return res.status(400).json({ message: "Supplier is required" });
      }

      if (!req.body.items || req.body.items.length === 0) {
        return res.status(400).json({ message: "Purchase items are required" });
      }

      // Create the purchase record
      const purchaseData = {
        supplierId: req.body.supplierId,
        userId: req.user?.id || 'system',
        totalAmount: req.body.totalAmount.toString(),
        purchaseDate: new Date(),
        status: 'approved' // Auto-approve to update stock immediately
      };

      const [purchase] = await db.insert(purchases).values(purchaseData).returning();
      console.log('Purchase created:', purchase.id);

      // Create purchase items and update stock
      for (const item of req.body.items) {
        // Create purchase item
        const purchaseItemData = {
          purchaseId: purchase.id,
          productVariantId: item.productVariantId,
          quantity: item.quantity.toString(),
          costPrice: item.costPrice.toString()
        };
        
        await db.insert(purchaseItems).values(purchaseItemData);
        console.log(`Purchase item created for variant ${item.productVariantId}`);

        // Update variant stock
        if (item.productVariantId) {
          const warehouseId = 1; // Default warehouse
          
          // Update stock table
          await db.execute(sql`
            UPDATE stock 
            SET quantity = quantity + ${item.quantity}
            WHERE product_variant_id = ${item.productVariantId}
              AND warehouse_id = ${warehouseId}
          `);
          
          console.log(`Updated variant ${item.productVariantId} stock by +${item.quantity}`);

          // Sync product total stock from variants
          await db.execute(sql`
            UPDATE products 
            SET stock = (
              SELECT COALESCE(SUM(CAST(s.quantity AS INTEGER)), 0)
              FROM product_variants pv
              LEFT JOIN stock s ON pv.id = s.product_variant_id
              WHERE pv.product_id = ${item.productId}
            ),
            updated_at = NOW()
            WHERE id = ${item.productId}
          `);
          
          console.log(`Synced product ${item.productId} total stock from variants`);
        }
      }

      // Return the created purchase
      const result = {
        id: purchase.id,
        supplierId: purchase.supplierId,
        userId: purchase.userId,
        totalAmount: purchase.totalAmount,
        purchaseDate: purchase.purchaseDate,
        status: purchase.status
      };

      console.log('Purchase created successfully with stock updates:', result.id);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ 
        message: "Failed to create purchase", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
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

  // ===== WAREHOUSES API =====
  
  // GET all warehouses
  app.get('/api/warehouses', isAuthenticated, async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error('Get warehouses error:', error);
      res.status(500).json({ message: 'Failed to fetch warehouses' });
    }
  });

  // POST - Create new warehouse
  app.post('/api/warehouses', isAuthenticated, async (req: any, res) => {
    try {
      const { name, location } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Warehouse name is required' });
      }
      
      const warehouseData = {
        name,
        location: location || '',
      };
      
      const warehouse = await storage.createWarehouse(warehouseData);
      
      await storage.logActivity(
        req.user?.claims?.sub || req.user?.id || 'system',
        `Created warehouse: ${name}`,
        req.ip
      );
      
      res.status(201).json(warehouse);
    } catch (error: any) {
      console.error('Create warehouse error:', error);
      res.status(500).json({ message: 'Failed to create warehouse', error: error.message });
    }
  });

  // PUT - Update warehouse
  app.put('/api/warehouses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const warehouseId = parseInt(req.params.id);
      const { name, location } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Warehouse name is required' });
      }
      
      const warehouseData = {
        name,
        location: location || '',
      };
      
      const warehouse = await storage.updateWarehouse(warehouseId, warehouseData);
      
      await storage.logActivity(
        req.user?.claims?.sub || req.user?.id || 'system',
        `Updated warehouse: ${name}`,
        req.ip
      );
      
      res.json(warehouse);
    } catch (error: any) {
      console.error('Update warehouse error:', error);
      res.status(500).json({ message: 'Failed to update warehouse', error: error.message });
    }
  });

  // DELETE warehouse
  app.delete('/api/warehouses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const warehouseId = parseInt(req.params.id);
      
      await storage.deleteWarehouse(warehouseId);
      
      await storage.logActivity(
        req.user?.claims?.sub || req.user?.id || 'system',
        `Deleted warehouse: ${warehouseId}`,
        req.ip
      );
      
      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error: any) {
      console.error('Delete warehouse error:', error);
      res.status(500).json({ message: 'Failed to delete warehouse', error: error.message });
    }
  });

  // Log the initialization
  await storage.logActivity(
    userId,
    "Initialized sample data: categories, brands, products, and customers",
    "system"
  );
}
