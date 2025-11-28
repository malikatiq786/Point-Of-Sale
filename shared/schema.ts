
import { pgTable, serial, varchar, text, timestamp, integer, numeric, boolean, date, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// =========================================
// 🔐 Authentication & Access Control
// =========================================

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: { primaryKey: [table.roleId, table.permissionId] },
}));

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default('gen_random_uuid()'),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: text("password"),
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
  code: varchar("code", { length: 50 }),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).default('0'),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).default('0'),
  isActive: boolean("is_active").default(true),
});

// =========================================
// 📦 Product Management
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
  type: varchar("type", { length: 20 }),
  description: text("description"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  unitId: integer("unit_id").references(() => units.id),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).default('0'),
  stock: integer("stock").default(0),
  barcode: varchar("barcode", { length: 255 }),
  lowStockAlert: integer("low_stock_alert").default(0),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).default('0'),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).default('0'),
  wholesalePrice: numeric("wholesale_price", { precision: 10, scale: 2 }).default('0'),
  retailPrice: numeric("retail_price", { precision: 10, scale: 2 }).default('0'),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  variantName: varchar("variant_name", { length: 100 }),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).default('0'),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).default('0'),
  wholesalePrice: numeric("wholesale_price", { precision: 10, scale: 2 }).default('0'),
  retailPrice: numeric("retail_price", { precision: 10, scale: 2 }).default('0'),
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

export const productBundleItems = pgTable("product_bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id").references(() => products.id),
  itemId: integer("item_id").references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
});

export const productImei = pgTable("product_imei", {
  id: serial("id").primaryKey(),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  imei: varchar("imei", { length: 50 }).unique(),
  status: varchar("status", { length: 50 }).default('available'),
});

export const productPrices = pgTable("product_prices", {
  id: serial("id").primaryKey(),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  price: numeric("price", { precision: 12, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  effectiveFrom: timestamp("effective_from"),
});

// =========================================
// 🏪 Inventory & Warehouse Management
// =========================================

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  location: text("location"),
});

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).default('0'),
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

export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  productId: integer("product_id").notNull().references(() => products.id),
  branchId: integer("branch_id").references(() => branches.id),
  movementType: varchar("movement_type").notNull(),
  referenceId: integer("reference_id").notNull(),
  referenceType: varchar("reference_type").notNull(),
  quantityChange: varchar("quantity_change").notNull().default('0'),
  unitCost: varchar("unit_cost").notNull().default('0'),
  totalCost: varchar("total_cost").notNull().default('0'),
  movementDate: timestamp("movement_date").defaultNow(),
});

export const productWac = pgTable("product_wac", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  currentQuantity: numeric("current_quantity", { precision: 15, scale: 4 }).default('0'),
  totalValue: numeric("total_value", { precision: 15, scale: 4 }).default('0'),
  weightedAverageCost: numeric("weighted_average_cost", { precision: 15, scale: 4 }).default('0'),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wacHistory = pgTable("wac_history", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  productId: integer("product_id").notNull().references(() => products.id),
  branchId: integer("branch_id").references(() => branches.id),
  oldWac: varchar("old_wac").notNull().default('0'),
  newWac: varchar("new_wac").notNull().default('0'),
  movementType: varchar("movement_type").notNull(),
  movementId: integer("movement_id").notNull(),
  quantityChanged: varchar("quantity_changed").notNull().default('0'),
  pricePerUnit: varchar("price_per_unit").notNull().default('0'),
});

// =========================================
// 💰 Sales & POS
// =========================================

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
});

export const onlineCustomers = pgTable("online_customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }).notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const onlineCustomersLegacy = pgTable("onlineCustomers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }).notNull(),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  onlineCustomerId: integer("online_customer_id").notNull().references(() => onlineCustomers.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  orderType: varchar("order_type", { length: 20 }).default('sale'),
  tableNumber: varchar("table_number", { length: 20 }),
  kitchenStatus: varchar("kitchen_status", { length: 20 }).default('new'),
  specialInstructions: text("special_instructions"),
  estimatedTime: integer("estimated_time"),
  onlineCustomerId: integer("online_customer_id").references(() => onlineCustomers.id),
  orderSource: varchar("order_source", { length: 20 }).default('pos'),
  deliveryAddress: text("delivery_address"),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerName: varchar("customer_name", { length: 150 }),
  assignedRiderId: integer("assigned_rider_id"),
  deliveryStatus: varchar("delivery_status", { length: 50 }).default('pending'),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  price: numeric("price", { precision: 12, scale: 2 }),
});

export const deliveryRiders = pgTable("delivery_riders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 100 }),
  licenseNumber: varchar("license_number", { length: 50 }),
  vehicleType: varchar("vehicle_type", { length: 50 }),
  vehicleNumber: varchar("vehicle_number", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const riderAssignments = pgTable("rider_assignments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  riderId: integer("rider_id").notNull().references(() => deliveryRiders.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  status: varchar("status", { length: 50 }).default('assigned'),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
});

// =========================================
// 📥 Returns
// =========================================

export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id),
  userId: varchar("user_id").references(() => users.id),
  reason: text("reason"),
  returnDate: timestamp("return_date"),
  customerId: integer("customer_id"),
  status: varchar("status", { length: 20 }).default('pending'),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  customerName: varchar("customer_name", { length: 150 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const returnItems = pgTable("return_items", {
  id: serial("id").primaryKey(),
  returnId: integer("return_id").references(() => returns.id),
  productVariantId: integer("product_variant_id").references(() => productVariants.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  price: numeric("price", { precision: 12, scale: 2 }),
  returnType: varchar("return_type", { length: 20 }).default('refund'),
});

// =========================================
// 📥 Purchases & Suppliers
// =========================================

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  userId: varchar("user_id").references(() => users.id),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  orderDate: timestamp("order_date"),
  status: varchar("status", { length: 50 }),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  userId: varchar("user_id").references(() => users.id),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  purchaseDate: timestamp("purchase_date"),
  status: varchar("status", { length: 50 }),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id"),
  productId: integer("product_id").references(() => products.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
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
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

export const customerLedgers = pgTable("customer_ledgers", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  type: varchar("type", { length: 20 }),
  reference: text("reference"),
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

// =========================================
// 💰 Accounting & Financial
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

export const expenseVendors = pgTable("expense_vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
});

export const expenseBudgets = pgTable("expense_budgets", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  branchId: integer("branch_id").references(() => branches.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  period: varchar("period", { length: 50 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
});

export const expenseApprovals = pgTable("expense_approvals", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").references(() => expenses.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  status: varchar("status", { length: 50 }),
  approvedAt: timestamp("approved_at"),
  comments: text("comments"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  vendorId: integer("vendor_id").references(() => expenseVendors.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  note: text("note"),
  expenseDate: timestamp("expense_date"),
  createdBy: varchar("created_by").references(() => users.id),
});

// =========================================
// 👥 HR & Employees
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
// ⚙️ Settings & Configuration
// =========================================

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique(),
  value: text("value"),
});

export const backupFiles = pgTable("backup_files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  status: varchar("status", { length: 20 }).default('completed'), // 'completed', 'failed'
  description: text("description"),
});

export const taxes = pgTable("taxes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  taxNumber: varchar("tax_number", { length: 50 }),
  isEnabled: boolean("is_enabled").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 12, scale: 6 }).default('1.000000'),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  message: text("message"),
  type: varchar("type", { length: 50 }),
  status: varchar("status", { length: 50 }).default('unread'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  filename: text("filename"),
  backupDate: timestamp("backup_date").defaultNow(),
});

// =========================================
// 📊 Analytics & Tracking
// =========================================

export const cogsTracking = pgTable("cogs_tracking", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  salePrice: varchar("sale_price").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  saleDate: timestamp("sale_date").notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  saleItemId: integer("sale_item_id").notNull().references(() => saleItems.id, { onDelete: "cascade" }),
  quantitySold: varchar("quantity_sold").notNull(),
  wacAtSale: varchar("wac_at_sale").notNull(),
  totalCogs: varchar("total_cogs").notNull(),
  grossProfit: varchar("gross_profit").notNull(),
  profitMargin: varchar("profit_margin").notNull(),
});

// =========================================
// 🍽️ Restaurant Features
// =========================================

export const menuCategories = pgTable("menuCategories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// =========================================
// 🗄️ Session Management
// =========================================

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => ({
  expireIdx: index("IDX_session_expire").on(table.expire),
}));

// Relations can be added here if needed for Drizzle queries
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  sales: many(sales),
  purchases: many(purchases),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  unit: one(units, { fields: [products.unitId], references: [units.id] }),
  variants: many(productVariants),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true });
export const insertBackupFileSchema = createInsertSchema(backupFiles).omit({ id: true });
