# Feature-Based Architecture

This directory contains the feature-based organization of our Universal POS System client-side code. Each feature is self-contained with its own components, types, and business logic.

## Structure

Each feature module follows a consistent folder structure with these subfolders:

- **components/**: Reusable UI components specific to the feature
- **contexts/**: React contexts for state management within the feature
- **hooks/**: Custom React hooks for the feature's business logic
- **pages/**: Main page components that represent routes
- **services/**: API service functions for backend communication
- **validations/**: Zod schemas for form validation and type safety
- **types.ts**: TypeScript interfaces and types for the feature
- **index.ts**: Main export file for clean imports

```
features/
├── auth/               # Authentication & authorization
│   ├── components/     # Login/register forms, auth guards
│   ├── contexts/       # AuthContext for user state
│   ├── hooks/          # useAuth, useLogin hooks
│   ├── pages/          # Login, register, forgot password pages
│   ├── services/       # Authentication API calls
│   ├── validations/    # Login/register form validation
│   ├── types.ts        # AuthUser, LoginCredentials, RegisterData
│   └── index.ts        # Feature exports
├── dashboard/          # Main dashboard & widgets
│   ├── components/     # Stats cards, charts, widgets
│   ├── contexts/       # Dashboard state context
│   ├── hooks/          # Dashboard data hooks
│   ├── pages/          # Main dashboard page
│   ├── services/       # Dashboard API services
│   ├── validations/    # Quick sale form validation
│   └── index.ts        # Feature exports
├── products/           # Product management
│   ├── components/     # Product cards, forms, search
│   ├── contexts/       # Product context for state
│   ├── hooks/          # Product CRUD hooks
│   ├── pages/          # Products listing, stock management
│   ├── services/       # Product API services
│   ├── validations/    # Product form validation
│   ├── types.ts        # Product, ProductVariant, ProductPrice, StockItem
│   └── index.ts        # Feature exports
├── categories/         # Categories & brands
│   ├── components/     # Category forms, tree view
│   ├── contexts/       # Category state management
│   ├── hooks/          # Category CRUD hooks
│   ├── pages/          # Category management page
│   ├── services/       # Category API services
│   ├── validations/    # Category form validation
│   ├── types.ts        # Category, Brand
│   └── index.ts        # Feature exports
├── sales/              # Sales & POS operations
│   ├── components/     # Cart, payment forms, receipt
│   ├── contexts/       # Cart context, sales state
│   ├── hooks/          # Sales processing hooks
│   ├── pages/          # POS terminal, sales history
│   ├── services/       # Sales API services
│   ├── validations/    # Sale form validation
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