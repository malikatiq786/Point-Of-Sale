import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SaleController } from '../controllers/SaleController';
import { DashboardController } from '../controllers/DashboardController';
import { UserController } from '../controllers/UserController';
import { InventoryController } from '../controllers/InventoryController';
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
router.get('/products', isAuthenticated, productController.getProducts as any);
router.get('/products/low-stock', isAuthenticated, productController.getLowStockProducts as any);
router.get('/products/:id', isAuthenticated, productController.getProductById as any);
router.post('/products', isAuthenticated, productController.createProduct as any);
router.put('/products/:id', isAuthenticated, productController.updateProduct as any);
router.delete('/products/:id', isAuthenticated, productController.deleteProduct as any);
router.patch('/products/:id/stock', isAuthenticated, productController.updateProductStock as any);

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
router.get('/stock', isAuthenticated, inventoryController.getStock as any);
router.post('/stock/adjust', isAuthenticated, inventoryController.adjustStock as any);
router.get('/stock/transfers', isAuthenticated, inventoryController.getStockTransfers as any);
router.post('/stock/transfers', isAuthenticated, inventoryController.createStockTransfer as any);
router.get('/stock/adjustments', isAuthenticated, inventoryController.getStockAdjustments as any);

export { router as apiRoutes };