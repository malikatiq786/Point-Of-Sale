import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  serial,
  text,
  integer,
  numeric,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// =========================================
// 🔐 Authentication & Access Control
// =========================================

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
}, (table) => ({
  pk: {
    primaryKey: [table.roleId, table.permissionId],
  },
}));

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 150 }).unique().notNull(),
  password: text("password"), // Made nullable for Replit Auth
  roleId: integer("role_id").references(() => roles.id),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========================================
// 🏢 Business Setup & Multi-Branch
// =========================================

export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  ownerName: varchar("owner_name", { length: 150 }),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businessProfiles.id),
  name: varchar("name", { length: 150 }),
  address: text("address"),
});

export const registers = pgTable("registers", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name", { length: 150 }),
  openedAt: timestamp("opened_at"),
  closedAt: timestamp("closed_at"),
});

// =========================================
// 📦 Product & Inventory Management
// =========================================

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  parentId: integer("parent_id"),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }),
  shortName: varchar("short_name", { length: 10 }),
});

export const productAttributes = pgTable("product_attributes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
});

export const productAttributeValues = pgTable("product_attribute_values", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  attributeId: integer("attribute_id").references(() => productAttributes.id),
  value: text("value"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  unitId: integer("unit_id").references(() => units.id),
  description: text("description"),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  variantName: varchar("variant_name", { length: 100 }),
});

export const productPrices = pgTable("product_prices", {
  id: serial("id").primaryKey(),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  price: numeric("price", { precision: 12, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  effectiveFrom: timestamp("effective_from"),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  location: text("location"),
});

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).default("0"),
});

export const productBundleItems = pgTable("product_bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id").references(() => products.id),
  itemId: integer("item_id").references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
});

export const stockAdjustments = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  userId: varchar("user_id").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  fromWarehouseId: integer("from_warehouse_id").references(() => warehouses.id),
  toWarehouseId: integer("to_warehouse_id").references(() => warehouses.id),
  transferDate: timestamp("transfer_date"),
  status: varchar("status", { length: 50 }),
});

export const stockTransferItems = pgTable("stock_transfer_items", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").references(() => stockTransfers.id),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }),
});

export const productImei = pgTable("product_imei", {
  id: serial("id").primaryKey(),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  imei: varchar("imei", { length: 50 }).unique(),
  status: varchar("status", { length: 50 }).default("available"),
});

// =========================================
// 👥 CRM & Customers
// =========================================

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
});

// =========================================
// 🧾 POS & Sales
// =========================================

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: varchar("user_id").references(() => users.id),
  branchId: integer("branch_id").references(() => branches.id),
  registerId: integer("register_id").references(() => registers.id),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }),
  saleDate: timestamp("sale_date").defaultNow(),
  status: varchar("status", { length: 50 }),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  price: numeric("price", { precision: 12, scale: 2 }),
});

export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id),
  userId: varchar("user_id").references(() => users.id),
  reason: text("reason"),
  returnDate: timestamp("return_date"),
});

// =========================================
// 📥 Purchases & Suppliers
// =========================================

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  userId: varchar("user_id").references(() => users.id),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  purchaseDate: timestamp("purchase_date"),
  status: varchar("status", { length: 50 }),
});

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => purchases.id),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
});

export const supplierLedgers = pgTable("supplier_ledgers", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  type: varchar("type", { length: 20 }),
  reference: text("reference"),
  date: timestamp("date").defaultNow(),
});

export const customerLedgers = pgTable("customer_ledgers", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  type: varchar("type", { length: 20 }),
  reference: text("reference"),
  date: timestamp("date").defaultNow(),
});

// =========================================
// 💰 Payments & Accounting
// =========================================

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  type: varchar("type", { length: 50 }),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  paymentType: varchar("payment_type", { length: 50 }),
  reference: text("reference"),
  date: timestamp("date").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  type: varchar("type", { length: 20 }),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  reference: text("reference"),
  date: timestamp("date").defaultNow(),
});

// =========================================
// 💸 Expenses
// =========================================

export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  note: text("note"),
  expenseDate: timestamp("expense_date"),
  createdBy: varchar("created_by").references(() => users.id),
});

// =========================================
// ⚙️ Settings & Configuration
// =========================================

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique(),
  value: text("value"),
});

export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  filename: text("filename"),
  backupDate: timestamp("backup_date").defaultNow(),
});

// =========================================
// 🔔 Notifications
// =========================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  message: text("message"),
  type: varchar("type", { length: 50 }),
  status: varchar("status", { length: 50 }).default("unread"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========================================
// 👨‍💼 Human Resource (Optional)
// =========================================

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  position: varchar("position", { length: 100 }),
  joinDate: timestamp("join_date"),
});

export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  date: date("date"),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
});

export const salaries = pgTable("salaries", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  payDate: timestamp("pay_date"),
});

// =========================================
// Relations
// =========================================

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  sales: many(sales),
  activityLogs: many(activityLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  prices: many(productPrices),
  stock: many(stock),
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [sales.branchId],
    references: [branches.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  productVariant: one(productVariants, {
    fields: [saleItems.productVariantId],
    references: [productVariants.id],
  }),
}));

// =========================================
// Types
// =========================================

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductPrice = typeof productPrices.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Stock = typeof stock.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  password: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products);
export const insertSaleSchema = createInsertSchema(sales);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertSupplierSchema = createInsertSchema(suppliers);
export const insertPurchaseSchema = createInsertSchema(purchases);
export const insertEmployeeSchema = createInsertSchema(employees);
export const insertExpenseSchema = createInsertSchema(expenses);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
