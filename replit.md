# Universal POS System

## Overview

This is a comprehensive Point of Sale (POS) system built with modern web technologies. The application provides a full-featured business management solution including inventory management, customer relationship management, sales processing, and analytics. It's designed as a full-stack web application with a React frontend and Express.js backend, using PostgreSQL for data persistence.

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