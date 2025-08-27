--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    name character varying(100),
    type character varying(50)
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id character varying,
    action text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id integer NOT NULL,
    employee_id integer,
    date date,
    check_in timestamp without time zone,
    check_out timestamp without time zone
);


--
-- Name: attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;


--
-- Name: backup_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_logs (
    id integer NOT NULL,
    filename text,
    backup_date timestamp without time zone DEFAULT now()
);


--
-- Name: backup_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.backup_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: backup_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.backup_logs_id_seq OWNED BY public.backup_logs.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    business_id integer,
    name character varying(150),
    address text
);


--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100)
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: business_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_profiles (
    id integer NOT NULL,
    name character varying(150),
    owner_name character varying(150),
    email character varying(150),
    phone character varying(20),
    address text
);


--
-- Name: business_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.business_profiles_id_seq OWNED BY public.business_profiles.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    online_customer_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100),
    parent_id integer
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: cogs_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cogs_tracking (
    id integer NOT NULL,
    sale_item_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity_sold numeric(15,4) NOT NULL,
    wac_at_sale numeric(15,4) NOT NULL,
    total_cogs numeric(15,4) NOT NULL,
    sale_price numeric(15,4) NOT NULL,
    gross_profit numeric(15,4) NOT NULL,
    profit_margin numeric(5,2) NOT NULL,
    sale_date timestamp without time zone NOT NULL,
    branch_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cogs_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cogs_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cogs_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cogs_tracking_id_seq OWNED BY public.cogs_tracking.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(10) NOT NULL,
    exchange_rate numeric(15,6) DEFAULT 1.000000 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- Name: customer_ledgers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_ledgers (
    id integer NOT NULL,
    customer_id integer,
    amount numeric(12,2),
    type character varying(20),
    reference text,
    date timestamp without time zone DEFAULT now()
);


--
-- Name: customer_ledgers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_ledgers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_ledgers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_ledgers_id_seq OWNED BY public.customer_ledgers.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(150),
    phone character varying(20),
    email character varying(100),
    address text
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: delivery_riders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_riders (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(100),
    license_number character varying(50),
    vehicle_type character varying(50),
    vehicle_number character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: delivery_riders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.delivery_riders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: delivery_riders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.delivery_riders_id_seq OWNED BY public.delivery_riders.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(150),
    phone character varying(20),
    email character varying(100),
    "position" character varying(100),
    join_date timestamp without time zone
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: expense_approval_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_approval_workflows (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    min_amount numeric(12,2) DEFAULT '0'::numeric,
    max_amount numeric(12,2),
    required_approvers integer DEFAULT 1,
    approver_role_ids integer[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_approval_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_approval_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_approval_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_approval_workflows_id_seq OWNED BY public.expense_approval_workflows.id;


--
-- Name: expense_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_approvals (
    id integer NOT NULL,
    expense_id integer NOT NULL,
    workflow_id integer,
    approver_id character varying NOT NULL,
    status character varying(20) NOT NULL,
    comments text,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_approvals_id_seq OWNED BY public.expense_approvals.id;


--
-- Name: expense_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_audit_logs (
    id integer NOT NULL,
    expense_id integer,
    user_id character varying NOT NULL,
    action character varying(50) NOT NULL,
    field_changed character varying(100),
    old_value text,
    new_value text,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_audit_logs_id_seq OWNED BY public.expense_audit_logs.id;


--
-- Name: expense_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_budgets (
    id integer NOT NULL,
    category_id integer,
    branch_id integer,
    budget_amount numeric(12,2) NOT NULL,
    period character varying(20) NOT NULL,
    year integer NOT NULL,
    month integer,
    quarter integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_budgets_id_seq OWNED BY public.expense_budgets.id;


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id integer,
    is_active boolean DEFAULT true,
    color character varying(7),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- Name: expense_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_notifications (
    id integer NOT NULL,
    expense_id integer,
    user_id character varying NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_notifications_id_seq OWNED BY public.expense_notifications.id;


--
-- Name: expense_vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_vendors (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150),
    phone character varying(20),
    address text,
    tax_id character varying(50),
    payment_terms character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expense_vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_vendors_id_seq OWNED BY public.expense_vendors.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    expense_number character varying(50),
    category_id integer,
    subcategory_id integer,
    vendor_id integer,
    branch_id integer,
    amount numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT '0'::numeric,
    total_amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    exchange_rate numeric(10,6) DEFAULT '1'::numeric,
    description text,
    notes text,
    receipt_number character varying(100),
    payment_method character varying(50) NOT NULL,
    payment_reference character varying(100),
    expense_date timestamp without time zone NOT NULL,
    due_date timestamp without time zone,
    paid_date timestamp without time zone,
    status character varying(20) DEFAULT 'pending'::character varying,
    approval_status character varying(20) DEFAULT 'pending'::character varying,
    is_recurring boolean DEFAULT false,
    recurring_pattern character varying(50),
    recurring_end_date timestamp without time zone,
    next_recurring_date timestamp without time zone,
    parent_expense_id integer,
    is_petty_cash boolean DEFAULT false,
    project_id integer,
    cost_center character varying(100),
    tax_type character varying(50),
    tax_rate numeric(5,2) DEFAULT '0'::numeric,
    is_reimbursable boolean DEFAULT false,
    reimbursed_amount numeric(12,2) DEFAULT '0'::numeric,
    attachment_urls text[],
    created_by character varying NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id integer NOT NULL,
    product_id integer NOT NULL,
    branch_id integer,
    warehouse_id integer,
    movement_type character varying(30) NOT NULL,
    quantity numeric(15,4) NOT NULL,
    unit_cost numeric(15,4) NOT NULL,
    total_cost numeric(15,4) NOT NULL,
    running_quantity numeric(15,4) DEFAULT '0'::numeric,
    running_value numeric(15,4) DEFAULT '0'::numeric,
    wac_after_movement numeric(15,4) DEFAULT '0'::numeric,
    reference_type character varying(30),
    reference_id integer,
    notes text,
    created_by character varying,
    movement_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: inventory_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_movements_id_seq OWNED BY public.inventory_movements.id;


--
-- Name: menuCategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."menuCategories" (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "isActive" boolean DEFAULT true,
    "sortOrder" integer DEFAULT 0,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now()
);


--
-- Name: menuCategories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."menuCategories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menuCategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."menuCategories_id_seq" OWNED BY public."menuCategories".id;


--
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: menu_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menu_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menu_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_categories_id_seq OWNED BY public.menu_categories.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying,
    message text,
    type character varying(50),
    status character varying(50) DEFAULT 'unread'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: onlineCustomers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."onlineCustomers" (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    password character varying(255) NOT NULL,
    address text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now()
);


--
-- Name: onlineCustomers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."onlineCustomers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: onlineCustomers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."onlineCustomers_id_seq" OWNED BY public."onlineCustomers".id;


--
-- Name: online_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.online_customers (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    password text NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: online_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.online_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: online_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.online_customers_id_seq OWNED BY public.online_customers.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    account_id integer,
    amount numeric(12,2),
    payment_type character varying(50),
    reference text,
    date timestamp without time zone DEFAULT now()
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: petty_cash_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.petty_cash_accounts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    branch_id integer,
    initial_amount numeric(12,2) NOT NULL,
    current_balance numeric(12,2) NOT NULL,
    custodian_id character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: petty_cash_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.petty_cash_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: petty_cash_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.petty_cash_accounts_id_seq OWNED BY public.petty_cash_accounts.id;


--
-- Name: product_attribute_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_attribute_values (
    id integer NOT NULL,
    product_id integer,
    attribute_id integer,
    value text
);


--
-- Name: product_attribute_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_attribute_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_attribute_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_attribute_values_id_seq OWNED BY public.product_attribute_values.id;


--
-- Name: product_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_attributes (
    id integer NOT NULL,
    name character varying(100)
);


--
-- Name: product_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_attributes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_attributes_id_seq OWNED BY public.product_attributes.id;


--
-- Name: product_bundle_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_bundle_items (
    id integer NOT NULL,
    bundle_id integer,
    item_id integer,
    quantity numeric(10,2)
);


--
-- Name: product_bundle_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_bundle_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_bundle_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_bundle_items_id_seq OWNED BY public.product_bundle_items.id;


--
-- Name: product_imei; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_imei (
    id integer NOT NULL,
    product_variant_id integer,
    imei character varying(50),
    status character varying(50) DEFAULT 'available'::character varying
);


--
-- Name: product_imei_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_imei_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_imei_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_imei_id_seq OWNED BY public.product_imei.id;


--
-- Name: product_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_prices (
    id integer NOT NULL,
    product_variant_id integer,
    price numeric(12,2),
    cost_price numeric(12,2),
    effective_from timestamp without time zone
);


--
-- Name: product_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_prices_id_seq OWNED BY public.product_prices.id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer,
    variant_name character varying(100),
    purchase_price numeric(10,2) DEFAULT '0'::numeric,
    sale_price numeric(10,2) DEFAULT '0'::numeric,
    wholesale_price numeric(10,2) DEFAULT '0'::numeric,
    retail_price numeric(10,2) DEFAULT '0'::numeric
);


--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- Name: product_wac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_wac (
    id integer NOT NULL,
    product_id integer NOT NULL,
    branch_id integer,
    warehouse_id integer,
    current_quantity numeric(15,4) DEFAULT '0'::numeric,
    total_value numeric(15,4) DEFAULT '0'::numeric,
    weighted_average_cost numeric(15,4) DEFAULT '0'::numeric,
    last_calculated_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: product_wac_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_wac_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_wac_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_wac_id_seq OWNED BY public.product_wac.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(150),
    category_id integer,
    brand_id integer,
    unit_id integer,
    description text,
    barcode character varying(255),
    price numeric(10,2) DEFAULT '0'::numeric,
    purchase_price numeric(10,2) DEFAULT '0'::numeric,
    sale_price numeric(10,2) DEFAULT '0'::numeric,
    wholesale_price numeric(10,2) DEFAULT '0'::numeric,
    retail_price numeric(10,2) DEFAULT '0'::numeric,
    stock integer DEFAULT 0,
    low_stock_alert integer DEFAULT 0,
    image text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_items (
    id integer NOT NULL,
    purchase_id integer,
    product_variant_id integer,
    quantity numeric(10,2),
    cost_price numeric(12,2)
);


--
-- Name: purchase_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_items_id_seq OWNED BY public.purchase_items.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_variant_id integer,
    ordered_quantity numeric(15,4) NOT NULL,
    received_quantity numeric(15,4) DEFAULT '0'::numeric,
    unit_cost numeric(15,4) NOT NULL,
    total_cost numeric(15,4) NOT NULL,
    discount_percent numeric(5,2) DEFAULT '0'::numeric,
    discount_amount numeric(15,4) DEFAULT '0'::numeric,
    tax_percent numeric(5,2) DEFAULT '0'::numeric,
    tax_amount numeric(15,4) DEFAULT '0'::numeric,
    line_total numeric(15,4) NOT NULL,
    notes text
);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    purchase_order_number character varying(50) NOT NULL,
    supplier_id integer,
    branch_id integer,
    warehouse_id integer,
    total_amount numeric(15,2) DEFAULT '0'::numeric,
    tax_amount numeric(15,2) DEFAULT '0'::numeric,
    discount_amount numeric(15,2) DEFAULT '0'::numeric,
    shipping_cost numeric(15,2) DEFAULT '0'::numeric,
    grand_total numeric(15,2) DEFAULT '0'::numeric,
    currency character varying(3) DEFAULT 'USD'::character varying,
    exchange_rate numeric(10,6) DEFAULT '1'::numeric,
    status character varying(30) DEFAULT 'draft'::character varying,
    order_date timestamp without time zone DEFAULT now(),
    expected_delivery_date timestamp without time zone,
    received_date timestamp without time zone,
    notes text,
    created_by character varying,
    received_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    supplier_id integer,
    user_id character varying,
    total_amount numeric(12,2),
    purchase_date timestamp without time zone,
    status character varying(50)
);


--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: registers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registers (
    id integer NOT NULL,
    branch_id integer,
    name character varying(150),
    code character varying(50),
    opening_balance numeric(12,2) DEFAULT '0'::numeric,
    current_balance numeric(12,2) DEFAULT '0'::numeric,
    is_active boolean DEFAULT true,
    opened_at timestamp without time zone,
    closed_at timestamp without time zone
);


--
-- Name: registers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registers_id_seq OWNED BY public.registers.id;


--
-- Name: return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_items (
    id integer NOT NULL,
    return_id integer,
    product_variant_id integer,
    quantity numeric(10,2),
    price numeric(12,2),
    return_type character varying(20) DEFAULT 'refund'::character varying
);


--
-- Name: return_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.return_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: return_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.return_items_id_seq OWNED BY public.return_items.id;


--
-- Name: returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.returns (
    id integer NOT NULL,
    sale_id integer,
    user_id character varying,
    customer_id integer,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying,
    total_amount numeric(12,2),
    customer_name character varying(150),
    return_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: returns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.returns_id_seq OWNED BY public.returns.id;


--
-- Name: rider_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rider_assignments (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    rider_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    assigned_by character varying,
    status character varying(50) DEFAULT 'assigned'::character varying,
    picked_up_at timestamp without time zone,
    delivered_at timestamp without time zone,
    notes text
);


--
-- Name: rider_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rider_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rider_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rider_assignments_id_seq OWNED BY public.rider_assignments.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: salaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salaries (
    id integer NOT NULL,
    employee_id integer,
    amount numeric(12,2),
    pay_date timestamp without time zone
);


--
-- Name: salaries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salaries_id_seq OWNED BY public.salaries.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer,
    product_variant_id integer,
    quantity numeric(10,2),
    price numeric(12,2)
);


--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    customer_id integer,
    online_customer_id integer,
    user_id character varying,
    branch_id integer,
    register_id integer,
    total_amount numeric(12,2),
    paid_amount numeric(12,2),
    sale_date timestamp without time zone DEFAULT now(),
    status character varying(50),
    order_type character varying(20) DEFAULT 'sale'::character varying,
    order_source character varying(20) DEFAULT 'pos'::character varying,
    table_number character varying(20),
    kitchen_status character varying(20) DEFAULT 'new'::character varying,
    special_instructions text,
    estimated_time integer,
    delivery_address text,
    customer_phone character varying(20),
    customer_name character varying(150),
    assigned_rider_id integer,
    delivery_status character varying(50) DEFAULT 'pending'::character varying
);


--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text
);


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock (
    id integer NOT NULL,
    product_variant_id integer,
    warehouse_id integer,
    quantity numeric(12,2) DEFAULT '0'::numeric
);


--
-- Name: stock_adjustment_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_adjustment_items (
    id integer NOT NULL,
    adjustment_id integer NOT NULL,
    product_id integer NOT NULL,
    adjustment_type character varying(20) NOT NULL,
    quantity_before numeric(15,4) NOT NULL,
    quantity_after numeric(15,4) NOT NULL,
    adjustment_quantity numeric(15,4) NOT NULL,
    unit_cost numeric(15,4),
    total_cost_impact numeric(15,4) DEFAULT '0'::numeric,
    wac_before numeric(15,4),
    wac_after numeric(15,4),
    reason text,
    notes text
);


--
-- Name: stock_adjustment_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_adjustment_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_adjustment_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_adjustment_items_id_seq OWNED BY public.stock_adjustment_items.id;


--
-- Name: stock_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_adjustments (
    id integer NOT NULL,
    warehouse_id integer,
    user_id character varying,
    reason text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_adjustments_id_seq OWNED BY public.stock_adjustments.id;


--
-- Name: stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_id_seq OWNED BY public.stock.id;


--
-- Name: stock_transfer_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfer_items (
    id integer NOT NULL,
    transfer_id integer,
    product_variant_id integer,
    quantity numeric(12,2)
);


--
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_transfer_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_transfer_items_id_seq OWNED BY public.stock_transfer_items.id;


--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfers (
    id integer NOT NULL,
    from_warehouse_id integer,
    to_warehouse_id integer,
    transfer_date timestamp without time zone,
    status character varying(50)
);


--
-- Name: stock_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_transfers_id_seq OWNED BY public.stock_transfers.id;


--
-- Name: supplier_ledgers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_ledgers (
    id integer NOT NULL,
    supplier_id integer,
    amount numeric(12,2),
    type character varying(20),
    reference text,
    date timestamp without time zone DEFAULT now()
);


--
-- Name: supplier_ledgers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_ledgers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_ledgers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_ledgers_id_seq OWNED BY public.supplier_ledgers.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(150),
    phone character varying(20),
    email character varying(100),
    address text
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    account_id integer,
    type character varying(20),
    amount numeric(12,2),
    reference text,
    date timestamp without time zone DEFAULT now()
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id integer NOT NULL,
    name character varying(50),
    short_name character varying(10),
    type character varying(20),
    description text
);


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100),
    email character varying(150) NOT NULL,
    password text,
    role_id integer,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: wac_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wac_history (
    id integer NOT NULL,
    product_id integer NOT NULL,
    branch_id integer,
    warehouse_id integer,
    previous_wac numeric(15,4),
    new_wac numeric(15,4) NOT NULL,
    previous_quantity numeric(15,4),
    new_quantity numeric(15,4) NOT NULL,
    previous_total_value numeric(15,4),
    new_total_value numeric(15,4) NOT NULL,
    trigger_type character varying(30) NOT NULL,
    trigger_reference_id integer,
    calculation_details jsonb,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: wac_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wac_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wac_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wac_history_id_seq OWNED BY public.wac_history.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(100),
    location text
);


--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: attendances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq'::regclass);


--
-- Name: backup_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_logs ALTER COLUMN id SET DEFAULT nextval('public.backup_logs_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: business_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profiles ALTER COLUMN id SET DEFAULT nextval('public.business_profiles_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: cogs_tracking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cogs_tracking ALTER COLUMN id SET DEFAULT nextval('public.cogs_tracking_id_seq'::regclass);


--
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- Name: customer_ledgers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_ledgers ALTER COLUMN id SET DEFAULT nextval('public.customer_ledgers_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: delivery_riders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_riders ALTER COLUMN id SET DEFAULT nextval('public.delivery_riders_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: expense_approval_workflows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_approval_workflows ALTER COLUMN id SET DEFAULT nextval('public.expense_approval_workflows_id_seq'::regclass);


--
-- Name: expense_approvals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_approvals ALTER COLUMN id SET DEFAULT nextval('public.expense_approvals_id_seq'::regclass);


--
-- Name: expense_audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.expense_audit_logs_id_seq'::regclass);


--
-- Name: expense_budgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_budgets ALTER COLUMN id SET DEFAULT nextval('public.expense_budgets_id_seq'::regclass);


--
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- Name: expense_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_notifications ALTER COLUMN id SET DEFAULT nextval('public.expense_notifications_id_seq'::regclass);


--
-- Name: expense_vendors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_vendors ALTER COLUMN id SET DEFAULT nextval('public.expense_vendors_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: inventory_movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements ALTER COLUMN id SET DEFAULT nextval('public.inventory_movements_id_seq'::regclass);


--
-- Name: menuCategories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."menuCategories" ALTER COLUMN id SET DEFAULT nextval('public."menuCategories_id_seq"'::regclass);


--
-- Name: menu_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories ALTER COLUMN id SET DEFAULT nextval('public.menu_categories_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: onlineCustomers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."onlineCustomers" ALTER COLUMN id SET DEFAULT nextval('public."onlineCustomers_id_seq"'::regclass);


--
-- Name: online_customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_customers ALTER COLUMN id SET DEFAULT nextval('public.online_customers_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: petty_cash_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_accounts ALTER COLUMN id SET DEFAULT nextval('public.petty_cash_accounts_id_seq'::regclass);


--
-- Name: product_attribute_values id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values ALTER COLUMN id SET DEFAULT nextval('public.product_attribute_values_id_seq'::regclass);


--
-- Name: product_attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attributes ALTER COLUMN id SET DEFAULT nextval('public.product_attributes_id_seq'::regclass);


--
-- Name: product_bundle_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bundle_items ALTER COLUMN id SET DEFAULT nextval('public.product_bundle_items_id_seq'::regclass);


--
-- Name: product_imei id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_imei ALTER COLUMN id SET DEFAULT nextval('public.product_imei_id_seq'::regclass);


--
-- Name: product_prices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices ALTER COLUMN id SET DEFAULT nextval('public.product_prices_id_seq'::regclass);


--
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- Name: product_wac id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac ALTER COLUMN id SET DEFAULT nextval('public.product_wac_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_items_id_seq'::regclass);


--
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: registers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registers ALTER COLUMN id SET DEFAULT nextval('public.registers_id_seq'::regclass);


--
-- Name: return_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items ALTER COLUMN id SET DEFAULT nextval('public.return_items_id_seq'::regclass);


--
-- Name: returns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns ALTER COLUMN id SET DEFAULT nextval('public.returns_id_seq'::regclass);


--
-- Name: rider_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments ALTER COLUMN id SET DEFAULT nextval('public.rider_assignments_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: salaries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries ALTER COLUMN id SET DEFAULT nextval('public.salaries_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: stock id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock ALTER COLUMN id SET DEFAULT nextval('public.stock_id_seq'::regclass);


--
-- Name: stock_adjustment_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustment_items ALTER COLUMN id SET DEFAULT nextval('public.stock_adjustment_items_id_seq'::regclass);


--
-- Name: stock_adjustments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments ALTER COLUMN id SET DEFAULT nextval('public.stock_adjustments_id_seq'::regclass);


--
-- Name: stock_transfer_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items ALTER COLUMN id SET DEFAULT nextval('public.stock_transfer_items_id_seq'::regclass);


--
-- Name: stock_transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers ALTER COLUMN id SET DEFAULT nextval('public.stock_transfers_id_seq'::regclass);


--
-- Name: supplier_ledgers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_ledgers ALTER COLUMN id SET DEFAULT nextval('public.supplier_ledgers_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: wac_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wac_history ALTER COLUMN id SET DEFAULT nextval('public.wac_history_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, name, type) FROM stdin;
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, user_id, action, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendances (id, employee_id, date, check_in, check_out) FROM stdin;
\.


--
-- Data for Name: backup_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_logs (id, filename, backup_date) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, business_id, name, address) FROM stdin;
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brands (id, name) FROM stdin;
\.


--
-- Data for Name: business_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_profiles (id, name, owner_name, email, phone, address) FROM stdin;
1	My Business Store	\N	\N	\N	123 Main Street
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, online_customer_id, product_id, quantity, price, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, parent_id) FROM stdin;
2	Books & Media	\N
3	Food & Beverages	\N
4	Clothing	\N
5	Home & Garden	\N
7	Food & Beverages	\N
6	Electronics	\N
8	Clothing	\N
9	Home & Garden	\N
10	Books & Media	\N
11	POLO	\N
12	Main Courses	\N
13	Appetizers	\N
14	Desserts	\N
15	Hot Beverages	\N
16	Cold Beverages	\N
17	Pizza	\N
18	Burgers	\N
19	Salads	\N
21	COVER	\N
22	GLASS	\N
23	SCREEN	\N
24	COVER	\N
25	GLASS	\N
1	Electronicsaa	\N
30	Phone	\N
\.


--
-- Data for Name: cogs_tracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cogs_tracking (id, sale_item_id, product_id, quantity_sold, wac_at_sale, total_cogs, sale_price, gross_profit, profit_margin, sale_date, branch_id, created_at) FROM stdin;
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currencies (id, code, name, symbol, exchange_rate, is_active, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_ledgers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_ledgers (id, customer_id, amount, type, reference, date) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, phone, email, address) FROM stdin;
1	John Smith	+1-555-0101	john.smith@email.com	123 Main St, City, State 12345
2	Sarah Johnson	+1-555-0102	sarah.j@email.com	456 Oak Ave, City, State 12346
3	Mike Wilson	+1-555-0103	mike.wilson@email.com	789 Pine Rd, City, State 12347
4	John Smith	+1-555-0101	john.smith@email.com	123 Main St, City, State 12345
5	Mike Wilson	+1-555-0103	mike.wilson@email.com	789 Pine Rd, City, State 12347
6	Sarah Johnson	+1-555-0102	sarah.j@email.com	456 Oak Ave, City, State 12346
\.


--
-- Data for Name: delivery_riders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_riders (id, name, phone, email, license_number, vehicle_type, vehicle_number, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, name, phone, email, "position", join_date) FROM stdin;
\.


--
-- Data for Name: expense_approval_workflows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_approval_workflows (id, name, description, min_amount, max_amount, required_approvers, approver_role_ids, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expense_approvals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_approvals (id, expense_id, workflow_id, approver_id, status, comments, approved_at, created_at) FROM stdin;
\.


--
-- Data for Name: expense_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_audit_logs (id, expense_id, user_id, action, field_changed, old_value, new_value, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: expense_budgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_budgets (id, category_id, branch_id, budget_amount, period, year, month, quarter, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_categories (id, name, description, parent_id, is_active, color, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expense_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_notifications (id, expense_id, user_id, type, title, message, is_read, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: expense_vendors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_vendors (id, name, email, phone, address, tax_id, payment_terms, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, expense_number, category_id, subcategory_id, vendor_id, branch_id, amount, tax_amount, total_amount, currency, exchange_rate, description, notes, receipt_number, payment_method, payment_reference, expense_date, due_date, paid_date, status, approval_status, is_recurring, recurring_pattern, recurring_end_date, next_recurring_date, parent_expense_id, is_petty_cash, project_id, cost_center, tax_type, tax_rate, is_reimbursable, reimbursed_amount, attachment_urls, created_by, approved_by, approved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_movements (id, product_id, branch_id, warehouse_id, movement_type, quantity, unit_cost, total_cost, running_quantity, running_value, wac_after_movement, reference_type, reference_id, notes, created_by, movement_date, created_at) FROM stdin;
\.


--
-- Data for Name: menuCategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."menuCategories" (id, name, description, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_categories (id, name, description, is_active, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, message, type, status, created_at) FROM stdin;
\.


--
-- Data for Name: onlineCustomers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."onlineCustomers" (id, name, email, phone, password, address, "createdAt", "updatedAt") FROM stdin;
1	Sarah Johnson	sarah@example.com	+1-555-0199	password123	456 Oak Avenue, Downtown	2025-08-04 03:40:43.880396	2025-08-04 03:40:43.880396
2	Mike Davis	mike@example.com	+1-555-0188	password123	789 Pine Street, Uptown	2025-08-04 03:40:43.880396	2025-08-04 03:40:43.880396
3	Emily Chen	emily@example.com	+1-555-0177	password123	321 Maple Drive, Central City	2025-08-04 03:40:43.880396	2025-08-04 03:40:43.880396
\.


--
-- Data for Name: online_customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.online_customers (id, name, email, phone, password, address, created_at, updated_at) FROM stdin;
1	Sarah Wilson	sarah@example.com	+1-555-9876	password123	456 Oak Street, Springfield	2025-08-04 04:02:43.558161	2025-08-04 04:02:43.558161
2	John Customer	john@customer.com	+1-555-1234	password123	123 Main Street, Springfield	2025-08-04 04:02:43.558161	2025-08-04 04:02:43.558161
3	Emma Thompson	emma@example.com	+1-555-5678	password123	789 Pine Avenue, Springfield	2025-08-04 04:02:43.558161	2025-08-04 04:02:43.558161
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, account_id, amount, payment_type, reference, date) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name) FROM stdin;
1	dashboard.view
2	dashboard.stats
3	dashboard.reports
4	users.view
5	users.create
6	users.edit
7	users.delete
8	users.manage_roles
9	products.view
10	products.create
11	products.edit
12	products.delete
13	products.manage_stock
14	products.view_cost_price
15	sales.view
16	sales.create
17	sales.edit
18	sales.delete
19	sales.process_pos
20	sales.view_reports
21	purchases.view
22	purchases.create
23	purchases.edit
24	purchases.delete
25	purchases.manage_suppliers
26	customers.view
27	customers.create
28	customers.edit
29	customers.delete
30	customers.view_ledger
31	accounting.view
32	accounting.manage_accounts
33	accounting.view_ledgers
34	accounting.manage_payments
35	accounting.view_reports
36	warehouse.view
37	warehouse.manage_stock
38	warehouse.stock_transfers
39	warehouse.stock_adjustments
40	warehouse.view_inventory
41	settings.view
42	settings.edit
43	settings.manage_business
44	settings.manage_branches
45	settings.system_config
46	reports.view
47	reports.sales
48	reports.inventory
49	reports.financial
50	reports.export
51	business_setup.manage_profile
52	business_setup.manage_branches
53	business_setup.manage_registers
54	inventory.manage_stock_transfers
55	inventory.manage_stock_adjustments
56	inventory.manage_warehouses
57	financial.manage_accounts
58	financial.manage_transactions
59	financial.view_ledgers
60	hr.manage_employees
61	hr.manage_attendance
62	hr.manage_payroll
63	system.manage_roles
64	system.view_activity_logs
65	system.manage_notifications
66	system.manage_backups
67	system.advanced_settings
68	sales.manage_returns
69	sales.access_history
70	purchases.manage_orders
71	purchases.supplier_relations
72	reports.sales_analytics
73	reports.inventory_reports
74	reports.financial_reports
75	reports.employee_reports
\.


--
-- Data for Name: petty_cash_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.petty_cash_accounts (id, name, branch_id, initial_amount, current_balance, custodian_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_attribute_values; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_attribute_values (id, product_id, attribute_id, value) FROM stdin;
\.


--
-- Data for Name: product_attributes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_attributes (id, name) FROM stdin;
1	Color
2	Size
3	Material
4	Brand
5	Model
6	Weight
7	Dimensions
\.


--
-- Data for Name: product_bundle_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_bundle_items (id, bundle_id, item_id, quantity) FROM stdin;
\.


--
-- Data for Name: product_imei; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_imei (id, product_variant_id, imei, status) FROM stdin;
\.


--
-- Data for Name: product_prices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_prices (id, product_variant_id, price, cost_price, effective_from) FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_variants (id, product_id, variant_name, purchase_price, sale_price, wholesale_price, retail_price) FROM stdin;
\.


--
-- Data for Name: product_wac; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_wac (id, product_id, branch_id, warehouse_id, current_quantity, total_value, weighted_average_cost, last_calculated_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, category_id, brand_id, unit_id, description, barcode, price, purchase_price, sale_price, wholesale_price, retail_price, stock, low_stock_alert, image, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_items (id, purchase_id, product_variant_id, quantity, cost_price) FROM stdin;
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, product_variant_id, ordered_quantity, received_quantity, unit_cost, total_cost, discount_percent, discount_amount, tax_percent, tax_amount, line_total, notes) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, purchase_order_number, supplier_id, branch_id, warehouse_id, total_amount, tax_amount, discount_amount, shipping_cost, grand_total, currency, exchange_rate, status, order_date, expected_delivery_date, received_date, notes, created_by, received_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, supplier_id, user_id, total_amount, purchase_date, status) FROM stdin;
\.


--
-- Data for Name: registers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registers (id, branch_id, name, code, opening_balance, current_balance, is_active, opened_at, closed_at) FROM stdin;
\.


--
-- Data for Name: return_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.return_items (id, return_id, product_variant_id, quantity, price, return_type) FROM stdin;
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.returns (id, sale_id, user_id, customer_id, reason, status, total_amount, customer_name, return_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rider_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rider_assignments (id, sale_id, rider_id, assigned_at, assigned_by, status, picked_up_at, delivered_at, notes) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name) FROM stdin;
1	Super Admin
2	Admin / Owner
3	Manager
4	Cashier
5	Accountant
6	Warehouse Staff
7	Kitchen Staff
\.


--
-- Data for Name: salaries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salaries (id, employee_id, amount, pay_date) FROM stdin;
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_items (id, sale_id, product_variant_id, quantity, price) FROM stdin;
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales (id, customer_id, online_customer_id, user_id, branch_id, register_id, total_amount, paid_amount, sale_date, status, order_type, order_source, table_number, kitchen_status, special_instructions, estimated_time, delivery_address, customer_phone, customer_name, assigned_rider_id, delivery_status) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
5tSabQR-g7bhgRV5vZnW0YKD2CiWvgmk	{"user": {"id": "41128350", "name": "Malik Atiq", "role": "Super Admin", "email": "malikatiq@gmail.com", "roleId": 1, "lastName": "Atiq", "password": null, "createdAt": "2025-07-28T08:22:57.596Z", "firstName": "Malik", "updatedAt": "2025-07-28T08:22:57.596Z", "profileImageUrl": null}, "cookie": {"path": "/", "secure": false, "expires": "2025-09-02T05:00:13.105Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-09-02 17:59:38
Ml0tS3DFP-MAtxyc-DVsOjYt1GW2KJ-_	{"user": {"id": "41128350", "name": "Malik Atiq", "role": "Super Admin", "email": "malikatiq@gmail.com", "roleId": 1, "lastName": "Atiq", "password": null, "createdAt": "2025-07-28T08:22:57.596Z", "firstName": "Malik", "updatedAt": "2025-07-28T08:22:57.596Z", "profileImageUrl": null}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-31T21:04:29.700Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-09-02 08:22:51
cQErzwkCl2ugaLCdek_Vvjl3xX3w8_zG	{"user": {"id": "41128350", "name": "Malik Atiq", "role": "Super Admin", "email": "malikatiq@gmail.com", "roleId": 1, "lastName": "Atiq", "password": null, "createdAt": "2025-07-28T08:22:57.596Z", "firstName": "Malik", "updatedAt": "2025-07-28T08:22:57.596Z", "profileImageUrl": null}, "cookie": {"path": "/", "secure": false, "expires": "2025-09-01T04:31:23.786Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-09-02 07:46:20
vT3fdpSs2J0y_n_jcDQqDGk4-EZuy1tR	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-03T04:48:55.228Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "41128350"}}	2025-09-03 04:49:13
xOpiCPU75LFj9zsp5uuxujL1HSVCDnm8	{"cookie": {"path": "/", "secure": false, "expires": "2025-09-03T04:47:31.946Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "41128350"}}	2025-09-03 04:47:49
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, key, value) FROM stdin;
1	online_ordering_enabled	true
2	system_currency	1
\.


--
-- Data for Name: stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock (id, product_variant_id, warehouse_id, quantity) FROM stdin;
\.


--
-- Data for Name: stock_adjustment_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_adjustment_items (id, adjustment_id, product_id, adjustment_type, quantity_before, quantity_after, adjustment_quantity, unit_cost, total_cost_impact, wac_before, wac_after, reason, notes) FROM stdin;
\.


--
-- Data for Name: stock_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_adjustments (id, warehouse_id, user_id, reason, created_at) FROM stdin;
\.


--
-- Data for Name: stock_transfer_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_transfer_items (id, transfer_id, product_variant_id, quantity) FROM stdin;
\.


--
-- Data for Name: stock_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_transfers (id, from_warehouse_id, to_warehouse_id, transfer_date, status) FROM stdin;
\.


--
-- Data for Name: supplier_ledgers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_ledgers (id, supplier_id, amount, type, reference, date) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, phone, email, address) FROM stdin;
1	TechWorld Supplies	+1-555-0123	contact@techworld.com	123 Tech Street, Silicon Valley, CA 94000
2	Global Electronics Inc	+1-555-0456	orders@globalelectronics.com	456 Electronics Ave, Austin, TX 78701
3	Premium Books Distribution	+1-555-0789	sales@premiumbooks.com	789 Library Lane, New York, NY 10001
4	Fashion Forward Wholesale	+1-555-0321	wholesale@fashionforward.com	321 Fashion Blvd, Los Angeles, CA 90210
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, account_id, type, amount, reference, date) FROM stdin;
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.units (id, name, short_name, type, description) FROM stdin;
2	Kilograms	kg	\N	\N
3	Liters	L	\N	\N
6	Each	ea	\N	\N
7	Pounds	lbs	\N	\N
8	Bottles	btl	\N	\N
9	Test Manual	TM	\N	\N
10	Updated API Test Unit	UATU	\N	\N
12	Test Unit Full	TUF	weight	Test unit with all fields
13	Final Test Unit	FTU	volume	Testing complete functionality
14	Complete Test Unit	CTU	count	Final verification unit with all fields working
5	Boxes	box	count	\N
1	Pieces	pcs	count	\N
11	Meter	m	length	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role_id, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
user_admin_001	Sarah Johnson	sarah.johnson@company.com	\N	2	\N	\N	\N	2025-07-28 10:26:39.164341	2025-07-28 10:26:39.164341
user_manager_001	Mike Wilson	mike.wilson@company.com	\N	3	\N	\N	\N	2025-07-28 10:26:39.164341	2025-07-28 10:26:39.164341
user_cashier_001	Emma Davis	emma.davis@company.com	\N	4	\N	\N	\N	2025-07-28 10:26:39.164341	2025-07-28 10:26:39.164341
user_cashier_002	James Smith	james.smith@company.com	\N	4	\N	\N	\N	2025-07-28 10:26:39.164341	2025-07-28 10:26:39.164341
user_accountant_001	Lisa Brown	lisa.brown@company.com	\N	5	\N	\N	\N	2025-07-28 10:26:39.164341	2025-07-28 10:26:39.164341
user_warehouse_001	David Miller	david.miller@company.com	\N	6	\N	\N	\N	2025-07-28 10:26:39.164341	2025-07-28 10:26:39.164341
user_warehouse_002	Anna Garcia	anna.garcia@company.com	\N	6	\N	\N	\N	2025-07-28 10:26:39.164341	2025-07-28 10:26:39.164341
33a29cf1-afd8-47b6-8083-6861f6a6acd8	Kitchen User	kitchen@company.com	\N	7	\N	\N	\N	2025-08-03 19:58:33.894712	2025-08-03 19:58:33.894712
41128350	Malik Atiq	malikatiq@gmail.com	$2b$10$sFZ2LNrZfq8KtEg1T8ixIO4E/pNBzDXRjIth/nmv.UALkaDtwtJ.O	1	Malik	Atiq	\N	2025-07-28 08:22:57.596736	2025-07-28 08:22:57.596736
\.


--
-- Data for Name: wac_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wac_history (id, product_id, branch_id, warehouse_id, previous_wac, new_wac, previous_quantity, new_quantity, previous_total_value, new_total_value, trigger_type, trigger_reference_id, calculation_details, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouses (id, name, location) FROM stdin;
1	Main Warehouse	123 Main St, City Center
2	Secondary Warehouse	456 Second Ave, Industrial District
3	Mobile Storage	789 Third Blvd, Mobile Unit
5	North Warehouse	North Side Storage Facility
6	South Warehouse	South Side Distribution Center
7	West Warehouse	West Side Storage Hub
8	Malik	rwerwe
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 1, false);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 5, true);


--
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendances_id_seq', 1, false);


--
-- Name: backup_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.backup_logs_id_seq', 1, false);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branches_id_seq', 4, true);


--
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brands_id_seq', 35, true);


--
-- Name: business_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.business_profiles_id_seq', 1, true);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 9, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 32, true);


--
-- Name: cogs_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cogs_tracking_id_seq', 1, false);


--
-- Name: currencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.currencies_id_seq', 1, false);


--
-- Name: customer_ledgers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_ledgers_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 10, true);


--
-- Name: delivery_riders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.delivery_riders_id_seq', 1, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 1, false);


--
-- Name: expense_approval_workflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_approval_workflows_id_seq', 1, false);


--
-- Name: expense_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_approvals_id_seq', 1, false);


--
-- Name: expense_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_audit_logs_id_seq', 1, false);


--
-- Name: expense_budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_budgets_id_seq', 1, false);


--
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 1, false);


--
-- Name: expense_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_notifications_id_seq', 1, false);


--
-- Name: expense_vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expense_vendors_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: inventory_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_movements_id_seq', 1, false);


--
-- Name: menuCategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."menuCategories_id_seq"', 1, false);


--
-- Name: menu_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menu_categories_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: onlineCustomers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."onlineCustomers_id_seq"', 3, true);


--
-- Name: online_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.online_customers_id_seq', 3, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 75, true);


--
-- Name: petty_cash_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.petty_cash_accounts_id_seq', 1, false);


--
-- Name: product_attribute_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_attribute_values_id_seq', 1, false);


--
-- Name: product_attributes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_attributes_id_seq', 7, true);


--
-- Name: product_bundle_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_bundle_items_id_seq', 1, false);


--
-- Name: product_imei_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_imei_id_seq', 1, false);


--
-- Name: product_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_prices_id_seq', 1, false);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 51, true);


--
-- Name: product_wac_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_wac_id_seq', 11, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 106, true);


--
-- Name: purchase_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_items_id_seq', 32, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 1, false);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchases_id_seq', 29, true);


--
-- Name: registers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.registers_id_seq', 16, true);


--
-- Name: return_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.return_items_id_seq', 6, true);


--
-- Name: returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.returns_id_seq', 8, true);


--
-- Name: rider_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rider_assignments_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 7, true);


--
-- Name: salaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salaries_id_seq', 1, false);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 53, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_id_seq', 56, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.settings_id_seq', 18, true);


--
-- Name: stock_adjustment_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_adjustment_items_id_seq', 1, false);


--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_adjustments_id_seq', 35, true);


--
-- Name: stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_id_seq', 123, true);


--
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_transfer_items_id_seq', 3, true);


--
-- Name: stock_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_transfers_id_seq', 3, true);


--
-- Name: supplier_ledgers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_ledgers_id_seq', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 9, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.units_id_seq', 15, true);


--
-- Name: wac_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wac_history_id_seq', 1, false);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 8, true);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: backup_logs backup_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_logs
    ADD CONSTRAINT backup_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: brands brands_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_unique UNIQUE (name);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: business_profiles business_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: cogs_tracking cogs_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cogs_tracking
    ADD CONSTRAINT cogs_tracking_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_code_key UNIQUE (code);


--
-- Name: currencies currencies_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_code_unique UNIQUE (code);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: customer_ledgers customer_ledgers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_ledgers
    ADD CONSTRAINT customer_ledgers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_riders delivery_riders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_riders
    ADD CONSTRAINT delivery_riders_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expense_approval_workflows expense_approval_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_approval_workflows
    ADD CONSTRAINT expense_approval_workflows_pkey PRIMARY KEY (id);


--
-- Name: expense_approvals expense_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_approvals
    ADD CONSTRAINT expense_approvals_pkey PRIMARY KEY (id);


--
-- Name: expense_audit_logs expense_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit_logs
    ADD CONSTRAINT expense_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: expense_budgets expense_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_budgets
    ADD CONSTRAINT expense_budgets_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expense_notifications expense_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_notifications
    ADD CONSTRAINT expense_notifications_pkey PRIMARY KEY (id);


--
-- Name: expense_vendors expense_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_vendors
    ADD CONSTRAINT expense_vendors_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_expense_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_expense_number_unique UNIQUE (expense_number);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: menuCategories menuCategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."menuCategories"
    ADD CONSTRAINT "menuCategories_pkey" PRIMARY KEY (id);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onlineCustomers onlineCustomers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."onlineCustomers"
    ADD CONSTRAINT "onlineCustomers_email_key" UNIQUE (email);


--
-- Name: onlineCustomers onlineCustomers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."onlineCustomers"
    ADD CONSTRAINT "onlineCustomers_pkey" PRIMARY KEY (id);


--
-- Name: online_customers online_customers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_customers
    ADD CONSTRAINT online_customers_email_key UNIQUE (email);


--
-- Name: online_customers online_customers_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_customers
    ADD CONSTRAINT online_customers_email_unique UNIQUE (email);


--
-- Name: online_customers online_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.online_customers
    ADD CONSTRAINT online_customers_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_unique UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: petty_cash_accounts petty_cash_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_accounts
    ADD CONSTRAINT petty_cash_accounts_pkey PRIMARY KEY (id);


--
-- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id);


--
-- Name: product_attributes product_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attributes
    ADD CONSTRAINT product_attributes_pkey PRIMARY KEY (id);


--
-- Name: product_bundle_items product_bundle_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_pkey PRIMARY KEY (id);


--
-- Name: product_imei product_imei_imei_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_imei
    ADD CONSTRAINT product_imei_imei_unique UNIQUE (imei);


--
-- Name: product_imei product_imei_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_imei
    ADD CONSTRAINT product_imei_pkey PRIMARY KEY (id);


--
-- Name: product_prices product_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_wac product_wac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_purchase_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_purchase_order_number_unique UNIQUE (purchase_order_number);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: registers registers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registers
    ADD CONSTRAINT registers_pkey PRIMARY KEY (id);


--
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: rider_assignments rider_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: salaries salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: settings settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_unique UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: stock_adjustment_items stock_adjustment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustment_items
    ADD CONSTRAINT stock_adjustment_items_pkey PRIMARY KEY (id);


--
-- Name: stock_adjustments stock_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_pkey PRIMARY KEY (id);


--
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (id);


--
-- Name: stock_transfer_items stock_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- Name: supplier_ledgers supplier_ledgers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_ledgers
    ADD CONSTRAINT supplier_ledgers_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wac_history wac_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wac_history
    ADD CONSTRAINT wac_history_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: activity_logs activity_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: attendances attendances_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: branches branches_business_id_business_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_business_id_business_profiles_id_fk FOREIGN KEY (business_id) REFERENCES public.business_profiles(id);


--
-- Name: cart_items cart_items_online_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_online_customer_id_fkey FOREIGN KEY (online_customer_id) REFERENCES public.online_customers(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_online_customer_id_online_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_online_customer_id_online_customers_id_fk FOREIGN KEY (online_customer_id) REFERENCES public.online_customers(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cogs_tracking cogs_tracking_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cogs_tracking
    ADD CONSTRAINT cogs_tracking_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: cogs_tracking cogs_tracking_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cogs_tracking
    ADD CONSTRAINT cogs_tracking_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: cogs_tracking cogs_tracking_sale_item_id_sale_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cogs_tracking
    ADD CONSTRAINT cogs_tracking_sale_item_id_sale_items_id_fk FOREIGN KEY (sale_item_id) REFERENCES public.sale_items(id) ON DELETE CASCADE;


--
-- Name: customer_ledgers customer_ledgers_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_ledgers
    ADD CONSTRAINT customer_ledgers_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: expense_approvals expense_approvals_approver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_approvals
    ADD CONSTRAINT expense_approvals_approver_id_users_id_fk FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: expense_approvals expense_approvals_expense_id_expenses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_approvals
    ADD CONSTRAINT expense_approvals_expense_id_expenses_id_fk FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: expense_approvals expense_approvals_workflow_id_expense_approval_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_approvals
    ADD CONSTRAINT expense_approvals_workflow_id_expense_approval_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.expense_approval_workflows(id);


--
-- Name: expense_audit_logs expense_audit_logs_expense_id_expenses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit_logs
    ADD CONSTRAINT expense_audit_logs_expense_id_expenses_id_fk FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: expense_audit_logs expense_audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_audit_logs
    ADD CONSTRAINT expense_audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expense_budgets expense_budgets_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_budgets
    ADD CONSTRAINT expense_budgets_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: expense_budgets expense_budgets_category_id_expense_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_budgets
    ADD CONSTRAINT expense_budgets_category_id_expense_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- Name: expense_notifications expense_notifications_expense_id_expenses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_notifications
    ADD CONSTRAINT expense_notifications_expense_id_expenses_id_fk FOREIGN KEY (expense_id) REFERENCES public.expenses(id);


--
-- Name: expense_notifications expense_notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_notifications
    ADD CONSTRAINT expense_notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: expenses expenses_category_id_expense_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_expense_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- Name: expenses expenses_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_subcategory_id_expense_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_subcategory_id_expense_categories_id_fk FOREIGN KEY (subcategory_id) REFERENCES public.expense_categories(id);


--
-- Name: expenses expenses_vendor_id_expense_vendors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_vendor_id_expense_vendors_id_fk FOREIGN KEY (vendor_id) REFERENCES public.expense_vendors(id);


--
-- Name: inventory_movements inventory_movements_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: inventory_movements inventory_movements_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: inventory_movements inventory_movements_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payments payments_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: petty_cash_accounts petty_cash_accounts_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_accounts
    ADD CONSTRAINT petty_cash_accounts_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: petty_cash_accounts petty_cash_accounts_custodian_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.petty_cash_accounts
    ADD CONSTRAINT petty_cash_accounts_custodian_id_users_id_fk FOREIGN KEY (custodian_id) REFERENCES public.users(id);


--
-- Name: product_attribute_values product_attribute_values_attribute_id_product_attributes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_attribute_id_product_attributes_id_fk FOREIGN KEY (attribute_id) REFERENCES public.product_attributes(id);


--
-- Name: product_attribute_values product_attribute_values_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_bundle_items product_bundle_items_bundle_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_bundle_id_products_id_fk FOREIGN KEY (bundle_id) REFERENCES public.products(id);


--
-- Name: product_bundle_items product_bundle_items_item_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_item_id_products_id_fk FOREIGN KEY (item_id) REFERENCES public.products(id);


--
-- Name: product_imei product_imei_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_imei
    ADD CONSTRAINT product_imei_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: product_prices product_prices_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: product_variants product_variants_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_wac product_wac_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: product_wac product_wac_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: product_wac product_wac_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_wac product_wac_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_wac product_wac_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: product_wac product_wac_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: products products_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: products products_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: products products_unit_id_units_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: purchase_items purchase_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: purchase_items purchase_items_purchase_id_purchases_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_purchase_id_purchases_id_fk FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- Name: purchase_order_items purchase_order_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_order_items purchase_order_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: purchase_order_items purchase_order_items_purchase_order_id_purchase_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_purchase_orders_id_fk FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: purchase_orders purchase_orders_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: purchase_orders purchase_orders_received_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_received_by_users_id_fk FOREIGN KEY (received_by) REFERENCES public.users(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchase_orders purchase_orders_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: purchases purchases_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchases purchases_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: registers registers_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registers
    ADD CONSTRAINT registers_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: return_items return_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: return_items return_items_return_id_returns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_return_id_returns_id_fk FOREIGN KEY (return_id) REFERENCES public.returns(id);


--
-- Name: returns returns_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: returns returns_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_sale_id_sales_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: returns returns_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: rider_assignments rider_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: rider_assignments rider_assignments_assigned_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_assigned_by_users_id_fk FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: rider_assignments rider_assignments_rider_id_delivery_riders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_rider_id_delivery_riders_id_fk FOREIGN KEY (rider_id) REFERENCES public.delivery_riders(id);


--
-- Name: rider_assignments rider_assignments_rider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.delivery_riders(id);


--
-- Name: rider_assignments rider_assignments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: rider_assignments rider_assignments_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_sale_id_sales_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: salaries salaries_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: sale_items sale_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: sale_items sale_items_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_sales_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: sales sales_assigned_rider_id_delivery_riders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_assigned_rider_id_delivery_riders_id_fk FOREIGN KEY (assigned_rider_id) REFERENCES public.delivery_riders(id);


--
-- Name: sales sales_assigned_rider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_assigned_rider_id_fkey FOREIGN KEY (assigned_rider_id) REFERENCES public.delivery_riders(id);


--
-- Name: sales sales_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: sales sales_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales sales_online_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_online_customer_id_fkey FOREIGN KEY (online_customer_id) REFERENCES public.online_customers(id);


--
-- Name: sales sales_online_customer_id_online_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_online_customer_id_online_customers_id_fk FOREIGN KEY (online_customer_id) REFERENCES public.online_customers(id);


--
-- Name: sales sales_register_id_registers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_register_id_registers_id_fk FOREIGN KEY (register_id) REFERENCES public.registers(id);


--
-- Name: sales sales_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: stock_adjustment_items stock_adjustment_items_adjustment_id_stock_adjustments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustment_items
    ADD CONSTRAINT stock_adjustment_items_adjustment_id_stock_adjustments_id_fk FOREIGN KEY (adjustment_id) REFERENCES public.stock_adjustments(id) ON DELETE CASCADE;


--
-- Name: stock_adjustment_items stock_adjustment_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustment_items
    ADD CONSTRAINT stock_adjustment_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: stock_adjustments stock_adjustments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: stock_adjustments stock_adjustments_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock stock_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: stock_transfer_items stock_transfer_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- Name: stock_transfer_items stock_transfer_items_transfer_id_stock_transfers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_transfer_id_stock_transfers_id_fk FOREIGN KEY (transfer_id) REFERENCES public.stock_transfers(id);


--
-- Name: stock_transfers stock_transfers_from_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_from_warehouse_id_warehouses_id_fk FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock_transfers stock_transfers_to_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_to_warehouse_id_warehouses_id_fk FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock stock_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: supplier_ledgers supplier_ledgers_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_ledgers
    ADD CONSTRAINT supplier_ledgers_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: transactions transactions_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: users users_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: wac_history wac_history_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wac_history
    ADD CONSTRAINT wac_history_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: wac_history wac_history_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wac_history
    ADD CONSTRAINT wac_history_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: wac_history wac_history_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wac_history
    ADD CONSTRAINT wac_history_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wac_history wac_history_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wac_history
    ADD CONSTRAINT wac_history_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- PostgreSQL database dump complete
--

