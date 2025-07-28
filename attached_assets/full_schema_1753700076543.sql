
-- =========================================
-- 🔐 Authentication & Access Control
-- =========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 🏢 Business Setup & Multi-Branch
-- =========================================

CREATE TABLE business_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    owner_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES business_profiles(id),
    name VARCHAR(150),
    address TEXT
);

CREATE TABLE registers (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    name VARCHAR(150),
    opened_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- =========================================
-- 📦 Product & Inventory Management
-- =========================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    short_name VARCHAR(10)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    category_id INTEGER REFERENCES categories(id),
    brand_id INTEGER REFERENCES brands(id),
    unit_id INTEGER REFERENCES units(id),
    description TEXT
);

CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    variant_name VARCHAR(100)
);

CREATE TABLE product_prices (
    id SERIAL PRIMARY KEY,
    product_variant_id INTEGER REFERENCES product_variants(id),
    price NUMERIC(12,2),
    cost_price NUMERIC(12,2),
    effective_from TIMESTAMP
);

CREATE TABLE product_attributes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE product_attribute_values (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    attribute_id INTEGER REFERENCES product_attributes(id),
    value TEXT
);

CREATE TABLE product_bundle_items (
    id SERIAL PRIMARY KEY,
    bundle_id INTEGER REFERENCES products(id),
    item_id INTEGER REFERENCES products(id),
    quantity NUMERIC(10,2)
);

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location TEXT
);

CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    product_variant_id INTEGER REFERENCES product_variants(id),
    warehouse_id INTEGER REFERENCES warehouses(id),
    quantity NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE stock_adjustments (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id),
    user_id INTEGER REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    from_warehouse_id INTEGER REFERENCES warehouses(id),
    to_warehouse_id INTEGER REFERENCES warehouses(id),
    transfer_date TIMESTAMP,
    status VARCHAR(50)
);

CREATE TABLE stock_transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER REFERENCES stock_transfers(id),
    product_variant_id INTEGER REFERENCES product_variants(id),
    quantity NUMERIC(12,2)
);

CREATE TABLE product_imei (
    id SERIAL PRIMARY KEY,
    product_variant_id INTEGER REFERENCES product_variants(id),
    imei VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'available'
);

-- =========================================
-- 🧾 POS & Sales
-- =========================================

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    user_id INTEGER REFERENCES users(id),
    branch_id INTEGER REFERENCES branches(id),
    register_id INTEGER REFERENCES registers(id),
    total_amount NUMERIC(12,2),
    paid_amount NUMERIC(12,2),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50)
);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    product_variant_id INTEGER REFERENCES product_variants(id),
    quantity NUMERIC(10,2),
    price NUMERIC(12,2)
);

CREATE TABLE returns (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    user_id INTEGER REFERENCES users(id),
    reason TEXT,
    return_date TIMESTAMP
);

-- =========================================
-- 📥 Purchases & Suppliers
-- =========================================

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT
);

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER REFERENCES users(id),
    total_amount NUMERIC(12,2),
    purchase_date TIMESTAMP,
    status VARCHAR(50)
);

CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id),
    product_variant_id INTEGER REFERENCES product_variants(id),
    quantity NUMERIC(10,2),
    cost_price NUMERIC(12,2)
);

CREATE TABLE supplier_ledgers (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    amount NUMERIC(12,2),
    type VARCHAR(20),
    reference TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 👥 CRM & Customers
-- =========================================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT
);

CREATE TABLE customer_ledgers (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    amount NUMERIC(12,2),
    type VARCHAR(20),
    reference TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 💰 Payments & Accounting
-- =========================================

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50)
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    amount NUMERIC(12,2),
    payment_type VARCHAR(50),
    reference TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    type VARCHAR(20),
    amount NUMERIC(12,2),
    reference TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 💸 Expenses
-- =========================================

CREATE TABLE expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES expense_categories(id),
    amount NUMERIC(12,2),
    note TEXT,
    expense_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- =========================================
-- ⚙️ Settings & Configuration
-- =========================================

CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE,
    value TEXT
);

CREATE TABLE backup_logs (
    id SERIAL PRIMARY KEY,
    filename TEXT,
    backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 🔔 Notifications
-- =========================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 👨‍💼 Human Resource (Optional)
-- =========================================

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    position VARCHAR(100),
    join_date TIMESTAMP
);

CREATE TABLE attendances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    date DATE,
    check_in TIMESTAMP,
    check_out TIMESTAMP
);

CREATE TABLE salaries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    amount NUMERIC(12,2),
    pay_date TIMESTAMP
);
