# Universal POS System

## Overview

This is a comprehensive Point of Sale (POS) system built with modern web technologies. The application provides a full-featured business management solution including inventory management, customer relationship management, sales processing, and analytics. It's designed as a full-stack web application with a React frontend and Express.js backend, using PostgreSQL for data persistence.

## Recent Changes

**July 28, 2025 - EVENING UPDATE**
- ✓ **RESOLVED CRITICAL PRODUCT API ISSUE** - Fixed persistent "failed to execute http error" in product creation
- ✓ Corrected ES6 module imports in server routes (storage import from '../../storage' not 'default')
- ✓ Fixed database connection by importing db directly from server/db.ts in route handlers
- ✓ Product creation API now working: curl tests successful with 201 status responses
- ✓ Database operations confirmed working: direct SQL insert and API both functional
- ✓ Complete product creation flow validated:
  - Form data properly formatted and sent to /api/products POST endpoint
  - Database successfully inserts products with all fields (name, description, price, stock, categoryId, brandId, barcode, etc.)
  - API returns proper JSON response with created product details
- ✓ Categories and brands API endpoints confirmed functional for dropdown population
- ✓ Authentication middleware properly configured for development environment
- ✓ **RESOLVED REGISTER MANAGEMENT ISSUE** - Fixed register creation and listing functionality
- ✓ Updated API endpoints to match actual database schema (registers table has limited fields)
- ✓ Fixed branch-register relationships using correct branch IDs from database
- ✓ Register creation now properly saves to database and appears in list immediately
- ✓ Completed functional Business Setup modules: Business Profile, Branches, and Registers

**July 28, 2025**
- ✓ Fixed critical database authentication issue by making password field nullable for Replit Auth
- ✓ Implemented complete database schema with 43 tables covering all business operations
- ✓ Added comprehensive table structure including:
  - Authentication & Access Control (users, roles, permissions)
  - Business Setup & Multi-Branch (business_profiles, branches, registers)
  - Product & Inventory Management (products, variants, stock, warehouses)
  - POS & Sales (sales, sale_items, returns)
  - Purchases & Suppliers (purchases, suppliers, ledgers)
  - CRM & Customers (customers, customer_ledgers)
  - Payments & Accounting (accounts, payments, transactions)
  - Expenses Management (expenses, expense_categories)
  - Settings & Configuration (settings, backup_logs)
  - Notifications System (notifications)
  - Human Resources (employees, attendances, salaries)
- ✓ Updated Drizzle schema with all table definitions and relationships
- ✓ Successfully applied all schema changes to PostgreSQL database
- ✓ Created comprehensive UI modules for all major POS features:
  - Dashboard with real-time statistics and quick actions
  - POS Terminal for processing sales transactions
  - Products management with search and categorization
  - Categories for product organization
  - Stock management with inventory level monitoring
  - Customers relationship management
  - Suppliers management and tracking
  - Purchases order management
  - Sales history and transaction tracking
  - Expenses tracking and management
  - Employees HR management
  - Settings with comprehensive system configuration
- ✓ Updated application routing to support all new pages and modules
- ✓ Implemented consistent UI design with proper navigation and user experience
- ✓ Added sample data functionality with 5 categories, 5 brands, and 8 diverse products
- ✓ Enhanced POS terminal with real product data and dynamic pricing based on categories
- ✓ Successfully tested POS system with sample sale ($79.99 Nike Air Max transaction)
- ✓ Restructured client-side code to complete feature-based architecture with standardized folder structure:
  - `/features/auth/` - Authentication, login, logout, register (components, contexts, hooks, pages, services, validations)
  - `/features/dashboard/` - Dashboard widgets, statistics, graphs (components, contexts, hooks, pages, services, validations)
  - `/features/products/` - Product CRUD, pricing, stock management (components, contexts, hooks, pages, services, validations)
  - `/features/categories/` - Category and brand management (components, contexts, hooks, pages, services, validations)
  - `/features/sales/` - POS terminal, sales history, invoices (components, contexts, hooks, pages, services, validations)
  - `/features/purchases/` - Purchase orders, supplier orders (components, contexts, hooks, pages, services, validations)
  - `/features/customers/` - Customer management, ledgers (components, contexts, hooks, pages, services, validations)
  - `/features/suppliers/` - Supplier management, ledgers (components, contexts, hooks, pages, services, validations)
  - `/features/expenses/` - Expense tracking, categories (components, contexts, hooks, pages, services, validations)
  - `/features/accounting/` - Financial reports, ledgers, transactions (components, contexts, hooks, pages, services, validations)
  - `/features/hr/` - Employee management, attendance, salaries (components, contexts, hooks, pages, services, validations)
  - `/features/reports/` - Business reports, analytics (components, contexts, hooks, pages, services, validations)
  - `/features/settings/` - System configuration, user roles (components, contexts, hooks, pages, services, validations)
- ✓ Each feature module now has standardized folder structure: components/, contexts/, hooks/, pages/, services/, validations/, types.ts, index.ts
- ✓ Created comprehensive Zod validation schemas for all business forms and data validation
- ✓ Established service layer architecture for clean API communication patterns
- ✓ Implemented consistent TypeScript types and interfaces across all feature modules
- ✓ Implemented complete layout system with separate app and landing page layouts:
  - Created `/layouts/app/` - Application layout with header, sidebar, footer for authenticated users
  - Created `/layouts/landing/` - Landing page layout with marketing header and footer for public pages
  - Updated all feature pages to use AppLayout for consistent application structure
  - Cleaned up project structure by removing unnecessary files and folders
  - Added proper UI components (Badge, DropdownMenu) for layout functionality
- ✓ Completed server-side MVC architecture restructuring with proper src directory organization:
  - Created `/server/src/models/` - Database models and schema exports
  - Created `/server/src/controllers/` - Request handling logic (ProductController, SaleController, DashboardController, UserController)
  - Created `/server/src/services/` - Business logic layer (ProductService, SaleService, DashboardService, UserService)
  - Created `/server/src/repositories/` - Data access layer with BaseRepository and specific repositories (UserRepository)
  - Created `/server/src/constants/` - Application constants, HTTP status codes, error messages
  - Created `/server/src/types/` - TypeScript interfaces and type definitions
  - Created `/server/src/utils/` - Utility functions for pagination, validation, formatting
  - Created `/server/src/validators/` - Zod validation schemas for all endpoints
  - Created `/server/src/routes/` - Organized API route definitions using controllers
  - Created `/server/src/core/` and `/server/src/middleware/` - Core functionality exports
  - All MVC components properly organized in src directory following enterprise patterns
  - Updated all import paths to reference new src directory structure
  - Cleaned up unnecessary root-level folders, keeping only essential server files at root
- ✓ Implemented comprehensive user management system with 6 role types:
  - Super Admin (SaaS owner) - Full system control with all 50 permissions
  - Admin/Owner (business owner) - Full business access except role management
  - Manager (store manager) - Full branch operations, sales, inventory, reports
  - Cashier (POS operator) - Limited to POS operations, basic customer management
  - Accountant (financial) - Expenses, purchases, accounting, financial reports
  - Warehouse Staff (inventory) - Stock management, transfers, inventory reports
  - Created comprehensive permission system with 50 granular permissions across all modules
  - Seeded database with all roles, permissions, and role-permission mappings
  - Created first Super Admin user (Malik Atiq) for system initialization
  - Built complete UserController, UserService, and UserRepository following MVC pattern
  - Implemented user CRUD operations with role-based access control
  - Added Users page with modern UI showing user cards, role badges, and management actions
  - Integrated Users menu in sidebar navigation under SYSTEM section
  - Added comprehensive TypeScript types for user management across client and server
- ✓ Enhanced sidebar navigation to show all 23 modules for Super Admin users:
  - POINT OF SALE: POS Terminal, Sales History, Returns  
  - INVENTORY: Products, Categories, Stock Management, Stock Transfers, Stock Adjustments, Warehouses
  - BUSINESS: Customers, Suppliers, Purchases, Customer Ledgers, Supplier Ledgers
  - FINANCIAL: Payments, Expenses, Accounts, Transactions, Reports
  - HUMAN RESOURCES: Employees, Attendance, Payroll
  - BUSINESS SETUP: Business Profile, Branches, Registers
  - SYSTEM: Users, Roles & Permissions, Activity Logs, Notifications, Backups, Settings
- ✓ Implemented proper role-based visibility logic where Super Admin can access all system modules
- ✓ Fixed dashboard currency formatting issues for proper financial data display
- ✓ Created comprehensive user management navigation system:
  - Built dedicated UserNav component with tabbed navigation for user management modules
  - Created complete Roles & Permissions page with role management and permission visualization
  - Built Activity Logs page with user activity tracking, filtering, and search capabilities
  - Implemented Notifications page with system alerts, status management, and categorization
  - Added proper sidebar scrolling with max-height constraint for better UX
  - Integrated all user management pages with consistent navigation and UI design
- ✓ Enhanced App routing to support all new user management pages with proper imports
- ✓ Removed duplicate Settings module from sidebar bottom as it's already properly placed in SYSTEM section
- ✓ Comprehensive user and role system implementation:
  - Added 8 users total: 1 Super Admin, 1 Admin/Owner, 1 Manager, 2 Cashiers, 1 Accountant, 2 Warehouse Staff
  - Extended permissions to 75 total covering all system modules including new additions
  - Properly assigned role-based permissions: Super Admin (50), Admin/Owner (72), Manager (45), Cashier (9), Accountant (23), Warehouse Staff (18)
  - Updated user management pages to display all users with role statistics and proper badge colors
  - All permissions cover complete system modules: Business Setup, Extended Inventory, Financial Management, HR, System Administration, Reports & Analytics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and database layers:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular component architecture with shared UI components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with JSON responses
- **Middleware**: Custom logging, error handling, and authentication middleware
- **Development**: Hot reload with tsx for TypeScript execution

### Database Architecture
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with WebSocket support
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### Authentication System
- **Provider**: Replit OIDC authentication
- **Session Management**: Express sessions with PostgreSQL storage
- **Authorization**: Role-based access control with permissions
- **Security**: HTTP-only cookies with secure configuration

### POS Terminal
- **Product Search**: Real-time product search and selection
- **Cart Management**: Add/remove items with quantity adjustments
- **Payment Processing**: Multiple payment method support (cash, card, mobile)
- **Transaction Recording**: Complete sale recording with item details

### Inventory Management
- **Product Catalog**: Products with variants, categories, and brands
- **Stock Tracking**: Real-time inventory levels and low stock alerts
- **Price Management**: Multiple price points per product variant

### Customer Management
- **Customer Records**: Complete customer information storage
- **Purchase History**: Track customer transactions and preferences
- **Analytics**: Customer behavior and sales patterns

### Dashboard & Analytics
- **Real-time Stats**: Sales, inventory, and customer metrics
- **Activity Logging**: System-wide activity tracking
- **Performance Metrics**: Top products, sales trends, and KPIs

## Data Flow

### Authentication Flow
1. User initiates login through Replit OIDC
2. OIDC provider validates credentials and returns tokens
3. Backend creates/updates user session in PostgreSQL
4. Frontend receives authentication status and user data
5. Protected routes check authentication status via session

### Sales Transaction Flow
1. Cashier searches and selects products in POS terminal
2. Items added to shopping cart with quantities
3. Customer information optionally collected
4. Payment method selected and transaction initiated
5. Sale recorded in database with all item details
6. Inventory levels automatically updated
7. Activity logged for audit trail

### Data Synchronization
- Real-time updates using React Query's automatic refetching
- Optimistic updates for better user experience
- Error handling with automatic retry mechanisms
- Cache invalidation on mutations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection with serverless support
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **express**: Web application framework
- **react**: Frontend UI library

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Authentication Dependencies
- **openid-client**: OIDC authentication client
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR for frontend
- **Backend Development**: tsx with nodemon-like functionality
- **Database**: Development database with Drizzle push migrations
- **Environment Variables**: Local .env file configuration

### Production Build
- **Frontend**: Vite production build with code splitting and optimization
- **Backend**: esbuild compilation to ES modules
- **Static Assets**: Served through Express with fallback to SPA routing
- **Database**: Production PostgreSQL with proper connection pooling

### Deployment Architecture
- **Single Server**: Express serves both API and static frontend files
- **Database**: External PostgreSQL instance (Neon)
- **Session Storage**: PostgreSQL-backed sessions for scalability
- **Environment**: Production environment variables for security

The system is designed to be easily deployable on Replit with automatic provisioning of the PostgreSQL database and environment configuration. The monorepo structure keeps all components together while maintaining clear separation of concerns between frontend, backend, and shared code.