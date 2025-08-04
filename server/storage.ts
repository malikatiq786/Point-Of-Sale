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
  onlineCustomers,
  cartItems,
  menuCategories,
  settings,
  currencies,
  type User,
  type UpsertUser,
  type Product,
  type ProductVariant,
  type ProductPrice,
  type Sale,
  type SaleItem,
  type Customer,
  type Role,
  type OnlineCustomer,
  type CartItem,
  type MenuCategory,
  type InsertOnlineCustomer,
  type InsertCartItem,
  type Setting,
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
  getUserByEmail(email: string): Promise<(User & { role: string | null }) | undefined>;
  
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
  
  // Online customer operations
  createOnlineCustomer(customer: InsertOnlineCustomer): Promise<OnlineCustomer>;
  getOnlineCustomerByEmail(email: string): Promise<OnlineCustomer | undefined>;
  authenticateOnlineCustomer(email: string, password: string): Promise<OnlineCustomer | null>;
  
  // Cart operations
  getCartItems(onlineCustomerId: number): Promise<(CartItem & { product: Pick<Product, 'id' | 'name' | 'description' | 'price' | 'image'> })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(onlineCustomerId: number): Promise<void>;
  
  // Menu operations
  getMenuProducts(): Promise<(Pick<Product, 'id' | 'name' | 'description' | 'price' | 'image' | 'categoryId'> & { category: { id: number; name: string } | null })[]>;
  getMenuCategories(): Promise<MenuCategory[]>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
  
  // Currency operations
  getCurrencies(): Promise<any[]>;
  createCurrency(currency: any): Promise<any>;
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

  async getUserByEmail(email: string): Promise<(User & { role: string | null }) | undefined> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
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
        orderSource: sales.orderSource,
        tableNumber: sales.tableNumber,
        kitchenStatus: sales.kitchenStatus,
        specialInstructions: sales.specialInstructions,
        estimatedTime: sales.estimatedTime,
        deliveryAddress: sales.deliveryAddress,
        customerPhone: sales.customerPhone,
        customerName: sales.customerName,
        customer: {
          id: customers.id,
          name: customers.name,
        },
        onlineCustomer: {
          id: onlineCustomers.id,
          name: onlineCustomers.name,
          email: onlineCustomers.email,
          phone: onlineCustomers.phone,
        },
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(onlineCustomers, eq(sales.onlineCustomerId, onlineCustomers.id))
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
  
  // Online customer operations
  async createOnlineCustomer(customerData: InsertOnlineCustomer): Promise<OnlineCustomer> {
    const [customer] = await db
      .insert(onlineCustomers)
      .values(customerData)
      .returning();
    return customer;
  }
  
  async getOnlineCustomerByEmail(email: string): Promise<OnlineCustomer | undefined> {
    const [customer] = await db
      .select()
      .from(onlineCustomers)
      .where(eq(onlineCustomers.email, email));
    return customer;
  }
  
  async authenticateOnlineCustomer(email: string, password: string): Promise<OnlineCustomer | null> {
    const [customer] = await db
      .select()
      .from(onlineCustomers)
      .where(and(eq(onlineCustomers.email, email), eq(onlineCustomers.password, password)));
    return customer || null;
  }
  
  // Cart operations
  async getCartItems(onlineCustomerId: number): Promise<(CartItem & { product: Pick<Product, 'id' | 'name' | 'description' | 'price' | 'image'> })[]> {
    return await db
      .select({
        id: cartItems.id,
        onlineCustomerId: cartItems.onlineCustomerId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        price: cartItems.price,
        createdAt: cartItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          image: products.image,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.onlineCustomerId, onlineCustomerId));
  }
  
  async addToCart(cartItemData: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.onlineCustomerId, cartItemData.onlineCustomerId),
        eq(cartItems.productId, cartItemData.productId)
      ));
    
    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + cartItemData.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db
        .insert(cartItems)
        .values(cartItemData)
        .returning();
      return newItem;
    }
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }
  
  async clearCart(onlineCustomerId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.onlineCustomerId, onlineCustomerId));
  }
  
  // Menu operations
  async getMenuProducts(): Promise<(Pick<Product, 'id' | 'name' | 'description' | 'price' | 'image' | 'categoryId'> & { category: { id: number; name: string } | null })[]> {
    return await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        image: products.image,
        categoryId: products.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(sql`${products.price} > 0`); // Only show products with price > 0
  }
  
  async getMenuCategories(): Promise<MenuCategory[]> {
    return await db.select().from(menuCategories).where(eq(menuCategories.isActive, true));
  }
  
  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.keyName, key));
    return setting;
  }
  
  async updateSetting(key: string, value: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ keyName: key, value })
      .onConflictDoUpdate({
        target: settings.keyName,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }
  
  // Currency operations
  async getCurrencies(): Promise<any[]> {
    return await db.select().from(currencies);
  }
  
  async createCurrency(currencyData: any): Promise<any> {
    const [currency] = await db
      .insert(currencies)
      .values(currencyData)
      .returning();
    return currency;
  }
}

export const storage = new DatabaseStorage();
