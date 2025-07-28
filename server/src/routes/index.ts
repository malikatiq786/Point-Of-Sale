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
router.get('/sales', isAuthenticated, saleController.getSales as any);
router.get('/sales/:id', isAuthenticated, saleController.getSaleById as any);
router.get('/sales/date-range', isAuthenticated, saleController.getSalesByDateRange as any);

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

router.delete('/brands/:id', async (req: any, res: any) => {
  try {
    await db.delete(schema.brands)
      .where(eq(schema.brands.id, parseInt(req.params.id)));
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ message: 'Failed to delete brand' });
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
router.get('/stock/transfers', isAuthenticated, inventoryController.getStockTransfers as any);
router.post('/stock/transfers', isAuthenticated, inventoryController.createStockTransfer as any);
router.get('/stock/adjustments', isAuthenticated, inventoryController.getStockAdjustments as any);

export { router as apiRoutes };