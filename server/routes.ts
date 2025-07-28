import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertCustomerSchema, insertSaleSchema } from "@shared/schema";
import { apiRoutes } from "./routes/index";

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
