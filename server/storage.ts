import {
  users,
  roles,
  products,
  productVariants,
  productPrices,
  categories,
  brands,
  units,
  stock,
  customers,
  sales,
  saleItems,
  activityLogs,
  type User,
  type UpsertUser,
  type Product,
  type ProductVariant,
  type ProductPrice,
  type Sale,
  type SaleItem,
  type Customer,
  type Role,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, like, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Role operations
  getRoles(): Promise<Role[]>;
  getUserWithRole(id: string): Promise<(User & { role: Role | null }) | undefined>;
  getUserByEmail(email: string): Promise<(User & { role: string }) | undefined>;
  
  // Product operations
  getProducts(limit?: number): Promise<(Product & { 
    category: { name: string } | null,
    brand: { name: string } | null,
    variants: (ProductVariant & { prices: ProductPrice[] })[]
  })[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: any): Promise<Product>;
  createCategory(category: any): Promise<any>;
  createBrand(brand: any): Promise<any>;
  getCategories(): Promise<any[]>;
  getBrands(): Promise<any[]>;
  
  // Customer operations
  getCustomers(limit?: number): Promise<Customer[]>;
  createCustomer(customer: any): Promise<Customer>;
  
  // Sales operations
  getSales(limit?: number): Promise<(Sale & { 
    customer: Customer | null,
    user: User | null,
    items: (SaleItem & { productVariant: ProductVariant | null })[]
  })[]>;
  getAllSales(): Promise<any[]>;
  createSale(sale: any): Promise<Sale>;
  updateSaleKitchenStatus(saleId: number, kitchenStatus: string, estimatedTime?: number): Promise<Sale>;
  
  // Dashboard operations
  getDashboardStats(): Promise<{
    todaySales: string;
    totalProducts: number;
    lowStock: number;
    activeCustomers: number;
  }>;
  
  getRecentActivities(limit?: number): Promise<any[]>;
  getTopProducts(limit?: number): Promise<any[]>;
  getRecentTransactions(limit?: number): Promise<any[]>;
  
  // Activity logging
  logActivity(userId: string, action: string, ipAddress?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getUserWithRole(id: string): Promise<(User & { role: Role | null }) | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.users,
      role: result.roles
    };
  }

  async getUserByEmail(email: string): Promise<(User & { role: string }) | undefined> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) return undefined;

    return result[0];
  }

  async getProducts(limit = 50): Promise<any[]> {
    return await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: {
          id: categories.id,
          name: categories.name,
        },
        brand: {
          id: brands.id,
          name: brands.name,
        },
        unit: {
          id: units.id,
          name: units.name,
          shortName: units.shortName,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(units, eq(products.unitId, units.id))
      .limit(limit);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(like(products.name, `%${query}%`))
      .limit(20);
  }

  async getCustomers(limit = 50): Promise<Customer[]> {
    return await db.select().from(customers).limit(limit);
  }

  async createCustomer(customerData: any): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return customer;
  }

  async getSales(limit = 50): Promise<any[]> {
    return await db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        paidAmount: sales.paidAmount,
        saleDate: sales.saleDate,
        status: sales.status,
        customer: {
          id: customers.id,
          name: customers.name,
        },
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .orderBy(desc(sales.saleDate))
      .limit(limit);
  }

  async getAllSales(): Promise<any[]> {
    return await db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        paidAmount: sales.paidAmount,
        saleDate: sales.saleDate,
        status: sales.status,
        orderType: sales.orderType,
        tableNumber: sales.tableNumber,
        kitchenStatus: sales.kitchenStatus,
        specialInstructions: sales.specialInstructions,
        estimatedTime: sales.estimatedTime,
        customer: {
          id: customers.id,
          name: customers.name,
        },
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .orderBy(desc(sales.saleDate));
  }

  async createSale(saleData: any): Promise<Sale> {
    const [sale] = await db
      .insert(sales)
      .values(saleData)
      .returning();
    return sale;
  }

  async updateSaleKitchenStatus(saleId: number, kitchenStatus: string, estimatedTime?: number): Promise<Sale> {
    const updateData: any = { kitchenStatus };
    if (estimatedTime !== undefined) {
      updateData.estimatedTime = estimatedTime;
    }
    
    const [updatedSale] = await db
      .update(sales)
      .set(updateData)
      .where(eq(sales.id, saleId))
      .returning();
    
    return updatedSale;
  }

  async getDashboardStats(): Promise<{
    todaySales: string;
    totalProducts: number;
    lowStock: number;
    activeCustomers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's sales
    const [todaySalesResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)` })
      .from(sales)
      .where(sql`DATE(${sales.saleDate}) = CURRENT_DATE`);
    
    // Get total products
    const [totalProductsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products);
    
    // Get low stock items (assuming quantity < 10 is low stock)
    const [lowStockResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stock)
      .where(sql`${stock.quantity} < 10`);
    
    // Get active customers (customers who made purchases this month)
    const [activeCustomersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${sales.customerId})` })
      .from(sales)
      .where(sql`EXTRACT(MONTH FROM ${sales.saleDate}) = EXTRACT(MONTH FROM CURRENT_DATE)`);

    return {
      todaySales: `$${todaySalesResult.total || '0'}`,
      totalProducts: totalProductsResult.count || 0,
      lowStock: lowStockResult.count || 0,
      activeCustomers: activeCustomersResult.count || 0,
    };
  }

  async getRecentActivities(limit = 10): Promise<any[]> {
    return await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        createdAt: activityLogs.createdAt,
        user: {
          name: users.name,
        },
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getTopProducts(limit = 5): Promise<any[]> {
    return await db
      .select({
        productId: products.id,
        productName: products.name,
        totalSold: sql<number>`SUM(${saleItems.quantity})`,
        totalRevenue: sql<string>`SUM(${saleItems.price} * ${saleItems.quantity})`,
      })
      .from(saleItems)
      .innerJoin(productVariants, eq(saleItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`SUM(${saleItems.quantity})`))
      .limit(limit);
  }

  async getRecentTransactions(limit = 10): Promise<any[]> {
    return await db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        saleDate: sales.saleDate,
        status: sales.status,
        customerName: customers.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.saleDate))
      .limit(limit);
  }

  async createProduct(productData: any): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async createCategory(categoryData: any): Promise<any> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async createBrand(brandData: any): Promise<any> {
    const [brand] = await db
      .insert(brands)
      .values(brandData)
      .returning();
    return brand;
  }

  async getCategories(): Promise<any[]> {
    return await db.select().from(categories);
  }

  async getBrands(): Promise<any[]> {
    return await db.select().from(brands);
  }

  async logActivity(userId: string, action: string, ipAddress?: string): Promise<void> {
    await db.insert(activityLogs).values({
      userId,
      action,
      ipAddress,
    });
  }
}

export const storage = new DatabaseStorage();
