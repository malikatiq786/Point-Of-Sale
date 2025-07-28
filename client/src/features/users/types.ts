// User Management Types
export interface User {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  roleId?: number;
  role?: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: number;
  password?: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

export interface UserWithRole extends User {
  role: Role;
}

// Role Permission Assignment
export interface RolePermissionAssignment {
  roleId: number;
  permissionIds: number[];
}

// User Role Change
export interface UserRoleChange {
  userId: string;
  newRoleId: number;
}

// Activity Log for user actions
export interface UserActivity {
  id: number;
  userId: string;
  action: string;
  ipAddress?: string;
  createdAt: Date;
  user?: User;
}

// Predefined system roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_OWNER: 'Admin / Owner',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  ACCOUNTANT: 'Accountant',
  WAREHOUSE_STAFF: 'Warehouse Staff',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  DASHBOARD: 'Dashboard',
  USERS: 'User Management',
  PRODUCTS: 'Product Management',
  SALES: 'Sales & POS',
  PURCHASES: 'Purchases',
  CUSTOMERS: 'Customer Management',
  ACCOUNTING: 'Accounting',
  WAREHOUSE: 'Warehouse',
  SETTINGS: 'Settings',
  REPORTS: 'Reports',
} as const;