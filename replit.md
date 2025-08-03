# Universal POS System

## Overview

This is a comprehensive Point of Sale (POS) system designed to be a full-featured business management solution. It includes inventory management, customer relationship management, sales processing, and analytics capabilities. The project's vision is to provide a robust, modern, and user-friendly web application for various business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application employs a modern full-stack architecture with distinct frontend, backend, and database layers, emphasizing modularity and scalability.

### UI/UX Decisions
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS combined with shadcn/ui for accessible and modular UI components.
- **Layouts**: Comprehensive layout system with `AppLayout` for authenticated users and `LandingLayout` for public pages, ensuring consistent navigation and user experience.
- **Component Structure**: Modular, feature-based architecture with standardized folder structures for components, contexts, hooks, pages, services, and validations.

### Technical Implementations
- **Frontend**: Utilizes TanStack Query for server state management and Wouter for client-side routing.
- **Backend**: Built with Node.js and Express.js, using TypeScript and ES modules. It features RESTful API design, custom middleware for logging, error handling, and authentication.
- **Database**: PostgreSQL is used for data persistence, managed by Drizzle ORM for type-safe operations. Drizzle Kit handles schema migrations.
- **Authentication**: Integrates Replit OIDC authentication with Express sessions stored in PostgreSQL. It implements a robust role-based access control (RBAC) system with 75 granular permissions and 6 role types (Super Admin, Admin/Owner, Manager, Cashier, Accountant, Warehouse Staff).
- **Core Modules**:
    - **POS Terminal**: Features real-time product search, cart management, multiple payment methods, and detailed transaction recording.
    - **Inventory Management**: Comprehensive product catalog with variants, categories, brands, real-time stock tracking, and price management.
    - **Customer Management**: Stores customer information, tracks purchase history, and provides basic analytics.
    - **Dashboard & Analytics**: Displays real-time statistics, activity logs, and key performance metrics.
    - **HR Modules**: Employees, Attendance, and Payroll with full CRUD operations and backend integration.
    - **Financial Modules**: Payments, Accounts, Transactions, Expenses, and comprehensive financial reporting.
    - **Business Setup**: Modules for Business Profile, Branches, and Registers, including mandatory register opening balance validation for POS terminals.
    - **Stock Management**: Capabilities for Stock Transfers and Stock Adjustments.

### System Design Choices
- **Data Flow**: Authentication flows are handled via Replit OIDC, leading to session creation in PostgreSQL. Sales transactions involve product selection, cart management, payment processing, and automatic inventory updates. Data synchronization uses React Query for real-time updates and optimistic UI.
- **Server Architecture**: Follows an MVC pattern with clear separation into models, controllers, services, repositories, constants, types, utils, validators, and routes within a `/server/src` directory.
- **Data Validation**: Comprehensive Zod validation schemas are used for all forms and API endpoints.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: For PostgreSQL database connectivity, specifically with serverless environments.
- `drizzle-orm`: The chosen ORM for interacting with the PostgreSQL database in a type-safe manner.
- `@tanstack/react-query`: Used for managing server state and data fetching in the React frontend.
- `express`: The web application framework for the Node.js backend.
- `react`: The primary library for building the user interface.

### UI Dependencies
- `@radix-ui/*`: A collection of unstyled, accessible UI components.
- `tailwindcss`: A utility-first CSS framework for rapid UI development.
- `lucide-react`: An icon library used across the application.
- `class-variance-authority`: For managing component variants and conditional styling.

### Authentication Dependencies
- `openid-client`: An OpenID Connect client for handling authentication flows.
- `passport`: Middleware for authentication in Node.js.
- `express-session`: Middleware for managing user sessions.
- `connect-pg-simple`: A PostgreSQL-backed session store for `express-session`.