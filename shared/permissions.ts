export const PERMISSIONS = {
  // Dashboard
  DASHBOARD: {
    VIEW: 'dashboard.view',
    STATS: 'dashboard.stats',
    REPORTS: 'dashboard.reports',
  },

  // Products
  PRODUCTS: {
    VIEW: 'products.view',
    CREATE: 'products.create',
    EDIT: 'products.edit',
    DELETE: 'products.delete',
    MANAGE_STOCK: 'products.manage_stock',
  },

  // Categories
  CATEGORIES: {
    VIEW: 'categories.view',
    MANAGE: 'categories.manage',
  },

  // Brands
  BRANDS: {
    VIEW: 'brands.view',
    MANAGE: 'brands.manage',
  },

  // Units
  UNITS: {
    VIEW: 'units.view',
    MANAGE: 'units.manage',
  },

  // Customers
  CUSTOMERS: {
    VIEW: 'customers.view',
    CREATE: 'customers.create',
    EDIT: 'customers.edit',
    DELETE: 'customers.delete',
    VIEW_LEDGER: 'customers.view_ledger',
  },

  // Sales
  SALES: {
    VIEW: 'sales.view',
    CREATE: 'sales.create',
    EDIT: 'sales.edit',
    DELETE: 'sales.delete',
    REFUND: 'sales.refund',
    APPLY_DISCOUNT: 'sales.apply_discount',
  },

  // Purchases
  PURCHASES: {
    VIEW: 'purchases.view',
    CREATE: 'purchases.create',
    EDIT: 'purchases.edit',
    DELETE: 'purchases.delete',
    APPROVE: 'purchases.approve',
  },

  // Suppliers
  SUPPLIERS: {
    VIEW: 'suppliers.view',
    CREATE: 'suppliers.create',
    EDIT: 'suppliers.edit',
    DELETE: 'suppliers.delete',
    VIEW_LEDGER: 'suppliers.view_ledger',
  },

  // Inventory
  INVENTORY: {
    MANAGE_STOCK_TRANSFERS: 'inventory.manage_stock_transfers',
    MANAGE_STOCK_ADJUSTMENTS: 'inventory.manage_stock_adjustments',
    MANAGE_WAREHOUSES: 'inventory.manage_warehouses',
  },

  // Returns
  RETURNS: {
    VIEW: 'returns.view',
    CREATE: 'returns.create',
    PROCESS: 'returns.process',
  },

  // Expenses
  EXPENSES: {
    VIEW: 'expenses.view',
    CREATE: 'expenses.create',
    EDIT: 'expenses.edit',
    DELETE: 'expenses.delete',
    APPROVE: 'expenses.approve',
  },

  // Accounting
  ACCOUNTING: {
    VIEW: 'accounting.view',
    MANAGE_ACCOUNTS: 'accounting.manage_accounts',
    VIEW_LEDGERS: 'accounting.view_ledgers',
    MANAGE_PAYMENTS: 'accounting.manage_payments',
    VIEW_REPORTS: 'accounting.view_reports',
  },

  // Financial
  FINANCIAL: {
    MANAGE_ACCOUNTS: 'financial.manage_accounts',
    MANAGE_TRANSACTIONS: 'financial.manage_transactions',
    VIEW_LEDGERS: 'financial.view_ledgers',
  },

  // Reports
  REPORTS: {
    VIEW_SALES: 'reports.view_sales',
    VIEW_PURCHASES: 'reports.view_purchases',
    VIEW_INVENTORY: 'reports.view_inventory',
    VIEW_FINANCIAL: 'reports.view_financial',
    EXPORT: 'reports.export',
  },

  // Business Setup
  BUSINESS_SETUP: {
    MANAGE_PROFILE: 'business_setup.manage_profile',
    MANAGE_BRANCHES: 'business_setup.manage_branches',
    MANAGE_REGISTERS: 'business_setup.manage_registers',
  },

  // User Management
  USERS: {
    VIEW: 'users.view',
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DELETE: 'users.delete',
    MANAGE_ROLES: 'users.manage_roles',
    MANAGE_PERMISSIONS: 'users.manage_permissions',
  },

  // Settings
  SETTINGS: {
    VIEW: 'settings.view',
    EDIT: 'settings.edit',
    MANAGE_TAXES: 'settings.manage_taxes',
    MANAGE_CURRENCIES: 'settings.manage_currencies',
  },

  // HR
  HR: {
    MANAGE_EMPLOYEES: 'hr.manage_employees',
    MANAGE_ATTENDANCE: 'hr.manage_attendance',
    MANAGE_PAYROLL: 'hr.manage_payroll',
  },

  // POS
  POS: {
    ACCESS: 'pos.access',
    HOLD_SALES: 'pos.hold_sales',
    VOID_ITEMS: 'pos.void_items',
  },

  // Kitchen
  KITCHEN: {
    ACCESS: 'kitchen.access',
    UPDATE_STATUS: 'kitchen.update_status',
  },
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];

export const MODULES = {
  DASHBOARD: 'dashboard',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  UNITS: 'units',
  CUSTOMERS: 'customers',
  SALES: 'sales',
  PURCHASES: 'purchases',
  SUPPLIERS: 'suppliers',
  INVENTORY: 'inventory',
  RETURNS: 'returns',
  EXPENSES: 'expenses',
  ACCOUNTING: 'accounting',
  FINANCIAL: 'financial',
  REPORTS: 'reports',
  BUSINESS_SETUP: 'business_setup',
  USERS: 'users',
  SETTINGS: 'settings',
  HR: 'hr',
  POS: 'pos',
  KITCHEN: 'kitchen',
} as const;
