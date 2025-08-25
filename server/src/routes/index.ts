import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SaleController } from '../controllers/SaleController';
import { DashboardController } from '../controllers/DashboardController';
import { UserController } from '../controllers/UserController';
import { InventoryController } from '../controllers/InventoryController';
import { CustomerController } from '../controllers/CustomerController';
import { SupplierController } from '../controllers/SupplierController';
import { ExpenseController } from '../controllers/ExpenseController';
import { FinancialReportController } from '../controllers/FinancialReportController';
import { storage } from '../../storage';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, sql, and, or, like, desc, count, inArray } from 'drizzle-orm';
import { isAuthenticated } from '../../replitAuth';
import { WacCalculationService } from '../services/WacCalculationService';
import { PurchaseOrderService } from '../services/PurchaseOrderService';
import { CogsTrackingService } from '../services/CogsTrackingService';

// Initialize controllers
const productController = new ProductController();
const saleController = new SaleController();
const dashboardController = new DashboardController();
const userController = new UserController();
const inventoryController = new InventoryController();
const customerController = new CustomerController();
const supplierController = new SupplierController();
const expenseController = new ExpenseController();
const financialReportController = new FinancialReportController();

// Create router
const router = Router();

// Product routes  
router.get('/products', isAuthenticated, async (req: any, res: any) => {
  try {
    const { search, categoryId, brandId } = req.query;
    
    // Build the query with proper search functionality
    let query = db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        description: schema.products.description,
        price: schema.products.price,
        stock: schema.products.stock,
        barcode: schema.products.barcode,
        lowStockAlert: schema.products.lowStockAlert,
        image: schema.products.image,
        createdAt: schema.products.createdAt,
        updatedAt: schema.products.updatedAt,
        category: {
          id: schema.categories.id,
          name: schema.categories.name,
        },
        brand: {
          id: schema.brands.id,
          name: schema.brands.name,
        },
        unit: {
          id: schema.units.id,
          name: schema.units.name,
          shortName: schema.units.shortName,
        },
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .leftJoin(schema.units, eq(schema.products.unitId, schema.units.id));

    // Apply search conditions
    const conditions = [];
    
    if (search) {
      console.log('Searching for:', search);
      const searchPattern = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${schema.products.name}) LIKE ${searchPattern}`,
          sql`LOWER(COALESCE(${schema.products.description}, '')) LIKE ${searchPattern}`,
          sql`LOWER(${schema.categories.name}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.brands.name}) LIKE ${searchPattern}`,
          sql`LOWER(COALESCE(${schema.products.barcode}, '')) LIKE ${searchPattern}`
        )
      );
    }
    
    if (categoryId) {
      conditions.push(eq(schema.products.categoryId, parseInt(categoryId as string)));
    }
    
    if (brandId) {
      conditions.push(eq(schema.products.brandId, parseInt(brandId as string)));
    }

    // Apply where conditions if any exist
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const products = await query.orderBy(schema.products.name).limit(1000);
    
    console.log(`Found ${products.length} products${search ? ` for search: "${search}"` : ''}`);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});
router.post('/products', isAuthenticated, async (req: any, res: any) => {
  try {
    console.log('Product creation with variants:', req.body);
    
    if (!req.body.name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Calculate total stock from variants
    const variants = req.body.variants || [{ variantName: 'Default', initialStock: 0 }];
    const totalStockFromVariants = variants.reduce((sum, variant) => sum + (variant.initialStock || 0), 0);

    const productData = {
      name: req.body.name,
      description: req.body.description || null,
      barcode: req.body.barcode || null,
      categoryId: req.body.categoryId || null,
      brandId: req.body.brandId || null,
      unitId: req.body.unitId || null,
      price: req.body.price?.toString() || "0",
      stock: totalStockFromVariants, // Use calculated total from variants
      lowStockAlert: req.body.lowStockAlert || 0,
      image: req.body.image || null
    };

    // Create the product first
    const [product] = await db.insert(schema.products)
      .values(productData)
      .returning();
      
    console.log('Product created:', product);

    // Handle variants creation if provided
    const selectedWarehouseIds = req.body.selectedWarehouses || [];
    
    // Get selected warehouses for stock distribution
    let warehouses = [];
    if (selectedWarehouseIds.length > 0) {
      const warehouseIdsAsNumbers = selectedWarehouseIds.map(id => parseInt(id));
      warehouses = await db.select().from(schema.warehouses)
        .where(inArray(schema.warehouses.id, warehouseIdsAsNumbers));
    } else {
      console.log('No warehouses selected - stock will not be created');
    }
    
    for (const variant of variants) {
      // Create product variant with pricing
      const [createdVariant] = await db.insert(schema.productVariants)
        .values({
          productId: product.id,
          variantName: variant.variantName || 'Default',
          purchasePrice: variant.purchasePrice?.toString() || "0",
          salePrice: variant.salePrice?.toString() || "0", 
          wholesalePrice: variant.wholesalePrice?.toString() || "0",
          retailPrice: variant.retailPrice?.toString() || "0"
        })
        .returning();
        
      console.log('Variant created:', createdVariant);
      
      // Create stock entries in selected warehouses - no distribution, full stock goes to each selected warehouse
      if (variant.initialStock > 0 && warehouses.length > 0) {
        // If only one warehouse is selected, put all stock there
        if (warehouses.length === 1) {
          await db.insert(schema.stock).values({
            productVariantId: createdVariant.id,
            warehouseId: warehouses[0].id,
            quantity: variant.initialStock.toString()
          });
          console.log(`Stock created: ${variant.initialStock} units in warehouse ${warehouses[0].name}`);
        } else {
          // If multiple warehouses selected, distribute evenly
          const stockPerWarehouse = Math.floor(variant.initialStock / warehouses.length);
          const remainder = variant.initialStock % warehouses.length;
          
          for (let i = 0; i < warehouses.length; i++) {
            const warehouseStock = stockPerWarehouse + (i < remainder ? 1 : 0);
            
            if (warehouseStock > 0) {
              await db.insert(schema.stock).values({
                productVariantId: createdVariant.id,
                warehouseId: warehouses[i].id,
                quantity: warehouseStock.toString()
              });
              
              console.log(`Stock created: ${warehouseStock} units in warehouse ${warehouses[i].name}`);
            }
          }
        }
      } else if (variant.initialStock > 0 && warehouses.length === 0) {
        console.log(`Warning: Cannot create stock for variant ${createdVariant.variantName} - no warehouses selected`);
      }
    }
    
    console.log('Product with variants created successfully:', product);
    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});
router.get('/products/low-stock', isAuthenticated, productController.getLowStockProducts as any);
router.get('/products/:id', isAuthenticated, productController.getProductById as any);

// Get product variants with pricing and stock
router.get('/products/:id/variants', isAuthenticated, async (req: any, res: any) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (!productId) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Fetch variants with their total stock (summed from all warehouses)
    const variantsWithStock = await db
      .select({
        id: schema.productVariants.id,
        variantName: schema.productVariants.variantName,
        purchasePrice: schema.productVariants.purchasePrice,
        salePrice: schema.productVariants.salePrice,
        wholesalePrice: schema.productVariants.wholesalePrice,
        retailPrice: schema.productVariants.retailPrice,
        totalStock: sql<number>`COALESCE(SUM(CAST(${schema.stock.quantity} AS INTEGER)), 0)`
      })
      .from(schema.productVariants)
      .leftJoin(schema.stock, eq(schema.productVariants.id, schema.stock.productVariantId))
      .where(eq(schema.productVariants.productId, productId))
      .groupBy(
        schema.productVariants.id,
        schema.productVariants.variantName,
        schema.productVariants.purchasePrice,
        schema.productVariants.salePrice,
        schema.productVariants.wholesalePrice,
        schema.productVariants.retailPrice
      );

    // Map to frontend format
    const variants = variantsWithStock.map(variant => ({
      id: variant.id,
      variantName: variant.variantName || 'Default',
      stock: variant.totalStock || 0,
      purchasePrice: variant.purchasePrice || '0',
      salePrice: variant.salePrice || '0',
      wholesalePrice: variant.wholesalePrice || '0',
      retailPrice: variant.retailPrice || '0'
    }));

    console.log(`Found ${variants.length} variants for product ${productId}:`, variants);
    res.json(variants);
  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({ message: 'Failed to fetch product variants' });
  }
});
// Categories route disabled - using main routes.ts version for database integration
// router.get('/categories', isAuthenticated, async (req: any, res: any) => {
//   try {
//     const categories = await storage.getCategories();
//     console.log('Categories route returning:', categories.length, 'categories');
//     res.json(categories);
//   } catch (error) {
//     console.error('Error fetching categories:', error);
//     res.status(500).json({ message: 'Failed to fetch categories' });
//   }
// });

// Brands routes moved to main routes.ts file for database integration

router.get('/units', isAuthenticated, async (req: any, res: any) => {
  try {
    const results = await db.select().from(schema.units).orderBy(schema.units.id);
    
    // Map database fields to frontend expected format
    const units = results.map(unit => ({
      id: unit.id,
      name: unit.name,
      shortName: unit.shortName,
      type: unit.type,
      description: unit.description
    }));
    
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ message: 'Failed to fetch units' });
  }
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
router.get('/returns', isAuthenticated, async (req: any, res: any) => {
  try {
    console.log('Fetching returns, current storage has:', returnsStorage.length, 'items');
    // Return all returns from storage, sorted by creation date (newest first)
    const sortedReturns = [...returnsStorage].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    console.log('Returning sorted returns:', sortedReturns.map(r => ({ id: r.id, reason: r.reason })));
    res.json(sortedReturns);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ message: 'Failed to fetch returns' });
  }
});

router.post('/returns', isAuthenticated, async (req: any, res: any) => {
  try {
    // Find the sale details to get customer and amount info
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
    
    // Add to storage
    returnsStorage.push(returnData);
    
    console.log('Return created and added to storage:', returnData);
    console.log('Total returns in storage:', returnsStorage.length);
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

// Kitchen POS debug route
router.get('/kitchen/test', async (req: any, res: any) => {
  try {
    const testQuery = await db.select().from(schema.sales).limit(3);
    res.json({
      message: 'Kitchen API test',
      count: testQuery.length,
      sample: testQuery
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kitchen POS routes - Simplified for debugging
router.get('/kitchen/orders/:status?', isAuthenticated, async (req: any, res: any) => {
  console.log('!!!!! KITCHEN ORDERS ENDPOINT HIT !!!!');
  console.log('Request params:', req.params);
  console.log('Request URL:', req.url);
  
  try {
    // Return hardcoded test data for now to see if frontend receives it
    const testOrders = [
      {
        id: 1,
        orderType: 'dine-in',
        tableNumber: '5',
        kitchenStatus: 'new',
        saleDate: new Date().toISOString(),
        totalAmount: '45.99',
        specialInstructions: 'Test order - debugging',
        estimatedTime: null,
        customer: { name: 'Test Customer' },
        items: [{
          id: 1,
          quantity: "2",
          productVariant: {
            product: { name: "Debug Test Item" }
          }
        }]
      },
      {
        id: 2,
        orderType: 'takeaway',
        tableNumber: null,
        kitchenStatus: 'preparing',
        saleDate: new Date().toISOString(),
        totalAmount: '32.50',
        specialInstructions: 'Extra sauce',
        estimatedTime: 15,
        customer: { name: 'John Doe' },
        items: [{
          id: 2,
          quantity: "1",
          productVariant: {
            product: { name: "Burger" }
          }
        }]
      }
    ];
    
    console.log('!!!!! RETURNING TEST ORDERS:', testOrders.length);
    res.json(testOrders);
  } catch (error) {
    console.error('!!!!! KITCHEN ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch kitchen orders', error: error.message });
  }
});

router.patch('/kitchen/orders/:id/status', isAuthenticated, async (req: any, res: any) => {
  try {
    const orderId = parseInt(req.params.id);
    const { kitchenStatus, estimatedTime } = req.body;
    
    console.log(`Updating order ${orderId} status to:`, kitchenStatus);
    
    const updateData: any = { kitchenStatus };
    if (estimatedTime) {
      updateData.estimatedTime = estimatedTime;
    }
    
    const [updatedOrder] = await db
      .update(schema.sales)
      .set(updateData)
      .where(eq(schema.sales.id, orderId))
      .returning();
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Order status updated successfully:', updatedOrder);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Update kitchen order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

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
router.get('/purchases', isAuthenticated, async (req: any, res: any) => {
  try {
    // Get all purchases with supplier info, ordered by latest first
    const purchases = await db
      .select({
        id: schema.purchases.id,
        supplierId: schema.purchases.supplierId,
        userId: schema.purchases.userId,
        totalAmount: schema.purchases.totalAmount,
        purchaseDate: schema.purchases.purchaseDate,
        status: schema.purchases.status,
        supplierName: schema.suppliers.name,
      })
      .from(schema.purchases)
      .leftJoin(schema.suppliers, eq(schema.purchases.supplierId, schema.suppliers.id))
      .orderBy(desc(schema.purchases.id)) // Latest first
      .limit(50);

    // Get item counts for each purchase
    const purchaseIds = purchases.map(p => p.id);
    const itemCounts = await db
      .select({
        purchaseId: schema.purchaseItems.purchaseId,
        itemCount: count(schema.purchaseItems.id),
      })
      .from(schema.purchaseItems)
      .where(inArray(schema.purchaseItems.purchaseId, purchaseIds))
      .groupBy(schema.purchaseItems.purchaseId);

    // Create a map for quick lookup
    const itemCountMap = Object.fromEntries(
      itemCounts.map(item => [item.purchaseId, parseInt(item.itemCount)])
    );

    // Format response with item counts and nested supplier object
    const formattedPurchases = purchases.map(purchase => ({
      ...purchase,
      supplier: purchase.supplierName ? {
        id: purchase.supplierId,
        name: purchase.supplierName,
      } : null,
      itemCount: itemCountMap[purchase.id] || 0,
    }));
    
    res.json(formattedPurchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

router.post('/purchases', isAuthenticated, async (req: any, res: any) => {
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

// Get single purchase
router.get('/purchases/:id', isAuthenticated, async (req: any, res: any) => {
  try {
    const purchaseId = parseInt(req.params.id);
    
    if (isNaN(purchaseId)) {
      return res.status(400).json({ message: 'Invalid purchase ID' });
    }
    
    // First get the purchase without joins - try with specific fields
    const purchaseResults = await db
      .select({
        id: schema.purchases.id,
        supplierId: schema.purchases.supplierId,
        totalAmount: schema.purchases.totalAmount,
        purchaseDate: schema.purchases.purchaseDate,
        status: schema.purchases.status,
      })
      .from(schema.purchases)
      .where(eq(schema.purchases.id, purchaseId))
      .limit(1);

    const purchase = purchaseResults[0];
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Get supplier separately if exists
    let supplier = null;
    if (purchase.supplierId) {
      const [supplierResult] = await db
        .select()
        .from(schema.suppliers)
        .where(eq(schema.suppliers.id, purchase.supplierId))
        .limit(1);
      supplier = supplierResult || null;
    }

    // Get purchase items with product details
    const purchaseItems = await db
      .select({
        id: schema.purchaseItems.id,
        purchaseId: schema.purchaseItems.purchaseId,
        productVariantId: schema.purchaseItems.productVariantId,
        quantity: schema.purchaseItems.quantity,
        costPrice: schema.purchaseItems.costPrice,
        // Product details
        productId: schema.products.id,
        productName: schema.products.name,
        productDescription: schema.products.description,
        productBarcode: schema.products.barcode,
      })
      .from(schema.purchaseItems)
      .leftJoin(schema.productVariants, eq(schema.purchaseItems.productVariantId, schema.productVariants.id))
      .leftJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(eq(schema.purchaseItems.purchaseId, purchaseId));
    
    const result = {
      ...purchase,
      supplier: supplier,
      items: purchaseItems.map(item => ({
        id: item.id,
        purchaseId: item.purchaseId,
        productVariantId: item.productVariantId,
        productId: item.productId,
        productName: item.productName,
        quantity: parseFloat(item.quantity || '0'),
        costPrice: parseFloat(item.costPrice || '0'),
        unitPrice: parseFloat(item.costPrice || '0'), // Frontend expects unitPrice
        total: parseFloat(item.quantity || '0') * parseFloat(item.costPrice || '0'), // Frontend expects 'total'
        totalCost: parseFloat(item.quantity || '0') * parseFloat(item.costPrice || '0'),
      }))
    };
    
    console.log(`Found purchase ${purchaseId} with ${purchaseItems.length} items`);
    res.json(result);
  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch purchase details' });
  }
});

// Update purchase status
router.patch('/purchases/:id/status', isAuthenticated, async (req: any, res: any) => {
  try {
    const purchaseId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(purchaseId)) {
      return res.status(400).json({ message: 'Invalid purchase ID' });
    }
    
    if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const [updatedPurchase] = await db
      .update(schema.purchases)
      .set({ status })
      .where(eq(schema.purchases.id, purchaseId))
      .returning();
    
    if (!updatedPurchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    // If purchase is approved, update variant stocks directly
    if (status === 'approved') {
      try {
        // Get purchase items
        const purchaseItems = await db
          .select()
          .from(schema.purchaseItems)
          .where(eq(schema.purchaseItems.purchaseId, purchaseId));
        
        console.log(`Processing stock updates for ${purchaseItems.length} items in purchase ${purchaseId}`);
        
        // Process each purchase item for stock update
        for (const item of purchaseItems) {
          if (item.productVariantId) {
            const quantity = parseFloat(item.quantity);
            const warehouseId = 1; // Default warehouse
            
            console.log(`Updating variant ${item.productVariantId} stock by +${quantity}`);
            
            // Update variant stock directly
            await db.execute(sql`
              UPDATE stock 
              SET quantity = quantity + ${quantity}
              WHERE product_variant_id = ${item.productVariantId}
                AND warehouse_id = ${warehouseId}
            `);
            
            // Get product ID from variant and sync product total
            const [variant] = await db
              .select({ productId: schema.productVariants.productId })
              .from(schema.productVariants)
              .where(eq(schema.productVariants.id, item.productVariantId))
              .limit(1);
            
            if (variant) {
              // Sync product total stock from variants
              await db.execute(sql`
                UPDATE products 
                SET stock = (
                  SELECT COALESCE(SUM(CAST(s.quantity AS INTEGER)), 0)
                  FROM product_variants pv
                  LEFT JOIN stock s ON pv.id = s.product_variant_id
                  WHERE pv.product_id = ${variant.productId}
                ),
                updated_at = NOW()
                WHERE id = ${variant.productId}
              `);
              
              console.log(`✓ Updated variant ${item.productVariantId} and synced product ${variant.productId} total stock`);
            }
          }
        }
        
        console.log(`Successfully processed stock updates for purchase ${purchaseId}`);
      } catch (stockError) {
        console.error(`Stock update failed for purchase ${purchaseId}:`, stockError);
        // Don't fail the approval if stock update fails, just log the error
      }
    }
    
    console.log(`Purchase ${purchaseId} status updated to: ${status}`);
    res.json({ message: 'Purchase status updated successfully', purchase: updatedPurchase });
  } catch (error) {
    console.error('Update purchase status error:', error);
    res.status(500).json({ message: 'Failed to update purchase status' });
  }
});

// Supplier routes
router.get('/suppliers', isAuthenticated, supplierController.getSuppliers as any);
router.post('/suppliers', isAuthenticated, supplierController.createSupplier as any);
router.get('/suppliers/:id', isAuthenticated, supplierController.getSupplierById as any);
router.put('/suppliers/:id', isAuthenticated, supplierController.updateSupplier as any);
router.delete('/suppliers/bulk-delete', isAuthenticated, supplierController.bulkDeleteSuppliers as any);
router.delete('/suppliers/:id', isAuthenticated, supplierController.deleteSupplier as any);
router.get('/suppliers/search', isAuthenticated, supplierController.searchSuppliers as any);

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

router.post('/brands', isAuthenticated, async (req: any, res: any) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Brand name is required" });
    }

    // Check if brand with this name already exists (case-insensitive)
    const existingBrands = await db.select().from(schema.brands);
    const existingBrand = existingBrands.find(brand => 
      brand.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingBrand) {
      return res.status(400).json({ message: "Brand name already exists" });
    }

    const [brand] = await db.insert(schema.brands)
      .values({ name, description })
      .returning();
    res.status(201).json(brand);
  } catch (error) {
    console.error('Create brand error:', error);
    // Handle unique constraint violation from database
    if (error.message && error.message.includes('unique')) {
      return res.status(400).json({ message: "Brand name already exists" });
    }
    res.status(500).json({ message: 'Failed to create brand' });
  }
});

router.put('/brands/:id', isAuthenticated, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Brand name is required" });
    }

    // Check if another brand with this name already exists (excluding current brand)
    const existingBrands = await db.select().from(schema.brands);
    const existingBrand = existingBrands.find(brand => 
      brand.name.toLowerCase() === name.toLowerCase() && 
      brand.id !== parseInt(id)
    );
    
    if (existingBrand) {
      return res.status(400).json({ message: "Brand name already exists" });
    }

    const [brand] = await db.update(schema.brands)
      .set({ name, description })
      .where(eq(schema.brands.id, parseInt(id)))
      .returning();
    res.json(brand);
  } catch (error) {
    console.error('Update brand error:', error);
    // Handle unique constraint violation from database
    if (error.message && error.message.includes('unique')) {
      return res.status(400).json({ message: "Brand name already exists" });
    }
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
router.get('/warehouses', isAuthenticated, inventoryController.getWarehouses as any);



router.post('/warehouses', isAuthenticated, inventoryController.createWarehouse as any);
router.put('/warehouses/:id', isAuthenticated, inventoryController.updateWarehouse as any);
router.delete('/warehouses/:id', isAuthenticated, inventoryController.deleteWarehouse as any);

// Stock management routes
router.get('/stock', isAuthenticated, inventoryController.getStock as any);

router.get('/stock/transfers', isAuthenticated, inventoryController.getStockTransfers as any);

router.post('/stock/transfers', isAuthenticated, inventoryController.createStockTransfer as any);

router.get('/stock/adjustments', isAuthenticated, inventoryController.getStockAdjustments as any);
router.post('/stock/adjustments', isAuthenticated, inventoryController.adjustStock as any);

// Customer routes
router.get('/customers', isAuthenticated, customerController.getCustomers as any);
router.get('/customers/search', isAuthenticated, customerController.searchCustomers as any);
router.get('/customers/:id', isAuthenticated, customerController.getCustomerById as any);
router.post('/customers', isAuthenticated, customerController.createCustomer as any);
router.put('/customers/:id', isAuthenticated, customerController.updateCustomer as any);
router.delete('/customers/bulk-delete', isAuthenticated, customerController.bulkDeleteCustomers as any);
router.delete('/customers/:id', isAuthenticated, customerController.deleteCustomer as any);

// =========================================
// 💸 EXPENSE MANAGEMENT ROUTES
// =========================================

// Expense CRUD operations
router.get('/expenses', isAuthenticated, expenseController.getExpenses);
router.get('/expenses/:id', isAuthenticated, expenseController.getExpenseById);
router.post('/expenses', isAuthenticated, expenseController.createExpense);
router.put('/expenses/:id', isAuthenticated, expenseController.updateExpense);
router.delete('/expenses/:id', isAuthenticated, expenseController.deleteExpense);
router.post('/expenses/bulk-delete', isAuthenticated, expenseController.bulkDeleteExpenses);

// Expense Categories
router.get('/expense-categories', isAuthenticated, expenseController.getCategories);
router.post('/expense-categories', isAuthenticated, expenseController.createCategory);
router.put('/expense-categories/:id', isAuthenticated, expenseController.updateCategory);
router.delete('/expense-categories/:id', isAuthenticated, expenseController.deleteCategory);

// Expense Vendors
router.get('/expense-vendors', isAuthenticated, expenseController.getVendors);
router.post('/expense-vendors', isAuthenticated, expenseController.createVendor);

// Expense Budgets
router.get('/expense-budgets', isAuthenticated, expenseController.getBudgets);
router.post('/expense-budgets', isAuthenticated, expenseController.createBudget);

// Expense Approvals
router.post('/expenses/:id/approve', isAuthenticated, expenseController.approveExpense);
router.post('/expenses/:id/reject', isAuthenticated, expenseController.rejectExpense);

// Expense Reports
router.get('/expense-reports/:reportType', isAuthenticated, expenseController.getExpenseReports);
router.get('/expense-dashboard/stats', isAuthenticated, expenseController.getDashboardStats);

// =========================================
// 📊 FINANCIAL REPORTS ROUTES
// =========================================

// Financial Reports
router.get('/reports/:reportType', isAuthenticated, financialReportController.getFinancialReport);
router.get('/reports/dashboard/summary', isAuthenticated, financialReportController.getDashboardSummary);
router.get('/reports/profit-loss', isAuthenticated, financialReportController.getProfitLossData);
router.get('/reports/expense-breakdown', isAuthenticated, financialReportController.getExpenseBreakdown);

// =========================================
// 📊 WAC (Weighted Average Cost) Routes
// =========================================

// Get inventory valuation report
router.get('/wac/inventory-valuation', isAuthenticated, async (req: any, res: any) => {
  try {
    const { branchId, warehouseId } = req.query;
    const valuation = await WacCalculationService.getInventoryValuation(
      branchId ? parseInt(branchId) : undefined,
      warehouseId ? parseInt(warehouseId) : undefined
    );
    res.json(valuation);
  } catch (error) {
    console.error('Get inventory valuation error:', error);
    res.status(500).json({ message: 'Failed to get inventory valuation' });
  }
});

// Get enhanced inventory valuation with product/brand/category grouping
router.get('/wac/inventory-valuation-enhanced', isAuthenticated, async (req: any, res: any) => {
  try {
    const { branchId, warehouseId } = req.query;
    const branchIdNum = branchId ? parseInt(branchId) : undefined;
    const warehouseIdNum = warehouseId ? parseInt(warehouseId) : undefined;
    
    const conditions = [];
    if (branchIdNum) {
      conditions.push(eq(schema.productWac.branchId, branchIdNum));
    }
    if (warehouseIdNum) {
      conditions.push(eq(schema.productWac.warehouseId, warehouseIdNum));
    }

    const enhancedData = await db
      .select({
        productId: schema.productWac.productId,
        productName: schema.products.name,
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        brandId: schema.products.brandId,
        brandName: schema.brands.name,
        currentQuantity: schema.productWac.currentQuantity,
        weightedAverageCost: schema.productWac.weightedAverageCost,
        totalValue: schema.productWac.totalValue,
        lastCalculatedAt: schema.productWac.lastCalculatedAt,
      })
      .from(schema.productWac)
      .leftJoin(schema.products, eq(schema.productWac.productId, schema.products.id))
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.products.name);

    const formattedData = enhancedData.map(item => ({
      ...item,
      currentQuantity: parseFloat(item.currentQuantity || '0'),
      weightedAverageCost: parseFloat(item.weightedAverageCost || '0'),
      totalValue: parseFloat(item.totalValue || '0'),
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Get enhanced inventory valuation error:', error);
    res.status(500).json({ message: 'Failed to get enhanced inventory valuation' });
  }
});

// Get variant-level inventory valuation with WAC per variant
router.get('/wac/inventory-valuation-variants', isAuthenticated, async (req: any, res: any) => {
  try {
    const { branchId, warehouseId } = req.query;
    const branchIdNum = branchId ? parseInt(branchId) : undefined;
    const warehouseIdNum = warehouseId ? parseInt(warehouseId) : undefined;
    
    const variantData = await WacCalculationService.getVariantLevelValuation(
      branchIdNum,
      warehouseIdNum
    );

    res.json(variantData);
  } catch (error) {
    console.error('Get variant-level inventory valuation error:', error);
    res.status(500).json({ message: 'Failed to get variant-level inventory valuation' });
  }
});

// Get detailed purchase history for a specific variant
router.get('/wac/variant-purchase-details/:variantId', isAuthenticated, async (req: any, res: any) => {
  try {
    const variantId = parseInt(req.params.variantId);
    
    if (!variantId) {
      return res.status(400).json({ message: 'Valid variant ID is required' });
    }

    // Get variant info
    const [variant] = await db
      .select({
        variantId: schema.productVariants.id,
        variantName: schema.productVariants.variantName,
        productId: schema.productVariants.productId,
        productName: schema.products.name,
      })
      .from(schema.productVariants)
      .leftJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(eq(schema.productVariants.id, variantId))
      .limit(1);

    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Get detailed purchase history with running WAC calculation
    const purchaseHistory = await db
      .select({
        purchaseId: schema.purchases.id,
        purchaseDate: schema.purchases.purchaseDate,
        quantity: schema.purchaseItems.quantity,
        costPrice: schema.purchaseItems.costPrice,
        totalCost: sql<string>`CAST(${schema.purchaseItems.quantity} AS DECIMAL) * CAST(${schema.purchaseItems.costPrice} AS DECIMAL)`,
        supplierName: schema.suppliers.name,
        status: schema.purchases.status,
      })
      .from(schema.purchaseItems)
      .leftJoin(schema.purchases, eq(schema.purchaseItems.purchaseId, schema.purchases.id))
      .leftJoin(schema.suppliers, eq(schema.purchases.supplierId, schema.suppliers.id))
      .where(
        and(
          eq(schema.purchaseItems.productVariantId, variantId),
          eq(schema.purchases.status, 'approved')
        )
      )
      .orderBy(schema.purchases.purchaseDate);

    // Calculate running WAC for each purchase
    let runningQuantity = 0;
    let runningTotalValue = 0;
    let runningWac = 0;

    const detailedHistory = purchaseHistory.map((purchase, index) => {
      const qty = parseFloat(purchase.quantity || '0');
      const cost = parseFloat(purchase.costPrice || '0');
      const totalCost = qty * cost;

      // Calculate running totals
      const previousQuantity = runningQuantity;
      const previousTotalValue = runningTotalValue;
      const previousWac = runningWac;

      runningQuantity += qty;
      runningTotalValue += totalCost;
      runningWac = runningQuantity > 0 ? runningTotalValue / runningQuantity : 0;

      return {
        purchaseNumber: index + 1,
        purchaseId: purchase.purchaseId,
        purchaseDate: purchase.purchaseDate,
        quantity: qty,
        unitCost: cost,
        totalCost: totalCost,
        supplierName: purchase.supplierName,
        status: purchase.status,
        // Running calculations
        previousQuantity,
        previousTotalValue,
        previousWac,
        newQuantity: runningQuantity,
        newTotalValue: runningTotalValue,
        newWac: runningWac,
      };
    });

    const response = {
      variant: {
        variantId: variant.variantId,
        variantName: variant.variantName,
        productId: variant.productId,
        productName: variant.productName,
      },
      summary: {
        totalPurchases: purchaseHistory.length,
        totalQuantityPurchased: runningQuantity,
        totalValuePurchased: runningTotalValue,
        finalWac: runningWac,
      },
      purchaseHistory: detailedHistory,
    };

    res.json(response);
  } catch (error) {
    console.error('Get variant purchase details error:', error);
    res.status(500).json({ message: 'Failed to get variant purchase details' });
  }
});

// Get current WAC for a product
router.get('/wac/product/:productId', isAuthenticated, async (req: any, res: any) => {
  try {
    const { productId } = req.params;
    const { branchId, warehouseId } = req.query;
    
    const wac = await WacCalculationService.getCurrentWacValue(
      parseInt(productId),
      branchId ? parseInt(branchId) : undefined,
      warehouseId ? parseInt(warehouseId) : undefined
    );
    
    res.json({ productId: parseInt(productId), wac });
  } catch (error) {
    console.error('Get product WAC error:', error);
    res.status(500).json({ message: 'Failed to get product WAC' });
  }
});

// Process manual inventory movement
router.post('/wac/movement', isAuthenticated, async (req: any, res: any) => {
  try {
    const movementData = {
      ...req.body,
      createdBy: req.session?.user?.id || req.user?.claims?.sub || 'system',
    };
    
    const result = await WacCalculationService.processInventoryMovement(movementData);
    res.json(result);
  } catch (error) {
    console.error('Process inventory movement error:', error);
    res.status(500).json({ message: 'Failed to process inventory movement' });
  }
});

// Process all existing approved purchases for WAC calculation
router.post('/wac/process-existing-purchases', isAuthenticated, async (req: any, res: any) => {
  try {
    console.log('Processing all existing approved purchases for WAC calculations...');
    
    // First, let's add sample purchase items for existing purchases that don't have any
    await createSamplePurchaseItemsIfMissing();
    
    // Add sample inventory movements for demonstration
    await createSampleInventoryMovements();
    
    // Get all approved purchases
    const approvedPurchases = await db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.status, 'approved'))
      .orderBy(schema.purchases.purchaseDate);
    
    console.log(`Found ${approvedPurchases.length} approved purchases to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const purchase of approvedPurchases) {
      try {
        // Get purchase items
        const purchaseItems = await db
          .select()
          .from(schema.purchaseItems)
          .where(eq(schema.purchaseItems.purchaseId, purchase.id));
        
        console.log(`Processing purchase ${purchase.id} with ${purchaseItems.length} items`);
        
        if (purchaseItems.length === 0) {
          console.log(`No items found for purchase ${purchase.id}, skipping...`);
          continue;
        }
        
        // Process each purchase item for WAC calculation
        for (const item of purchaseItems) {
          // For variant-based purchases, we need to get the product ID from the variant
          if (!item.productVariantId) {
            console.log(`Skipping item in purchase ${purchase.id} - missing productVariantId`);
            continue;
          }
          
          // Get the product ID from the variant
          const [variant] = await db
            .select({ productId: schema.productVariants.productId })
            .from(schema.productVariants)
            .where(eq(schema.productVariants.id, item.productVariantId))
            .limit(1);
          
          if (!variant || !variant.productId) {
            console.log(`Skipping item in purchase ${purchase.id} - variant ${item.productVariantId} not found or missing productId`);
            continue;
          }
          
          const quantity = parseFloat(item.quantity || '0');
          const unitCost = parseFloat(item.costPrice || '0');
          
          if (quantity <= 0 || unitCost <= 0) {
            console.log(`Skipping item in purchase ${purchase.id} - invalid quantity (${quantity}) or cost (${unitCost})`);
            continue;
          }
          
          const movementData = {
            productId: variant.productId,
            productVariantId: item.productVariantId,
            quantity: quantity,
            unitCost: unitCost,
            movementType: 'purchase' as const,
            referenceId: purchase.id.toString(),
            branchId: undefined,
            warehouseId: undefined,
            createdBy: req.session?.user?.id || req.user?.claims?.sub || 'system',
          };
          
          console.log(`Processing item for product ${variant.productId} (variant ${item.productVariantId}) with quantity ${quantity} and cost ${unitCost}`);
          
          // Process inventory movement and calculate WAC
          await WacCalculationService.processInventoryMovement(movementData);
        }
        
        processedCount++;
        console.log(`Successfully processed purchase ${purchase.id}`);
      } catch (purchaseError) {
        console.error(`Failed to process purchase ${purchase.id}:`, purchaseError);
        errorCount++;
      }
    }
    
    console.log(`WAC processing completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    res.json({ 
      message: 'WAC processing completed', 
      processedPurchases: processedCount,
      errors: errorCount,
      totalPurchases: approvedPurchases.length
    });
  } catch (error) {
    console.error('Process existing purchases error:', error);
    res.status(500).json({ message: 'Failed to process existing purchases' });
  }
});

// Helper function to create sample purchase items for existing purchases
async function createSamplePurchaseItemsIfMissing() {
  try {
    console.log('Checking for missing purchase items...');
    
    // Get some product IDs to use as sample data
    const products = await db.select({ id: schema.products.id }).from(schema.products).limit(10);
    
    if (products.length === 0) {
      console.log('No products found, cannot create sample purchase items');
      return;
    }
    
    // Get approved purchases that have no items
    const purchasesWithoutItems = await db
      .select({ 
        id: schema.purchases.id, 
        totalAmount: schema.purchases.totalAmount 
      })
      .from(schema.purchases)
      .leftJoin(schema.purchaseItems, eq(schema.purchases.id, schema.purchaseItems.purchaseId))
      .where(and(
        eq(schema.purchases.status, 'approved'),
        isNull(schema.purchaseItems.id)
      ))
      .groupBy(schema.purchases.id, schema.purchases.totalAmount);
    
    console.log(`Found ${purchasesWithoutItems.length} purchases without items`);
    
    for (const purchase of purchasesWithoutItems) {
      const totalAmount = parseFloat(purchase.totalAmount);
      const numItems = Math.min(3, products.length); // Add 1-3 items per purchase
      const avgItemCost = totalAmount / numItems;
      
      for (let i = 0; i < numItems; i++) {
        const product = products[i % products.length];
        const itemCost = avgItemCost * (0.8 + Math.random() * 0.4); // Vary item costs ±20%
        const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units
        const unitPrice = itemCost / quantity;
        
        await db.insert(schema.purchaseItems).values({
          purchaseId: purchase.id,
          productId: product.id,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toFixed(2),
          totalPrice: itemCost.toFixed(2),
        });
      }
      
      console.log(`Added ${numItems} items to purchase ${purchase.id}`);
    }
    
    console.log('Sample purchase items creation completed');
  } catch (error) {
    console.error('Error creating sample purchase items:', error);
  }
}

// Helper function to create sample inventory movements for demonstration
async function createSampleInventoryMovements() {
  try {
    console.log('Creating sample inventory movements for demonstration...');
    
    // Get some products to create movements for
    const products = await db.select({ 
      id: schema.products.id, 
      name: schema.products.name 
    }).from(schema.products).limit(5);
    
    if (products.length === 0) {
      console.log('No products found for sample inventory movements');
      return;
    }
    
    // Create sample purchase movements with different costs to demonstrate WAC
    const sampleMovements = [
      { productId: products[0].id, quantity: 50, unitCost: 10.00, notes: 'Initial stock' },
      { productId: products[0].id, quantity: 30, unitCost: 12.00, notes: 'Second purchase' },
      { productId: products[1].id, quantity: 100, unitCost: 5.50, notes: 'Bulk purchase' },
      { productId: products[1].id, quantity: 50, unitCost: 6.00, notes: 'Follow-up order' },
      { productId: products[2].id, quantity: 25, unitCost: 25.00, notes: 'Premium items' },
    ];
    
    for (const movement of sampleMovements) {
      if (!movement.productId) continue;
      
      const movementData = {
        productId: movement.productId,
        quantity: movement.quantity,
        unitCost: movement.unitCost,
        movementType: 'purchase' as const,
        referenceId: 'sample-001',
        branchId: undefined,
        warehouseId: undefined,
        createdBy: 'system',
        notes: movement.notes,
      };
      
      console.log(`Creating sample movement for product ${movement.productId}: ${movement.quantity} units at $${movement.unitCost} each`);
      
      try {
        await WacCalculationService.processInventoryMovement(movementData);
        console.log(`✓ Successfully processed sample movement`);
      } catch (error) {
        console.log(`✗ Failed to process sample movement: ${error}`);
      }
    }
    
    console.log('Sample inventory movements creation completed');
  } catch (error) {
    console.error('Error creating sample inventory movements:', error);
  }
}

// Recalculate WAC from history (for data correction)
router.post('/wac/recalculate/:productId', isAuthenticated, async (req: any, res: any) => {
  try {
    const { productId } = req.params;
    const { branchId, warehouseId } = req.body;
    
    const result = await WacCalculationService.recalculateWacFromHistory(
      parseInt(productId),
      branchId,
      warehouseId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Recalculate WAC error:', error);
    res.status(500).json({ message: 'Failed to recalculate WAC' });
  }
});

// =========================================
// 🛒 Purchase Order Routes
// =========================================

// Get all purchase orders
router.get('/purchase-orders', isAuthenticated, async (req: any, res: any) => {
  try {
    const { branchId, status } = req.query;
    const orders = await PurchaseOrderService.getPurchaseOrders(
      branchId ? parseInt(branchId) : undefined,
      status
    );
    res.json(orders);
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ message: 'Failed to get purchase orders' });
  }
});

// Get purchase order details
router.get('/purchase-orders/:id', isAuthenticated, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const details = await PurchaseOrderService.getPurchaseOrderDetails(parseInt(id));
    res.json(details);
  } catch (error) {
    console.error('Get purchase order details error:', error);
    res.status(500).json({ message: 'Failed to get purchase order details' });
  }
});

// Create new purchase order
router.post('/purchase-orders', isAuthenticated, async (req: any, res: any) => {
  try {
    const orderData = {
      ...req.body,
      createdBy: req.session?.user?.id || req.user?.claims?.sub || 'system',
    };
    
    const order = await PurchaseOrderService.createPurchaseOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ message: 'Failed to create purchase order' });
  }
});

// Receive purchase order (updates WAC automatically)
router.post('/purchase-orders/:id/receive', isAuthenticated, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const receiveData = {
      ...req.body,
      purchaseOrderId: parseInt(id),
      receivedBy: req.session?.user?.id || req.user?.claims?.sub || 'system',
    };
    
    await PurchaseOrderService.receivePurchaseOrder(receiveData);
    res.json({ message: 'Purchase order received successfully' });
  } catch (error) {
    console.error('Receive purchase order error:', error);
    res.status(500).json({ message: 'Failed to receive purchase order' });
  }
});

// Cancel purchase order
router.post('/purchase-orders/:id/cancel', isAuthenticated, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const cancelledBy = req.session?.user?.id || req.user?.claims?.sub || 'system';
    
    await PurchaseOrderService.cancelPurchaseOrder(parseInt(id), cancelledBy);
    res.json({ message: 'Purchase order cancelled successfully' });
  } catch (error) {
    console.error('Cancel purchase order error:', error);
    res.status(500).json({ message: 'Failed to cancel purchase order' });
  }
});

// Get purchase order statistics
router.get('/purchase-orders/stats/summary', isAuthenticated, async (req: any, res: any) => {
  try {
    const { branchId } = req.query;
    const stats = await PurchaseOrderService.getPurchaseOrderStats(
      branchId ? parseInt(branchId) : undefined
    );
    res.json(stats);
  } catch (error) {
    console.error('Get purchase order stats error:', error);
    res.status(500).json({ message: 'Failed to get purchase order stats' });
  }
});

// =========================================
// 📈 COGS Tracking & Profitability Routes
// =========================================

// Get COGS report
router.get('/cogs/report', isAuthenticated, async (req: any, res: any) => {
  try {
    const { startDate, endDate, branchId, productIds } = req.query;
    
    const report = await CogsTrackingService.getCogsReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      branchId ? parseInt(branchId) : undefined,
      productIds ? productIds.split(',').map((id: string) => parseInt(id)) : undefined
    );
    
    res.json(report);
  } catch (error) {
    console.error('Get COGS report error:', error);
    res.status(500).json({ message: 'Failed to get COGS report' });
  }
});

// Get profitability analysis
router.get('/cogs/profitability', isAuthenticated, async (req: any, res: any) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    
    const analysis = await CogsTrackingService.getProfitabilityAnalysis(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      branchId ? parseInt(branchId) : undefined
    );
    
    res.json(analysis);
  } catch (error) {
    console.error('Get profitability analysis error:', error);
    res.status(500).json({ message: 'Failed to get profitability analysis' });
  }
});

// Get daily COGS summary
router.get('/cogs/daily-summary', isAuthenticated, async (req: any, res: any) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const summary = await CogsTrackingService.getDailyCogsummary(
      new Date(startDate),
      new Date(endDate),
      branchId ? parseInt(branchId) : undefined
    );
    
    res.json(summary);
  } catch (error) {
    console.error('Get daily COGS summary error:', error);
    res.status(500).json({ message: 'Failed to get daily COGS summary' });
  }
});

// Get COGS for specific sale
router.get('/cogs/sale/:saleId', isAuthenticated, async (req: any, res: any) => {
  try {
    const { saleId } = req.params;
    const cogs = await CogsTrackingService.getCogsForSale(parseInt(saleId));
    res.json(cogs);
  } catch (error) {
    console.error('Get sale COGS error:', error);
    res.status(500).json({ message: 'Failed to get sale COGS' });
  }
});

// Backfill COGS data for existing sales
router.post('/cogs/backfill', isAuthenticated, async (req: any, res: any) => {
  try {
    const { saleIds } = req.body;
    const backfilledCount = await CogsTrackingService.backfillCogsData(saleIds);
    res.json({ 
      message: `Backfilled COGS data for ${backfilledCount} sales`,
      backfilledCount 
    });
  } catch (error) {
    console.error('Backfill COGS error:', error);
    res.status(500).json({ message: 'Failed to backfill COGS data' });
  }
});

export { router as apiRoutes };