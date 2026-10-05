-- ============================================================================
-- HYPERLOCAL SERVICES & RECURRING MARKETPLACE - DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Production-ready schema with Multi-Society Architecture, Dynamic Pricing Models,
-- Subscriptions, Order State Machine, Payments, Reviews, Complaints & RLS.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');

CREATE TYPE provider_status AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED'
);

CREATE TYPE pricing_model_type AS ENUM (
  'FIXED',
  'HOURLY',
  'PER_ITEM',
  'SUBSCRIPTION',
  'INSPECTION_VARIABLE',
  'CUSTOM_QUOTATION'
);

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'FAILED',
  'DISPUTED',
  'REFUND_REQUESTED',
  'REFUNDED'
);

CREATE TYPE subscription_status AS ENUM (
  'ACTIVE',
  'PAUSED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE subscription_frequency AS ENUM (
  'DAILY',
  'MON_TO_SAT',
  'WEEKLY',
  'ALTERNATE_DAYS',
  'MONTHLY'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'CAPTURED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE discount_type AS ENUM (
  'PERCENTAGE',
  'FLAT',
  'FIRST_ORDER',
  'SUBSCRIPTION'
);

CREATE TYPE discount_source AS ENUM (
  'PLATFORM',
  'PROVIDER'
);

CREATE TYPE complaint_status AS ENUM (
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED'
);

CREATE TYPE commission_rule_type AS ENUM (
  'DEFAULT',
  'CATEGORY',
  'SERVICE',
  'PROVIDER'
);

-- ----------------------------------------------------------------------------
-- 2. COMMUNITIES & SOCIETIES (Multi-society architecture)
-- ----------------------------------------------------------------------------
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  area VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE societies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  total_flats INT DEFAULT 0, -- e.g., 1790 in pilot, never hardcoded
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. USERS, PROFILES & ADDRESSES
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- references auth.users(id) in Supabase
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role user_role DEFAULT 'CUSTOMER',
  society_id UUID REFERENCES societies(id) ON DELETE SET NULL,
  flat_number VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  society_id UUID REFERENCES societies(id),
  flat_number VARCHAR(100) NOT NULL,
  wing_or_building VARCHAR(100),
  landmark VARCHAR(255),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. PROVIDERS & AVAILABILITY
-- ----------------------------------------------------------------------------
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id),
  description TEXT,
  avatar_url TEXT,
  phone VARCHAR(50),
  status provider_status DEFAULT 'PENDING',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  rating NUMERIC(3, 2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  completed_orders INT DEFAULT 0,
  on_time_rate NUMERIC(5, 2) DEFAULT 98.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provider_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- e.g. ID_PROOF, BUSINESS_LICENSE, ADDRESS_PROOF
  document_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provider_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, society_id)
);

CREATE TABLE provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slots_per_hour INT DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE
);

-- ----------------------------------------------------------------------------
-- 6. SERVICES & DYNAMIC PRICING
-- ----------------------------------------------------------------------------
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pricing_model pricing_model_type NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  unit_name VARCHAR(100), -- e.g. "per item", "per hour", "monthly", "inspection"
  is_subscription_supported BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_pricing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- e.g. "Wash & Fold", "Ironing", "Dry Cleaning"
  price NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'item',
  is_active BOOLEAN DEFAULT TRUE
);

-- ----------------------------------------------------------------------------
-- 7. COMMISSION RULES
-- ----------------------------------------------------------------------------
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_type commission_rule_type NOT NULL,
  target_id UUID, -- NULL for DEFAULT, category_id, service_id, or provider_id
  commission_percentage NUMERIC(5, 2) NOT NULL, -- e.g. 10.00
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. COUPONS & PROMOTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(10, 2) NOT NULL, -- 10% or ₹100
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  max_discount NUMERIC(10, 2), -- cap for percentage discounts
  usage_limit INT, -- overall uses
  per_user_limit INT DEFAULT 1,
  current_usage INT DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  society_id UUID REFERENCES societies(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID,
  discount_applied NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. ORDERS & STATE MACHINE
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  provider_id UUID REFERENCES providers(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  society_id UUID REFERENCES societies(id) ON DELETE RESTRICT,
  status order_status DEFAULT 'PENDING',
  scheduled_date DATE NOT NULL,
  scheduled_slot VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  special_instructions TEXT,
  
  -- Financials
  pricing_model pricing_model_type NOT NULL,
  item_quantity INT DEFAULT 1,
  subtotal NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) DEFAULT 20.00,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0.00,
  discount_source discount_source DEFAULT 'PLATFORM',
  total_amount NUMERIC(10, 2) NOT NULL,
  
  -- Commission & Payout
  commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  platform_commission NUMERIC(10, 2) NOT NULL,
  provider_earnings NUMERIC(10, 2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. SUBSCRIPTIONS (Recurring Services)
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  provider_id UUID REFERENCES providers(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  society_id UUID REFERENCES societies(id) ON DELETE RESTRICT,
  status subscription_status DEFAULT 'ACTIVE',
  frequency subscription_frequency NOT NULL,
  scheduled_time_slot VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  next_service_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  monthly_price NUMERIC(10, 2) NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscription_fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  fulfilled_at TIMESTAMPTZ,
  notes TEXT
);

-- ----------------------------------------------------------------------------
-- 11. PAYMENTS & REFUNDS (Razorpay)
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100) UNIQUE,
  razorpay_signature VARCHAR(255),
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status payment_status DEFAULT 'PENDING',
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PROCESSED',
  razorpay_refund_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. REVIEWS & TRUST SYSTEM
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. COMPLAINTS & SUPPORT TICKETS
-- ----------------------------------------------------------------------------
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status complaint_status DEFAULT 'OPEN',
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. ADMIN ACTIONS & AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  target_entity VARCHAR(100) NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 15. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_provider_id ON orders(provider_id);
CREATE INDEX idx_orders_society_id ON orders(society_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_provider_id ON subscriptions(provider_id);
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_complaints_status ON complaints(status);

-- ----------------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin());

CREATE POLICY "Customer can view own orders" ON orders
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() IN (SELECT user_id FROM providers WHERE id = orders.provider_id) OR is_admin());

CREATE POLICY "Customer can insert orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Provider or Admin can update orders" ON orders
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM providers WHERE id = orders.provider_id) OR is_admin());

CREATE POLICY "Customer and Provider can view subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() IN (SELECT user_id FROM providers WHERE id = subscriptions.provider_id) OR is_admin());

CREATE POLICY "Customer view own complaints" ON complaints
  FOR SELECT USING (auth.uid() = customer_id OR is_admin());

CREATE POLICY "Customer insert complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
