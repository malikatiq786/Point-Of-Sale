import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SaleController } from '../controllers/SaleController';
import { DashboardController } from '../controllers/DashboardController';
import { isAuthenticated } from '../../replitAuth';

// Initialize controllers
const productController = new ProductController();
const saleController = new SaleController();
const dashboardController = new DashboardController();

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

export { router as apiRoutes };