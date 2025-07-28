# Feature-Based Architecture

This directory contains the feature-based organization of our Universal POS System client-side code. Each feature is self-contained with its own components, types, and business logic.

## Structure

```
features/
├── auth/               # Authentication & authorization
│   ├── types.ts        # AuthUser, LoginCredentials, RegisterData
│   └── index.ts        # Feature exports
├── dashboard/          # Main dashboard & widgets
│   ├── dashboard.tsx   # Main dashboard page
│   ├── dashboard-stats.tsx # Statistics widgets
│   ├── types.ts        # Dashboard-specific types
│   └── index.ts        # Feature exports
├── products/           # Product management
│   ├── products.tsx    # Product listing & management
│   ├── stock.tsx       # Inventory management
│   ├── types.ts        # Product, ProductVariant, ProductPrice, StockItem
│   └── index.ts        # Feature exports
├── categories/         # Categories & brands
│   ├── categories.tsx  # Category management
│   ├── types.ts        # Category, Brand
│   └── index.ts        # Feature exports
├── sales/              # Sales & POS operations
│   ├── pos-terminal.tsx # Point of Sale terminal
│   ├── sales.tsx       # Sales history & management
│   ├── types.ts        # Sale, SaleItem, CartItem, PaymentMethod
│   └── index.ts        # Feature exports
├── purchases/          # Purchase management
│   ├── purchases.tsx   # Purchase orders
│   ├── types.ts        # Purchase, PurchaseItem
│   └── index.ts        # Feature exports
├── customers/          # Customer relationship management
│   ├── customers.tsx   # Customer management
│   ├── types.ts        # Customer, CustomerLedger
│   └── index.ts        # Feature exports
├── suppliers/          # Supplier management
│   ├── suppliers.tsx   # Supplier management
│   ├── types.ts        # Supplier, SupplierLedger
│   └── index.ts        # Feature exports
├── expenses/           # Expense tracking
│   ├── expenses.tsx    # Expense management
│   ├── types.ts        # Expense, ExpenseCategory
│   └── index.ts        # Feature exports
├── accounting/         # Financial management
│   ├── types.ts        # Account, Transaction, Payment
│   └── index.ts        # Feature exports
├── hr/                 # Human resources
│   ├── employees.tsx   # Employee management
│   ├── types.ts        # Employee, Attendance, Salary
│   └── index.ts        # Feature exports
├── reports/            # Business analytics & reports
│   ├── types.ts        # SalesReport, InventoryReport, FinancialReport
│   └── index.ts        # Feature exports
└── settings/           # System configuration
    ├── settings.tsx    # Settings management
    ├── types.ts        # BusinessProfile, SystemSetting, UserRole
    └── index.ts        # Feature exports
```

## Benefits

1. **Modularity**: Each feature is self-contained and can be developed independently
2. **Scalability**: Easy to add new features without affecting existing code
3. **Maintainability**: Clear separation of concerns makes code easier to maintain
4. **Type Safety**: Feature-specific types are co-located with related components
5. **Import Clarity**: Clean import paths using index files

## Usage

Import components and types from features:

```typescript
// Import entire feature
import Dashboard from '@/features/dashboard';

// Import specific components
import { POSTerminal, Sales } from '@/features/sales';

// Import types
import { Product, StockItem } from '@/features/products';
```

## Standards

- Each feature must have an `index.ts` file for clean exports
- Types should be defined in `types.ts` within each feature
- Components should follow the naming convention: `feature-name.tsx`
- All exports should be properly typed and documented