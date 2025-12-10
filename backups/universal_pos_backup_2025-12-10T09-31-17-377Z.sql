--
-- PostgreSQL database dump
--

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 17.5

-- Started on 2025-12-10 09:31:17 UTC

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

DROP DATABASE IF EXISTS neondb;
--
-- TOC entry 4032 (class 1262 OID 16391)
-- Name: neondb; Type: DATABASE; Schema: -; Owner: neondb_owner
--

CREATE DATABASE neondb WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C.UTF-8';


ALTER DATABASE neondb OWNER TO neondb_owner;

\connect neondb

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

--
-- TOC entry 4034 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 16480)
-- Name: accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    name character varying(100),
    type character varying(50)
);


ALTER TABLE public.accounts OWNER TO neondb_owner;

--
-- TOC entry 216 (class 1259 OID 16483)
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4035 (class 0 OID 0)
-- Dependencies: 216
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- TOC entry 217 (class 1259 OID 16484)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id character varying,
    action text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO neondb_owner;

--
-- TOC entry 218 (class 1259 OID 16490)
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4036 (class 0 OID 0)
-- Dependencies: 218
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 219 (class 1259 OID 16491)
-- Name: attendances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.attendances (
    id integer NOT NULL,
    employee_id integer,
    date date,
    check_in timestamp without time zone,
    check_out timestamp without time zone
);


ALTER TABLE public.attendances OWNER TO neondb_owner;

--
-- TOC entry 220 (class 1259 OID 16494)
-- Name: attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendances_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4037 (class 0 OID 0)
-- Dependencies: 220
-- Name: attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;


--
-- TOC entry 221 (class 1259 OID 16495)
-- Name: backup_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.backup_logs (
    id integer NOT NULL,
    filename text,
    backup_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.backup_logs OWNER TO neondb_owner;

--
-- TOC entry 222 (class 1259 OID 16501)
-- Name: backup_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.backup_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.backup_logs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4038 (class 0 OID 0)
-- Dependencies: 222
-- Name: backup_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.backup_logs_id_seq OWNED BY public.backup_logs.id;


--
-- TOC entry 223 (class 1259 OID 16502)
-- Name: branches; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    business_id integer,
    name character varying(150),
    address text
);


ALTER TABLE public.branches OWNER TO neondb_owner;

--
-- TOC entry 224 (class 1259 OID 16507)
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4039 (class 0 OID 0)
-- Dependencies: 224
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- TOC entry 225 (class 1259 OID 16508)
-- Name: brands; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100)
);


ALTER TABLE public.brands OWNER TO neondb_owner;

--
-- TOC entry 226 (class 1259 OID 16511)
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brands_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4040 (class 0 OID 0)
-- Dependencies: 226
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- TOC entry 227 (class 1259 OID 16512)
-- Name: business_profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.business_profiles (
    id integer NOT NULL,
    name character varying(150),
    owner_name character varying(150),
    email character varying(150),
    phone character varying(20),
    address text
);


ALTER TABLE public.business_profiles OWNER TO neondb_owner;

--
-- TOC entry 228 (class 1259 OID 16517)
-- Name: business_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.business_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_profiles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4041 (class 0 OID 0)
-- Dependencies: 228
-- Name: business_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.business_profiles_id_seq OWNED BY public.business_profiles.id;


--
-- TOC entry 229 (class 1259 OID 16518)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    online_customer_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cart_items OWNER TO neondb_owner;

--
-- TOC entry 230 (class 1259 OID 16522)
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4042 (class 0 OID 0)
-- Dependencies: 230
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- TOC entry 231 (class 1259 OID 16523)
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100),
    parent_id integer
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- TOC entry 232 (class 1259 OID 16526)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4043 (class 0 OID 0)
-- Dependencies: 232
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 233 (class 1259 OID 16527)
-- Name: cogs_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cogs_tracking (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    sale_price character varying NOT NULL,
    branch_id integer,
    sale_date timestamp without time zone NOT NULL,
    product_id integer NOT NULL,
    sale_item_id integer NOT NULL,
    quantity_sold character varying NOT NULL,
    wac_at_sale character varying NOT NULL,
    total_cogs character varying NOT NULL,
    gross_profit character varying NOT NULL,
    profit_margin character varying NOT NULL
);


ALTER TABLE public.cogs_tracking OWNER TO neondb_owner;

--
-- TOC entry 234 (class 1259 OID 16533)
-- Name: cogs_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cogs_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cogs_tracking_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4044 (class 0 OID 0)
-- Dependencies: 234
-- Name: cogs_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cogs_tracking_id_seq OWNED BY public.cogs_tracking.id;


--
-- TOC entry 235 (class 1259 OID 16534)
-- Name: currencies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(10) NOT NULL,
    exchange_rate numeric(12,6) DEFAULT 1.000000,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.currencies OWNER TO neondb_owner;

--
-- TOC entry 236 (class 1259 OID 16542)
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currencies_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4045 (class 0 OID 0)
-- Dependencies: 236
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- TOC entry 237 (class 1259 OID 16543)
-- Name: customer_ledgers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_ledgers (
    id integer NOT NULL,
    customer_id integer,
    amount numeric(12,2),
    type character varying(20),
    reference text,
    date timestamp without time zone DEFAULT now(),
    description text
);


ALTER TABLE public.customer_ledgers OWNER TO neondb_owner;

--
-- TOC entry 238 (class 1259 OID 16549)
-- Name: customer_ledgers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customer_ledgers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_ledgers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4046 (class 0 OID 0)
-- Dependencies: 238
-- Name: customer_ledgers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customer_ledgers_id_seq OWNED BY public.customer_ledgers.id;


--
-- TOC entry 239 (class 1259 OID 16550)
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(150),
    phone character varying(20),
    email character varying(100),
    address text
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- TOC entry 240 (class 1259 OID 16555)
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4047 (class 0 OID 0)
-- Dependencies: 240
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 241 (class 1259 OID 16556)
-- Name: delivery_riders; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.delivery_riders OWNER TO neondb_owner;

--
-- TOC entry 242 (class 1259 OID 16562)
-- Name: delivery_riders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.delivery_riders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_riders_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4048 (class 0 OID 0)
-- Dependencies: 242
-- Name: delivery_riders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.delivery_riders_id_seq OWNED BY public.delivery_riders.id;


--
-- TOC entry 243 (class 1259 OID 16563)
-- Name: employees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(150),
    phone character varying(20),
    email character varying(100),
    "position" character varying(100),
    join_date timestamp without time zone
);


ALTER TABLE public.employees OWNER TO neondb_owner;

--
-- TOC entry 244 (class 1259 OID 16566)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4049 (class 0 OID 0)
-- Dependencies: 244
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 245 (class 1259 OID 16567)
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name character varying(100)
);


ALTER TABLE public.expense_categories OWNER TO neondb_owner;

--
-- TOC entry 246 (class 1259 OID 16570)
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_categories_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4050 (class 0 OID 0)
-- Dependencies: 246
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- TOC entry 247 (class 1259 OID 16571)
-- Name: expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    category_id integer,
    amount numeric(12,2),
    note text,
    expense_date timestamp without time zone,
    created_by character varying
);


ALTER TABLE public.expenses OWNER TO neondb_owner;

--
-- TOC entry 248 (class 1259 OID 16576)
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4051 (class 0 OID 0)
-- Dependencies: 248
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- TOC entry 249 (class 1259 OID 16577)
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory_movements (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    product_id integer NOT NULL,
    branch_id integer,
    movement_type character varying NOT NULL,
    reference_id integer NOT NULL,
    reference_type character varying NOT NULL,
    quantity_change character varying DEFAULT '0'::character varying NOT NULL,
    unit_cost character varying DEFAULT '0'::character varying NOT NULL,
    total_cost character varying DEFAULT '0'::character varying NOT NULL,
    movement_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inventory_movements OWNER TO neondb_owner;

--
-- TOC entry 250 (class 1259 OID 16587)
-- Name: inventory_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_movements_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4052 (class 0 OID 0)
-- Dependencies: 250
-- Name: inventory_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_movements_id_seq OWNED BY public.inventory_movements.id;


--
-- TOC entry 251 (class 1259 OID 16588)
-- Name: menuCategories; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public."menuCategories" OWNER TO neondb_owner;

--
-- TOC entry 252 (class 1259 OID 16597)
-- Name: menuCategories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."menuCategories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."menuCategories_id_seq" OWNER TO neondb_owner;

--
-- TOC entry 4053 (class 0 OID 0)
-- Dependencies: 252
-- Name: menuCategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."menuCategories_id_seq" OWNED BY public."menuCategories".id;


--
-- TOC entry 253 (class 1259 OID 16598)
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying,
    message text,
    type character varying(50),
    status character varying(50) DEFAULT 'unread'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- TOC entry 254 (class 1259 OID 16605)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4054 (class 0 OID 0)
-- Dependencies: 254
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 255 (class 1259 OID 16606)
-- Name: onlineCustomers; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public."onlineCustomers" OWNER TO neondb_owner;

--
-- TOC entry 256 (class 1259 OID 16613)
-- Name: onlineCustomers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."onlineCustomers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."onlineCustomers_id_seq" OWNER TO neondb_owner;

--
-- TOC entry 4055 (class 0 OID 0)
-- Dependencies: 256
-- Name: onlineCustomers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."onlineCustomers_id_seq" OWNED BY public."onlineCustomers".id;


--
-- TOC entry 257 (class 1259 OID 16614)
-- Name: online_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.online_customers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    password character varying(255) NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.online_customers OWNER TO neondb_owner;

--
-- TOC entry 258 (class 1259 OID 16621)
-- Name: online_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.online_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.online_customers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4056 (class 0 OID 0)
-- Dependencies: 258
-- Name: online_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.online_customers_id_seq OWNED BY public.online_customers.id;


--
-- TOC entry 259 (class 1259 OID 16622)
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    account_id integer,
    amount numeric(12,2),
    payment_type character varying(50),
    reference text,
    date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- TOC entry 260 (class 1259 OID 16628)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4057 (class 0 OID 0)
-- Dependencies: 260
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 261 (class 1259 OID 16629)
-- Name: permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.permissions OWNER TO neondb_owner;

--
-- TOC entry 262 (class 1259 OID 16632)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4058 (class 0 OID 0)
-- Dependencies: 262
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 263 (class 1259 OID 16633)
-- Name: product_attribute_values; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_attribute_values (
    id integer NOT NULL,
    product_id integer,
    attribute_id integer,
    value text
);


ALTER TABLE public.product_attribute_values OWNER TO neondb_owner;

--
-- TOC entry 264 (class 1259 OID 16638)
-- Name: product_attribute_values_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_attribute_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_attribute_values_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4059 (class 0 OID 0)
-- Dependencies: 264
-- Name: product_attribute_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_attribute_values_id_seq OWNED BY public.product_attribute_values.id;


--
-- TOC entry 265 (class 1259 OID 16639)
-- Name: product_attributes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_attributes (
    id integer NOT NULL,
    name character varying(100)
);


ALTER TABLE public.product_attributes OWNER TO neondb_owner;

--
-- TOC entry 266 (class 1259 OID 16642)
-- Name: product_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_attributes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_attributes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4060 (class 0 OID 0)
-- Dependencies: 266
-- Name: product_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_attributes_id_seq OWNED BY public.product_attributes.id;


--
-- TOC entry 267 (class 1259 OID 16643)
-- Name: product_bundle_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_bundle_items (
    id integer NOT NULL,
    bundle_id integer,
    item_id integer,
    quantity numeric(10,2)
);


ALTER TABLE public.product_bundle_items OWNER TO neondb_owner;

--
-- TOC entry 268 (class 1259 OID 16646)
-- Name: product_bundle_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_bundle_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_bundle_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4061 (class 0 OID 0)
-- Dependencies: 268
-- Name: product_bundle_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_bundle_items_id_seq OWNED BY public.product_bundle_items.id;


--
-- TOC entry 269 (class 1259 OID 16647)
-- Name: product_imei; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_imei (
    id integer NOT NULL,
    product_variant_id integer,
    imei character varying(50),
    status character varying(50) DEFAULT 'available'::character varying
);


ALTER TABLE public.product_imei OWNER TO neondb_owner;

--
-- TOC entry 270 (class 1259 OID 16651)
-- Name: product_imei_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_imei_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_imei_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4062 (class 0 OID 0)
-- Dependencies: 270
-- Name: product_imei_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_imei_id_seq OWNED BY public.product_imei.id;


--
-- TOC entry 271 (class 1259 OID 16652)
-- Name: product_prices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_prices (
    id integer NOT NULL,
    product_variant_id integer,
    price numeric(12,2),
    cost_price numeric(12,2),
    effective_from timestamp without time zone
);


ALTER TABLE public.product_prices OWNER TO neondb_owner;

--
-- TOC entry 272 (class 1259 OID 16655)
-- Name: product_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_prices_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4063 (class 0 OID 0)
-- Dependencies: 272
-- Name: product_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_prices_id_seq OWNED BY public.product_prices.id;


--
-- TOC entry 273 (class 1259 OID 16656)
-- Name: product_variants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer,
    variant_name character varying(100),
    purchase_price numeric(10,2) DEFAULT 0,
    sale_price numeric(10,2) DEFAULT 0,
    wholesale_price numeric(10,2) DEFAULT 0,
    retail_price numeric(10,2) DEFAULT 0
);


ALTER TABLE public.product_variants OWNER TO neondb_owner;

--
-- TOC entry 274 (class 1259 OID 16663)
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_variants_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4064 (class 0 OID 0)
-- Dependencies: 274
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- TOC entry 275 (class 1259 OID 16664)
-- Name: product_wac; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_wac (
    id integer NOT NULL,
    product_id integer NOT NULL,
    branch_id integer,
    warehouse_id integer,
    current_quantity numeric(15,4) DEFAULT 0,
    total_value numeric(15,4) DEFAULT 0,
    weighted_average_cost numeric(15,4) DEFAULT 0,
    last_calculated_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_wac OWNER TO neondb_owner;

--
-- TOC entry 276 (class 1259 OID 16672)
-- Name: product_wac_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_wac_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_wac_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4065 (class 0 OID 0)
-- Dependencies: 276
-- Name: product_wac_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_wac_id_seq OWNED BY public.product_wac.id;


--
-- TOC entry 277 (class 1259 OID 16673)
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(150),
    category_id integer,
    brand_id integer,
    unit_id integer,
    description text,
    price numeric(10,2) DEFAULT 0,
    stock integer DEFAULT 0,
    barcode character varying(255),
    low_stock_alert integer DEFAULT 0,
    image text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    purchase_price numeric(10,2) DEFAULT 0,
    sale_price numeric(10,2) DEFAULT 0,
    wholesale_price numeric(10,2) DEFAULT 0,
    retail_price numeric(10,2) DEFAULT 0
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- TOC entry 278 (class 1259 OID 16687)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4066 (class 0 OID 0)
-- Dependencies: 278
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 279 (class 1259 OID 16688)
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_items (
    id integer NOT NULL,
    purchase_id integer,
    product_variant_id integer,
    quantity numeric(10,2),
    cost_price numeric(12,2)
);


ALTER TABLE public.purchase_items OWNER TO neondb_owner;

--
-- TOC entry 280 (class 1259 OID 16691)
-- Name: purchase_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchase_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4067 (class 0 OID 0)
-- Dependencies: 280
-- Name: purchase_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchase_items_id_seq OWNED BY public.purchase_items.id;


--
-- TOC entry 281 (class 1259 OID 16692)
-- Name: purchases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    supplier_id integer,
    user_id character varying,
    total_amount numeric(12,2),
    purchase_date timestamp without time zone,
    status character varying(50)
);


ALTER TABLE public.purchases OWNER TO neondb_owner;

--
-- TOC entry 282 (class 1259 OID 16697)
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchases_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4068 (class 0 OID 0)
-- Dependencies: 282
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- TOC entry 283 (class 1259 OID 16698)
-- Name: registers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.registers (
    id integer NOT NULL,
    branch_id integer,
    name character varying(150),
    opened_at timestamp without time zone,
    closed_at timestamp without time zone,
    code character varying(50),
    opening_balance numeric(12,2) DEFAULT '0'::numeric,
    current_balance numeric(12,2) DEFAULT '0'::numeric,
    is_active boolean DEFAULT true
);


ALTER TABLE public.registers OWNER TO neondb_owner;

--
-- TOC entry 284 (class 1259 OID 16704)
-- Name: registers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.registers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4069 (class 0 OID 0)
-- Dependencies: 284
-- Name: registers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.registers_id_seq OWNED BY public.registers.id;


--
-- TOC entry 285 (class 1259 OID 16705)
-- Name: return_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.return_items (
    id integer NOT NULL,
    return_id integer,
    product_variant_id integer,
    quantity numeric(10,2),
    price numeric(12,2),
    return_type character varying(20) DEFAULT 'refund'::character varying
);


ALTER TABLE public.return_items OWNER TO neondb_owner;

--
-- TOC entry 286 (class 1259 OID 16709)
-- Name: return_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.return_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.return_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4070 (class 0 OID 0)
-- Dependencies: 286
-- Name: return_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.return_items_id_seq OWNED BY public.return_items.id;


--
-- TOC entry 287 (class 1259 OID 16710)
-- Name: returns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.returns (
    id integer NOT NULL,
    sale_id integer,
    user_id character varying,
    reason text,
    return_date timestamp without time zone,
    customer_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    total_amount numeric(12,2),
    customer_name character varying(150),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.returns OWNER TO neondb_owner;

--
-- TOC entry 288 (class 1259 OID 16718)
-- Name: returns_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.returns_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4071 (class 0 OID 0)
-- Dependencies: 288
-- Name: returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.returns_id_seq OWNED BY public.returns.id;


--
-- TOC entry 289 (class 1259 OID 16719)
-- Name: rider_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.rider_assignments OWNER TO neondb_owner;

--
-- TOC entry 290 (class 1259 OID 16726)
-- Name: rider_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.rider_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rider_assignments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4072 (class 0 OID 0)
-- Dependencies: 290
-- Name: rider_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.rider_assignments_id_seq OWNED BY public.rider_assignments.id;


--
-- TOC entry 291 (class 1259 OID 16727)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- TOC entry 292 (class 1259 OID 16730)
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- TOC entry 293 (class 1259 OID 16733)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4073 (class 0 OID 0)
-- Dependencies: 293
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 294 (class 1259 OID 16734)
-- Name: salaries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.salaries (
    id integer NOT NULL,
    employee_id integer,
    amount numeric(12,2),
    pay_date timestamp without time zone
);


ALTER TABLE public.salaries OWNER TO neondb_owner;

--
-- TOC entry 295 (class 1259 OID 16737)
-- Name: salaries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.salaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salaries_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4074 (class 0 OID 0)
-- Dependencies: 295
-- Name: salaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.salaries_id_seq OWNED BY public.salaries.id;


--
-- TOC entry 296 (class 1259 OID 16738)
-- Name: sale_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer,
    product_variant_id integer,
    quantity numeric(10,2),
    price numeric(12,2)
);


ALTER TABLE public.sale_items OWNER TO neondb_owner;

--
-- TOC entry 297 (class 1259 OID 16741)
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4075 (class 0 OID 0)
-- Dependencies: 297
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- TOC entry 298 (class 1259 OID 16742)
-- Name: sales; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    customer_id integer,
    user_id character varying,
    branch_id integer,
    register_id integer,
    total_amount numeric(12,2),
    paid_amount numeric(12,2),
    sale_date timestamp without time zone DEFAULT now(),
    status character varying(50),
    order_type character varying(20) DEFAULT 'sale'::character varying,
    table_number character varying(20),
    kitchen_status character varying(20) DEFAULT 'new'::character varying,
    special_instructions text,
    estimated_time integer,
    online_customer_id integer,
    order_source character varying(20) DEFAULT 'pos'::character varying,
    delivery_address text,
    customer_phone character varying(20),
    customer_name character varying(150),
    assigned_rider_id integer,
    delivery_status character varying(50) DEFAULT 'pending'::character varying
);


ALTER TABLE public.sales OWNER TO neondb_owner;

--
-- TOC entry 299 (class 1259 OID 16752)
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4076 (class 0 OID 0)
-- Dependencies: 299
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- TOC entry 300 (class 1259 OID 16753)
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- TOC entry 301 (class 1259 OID 16758)
-- Name: settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(100),
    value text
);


ALTER TABLE public.settings OWNER TO neondb_owner;

--
-- TOC entry 302 (class 1259 OID 16763)
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4077 (class 0 OID 0)
-- Dependencies: 302
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- TOC entry 303 (class 1259 OID 16764)
-- Name: stock; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock (
    id integer NOT NULL,
    product_variant_id integer,
    warehouse_id integer,
    quantity numeric(12,2) DEFAULT '0'::numeric
);


ALTER TABLE public.stock OWNER TO neondb_owner;

--
-- TOC entry 304 (class 1259 OID 16768)
-- Name: stock_adjustments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_adjustments (
    id integer NOT NULL,
    warehouse_id integer,
    user_id character varying,
    reason text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_adjustments OWNER TO neondb_owner;

--
-- TOC entry 305 (class 1259 OID 16774)
-- Name: stock_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_adjustments_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4078 (class 0 OID 0)
-- Dependencies: 305
-- Name: stock_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_adjustments_id_seq OWNED BY public.stock_adjustments.id;


--
-- TOC entry 306 (class 1259 OID 16775)
-- Name: stock_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4079 (class 0 OID 0)
-- Dependencies: 306
-- Name: stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_id_seq OWNED BY public.stock.id;


--
-- TOC entry 307 (class 1259 OID 16776)
-- Name: stock_transfer_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_transfer_items (
    id integer NOT NULL,
    transfer_id integer,
    product_variant_id integer,
    quantity numeric(12,2)
);


ALTER TABLE public.stock_transfer_items OWNER TO neondb_owner;

--
-- TOC entry 308 (class 1259 OID 16779)
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_transfer_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_transfer_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4080 (class 0 OID 0)
-- Dependencies: 308
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_transfer_items_id_seq OWNED BY public.stock_transfer_items.id;


--
-- TOC entry 309 (class 1259 OID 16780)
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_transfers (
    id integer NOT NULL,
    from_warehouse_id integer,
    to_warehouse_id integer,
    transfer_date timestamp without time zone,
    status character varying(50)
);


ALTER TABLE public.stock_transfers OWNER TO neondb_owner;

--
-- TOC entry 310 (class 1259 OID 16783)
-- Name: stock_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_transfers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4081 (class 0 OID 0)
-- Dependencies: 310
-- Name: stock_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_transfers_id_seq OWNED BY public.stock_transfers.id;


--
-- TOC entry 311 (class 1259 OID 16784)
-- Name: supplier_ledgers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.supplier_ledgers (
    id integer NOT NULL,
    supplier_id integer,
    amount numeric(12,2),
    type character varying(20),
    reference text,
    date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.supplier_ledgers OWNER TO neondb_owner;

--
-- TOC entry 312 (class 1259 OID 16790)
-- Name: supplier_ledgers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.supplier_ledgers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_ledgers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4082 (class 0 OID 0)
-- Dependencies: 312
-- Name: supplier_ledgers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.supplier_ledgers_id_seq OWNED BY public.supplier_ledgers.id;


--
-- TOC entry 313 (class 1259 OID 16791)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(150),
    phone character varying(20),
    email character varying(100),
    address text
);


ALTER TABLE public.suppliers OWNER TO neondb_owner;

--
-- TOC entry 314 (class 1259 OID 16796)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4083 (class 0 OID 0)
-- Dependencies: 314
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- TOC entry 315 (class 1259 OID 16797)
-- Name: taxes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.taxes (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    rate numeric(5,2) NOT NULL,
    tax_number character varying(50),
    is_enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.taxes OWNER TO neondb_owner;

--
-- TOC entry 316 (class 1259 OID 16804)
-- Name: taxes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.taxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.taxes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4084 (class 0 OID 0)
-- Dependencies: 316
-- Name: taxes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.taxes_id_seq OWNED BY public.taxes.id;


--
-- TOC entry 317 (class 1259 OID 16805)
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    account_id integer,
    type character varying(20),
    amount numeric(12,2),
    reference text,
    date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- TOC entry 318 (class 1259 OID 16811)
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4085 (class 0 OID 0)
-- Dependencies: 318
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- TOC entry 319 (class 1259 OID 16812)
-- Name: units; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.units (
    id integer NOT NULL,
    name character varying(50),
    short_name character varying(10),
    type character varying(20),
    description text
);


ALTER TABLE public.units OWNER TO neondb_owner;

--
-- TOC entry 320 (class 1259 OID 16817)
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4086 (class 0 OID 0)
-- Dependencies: 320
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- TOC entry 321 (class 1259 OID 16818)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 322 (class 1259 OID 16826)
-- Name: wac_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.wac_history (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    product_id integer NOT NULL,
    branch_id integer,
    old_wac character varying DEFAULT '0'::character varying NOT NULL,
    new_wac character varying DEFAULT '0'::character varying NOT NULL,
    movement_type character varying NOT NULL,
    movement_id integer NOT NULL,
    quantity_changed character varying DEFAULT '0'::character varying NOT NULL,
    price_per_unit character varying DEFAULT '0'::character varying NOT NULL
);


ALTER TABLE public.wac_history OWNER TO neondb_owner;

--
-- TOC entry 323 (class 1259 OID 16836)
-- Name: wac_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.wac_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wac_history_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4087 (class 0 OID 0)
-- Dependencies: 323
-- Name: wac_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.wac_history_id_seq OWNED BY public.wac_history.id;


--
-- TOC entry 324 (class 1259 OID 16837)
-- Name: warehouses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(100),
    location text
);


ALTER TABLE public.warehouses OWNER TO neondb_owner;

--
-- TOC entry 325 (class 1259 OID 16842)
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO neondb_owner;

--
-- TOC entry 4088 (class 0 OID 0)
-- Dependencies: 325
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- TOC entry 3457 (class 2604 OID 16843)
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- TOC entry 3458 (class 2604 OID 16844)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 3460 (class 2604 OID 16845)
-- Name: attendances id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq'::regclass);


--
-- TOC entry 3461 (class 2604 OID 16846)
-- Name: backup_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.backup_logs ALTER COLUMN id SET DEFAULT nextval('public.backup_logs_id_seq'::regclass);


--
-- TOC entry 3463 (class 2604 OID 16847)
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- TOC entry 3464 (class 2604 OID 16848)
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- TOC entry 3465 (class 2604 OID 16849)
-- Name: business_profiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.business_profiles ALTER COLUMN id SET DEFAULT nextval('public.business_profiles_id_seq'::regclass);


--
-- TOC entry 3466 (class 2604 OID 16850)
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- TOC entry 3468 (class 2604 OID 16851)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 3469 (class 2604 OID 16852)
-- Name: cogs_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cogs_tracking ALTER COLUMN id SET DEFAULT nextval('public.cogs_tracking_id_seq'::regclass);


--
-- TOC entry 3471 (class 2604 OID 16853)
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- TOC entry 3477 (class 2604 OID 16854)
-- Name: customer_ledgers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_ledgers ALTER COLUMN id SET DEFAULT nextval('public.customer_ledgers_id_seq'::regclass);


--
-- TOC entry 3479 (class 2604 OID 16855)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 3480 (class 2604 OID 16856)
-- Name: delivery_riders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_riders ALTER COLUMN id SET DEFAULT nextval('public.delivery_riders_id_seq'::regclass);


--
-- TOC entry 3484 (class 2604 OID 16857)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 3485 (class 2604 OID 16858)
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- TOC entry 3486 (class 2604 OID 16859)
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- TOC entry 3487 (class 2604 OID 16860)
-- Name: inventory_movements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_movements ALTER COLUMN id SET DEFAULT nextval('public.inventory_movements_id_seq'::regclass);


--
-- TOC entry 3493 (class 2604 OID 16861)
-- Name: menuCategories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."menuCategories" ALTER COLUMN id SET DEFAULT nextval('public."menuCategories_id_seq"'::regclass);


--
-- TOC entry 3498 (class 2604 OID 16862)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3501 (class 2604 OID 16863)
-- Name: onlineCustomers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."onlineCustomers" ALTER COLUMN id SET DEFAULT nextval('public."onlineCustomers_id_seq"'::regclass);


--
-- TOC entry 3504 (class 2604 OID 16864)
-- Name: online_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.online_customers ALTER COLUMN id SET DEFAULT nextval('public.online_customers_id_seq'::regclass);


--
-- TOC entry 3507 (class 2604 OID 16865)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 3509 (class 2604 OID 16866)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 3510 (class 2604 OID 16867)
-- Name: product_attribute_values id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_attribute_values ALTER COLUMN id SET DEFAULT nextval('public.product_attribute_values_id_seq'::regclass);


--
-- TOC entry 3511 (class 2604 OID 16868)
-- Name: product_attributes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_attributes ALTER COLUMN id SET DEFAULT nextval('public.product_attributes_id_seq'::regclass);


--
-- TOC entry 3512 (class 2604 OID 16869)
-- Name: product_bundle_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_bundle_items ALTER COLUMN id SET DEFAULT nextval('public.product_bundle_items_id_seq'::regclass);


--
-- TOC entry 3513 (class 2604 OID 16870)
-- Name: product_imei id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_imei ALTER COLUMN id SET DEFAULT nextval('public.product_imei_id_seq'::regclass);


--
-- TOC entry 3515 (class 2604 OID 16871)
-- Name: product_prices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_prices ALTER COLUMN id SET DEFAULT nextval('public.product_prices_id_seq'::regclass);


--
-- TOC entry 3516 (class 2604 OID 16872)
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- TOC entry 3521 (class 2604 OID 16873)
-- Name: product_wac id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wac ALTER COLUMN id SET DEFAULT nextval('public.product_wac_id_seq'::regclass);


--
-- TOC entry 3527 (class 2604 OID 16874)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 3537 (class 2604 OID 16875)
-- Name: purchase_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_items_id_seq'::regclass);


--
-- TOC entry 3538 (class 2604 OID 16876)
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- TOC entry 3539 (class 2604 OID 16877)
-- Name: registers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.registers ALTER COLUMN id SET DEFAULT nextval('public.registers_id_seq'::regclass);


--
-- TOC entry 3543 (class 2604 OID 16878)
-- Name: return_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.return_items ALTER COLUMN id SET DEFAULT nextval('public.return_items_id_seq'::regclass);


--
-- TOC entry 3545 (class 2604 OID 16879)
-- Name: returns id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.returns ALTER COLUMN id SET DEFAULT nextval('public.returns_id_seq'::regclass);


--
-- TOC entry 3549 (class 2604 OID 16880)
-- Name: rider_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rider_assignments ALTER COLUMN id SET DEFAULT nextval('public.rider_assignments_id_seq'::regclass);


--
-- TOC entry 3552 (class 2604 OID 16881)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 3553 (class 2604 OID 16882)
-- Name: salaries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.salaries ALTER COLUMN id SET DEFAULT nextval('public.salaries_id_seq'::regclass);


--
-- TOC entry 3554 (class 2604 OID 16883)
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- TOC entry 3555 (class 2604 OID 16884)
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- TOC entry 3561 (class 2604 OID 16885)
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- TOC entry 3562 (class 2604 OID 16886)
-- Name: stock id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock ALTER COLUMN id SET DEFAULT nextval('public.stock_id_seq'::regclass);


--
-- TOC entry 3564 (class 2604 OID 16887)
-- Name: stock_adjustments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_adjustments ALTER COLUMN id SET DEFAULT nextval('public.stock_adjustments_id_seq'::regclass);


--
-- TOC entry 3566 (class 2604 OID 16888)
-- Name: stock_transfer_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfer_items ALTER COLUMN id SET DEFAULT nextval('public.stock_transfer_items_id_seq'::regclass);


--
-- TOC entry 3567 (class 2604 OID 16889)
-- Name: stock_transfers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfers ALTER COLUMN id SET DEFAULT nextval('public.stock_transfers_id_seq'::regclass);


--
-- TOC entry 3568 (class 2604 OID 16890)
-- Name: supplier_ledgers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier_ledgers ALTER COLUMN id SET DEFAULT nextval('public.supplier_ledgers_id_seq'::regclass);


--
-- TOC entry 3570 (class 2604 OID 16891)
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 3571 (class 2604 OID 16892)
-- Name: taxes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.taxes ALTER COLUMN id SET DEFAULT nextval('public.taxes_id_seq'::regclass);


--
-- TOC entry 3576 (class 2604 OID 16893)
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- TOC entry 3578 (class 2604 OID 16894)
-- Name: units id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- TOC entry 3582 (class 2604 OID 16895)
-- Name: wac_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wac_history ALTER COLUMN id SET DEFAULT nextval('public.wac_history_id_seq'::regclass);


--
-- TOC entry 3588 (class 2604 OID 16896)
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- TOC entry 3916 (class 0 OID 16480)
-- Dependencies: 215
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accounts (id, name, type) FROM stdin;
\.


--
-- TOC entry 3918 (class 0 OID 16484)
-- Dependencies: 217
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_logs (id, user_id, action, ip_address, created_at) FROM stdin;
1	41128350	Initialized sample data: categories, brands, products, and customers	system	2025-07-28 08:40:01.674833
2	41128350	Initialized sample data: categories, brands, products, and customers	system	2025-07-28 08:40:30.341334
3	41128350	Completed sale: $79.99	10.83.5.33	2025-07-28 08:43:18.181276
6	41128350	Created category: New testing category	10.83.0.123	2025-11-28 06:30:19.976097
7	41128350	Created category: COVER	10.83.0.45	2025-12-02 06:39:46.260448
8	41128350	Updated category: COVERS	10.83.0.45	2025-12-02 07:58:36.233593
9	41128350	Created category: Test	10.83.0.45	2025-12-02 07:58:50.592145
10	41128350	Deleted category with ID: 35	10.83.0.45	2025-12-02 07:58:54.687813
11	41128350	Created category: efefewadeqwd	10.83.7.111	2025-12-10 06:45:11.73903
12	41128350	Updated category: efff	10.83.7.111	2025-12-10 06:45:23.677657
13	41128350	Deleted category with ID: 36	10.83.7.111	2025-12-10 06:45:28.886895
14	41128350	Updated product: testing update	10.83.6.127	2025-12-10 07:04:08.64357
15	41128350	Updated product: testing update	10.83.6.127	2025-12-10 07:04:47.788844
16	41128350	Updated product: testing update successfully	10.83.6.127	2025-12-10 07:05:29.052644
17	41128350	Updated product: testing update successfully	10.83.7.111	2025-12-10 07:06:09.7825
18	41128350	Updated product: testing update successfully	10.83.5.107	2025-12-10 07:13:13.53158
19	41128350	Updated product: testing update successfully	10.83.1.54	2025-12-10 07:35:11.560404
20	41128350	Updated product: testing update successfully	10.83.11.105	2025-12-10 07:36:13.425504
21	41128350	Updated product: testing update successfully	10.83.11.105	2025-12-10 07:42:05.225422
22	41128350	Updated product: testing update successfully	10.83.6.127	2025-12-10 07:50:07.842213
23	41128350	Updated product: testing update successfully	10.83.1.54	2025-12-10 07:50:25.648954
24	41128350	Updated product: testing update successfully	10.83.6.127	2025-12-10 07:50:57.688626
25	41128350	Updated product: iphone	10.83.11.105	2025-12-10 07:51:24.621046
\.


--
-- TOC entry 3920 (class 0 OID 16491)
-- Dependencies: 219
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.attendances (id, employee_id, date, check_in, check_out) FROM stdin;
\.


--
-- TOC entry 3922 (class 0 OID 16495)
-- Dependencies: 221
-- Data for Name: backup_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.backup_logs (id, filename, backup_date) FROM stdin;
\.


--
-- TOC entry 3924 (class 0 OID 16502)
-- Dependencies: 223
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.branches (id, business_id, name, address) FROM stdin;
\.


--
-- TOC entry 3926 (class 0 OID 16508)
-- Dependencies: 225
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.brands (id, name) FROM stdin;
36	POLO
37	mixed
\.


--
-- TOC entry 3928 (class 0 OID 16512)
-- Dependencies: 227
-- Data for Name: business_profiles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.business_profiles (id, name, owner_name, email, phone, address) FROM stdin;
\.


--
-- TOC entry 3930 (class 0 OID 16518)
-- Dependencies: 229
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cart_items (id, online_customer_id, product_id, quantity, price, created_at) FROM stdin;
\.


--
-- TOC entry 3932 (class 0 OID 16523)
-- Dependencies: 231
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, name, parent_id) FROM stdin;
34	COVERS	\N
\.


--
-- TOC entry 3934 (class 0 OID 16527)
-- Dependencies: 233
-- Data for Name: cogs_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cogs_tracking (id, created_at, sale_price, branch_id, sale_date, product_id, sale_item_id, quantity_sold, wac_at_sale, total_cogs, gross_profit, profit_margin) FROM stdin;
\.


--
-- TOC entry 3936 (class 0 OID 16534)
-- Dependencies: 235
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.currencies (id, code, name, symbol, exchange_rate, is_active, is_default, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3938 (class 0 OID 16543)
-- Dependencies: 237
-- Data for Name: customer_ledgers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_ledgers (id, customer_id, amount, type, reference, date, description) FROM stdin;
3	18	2000.00	debit	SALE-81	2025-12-10 08:41:57.826519	Sale #81 - Outstanding amount
4	18	2000.00	credit	PAYMENT-1765356919433	2025-12-10 00:00:00	Payment on account
5	19	1990.00	debit	SALE-82	2025-12-10 08:58:00.128	Sale #82 - Outstanding amount
6	19	400.00	credit	PAYMENT-1765357286550	2025-12-10 00:00:00	Payment on account
7	19	300.00	credit	PAYMENT-1765357298152	2025-12-10 00:00:00	Payment on account
8	19	600.00	credit	PAYMENT-1765357310971	2025-12-10 00:00:00	Payment on account
9	19	800.00	credit	PAYMENT-1765357320529	2025-12-10 00:00:00	Payment on account
10	19	3000.00	debit	SALE-83	2025-12-10 09:08:10.274	Sale #83 - Outstanding amount
11	19	1000.00	credit	PAYMENT-1765357802213	2025-12-10 00:00:00	Payment on account
\.


--
-- TOC entry 3940 (class 0 OID 16550)
-- Dependencies: 239
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, name, phone, email, address) FROM stdin;
18	Maher Tanveer Ahmad	03406884169	mahartanveerahmad@gmail.com	Lahore Thokar
19	Malik	31231	maharveer2226@gmail.com	\N
\.


--
-- TOC entry 3942 (class 0 OID 16556)
-- Dependencies: 241
-- Data for Name: delivery_riders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_riders (id, name, phone, email, license_number, vehicle_type, vehicle_number, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3944 (class 0 OID 16563)
-- Dependencies: 243
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employees (id, name, phone, email, "position", join_date) FROM stdin;
\.


--
-- TOC entry 3946 (class 0 OID 16567)
-- Dependencies: 245
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.expense_categories (id, name) FROM stdin;
\.


--
-- TOC entry 3948 (class 0 OID 16571)
-- Dependencies: 247
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.expenses (id, category_id, amount, note, expense_date, created_by) FROM stdin;
\.


--
-- TOC entry 3950 (class 0 OID 16577)
-- Dependencies: 249
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory_movements (id, created_at, product_id, branch_id, movement_type, reference_id, reference_type, quantity_change, unit_cost, total_cost, movement_date) FROM stdin;
\.


--
-- TOC entry 3952 (class 0 OID 16588)
-- Dependencies: 251
-- Data for Name: menuCategories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."menuCategories" (id, name, description, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3954 (class 0 OID 16598)
-- Dependencies: 253
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, message, type, status, created_at) FROM stdin;
\.


--
-- TOC entry 3956 (class 0 OID 16606)
-- Dependencies: 255
-- Data for Name: onlineCustomers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."onlineCustomers" (id, name, email, phone, password, address, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3958 (class 0 OID 16614)
-- Dependencies: 257
-- Data for Name: online_customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.online_customers (id, name, email, phone, password, address, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3960 (class 0 OID 16622)
-- Dependencies: 259
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, account_id, amount, payment_type, reference, date) FROM stdin;
\.


--
-- TOC entry 3962 (class 0 OID 16629)
-- Dependencies: 261
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- TOC entry 3964 (class 0 OID 16633)
-- Dependencies: 263
-- Data for Name: product_attribute_values; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_attribute_values (id, product_id, attribute_id, value) FROM stdin;
\.


--
-- TOC entry 3966 (class 0 OID 16639)
-- Dependencies: 265
-- Data for Name: product_attributes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_attributes (id, name) FROM stdin;
\.


--
-- TOC entry 3968 (class 0 OID 16643)
-- Dependencies: 267
-- Data for Name: product_bundle_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_bundle_items (id, bundle_id, item_id, quantity) FROM stdin;
\.


--
-- TOC entry 3970 (class 0 OID 16647)
-- Dependencies: 269
-- Data for Name: product_imei; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_imei (id, product_variant_id, imei, status) FROM stdin;
\.


--
-- TOC entry 3972 (class 0 OID 16652)
-- Dependencies: 271
-- Data for Name: product_prices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_prices (id, product_variant_id, price, cost_price, effective_from) FROM stdin;
\.


--
-- TOC entry 3974 (class 0 OID 16656)
-- Dependencies: 273
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_variants (id, product_id, variant_name, purchase_price, sale_price, wholesale_price, retail_price) FROM stdin;
63	116	test1	1000.00	2000.00	1500.00	1800.00
65	116	test2	2000.00	4000.00	3000.00	3500.00
\.


--
-- TOC entry 3976 (class 0 OID 16664)
-- Dependencies: 275
-- Data for Name: product_wac; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_wac (id, product_id, branch_id, warehouse_id, current_quantity, total_value, weighted_average_cost, last_calculated_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3978 (class 0 OID 16673)
-- Dependencies: 277
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, category_id, brand_id, unit_id, description, price, stock, barcode, low_stock_alert, image, created_at, updated_at, purchase_price, sale_price, wholesale_price, retail_price) FROM stdin;
116	testing update successfully	34	37	\N	updated	3000.00	35	\N	3	\N	2025-12-10 06:46:34.438724	2025-12-10 09:15:04.902373	0.00	0.00	0.00	0.00
\.


--
-- TOC entry 3980 (class 0 OID 16688)
-- Dependencies: 279
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_items (id, purchase_id, product_variant_id, quantity, cost_price) FROM stdin;
34	31	63	10.00	800.00
35	32	63	15.00	700.00
\.


--
-- TOC entry 3982 (class 0 OID 16692)
-- Dependencies: 281
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchases (id, supplier_id, user_id, total_amount, purchase_date, status) FROM stdin;
31	11	41128350	8000.00	2025-12-10 09:12:00.271	approved
32	11	41128350	10500.00	2025-12-10 09:15:02.158	approved
\.


--
-- TOC entry 3984 (class 0 OID 16698)
-- Dependencies: 283
-- Data for Name: registers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.registers (id, branch_id, name, opened_at, closed_at, code, opening_balance, current_balance, is_active) FROM stdin;
\.


--
-- TOC entry 3986 (class 0 OID 16705)
-- Dependencies: 285
-- Data for Name: return_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.return_items (id, return_id, product_variant_id, quantity, price, return_type) FROM stdin;
\.


--
-- TOC entry 3988 (class 0 OID 16710)
-- Dependencies: 287
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.returns (id, sale_id, user_id, reason, return_date, customer_id, status, total_amount, customer_name, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3990 (class 0 OID 16719)
-- Dependencies: 289
-- Data for Name: rider_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rider_assignments (id, sale_id, rider_id, assigned_at, assigned_by, status, picked_up_at, delivered_at, notes) FROM stdin;
\.


--
-- TOC entry 3992 (class 0 OID 16727)
-- Dependencies: 291
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
1	21
1	22
1	23
1	24
1	25
1	26
1	27
1	28
1	29
1	30
1	31
1	32
1	33
1	34
1	35
1	36
1	37
1	38
1	39
1	40
1	41
1	42
1	43
1	44
1	45
1	46
1	47
1	48
1	49
1	50
2	1
2	2
2	3
2	4
2	5
2	6
2	7
2	9
2	10
2	11
2	12
2	13
2	14
2	15
2	16
2	17
2	18
2	19
2	20
2	21
2	22
2	23
2	24
2	25
2	26
2	27
2	28
2	29
2	30
2	31
2	32
2	33
2	34
2	35
2	36
2	37
2	38
2	39
2	40
2	41
2	42
2	43
2	44
2	45
2	46
2	47
2	48
2	49
2	50
2	51
2	52
2	53
2	54
2	55
2	56
2	57
2	58
2	59
2	60
2	61
2	62
2	64
2	65
2	66
2	68
2	69
2	70
2	71
2	72
2	73
2	74
2	75
3	1
3	2
3	3
3	9
3	10
3	11
3	12
3	13
3	14
3	15
3	16
3	17
3	18
3	19
3	20
3	21
3	22
3	23
3	26
3	27
3	28
3	29
3	30
3	36
3	37
3	38
3	39
3	40
3	46
3	47
3	48
3	49
3	50
3	54
3	55
3	56
3	60
3	61
3	62
3	68
3	69
3	72
3	73
3	74
3	75
4	1
4	2
4	9
4	15
4	16
4	19
4	26
4	27
4	28
5	1
5	2
5	21
5	22
5	23
5	24
5	25
5	26
5	30
5	31
5	32
5	33
5	34
5	35
5	47
5	49
5	57
5	58
5	59
5	70
5	71
5	72
5	74
6	1
6	2
6	9
6	10
6	11
6	12
6	13
6	14
6	36
6	37
6	38
6	39
6	40
6	48
6	54
6	55
6	56
6	73
\.


--
-- TOC entry 3993 (class 0 OID 16730)
-- Dependencies: 292
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- TOC entry 3995 (class 0 OID 16734)
-- Dependencies: 294
-- Data for Name: salaries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.salaries (id, employee_id, amount, pay_date) FROM stdin;
\.


--
-- TOC entry 3997 (class 0 OID 16738)
-- Dependencies: 296
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_items (id, sale_id, product_variant_id, quantity, price) FROM stdin;
78	80	63	1.00	2000.00
79	81	65	1.00	4000.00
80	82	63	1.00	2000.00
81	83	65	1.00	4000.00
\.


--
-- TOC entry 3999 (class 0 OID 16742)
-- Dependencies: 298
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales (id, customer_id, user_id, branch_id, register_id, total_amount, paid_amount, sale_date, status, order_type, table_number, kitchen_status, special_instructions, estimated_time, online_customer_id, order_source, delivery_address, customer_phone, customer_name, assigned_rider_id, delivery_status) FROM stdin;
80	18	\N	\N	\N	2000.00	2000.00	2025-12-10 08:20:28.043	completed	sale	\N	new	\N	\N	\N	pos	\N	\N	\N	\N	pending
81	18	\N	\N	\N	4000.00	2000.00	2025-12-10 08:22:16.484	pending	sale	\N	new	\N	\N	\N	pos	\N	\N	\N	\N	pending
82	19	\N	\N	\N	2000.00	10.00	2025-12-10 08:57:59.926	pending	sale	\N	new	\N	\N	\N	pos	\N	\N	\N	\N	pending
83	19	\N	\N	\N	4000.00	1000.00	2025-12-10 09:08:10.061	pending	sale	\N	new	\N	\N	\N	pos	\N	\N	\N	\N	pending
\.


--
-- TOC entry 4001 (class 0 OID 16753)
-- Dependencies: 300
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
QNybEJoLqb2nvto_i_AEB1VfRmQDFyPB	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-17T09:30:28.021Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "41128350"}}	2025-12-17 09:31:16
NfNNBwJt8sUSoyp6Pa6x1Hf25aapGsOq	{"cookie": {"path": "/", "secure": false, "expires": "2025-12-17T08:02:54.737Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "41128350"}}	2025-12-17 09:31:13
\.


--
-- TOC entry 4002 (class 0 OID 16758)
-- Dependencies: 301
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.settings (id, key, value) FROM stdin;
\.


--
-- TOC entry 4004 (class 0 OID 16764)
-- Dependencies: 303
-- Data for Name: stock; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock (id, product_variant_id, warehouse_id, quantity) FROM stdin;
135	63	9	20.00
136	65	9	15.00
\.


--
-- TOC entry 4005 (class 0 OID 16768)
-- Dependencies: 304
-- Data for Name: stock_adjustments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_adjustments (id, warehouse_id, user_id, reason, created_at) FROM stdin;
\.


--
-- TOC entry 4008 (class 0 OID 16776)
-- Dependencies: 307
-- Data for Name: stock_transfer_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_transfer_items (id, transfer_id, product_variant_id, quantity) FROM stdin;
\.


--
-- TOC entry 4010 (class 0 OID 16780)
-- Dependencies: 309
-- Data for Name: stock_transfers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_transfers (id, from_warehouse_id, to_warehouse_id, transfer_date, status) FROM stdin;
\.


--
-- TOC entry 4012 (class 0 OID 16784)
-- Dependencies: 311
-- Data for Name: supplier_ledgers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.supplier_ledgers (id, supplier_id, amount, type, reference, date) FROM stdin;
\.


--
-- TOC entry 4014 (class 0 OID 16791)
-- Dependencies: 313
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.suppliers (id, name, phone, email, address) FROM stdin;
11	Maher Tanveer Ahmad update	03406884169	mahartanveerahmad@gmail.com	Lahore Thokar
12	test	034068841698	maharveer2226@gmail.com	Lahore Thokar
\.


--
-- TOC entry 4016 (class 0 OID 16797)
-- Dependencies: 315
-- Data for Name: taxes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.taxes (id, name, rate, tax_number, is_enabled, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4018 (class 0 OID 16805)
-- Dependencies: 317
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, account_id, type, amount, reference, date) FROM stdin;
\.


--
-- TOC entry 4020 (class 0 OID 16812)
-- Dependencies: 319
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.units (id, name, short_name, type, description) FROM stdin;
16	pieces	pc	count	\N
\.


--
-- TOC entry 4022 (class 0 OID 16818)
-- Dependencies: 321
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
41128350	Malik Atiq	malikatiq@gmail.com	$2b$10$tgebBykt1xeRpjxH1tRryuwubAYFiuRgMBiI8iMZRwf9YBip9vriq	1	Malik	Atiq	\N	2025-07-28 08:22:57.596736	2025-07-28 08:22:57.596736
\.


--
-- TOC entry 4023 (class 0 OID 16826)
-- Dependencies: 322
-- Data for Name: wac_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.wac_history (id, created_at, product_id, branch_id, old_wac, new_wac, movement_type, movement_id, quantity_changed, price_per_unit) FROM stdin;
\.


--
-- TOC entry 4025 (class 0 OID 16837)
-- Dependencies: 324
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.warehouses (id, name, location) FROM stdin;
9	Main Warehouse	Kot Addu 
\.


--
-- TOC entry 4089 (class 0 OID 0)
-- Dependencies: 216
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accounts_id_seq', 1, false);


--
-- TOC entry 4090 (class 0 OID 0)
-- Dependencies: 218
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 25, true);


--
-- TOC entry 4091 (class 0 OID 0)
-- Dependencies: 220
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.attendances_id_seq', 1, false);


--
-- TOC entry 4092 (class 0 OID 0)
-- Dependencies: 222
-- Name: backup_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.backup_logs_id_seq', 1, false);


--
-- TOC entry 4093 (class 0 OID 0)
-- Dependencies: 224
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.branches_id_seq', 4, true);


--
-- TOC entry 4094 (class 0 OID 0)
-- Dependencies: 226
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.brands_id_seq', 39, true);


--
-- TOC entry 4095 (class 0 OID 0)
-- Dependencies: 228
-- Name: business_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.business_profiles_id_seq', 1, true);


--
-- TOC entry 4096 (class 0 OID 0)
-- Dependencies: 230
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 9, true);


--
-- TOC entry 4097 (class 0 OID 0)
-- Dependencies: 232
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.categories_id_seq', 36, true);


--
-- TOC entry 4098 (class 0 OID 0)
-- Dependencies: 234
-- Name: cogs_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cogs_tracking_id_seq', 1, false);


--
-- TOC entry 4099 (class 0 OID 0)
-- Dependencies: 236
-- Name: currencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.currencies_id_seq', 1, false);


--
-- TOC entry 4100 (class 0 OID 0)
-- Dependencies: 238
-- Name: customer_ledgers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customer_ledgers_id_seq', 11, true);


--
-- TOC entry 4101 (class 0 OID 0)
-- Dependencies: 240
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 19, true);


--
-- TOC entry 4102 (class 0 OID 0)
-- Dependencies: 242
-- Name: delivery_riders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.delivery_riders_id_seq', 1, true);


--
-- TOC entry 4103 (class 0 OID 0)
-- Dependencies: 244
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.employees_id_seq', 1, false);


--
-- TOC entry 4104 (class 0 OID 0)
-- Dependencies: 246
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 1, false);


--
-- TOC entry 4105 (class 0 OID 0)
-- Dependencies: 248
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- TOC entry 4106 (class 0 OID 0)
-- Dependencies: 250
-- Name: inventory_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_movements_id_seq', 1, false);


--
-- TOC entry 4107 (class 0 OID 0)
-- Dependencies: 252
-- Name: menuCategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."menuCategories_id_seq"', 1, false);


--
-- TOC entry 4108 (class 0 OID 0)
-- Dependencies: 254
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 4109 (class 0 OID 0)
-- Dependencies: 256
-- Name: onlineCustomers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."onlineCustomers_id_seq"', 3, true);


--
-- TOC entry 4110 (class 0 OID 0)
-- Dependencies: 258
-- Name: online_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.online_customers_id_seq', 3, true);


--
-- TOC entry 4111 (class 0 OID 0)
-- Dependencies: 260
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- TOC entry 4112 (class 0 OID 0)
-- Dependencies: 262
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.permissions_id_seq', 75, true);


--
-- TOC entry 4113 (class 0 OID 0)
-- Dependencies: 264
-- Name: product_attribute_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_attribute_values_id_seq', 1, false);


--
-- TOC entry 4114 (class 0 OID 0)
-- Dependencies: 266
-- Name: product_attributes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_attributes_id_seq', 7, true);


--
-- TOC entry 4115 (class 0 OID 0)
-- Dependencies: 268
-- Name: product_bundle_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_bundle_items_id_seq', 1, false);


--
-- TOC entry 4116 (class 0 OID 0)
-- Dependencies: 270
-- Name: product_imei_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_imei_id_seq', 1, false);


--
-- TOC entry 4117 (class 0 OID 0)
-- Dependencies: 272
-- Name: product_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_prices_id_seq', 1, false);


--
-- TOC entry 4118 (class 0 OID 0)
-- Dependencies: 274
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 65, true);


--
-- TOC entry 4119 (class 0 OID 0)
-- Dependencies: 276
-- Name: product_wac_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_wac_id_seq', 11, true);


--
-- TOC entry 4120 (class 0 OID 0)
-- Dependencies: 278
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.products_id_seq', 116, true);


--
-- TOC entry 4121 (class 0 OID 0)
-- Dependencies: 280
-- Name: purchase_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_items_id_seq', 35, true);


--
-- TOC entry 4122 (class 0 OID 0)
-- Dependencies: 282
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchases_id_seq', 32, true);


--
-- TOC entry 4123 (class 0 OID 0)
-- Dependencies: 284
-- Name: registers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.registers_id_seq', 16, true);


--
-- TOC entry 4124 (class 0 OID 0)
-- Dependencies: 286
-- Name: return_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.return_items_id_seq', 6, true);


--
-- TOC entry 4125 (class 0 OID 0)
-- Dependencies: 288
-- Name: returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.returns_id_seq', 8, true);


--
-- TOC entry 4126 (class 0 OID 0)
-- Dependencies: 290
-- Name: rider_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rider_assignments_id_seq', 1, false);


--
-- TOC entry 4127 (class 0 OID 0)
-- Dependencies: 293
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 7, true);


--
-- TOC entry 4128 (class 0 OID 0)
-- Dependencies: 295
-- Name: salaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.salaries_id_seq', 1, false);


--
-- TOC entry 4129 (class 0 OID 0)
-- Dependencies: 297
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 81, true);


--
-- TOC entry 4130 (class 0 OID 0)
-- Dependencies: 299
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sales_id_seq', 83, true);


--
-- TOC entry 4131 (class 0 OID 0)
-- Dependencies: 302
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.settings_id_seq', 130, true);


--
-- TOC entry 4132 (class 0 OID 0)
-- Dependencies: 305
-- Name: stock_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_adjustments_id_seq', 44, true);


--
-- TOC entry 4133 (class 0 OID 0)
-- Dependencies: 306
-- Name: stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_id_seq', 136, true);


--
-- TOC entry 4134 (class 0 OID 0)
-- Dependencies: 308
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_transfer_items_id_seq', 3, true);


--
-- TOC entry 4135 (class 0 OID 0)
-- Dependencies: 310
-- Name: stock_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_transfers_id_seq', 3, true);


--
-- TOC entry 4136 (class 0 OID 0)
-- Dependencies: 312
-- Name: supplier_ledgers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.supplier_ledgers_id_seq', 1, false);


--
-- TOC entry 4137 (class 0 OID 0)
-- Dependencies: 314
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 12, true);


--
-- TOC entry 4138 (class 0 OID 0)
-- Dependencies: 316
-- Name: taxes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.taxes_id_seq', 3, true);


--
-- TOC entry 4139 (class 0 OID 0)
-- Dependencies: 318
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- TOC entry 4140 (class 0 OID 0)
-- Dependencies: 320
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.units_id_seq', 18, true);


--
-- TOC entry 4141 (class 0 OID 0)
-- Dependencies: 323
-- Name: wac_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.wac_history_id_seq', 1, false);


--
-- TOC entry 4142 (class 0 OID 0)
-- Dependencies: 325
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 9, true);


--
-- TOC entry 3590 (class 2606 OID 16898)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3592 (class 2606 OID 16900)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3594 (class 2606 OID 16902)
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 3596 (class 2606 OID 16904)
-- Name: backup_logs backup_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.backup_logs
    ADD CONSTRAINT backup_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3598 (class 2606 OID 16906)
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- TOC entry 3600 (class 2606 OID 16908)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- TOC entry 3602 (class 2606 OID 16910)
-- Name: business_profiles business_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.business_profiles
    ADD CONSTRAINT business_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3604 (class 2606 OID 16912)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3606 (class 2606 OID 16914)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3608 (class 2606 OID 16916)
-- Name: cogs_tracking cogs_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cogs_tracking
    ADD CONSTRAINT cogs_tracking_pkey PRIMARY KEY (id);


--
-- TOC entry 3610 (class 2606 OID 16918)
-- Name: currencies currencies_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_code_key UNIQUE (code);


--
-- TOC entry 3612 (class 2606 OID 16920)
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- TOC entry 3614 (class 2606 OID 16922)
-- Name: customer_ledgers customer_ledgers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_ledgers
    ADD CONSTRAINT customer_ledgers_pkey PRIMARY KEY (id);


--
-- TOC entry 3616 (class 2606 OID 16924)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 3618 (class 2606 OID 16926)
-- Name: delivery_riders delivery_riders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_riders
    ADD CONSTRAINT delivery_riders_pkey PRIMARY KEY (id);


--
-- TOC entry 3620 (class 2606 OID 16928)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3622 (class 2606 OID 16930)
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3624 (class 2606 OID 16932)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 3626 (class 2606 OID 16934)
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 3628 (class 2606 OID 16936)
-- Name: menuCategories menuCategories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."menuCategories"
    ADD CONSTRAINT "menuCategories_pkey" PRIMARY KEY (id);


--
-- TOC entry 3630 (class 2606 OID 16938)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3632 (class 2606 OID 16940)
-- Name: onlineCustomers onlineCustomers_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."onlineCustomers"
    ADD CONSTRAINT "onlineCustomers_email_key" UNIQUE (email);


--
-- TOC entry 3634 (class 2606 OID 16942)
-- Name: onlineCustomers onlineCustomers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."onlineCustomers"
    ADD CONSTRAINT "onlineCustomers_pkey" PRIMARY KEY (id);


--
-- TOC entry 3636 (class 2606 OID 16944)
-- Name: online_customers online_customers_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.online_customers
    ADD CONSTRAINT online_customers_email_key UNIQUE (email);


--
-- TOC entry 3638 (class 2606 OID 16946)
-- Name: online_customers online_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.online_customers
    ADD CONSTRAINT online_customers_pkey PRIMARY KEY (id);


--
-- TOC entry 3640 (class 2606 OID 16948)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3642 (class 2606 OID 16950)
-- Name: permissions permissions_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_unique UNIQUE (name);


--
-- TOC entry 3644 (class 2606 OID 16952)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3646 (class 2606 OID 16954)
-- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id);


--
-- TOC entry 3648 (class 2606 OID 16956)
-- Name: product_attributes product_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_attributes
    ADD CONSTRAINT product_attributes_pkey PRIMARY KEY (id);


--
-- TOC entry 3650 (class 2606 OID 16958)
-- Name: product_bundle_items product_bundle_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3652 (class 2606 OID 16960)
-- Name: product_imei product_imei_imei_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_imei
    ADD CONSTRAINT product_imei_imei_unique UNIQUE (imei);


--
-- TOC entry 3654 (class 2606 OID 16962)
-- Name: product_imei product_imei_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_imei
    ADD CONSTRAINT product_imei_pkey PRIMARY KEY (id);


--
-- TOC entry 3656 (class 2606 OID 16964)
-- Name: product_prices product_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_pkey PRIMARY KEY (id);


--
-- TOC entry 3658 (class 2606 OID 16966)
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- TOC entry 3660 (class 2606 OID 16968)
-- Name: product_wac product_wac_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_pkey PRIMARY KEY (id);


--
-- TOC entry 3662 (class 2606 OID 16970)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3664 (class 2606 OID 16972)
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3666 (class 2606 OID 16974)
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- TOC entry 3668 (class 2606 OID 16976)
-- Name: registers registers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.registers
    ADD CONSTRAINT registers_pkey PRIMARY KEY (id);


--
-- TOC entry 3670 (class 2606 OID 16978)
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3672 (class 2606 OID 16980)
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- TOC entry 3674 (class 2606 OID 16982)
-- Name: rider_assignments rider_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3676 (class 2606 OID 16984)
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- TOC entry 3678 (class 2606 OID 16986)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3680 (class 2606 OID 16988)
-- Name: salaries salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_pkey PRIMARY KEY (id);


--
-- TOC entry 3682 (class 2606 OID 16990)
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3684 (class 2606 OID 16992)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 3687 (class 2606 OID 16994)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 3689 (class 2606 OID 16996)
-- Name: settings settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_unique UNIQUE (key);


--
-- TOC entry 3691 (class 2606 OID 16998)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 2606 OID 17000)
-- Name: stock_adjustments stock_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 17002)
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (id);


--
-- TOC entry 3697 (class 2606 OID 17004)
-- Name: stock_transfer_items stock_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3699 (class 2606 OID 17006)
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 3701 (class 2606 OID 17008)
-- Name: supplier_ledgers supplier_ledgers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier_ledgers
    ADD CONSTRAINT supplier_ledgers_pkey PRIMARY KEY (id);


--
-- TOC entry 3703 (class 2606 OID 17010)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 3705 (class 2606 OID 17012)
-- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT taxes_pkey PRIMARY KEY (id);


--
-- TOC entry 3707 (class 2606 OID 17014)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3709 (class 2606 OID 17016)
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- TOC entry 3711 (class 2606 OID 17018)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3713 (class 2606 OID 17020)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3715 (class 2606 OID 17022)
-- Name: wac_history wac_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wac_history
    ADD CONSTRAINT wac_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3717 (class 2606 OID 17024)
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- TOC entry 3685 (class 1259 OID 17025)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- TOC entry 3718 (class 2606 OID 17026)
-- Name: activity_logs activity_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3719 (class 2606 OID 17031)
-- Name: attendances attendances_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 3720 (class 2606 OID 17036)
-- Name: branches branches_business_id_business_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_business_id_business_profiles_id_fk FOREIGN KEY (business_id) REFERENCES public.business_profiles(id);


--
-- TOC entry 3721 (class 2606 OID 17041)
-- Name: cart_items cart_items_online_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_online_customer_id_fkey FOREIGN KEY (online_customer_id) REFERENCES public.online_customers(id) ON DELETE CASCADE;


--
-- TOC entry 3722 (class 2606 OID 17046)
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3723 (class 2606 OID 17051)
-- Name: customer_ledgers customer_ledgers_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_ledgers
    ADD CONSTRAINT customer_ledgers_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 3724 (class 2606 OID 17056)
-- Name: expenses expenses_category_id_expense_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_expense_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- TOC entry 3725 (class 2606 OID 17061)
-- Name: expenses expenses_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3726 (class 2606 OID 17066)
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3727 (class 2606 OID 17071)
-- Name: payments payments_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- TOC entry 3728 (class 2606 OID 17076)
-- Name: product_attribute_values product_attribute_values_attribute_id_product_attributes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_attribute_id_product_attributes_id_fk FOREIGN KEY (attribute_id) REFERENCES public.product_attributes(id);


--
-- TOC entry 3729 (class 2606 OID 17081)
-- Name: product_attribute_values product_attribute_values_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3730 (class 2606 OID 17086)
-- Name: product_bundle_items product_bundle_items_bundle_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_bundle_id_products_id_fk FOREIGN KEY (bundle_id) REFERENCES public.products(id);


--
-- TOC entry 3731 (class 2606 OID 17091)
-- Name: product_bundle_items product_bundle_items_item_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_item_id_products_id_fk FOREIGN KEY (item_id) REFERENCES public.products(id);


--
-- TOC entry 3732 (class 2606 OID 17096)
-- Name: product_imei product_imei_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_imei
    ADD CONSTRAINT product_imei_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 3733 (class 2606 OID 17101)
-- Name: product_prices product_prices_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 3734 (class 2606 OID 17106)
-- Name: product_variants product_variants_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3735 (class 2606 OID 17111)
-- Name: product_wac product_wac_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 3736 (class 2606 OID 17116)
-- Name: product_wac product_wac_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3737 (class 2606 OID 17121)
-- Name: product_wac product_wac_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wac
    ADD CONSTRAINT product_wac_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- TOC entry 3738 (class 2606 OID 17126)
-- Name: products products_brand_id_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- TOC entry 3739 (class 2606 OID 17131)
-- Name: products products_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 3740 (class 2606 OID 17136)
-- Name: products products_unit_id_units_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- TOC entry 3741 (class 2606 OID 17141)
-- Name: purchase_items purchase_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 3742 (class 2606 OID 17146)
-- Name: purchase_items purchase_items_purchase_id_purchases_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_purchase_id_purchases_id_fk FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- TOC entry 3743 (class 2606 OID 17151)
-- Name: purchases purchases_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 3744 (class 2606 OID 17156)
-- Name: purchases purchases_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3745 (class 2606 OID 17161)
-- Name: registers registers_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.registers
    ADD CONSTRAINT registers_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 3746 (class 2606 OID 17166)
-- Name: returns returns_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_sale_id_sales_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 3747 (class 2606 OID 17171)
-- Name: returns returns_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3748 (class 2606 OID 17176)
-- Name: rider_assignments rider_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- TOC entry 3749 (class 2606 OID 17181)
-- Name: rider_assignments rider_assignments_rider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.delivery_riders(id);


--
-- TOC entry 3750 (class 2606 OID 17186)
-- Name: rider_assignments rider_assignments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rider_assignments
    ADD CONSTRAINT rider_assignments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- TOC entry 3751 (class 2606 OID 17191)
-- Name: role_permissions role_permissions_permission_id_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 3752 (class 2606 OID 17196)
-- Name: role_permissions role_permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 3753 (class 2606 OID 17201)
-- Name: salaries salaries_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 3754 (class 2606 OID 17206)
-- Name: sale_items sale_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 3755 (class 2606 OID 17211)
-- Name: sale_items sale_items_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_sales_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 3756 (class 2606 OID 17216)
-- Name: sales sales_assigned_rider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_assigned_rider_id_fkey FOREIGN KEY (assigned_rider_id) REFERENCES public.delivery_riders(id);


--
-- TOC entry 3757 (class 2606 OID 17221)
-- Name: sales sales_branch_id_branches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_branch_id_branches_id_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 3758 (class 2606 OID 17226)
-- Name: sales sales_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 3759 (class 2606 OID 17231)
-- Name: sales sales_online_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_online_customer_id_fkey FOREIGN KEY (online_customer_id) REFERENCES public.online_customers(id);


--
-- TOC entry 3760 (class 2606 OID 17236)
-- Name: sales sales_register_id_registers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_register_id_registers_id_fk FOREIGN KEY (register_id) REFERENCES public.registers(id);


--
-- TOC entry 3761 (class 2606 OID 17241)
-- Name: sales sales_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3764 (class 2606 OID 17246)
-- Name: stock_adjustments stock_adjustments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3765 (class 2606 OID 17251)
-- Name: stock_adjustments stock_adjustments_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- TOC entry 3762 (class 2606 OID 17256)
-- Name: stock stock_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 3766 (class 2606 OID 17261)
-- Name: stock_transfer_items stock_transfer_items_product_variant_id_product_variants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_product_variant_id_product_variants_id_fk FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 3767 (class 2606 OID 17266)
-- Name: stock_transfer_items stock_transfer_items_transfer_id_stock_transfers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_transfer_id_stock_transfers_id_fk FOREIGN KEY (transfer_id) REFERENCES public.stock_transfers(id);


--
-- TOC entry 3768 (class 2606 OID 17271)
-- Name: stock_transfers stock_transfers_from_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_from_warehouse_id_warehouses_id_fk FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id);


--
-- TOC entry 3769 (class 2606 OID 17276)
-- Name: stock_transfers stock_transfers_to_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_to_warehouse_id_warehouses_id_fk FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id);


--
-- TOC entry 3763 (class 2606 OID 17281)
-- Name: stock stock_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- TOC entry 3770 (class 2606 OID 17286)
-- Name: supplier_ledgers supplier_ledgers_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier_ledgers
    ADD CONSTRAINT supplier_ledgers_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 3771 (class 2606 OID 17291)
-- Name: transactions transactions_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- TOC entry 3772 (class 2606 OID 17296)
-- Name: users users_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4033 (class 0 OID 0)
-- Dependencies: 4032
-- Name: DATABASE neondb; Type: ACL; Schema: -; Owner: neondb_owner
--

GRANT ALL ON DATABASE neondb TO neon_superuser;


--
-- TOC entry 2316 (class 826 OID 16394)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2315 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-12-10 09:31:26 UTC

--
-- PostgreSQL database dump complete
--

