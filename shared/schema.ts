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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
