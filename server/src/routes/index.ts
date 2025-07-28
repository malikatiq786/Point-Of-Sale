import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SaleController } from '../controllers/SaleController';
import { DashboardController } from '../controllers/DashboardController';
import { UserController } from '../controllers/UserController';
import { InventoryController } from '../controllers/InventoryController';
import { storage } from '../../storage';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { isAuthenticated } from '../../replitAuth';

// Initialize controllers
const productController = new ProductController();
const saleController = new SaleController();
const dashboardController = new DashboardController();
const userController = new UserController();
const inventoryController = new InventoryController();

// Create router
const router = Router();

// Product routes  
router.get('/products', isAuthenticated, async (req: any, res: any) => {
  try {
    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        description: schema.products.description,
        price: schema.products.price,
        stock: schema.products.stock,
        barcode: schema.products.barcode,
        lowStockAlert: schema.products.lowStockAlert,
        image: schema.products.image,
        category: {
          id: schema.categories.id,
          name: schema.categories.name,
        },
        brand: {
          id: schema.brands.id,
          name: schema.brands.name,
        },
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .limit(50);
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});
router.post('/products', isAuthenticated, async (req: any, res: any) => {
  try {
    console.log('Direct product creation in route:', req.body);
    
    if (!req.body.name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const productData = {
      name: req.body.name,
      description: req.body.description || null,
      barcode: req.body.barcode || null,
      categoryId: req.body.categoryId || null,
      brandId: req.body.brandId || null,
      unitId: req.body.unitId || null,
      price: req.body.price?.toString() || "0",
      stock: req.body.stock || 0,
      lowStockAlert: req.body.lowStockAlert || 0,
      image: req.body.image || null
    };

    const [result] = await db.insert(schema.products)
      .values(productData)
      .returning();
      
    console.log('Direct route result:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Direct route error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});
router.get('/products/low-stock', isAuthenticated, productController.getLowStockProducts as any);
router.get('/products/:id', isAuthenticated, productController.getProductById as any);
// Categories and brands routes
router.get('/categories', isAuthenticated, (req: any, res: any) => {
  res.json([
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Books & Media' },
    { id: 3, name: 'Food & Beverages' },
    { id: 4, name: 'Clothing' },
    { id: 5, name: 'Home & Garden' }
  ]);
});

router.get('/brands', isAuthenticated, (req: any, res: any) => {
  res.json([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Samsung' },
    { id: 3, name: 'Nike' },
    { id: 4, name: 'Adidas' },
    { id: 5, name: 'Sony' }
  ]);
});

router.get('/units', isAuthenticated, (req: any, res: any) => {
  res.json([
    { id: 1, name: 'Each', short_name: 'ea' },
    { id: 2, name: 'Pounds', short_name: 'lbs' },
    { id: 3, name: 'Kilograms', short_name: 'kg' },
    { id: 4, name: 'Meters', short_name: 'm' },
    { id: 5, name: 'Liters', short_name: 'L' }
  ]);
});

// Sale routes
router.post('/sales', isAuthenticated, saleController.processSale as any);
router.get('/sales', isAuthenticated, async (req: any, res: any) => {
  try {
    // Sample sales data for testing
    const sales = [
      {
        id: 1,
        totalAmount: "599.99",
        status: "completed",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "card",
        user: { id: "1", name: "Malik Atiq" },
        customer: { id: 1, name: "John Smith", phone: "+1234567890" },
        items: [
          { productName: "Samsung Galaxy S23", quantity: 1, price: "599.99", total: "599.99" }
        ]
      },
      {
        id: 2,
        totalAmount: "129.99",
        status: "completed",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "cash",
        user: { id: "1", name: "Malik Atiq" },
        customer: { id: 2, name: "Jane Doe", phone: "+1234567891" },
        items: [
          { productName: "Nike Air Max", quantity: 1, price: "129.99", total: "129.99" }
        ]
      },
      {
        id: 3,
        totalAmount: "89.99",
        status: "completed",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        saleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "mobile",
        user: { id: "1", name: "Malik Atiq" },
        customer: { id: 3, name: "Mike Johnson", phone: "+1234567892" },
        items: [
          { productName: "Sony Headphones", quantity: 1, price: "89.99", total: "89.99" }
        ]
      },
      {
        id: 4,
        totalAmount: "49.99",
        status: "completed",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        saleDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: "card",
        user: { id: "1", name: "Malik Atiq" },
        customer: { id: 4, name: "Sarah Wilson", phone: "+1234567893" },
        items: [
          { productName: "Bluetooth Speaker", quantity: 1, price: "49.99", total: "49.99" }
        ]
      }
    ];
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Failed to fetch sales' });
  }
});
router.get('/sales/:id', isAuthenticated, saleController.getSaleById as any);
router.get('/sales/date-range', isAuthenticated, saleController.getSalesByDateRange as any);

// Returns routes
router.get('/returns', isAuthenticated, async (req: any, res: any) => {
  try {
    // Sample returns data
    const returns = [
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
    res.json(returns);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ message: 'Failed to fetch returns' });
  }
});

router.post('/returns', isAuthenticated, async (req: any, res: any) => {
  try {
    const returnData = {
      id: Date.now(),
      ...req.body,
      status: "pending",
      createdAt: new Date().toISOString(),
      customerName: "Walk-in Customer"
    };
    
    console.log('Return created:', returnData);
    res.status(201).json(returnData);
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ message: 'Failed to create return' });
  }
});

// Dashboard routes  
router.get('/dashboard/stats', isAuthenticated, dashboardController.getStats as any);
router.get('/dashboard/activities', isAuthenticated, dashboardController.getActivities as any);
router.get('/dashboard/top-products', isAuthenticated, dashboardController.getTopProducts as any);
router.get('/dashboard/recent-transactions', isAuthenticated, dashboardController.getRecentTransactions as any);

// User management routes
router.get('/users', isAuthenticated, userController.getUsers as any);
router.get('/users/:id', isAuthenticated, userController.getUserById as any);
router.post('/users', isAuthenticated, userController.createUser as any);
router.put('/users/:id', isAuthenticated, userController.updateUser as any);
router.delete('/users/:id', isAuthenticated, userController.deleteUser as any);
router.patch('/users/:id/role', isAuthenticated, userController.updateUserRole as any);

// Role and permission routes
router.get('/roles', isAuthenticated, userController.getAllRoles as any);
router.get('/permissions', isAuthenticated, userController.getAllPermissions as any);
router.get('/users/:id/permissions', isAuthenticated, userController.getUserPermissions as any);
router.put('/users/:id/permissions', isAuthenticated, userController.updateUserPermissions as any);

// Purchase routes
router.get('/purchases', async (req: any, res: any) => {
  try {
    const purchases = await db
      .select({
        id: schema.purchases.id,
        supplierId: schema.purchases.supplierId,
        userId: schema.purchases.userId,
        totalAmount: schema.purchases.totalAmount,
        purchaseDate: schema.purchases.purchaseDate,
        status: schema.purchases.status,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
      })
      .from(schema.purchases)
      .leftJoin(schema.suppliers, eq(schema.purchases.supplierId, schema.suppliers.id))
      .orderBy(schema.purchases.id)
      .limit(50);
    
    res.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

router.post('/purchases', async (req: any, res: any) => {
  try {
    const { supplierId, items, totalAmount } = req.body;
    
    console.log('Creating purchase with data:', { supplierId, items, totalAmount });
    
    // Create purchase record
    const [purchase] = await db.insert(schema.purchases)
      .values({
        supplierId: parseInt(supplierId),
        userId: '41128350', // Using existing user ID
        totalAmount: totalAmount.toString(),
        purchaseDate: new Date(),
        status: 'pending'
      })
      .returning();

    // Add purchase items
    if (items && items.length > 0) {
      // First, create product variants for each product if they don't exist
      for (const item of items) {
        // Check if product variant exists, if not create one
        const existingVariant = await db.select()
          .from(schema.productVariants)
          .where(eq(schema.productVariants.productId, item.productId))
          .limit(1);
        
        if (existingVariant.length === 0) {
          // Create a basic variant for this product
          await db.insert(schema.productVariants).values({
            productId: item.productId,
            name: 'Default',
            price: '0',
            stock: 0
          });
        }
      }

      // Now get the variant IDs and create purchase items
      const purchaseItems = [];
      for (const item of items) {
        const [variant] = await db.select()
          .from(schema.productVariants)
          .where(eq(schema.productVariants.productId, item.productId))
          .limit(1);
        
        purchaseItems.push({
          purchaseId: purchase.id,
          productVariantId: variant.id,
          quantity: item.quantity,
          costPrice: item.costPrice.toString()
        });
      }

      await db.insert(schema.purchaseItems).values(purchaseItems);

      // Update product stock levels
      for (const item of items) {
        await db.update(schema.products)
          .set({ 
            stock: sql`${schema.products.stock} + ${item.quantity}` 
          })
          .where(eq(schema.products.id, item.productId));
      }
    }
    
    res.status(201).json(purchase);
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ message: 'Failed to create purchase' });
  }
});

// Supplier routes
router.get('/suppliers', async (req: any, res: any) => {
  try {
    const suppliers = await db.select().from(schema.suppliers).limit(50);
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Failed to fetch suppliers' });
  }
});

router.post('/suppliers', async (req: any, res: any) => {
  try {
    const [supplier] = await db.insert(schema.suppliers)
      .values(req.body)
      .returning();
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Failed to create supplier' });
  }
});

// Brand routes
router.get('/brands', async (req: any, res: any) => {
  try {
    const brands = await db.select().from(schema.brands).limit(50);
    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ message: 'Failed to fetch brands' });
  }
});

router.post('/brands', async (req: any, res: any) => {
  try {
    const [brand] = await db.insert(schema.brands)
      .values(req.body)
      .returning();
    res.status(201).json(brand);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ message: 'Failed to create brand' });
  }
});

router.put('/brands/:id', async (req: any, res: any) => {
  try {
    const [brand] = await db.update(schema.brands)
      .set(req.body)
      .where(eq(schema.brands.id, parseInt(req.params.id)))
      .returning();
    res.json(brand);
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ message: 'Failed to update brand' });
  }
});

// Business Profile routes
router.get('/business-profile', async (req: any, res: any) => {
  try {
    res.json({
      id: 1,
      businessName: "My Business Store",
      businessType: "retail",
      email: "contact@mybusiness.com",
      phone: "+1-555-0123",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "United States",
      postalCode: "10001",
      taxId: "12-3456789",
      website: "https://mybusiness.com",
      description: "A modern retail business serving customers with quality products."
    });
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({ message: 'Failed to fetch business profile' });
  }
});

router.put('/business-profile', async (req: any, res: any) => {
  try {
    res.json({ id: 1, ...req.body });
  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({ message: 'Failed to update business profile' });
  }
});

// Branches routes
router.get('/branches', async (req: any, res: any) => {
  try {
    const branches = await db.select().from(schema.branches).limit(50);
    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ message: 'Failed to fetch branches' });
  }
});

router.post('/branches', async (req: any, res: any) => {
  try {
    const branch = { id: Date.now(), ...req.body, businessProfileId: 1 };
    res.status(201).json(branch);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ message: 'Failed to create branch' });
  }
});

// Registers routes  
router.get('/registers', async (req: any, res: any) => {
  try {
    const registers = await db.select({
      id: schema.registers.id,
      name: schema.registers.name,
      branchId: schema.registers.branchId,
      branchName: schema.branches.name,
      code: schema.registers.code,
      openingBalance: schema.registers.openingBalance,
      currentBalance: schema.registers.currentBalance,
      isActive: schema.registers.isActive,
      lastOpened: schema.registers.openedAt,
      lastClosed: schema.registers.closedAt,
    })
    .from(schema.registers)
    .leftJoin(schema.branches, eq(schema.registers.branchId, schema.branches.id))
    .limit(50);
    
    res.json(registers);
  } catch (error) {
    console.error('Get registers error:', error);
    res.status(500).json({ message: 'Failed to fetch registers' });
  }
});

router.post('/registers', async (req: any, res: any) => {
  try {
    const [register] = await db.insert(schema.registers)
      .values({
        name: req.body.name,
        branchId: req.body.branchId,
        code: req.body.code,
        openingBalance: req.body.openingBalance || 0,
        currentBalance: req.body.openingBalance || 0,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        openedAt: new Date()
      })
      .returning();
    
    // Get branch name for the response
    const [branch] = await db.select()
      .from(schema.branches)
      .where(eq(schema.branches.id, req.body.branchId))
      .limit(1);
    
    const response = {
      ...register,
      branchName: branch?.name || "Unknown Branch",
      lastOpened: register.openedAt,
      lastClosed: register.closedAt
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Create register error:', error);
    res.status(500).json({ message: 'Failed to create register' });
  }
});

router.put('/registers/:id', async (req: any, res: any) => {
  try {
    const [register] = await db.update(schema.registers)
      .set({
        name: req.body.name,
        branchId: req.body.branchId,
        code: req.body.code,
        openingBalance: req.body.openingBalance,
        currentBalance: req.body.currentBalance,
        isActive: req.body.isActive
      })
      .where(eq(schema.registers.id, parseInt(req.params.id)))
      .returning();
    
    // Get branch name for the response
    const [branch] = await db.select()
      .from(schema.branches)
      .where(eq(schema.branches.id, req.body.branchId))
      .limit(1);
    
    const response = {
      ...register,
      branchName: branch?.name || "Unknown Branch",
      lastOpened: register.openedAt,
      lastClosed: register.closedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('Update register error:', error);
    res.status(500).json({ message: 'Failed to update register' });
  }
});

router.delete('/registers/:id', async (req: any, res: any) => {
  try {
    await db.delete(schema.registers)
      .where(eq(schema.registers.id, parseInt(req.params.id)));
    res.json({ message: 'Register deleted successfully' });
  } catch (error) {
    console.error('Delete register error:', error);
    res.status(500).json({ message: 'Failed to delete register' });
  }
});

// Inventory routes
router.get('/warehouses', (req: any, res: any) => {
  res.json([
    { id: 1, name: 'Main Warehouse', location: 'Central Distribution Center - Downtown' },
    { id: 2, name: 'North Warehouse', location: 'North Side Storage Facility' },
    { id: 3, name: 'South Warehouse', location: 'South Side Distribution Center' },
    { id: 4, name: 'West Warehouse', location: 'West Side Storage Hub' }
  ]);
});

router.get('/stock', async (req: any, res: any) => {
  try {
    // Get stock data with product information
    const stockData = await db
      .select({
        productId: schema.products.id,
        productName: schema.products.name,
        productVariantId: schema.products.id, // Using product ID as variant ID for now
        variantName: schema.products.name, // Using product name as variant name
        quantity: schema.products.stock,
        warehouseId: sql`1`, // Default warehouse
        warehouseName: sql`'Main Warehouse'`, // Default warehouse name
        categoryName: schema.categories.name,
        brandName: schema.brands.name,
        price: schema.products.price,
        lowStockAlert: schema.products.lowStockAlert
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .limit(100);

    res.json(stockData);
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ message: 'Failed to fetch stock data' });
  }
});

router.post('/stock/adjust', async (req: any, res: any) => {
  try {
    const { productVariantId, quantityChange, reason, userId } = req.body;
    
    // Update product stock directly (since we're using products table for stock)
    await db.update(schema.products)
      .set({ 
        stock: sql`${schema.products.stock} + ${quantityChange}` 
      })
      .where(eq(schema.products.id, productVariantId));

    // Log the adjustment (we can add this to stock_adjustments table later)
    console.log(`Stock adjusted: Product ${productVariantId}, Change: ${quantityChange}, Reason: ${reason}`);
    
    res.json({ message: 'Stock adjusted successfully' });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ message: 'Failed to adjust stock' });
  }
});

router.post('/warehouses', isAuthenticated, inventoryController.createWarehouse as any);
router.put('/warehouses/:id', isAuthenticated, inventoryController.updateWarehouse as any);
router.delete('/warehouses/:id', isAuthenticated, inventoryController.deleteWarehouse as any);
// Stock transfers routes - using in-memory storage
let stockTransfers: any[] = [
  {
    id: 1,
    fromWarehouseId: 1,
    toWarehouseId: 2,
    fromWarehouseName: "Main Warehouse",
    toWarehouseName: "North Warehouse", 
    transferDate: "2025-07-28T10:00:00Z",
    status: "completed",
    items: [
      {
        productName: "Final Test Product",
        quantity: 2
      }
    ]
  }
];

router.get('/stock/transfers', async (req: any, res: any) => {
  try {
    // Get warehouse names for each transfer
    const warehouses = await db.select().from(schema.warehouses);
    const warehouseMap = warehouses.reduce((acc: Record<number, string>, warehouse: any) => {
      acc[warehouse.id] = warehouse.name || "Unknown";
      return acc;
    }, {} as Record<number, string>);

    const transfersWithNames = stockTransfers.map(transfer => ({
      ...transfer,
      fromWarehouseName: warehouseMap[transfer.fromWarehouseId] || "Unknown Warehouse",
      toWarehouseName: warehouseMap[transfer.toWarehouseId] || "Unknown Warehouse"
    }));

    res.json(transfersWithNames);
  } catch (error) {
    console.error('Get stock transfers error:', error);
    res.status(500).json({ message: 'Failed to fetch stock transfers' });
  }
});

router.post('/stock/transfers', async (req: any, res: any) => {
  try {
    // Get warehouse names
    const warehouses = await db.select().from(schema.warehouses);
    const warehouseMap = warehouses.reduce((acc: Record<number, string>, warehouse: any) => {
      acc[warehouse.id] = warehouse.name || "Unknown";
      return acc;
    }, {} as Record<number, string>);

    const transfer = {
      id: Date.now(),
      fromWarehouseId: req.body.fromWarehouseId,
      toWarehouseId: req.body.toWarehouseId,
      fromWarehouseName: warehouseMap[req.body.fromWarehouseId] || "Unknown Warehouse",
      toWarehouseName: warehouseMap[req.body.toWarehouseId] || "Unknown Warehouse",
      transferDate: new Date().toISOString(),
      status: "completed",
      items: req.body.items || []
    };
    
    // Add to in-memory storage
    stockTransfers.unshift(transfer); // Add to beginning of array
    
    res.status(201).json(transfer);
  } catch (error) {
    console.error('Create stock transfer error:', error);
    res.status(500).json({ message: 'Failed to create stock transfer' });
  }
});
// In-memory storage for stock adjustments
const stockAdjustments: any[] = [
  {
    id: 1,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    userId: "41128350",
    userName: "Malik Atiq",
    reason: "Physical count adjustment - Found discrepancy during monthly audit",
    items: [
      { productName: "Samsung Galaxy S23", quantity: -2, previousQuantity: 25, newQuantity: 23 },
      { productName: "iPhone 15 Pro", quantity: 1, previousQuantity: 12, newQuantity: 13 }
    ],
    createdAt: "2025-07-28T08:30:00Z"
  },
  {
    id: 2,
    warehouseId: 2,
    warehouseName: "Secondary Warehouse",
    userId: "41128350",
    userName: "Malik Atiq",
    reason: "Damaged goods - Water damage from roof leak",
    items: [
      { productName: "Nike Air Max", quantity: -5, previousQuantity: 20, newQuantity: 15 }
    ],
    createdAt: "2025-07-27T14:15:00Z"
  },
  {
    id: 3,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    userId: "41128350",
    userName: "Malik Atiq",
    reason: "Expired products - Past expiration date removal",
    items: [
      { productName: "Wireless Earbuds", quantity: -3, previousQuantity: 8, newQuantity: 5 }
    ],
    createdAt: "2025-07-26T16:45:00Z"
  }
];

router.get('/stock/adjustments', async (req: any, res: any) => {
  try {
    res.status(200).json(stockAdjustments);
  } catch (error) {
    console.error('Get stock adjustments error:', error);
    res.status(500).json({ message: 'Failed to fetch stock adjustments' });
  }
});

router.post('/stock/adjustments', async (req: any, res: any) => {
  try {
    // Get warehouse names
    const warehouses = await db.select().from(schema.warehouses);
    const warehouseMap = warehouses.reduce((acc: Record<number, string>, warehouse: any) => {
      acc[warehouse.id] = warehouse.name || "Unknown";
      return acc;
    }, {} as Record<number, string>);

    const adjustment = {
      id: Date.now(),
      warehouseId: req.body.warehouseId,
      warehouseName: warehouseMap[req.body.warehouseId] || "Unknown Warehouse",
      userId: "41128350", // Mock user ID
      userName: "Malik Atiq", // Mock user name
      reason: req.body.reason,
      items: req.body.items || [],
      createdAt: new Date().toISOString()
    };
    
    // Add to in-memory storage
    stockAdjustments.unshift(adjustment); // Add to beginning of array
    
    res.status(201).json(adjustment);
  } catch (error) {
    console.error('Create stock adjustment error:', error);
    res.status(500).json({ message: 'Failed to create stock adjustment' });
  }
});

// Remove the complex repository-based route
// router.get('/stock/adjustments', isAuthenticated, inventoryController.getStockAdjustments as any);

export { router as apiRoutes };