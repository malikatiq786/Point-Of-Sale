import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SaleController } from '../controllers/SaleController';
import { DashboardController } from '../controllers/DashboardController';
import { UserController } from '../controllers/UserController';
import { InventoryController } from '../controllers/InventoryController';
import { storage } from '../../storage';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq } from 'drizzle-orm';
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

// Inventory routes
router.get('/warehouses', isAuthenticated, inventoryController.getWarehouses as any);
router.post('/warehouses', isAuthenticated, inventoryController.createWarehouse as any);
router.put('/warehouses/:id', isAuthenticated, inventoryController.updateWarehouse as any);
router.delete('/warehouses/:id', isAuthenticated, inventoryController.deleteWarehouse as any);
router.get('/stock', isAuthenticated, inventoryController.getStock as any);
router.post('/stock/adjust', isAuthenticated, inventoryController.adjustStock as any);
router.get('/stock/transfers', isAuthenticated, inventoryController.getStockTransfers as any);
router.post('/stock/transfers', isAuthenticated, inventoryController.createStockTransfer as any);
router.get('/stock/adjustments', isAuthenticated, inventoryController.getStockAdjustments as any);

export { router as apiRoutes };