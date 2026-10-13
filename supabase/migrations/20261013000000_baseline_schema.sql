-- ============================================================================
-- HYPERLOCAL SERVICES & RECURRING MARKETPLACE - DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Production-ready schema with Multi-Society Architecture, Dynamic Pricing Models,
-- Subscriptions, Order State Machine, Payments, Reviews, Complaints & RLS.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  'CUSTOM_QUOTATION',
  'TICK_WHAT_YOU_WANT',
  'LEAD_QUOTE'
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
  locality VARCHAR(100),
  pincode VARCHAR(20) NOT NULL,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
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
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
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
  monetization VARCHAR(20) NOT NULL DEFAULT 'COMMISSION'
    CHECK (monetization IN ('COMMISSION', 'MEMBERSHIP')),
  matching VARCHAR(20) NOT NULL DEFAULT 'DISPATCH'
    CHECK (matching IN ('DISPATCH', 'LEAD_QUOTE', 'BROWSE_ORDER', 'SUBSCRIPTION')),
  flat_commission_rate NUMERIC(5, 2),
  membership_monthly_fee NUMERIC(10, 2),
  membership_group_id VARCHAR(100),
  supports_one_off_dispatch BOOLEAN NOT NULL DEFAULT FALSE,
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
  max_orders_per_day INT DEFAULT 10,
  is_vacation_mode BOOLEAN NOT NULL DEFAULT FALSE,
  experience_years INT NOT NULL DEFAULT 0,
  average_acceptance_minutes NUMERIC(6, 2),
  acceptance_rate NUMERIC(5, 2),
  trust_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
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
  -- Service Area, Radius & Travel Charge Settings
  base_label VARCHAR(255),
  base_pincode VARCHAR(20),
  base_latitude NUMERIC(9, 6),
  base_longitude NUMERIC(9, 6),
  max_distance_km NUMERIC(5, 2) DEFAULT 10.00,
  coverage_mode VARCHAR(50) DEFAULT 'RADIUS', -- 'RADIUS' | 'SELECTED_SOCIETIES'
  excluded_society_ids UUID[] DEFAULT '{}',
  free_service_radius_km NUMERIC(5, 2) DEFAULT 0.00,
  travel_charge_per_km NUMERIC(6, 2) DEFAULT 0.00,
  max_travel_charge NUMERIC(6, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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
  travel_charge NUMERIC(10, 2) DEFAULT 0.00,
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

-- ----------------------------------------------------------------------------
-- 17. PROVIDER SERVICE AREA RLS
-- ----------------------------------------------------------------------------
ALTER TABLE provider_service_areas ENABLE ROW LEVEL SECURITY;

-- Anyone can view service areas (needed for provider discovery)
CREATE POLICY "Anyone can view service areas" ON provider_service_areas
  FOR SELECT USING (TRUE);

-- Providers can insert their own service area
CREATE POLICY "Provider can insert own service area" ON provider_service_areas
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_service_areas.provider_id)
  );

-- Providers can update only their own service area; admins can update any
CREATE POLICY "Provider or Admin can update service area" ON provider_service_areas
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_service_areas.provider_id)
    OR is_admin()
  );

-- Providers can delete only their own service area
CREATE POLICY "Provider can delete own service area" ON provider_service_areas
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_service_areas.provider_id)
    OR is_admin()
  );

-- ----------------------------------------------------------------------------
-- 18. SOCIETY SERVICE REQUESTS (Demand signals when no provider covers area)
-- ----------------------------------------------------------------------------
CREATE TABLE society_service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes TEXT,
  notify_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE society_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer can insert service request" ON society_service_requests
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customer or Admin can view service requests" ON society_service_requests
  FOR SELECT USING (auth.uid() = customer_id OR is_admin());

-- ----------------------------------------------------------------------------
-- 19. HAVERSINE DISTANCE FUNCTION
-- Returns the great-circle distance in kilometres between two lat/lng points.
-- Uses the Haversine formula. Does NOT require PostGIS.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION haversine_distance_km(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  R  NUMERIC := 6371.0;  -- Earth radius in km
  d_lat NUMERIC;
  d_lon NUMERIC;
  a  NUMERIC;
  c  NUMERIC;
BEGIN
  d_lat := RADIANS(lat2 - lat1);
  d_lon := RADIANS(lon2 - lon1);
  a := SIN(d_lat / 2) ^ 2
       + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(d_lon / 2) ^ 2;
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  RETURN ROUND((R * c)::NUMERIC, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Index to support distance-based lookups on societies
CREATE INDEX idx_societies_coordinates ON societies (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 14. UBER-STYLE DISPATCH, SERVICE TYPES & MEMBERSHIP EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE TYPE category_monetization_type AS ENUM ('COMMISSION', 'MEMBERSHIP');
CREATE TYPE category_matching_type AS ENUM ('DISPATCH', 'LEAD_QUOTE', 'BROWSE_ORDER', 'SUBSCRIPTION');
CREATE TYPE job_request_status_type AS ENUM ('OPEN', 'CLAIMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE membership_status_type AS ENUM ('TRIAL', 'ACTIVE', 'GRACE', 'LAPSED');
CREATE TYPE lead_quote_status_type AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- Service Types Catalog (Platform-Level Master Catalog)
CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  pricing_model pricing_model_type NOT NULL DEFAULT 'FIXED',
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  estimated_duration_minutes INT NOT NULL DEFAULT 60,
  available_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  size_bands JSONB NOT NULL DEFAULT '[]'::jsonb,
  tier VARCHAR(50) DEFAULT 'BASIC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_service_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (provider_id, service_type_id)
);

-- Provider Memberships (Compulsory monthly plan for membership categories)
CREATE TABLE IF NOT EXISTS provider_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category_group_id VARCHAR(100) NOT NULL,
  status membership_status_type NOT NULL DEFAULT 'TRIAL',
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 799.00,
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '60 days',
  current_billing_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_billing_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  grace_period_ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_method_last4 VARCHAR(4),
  invoices JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, category_group_id)
);

CREATE TABLE IF NOT EXISTS provider_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_group_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  monthly_fee NUMERIC(10, 2) NOT NULL,
  trial_days INT NOT NULL DEFAULT 60,
  grace_period_days INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Job Requests (Broadcast dispatch requests)
CREATE TABLE IF NOT EXISTS job_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number VARCHAR(50) UNIQUE NOT NULL,
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_number VARCHAR(50) NOT NULL,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resident_phone_masked VARCHAR(50) NOT NULL,
  service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  pricing_model pricing_model_type NOT NULL DEFAULT 'FIXED',
  request_type VARCHAR(20) NOT NULL DEFAULT 'DISPATCH' CHECK (request_type IN ('DISPATCH', 'LEAD')),
  request_notes TEXT,
  status job_request_status_type NOT NULL DEFAULT 'OPEN',
  selected_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  size_band_input VARCHAR(100),
  dish_notes TEXT,
  kitchen_readiness_confirmed BOOLEAN DEFAULT false,
  stylist_gender_preference VARCHAR(20) DEFAULT 'ANY',
  scheduled_date DATE NOT NULL,
  scheduled_slot VARCHAR(50) NOT NULL,
  estimated_duration_minutes INT NOT NULL DEFAULT 60,
  locked_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_resident_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  platform_commission NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  provider_payout NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  resident_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  quantity INT NOT NULL DEFAULT 1,
  notified_provider_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  excluded_provider_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  claimed_by_provider_id UUID REFERENCES providers(id),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  order_id UUID REFERENCES orders(id),
  rejection_reason TEXT,
  cancelled_by VARCHAR(50),
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_dispatch_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  job_request_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'VIEWED', 'CLAIMED', 'EXPIRED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, job_request_id)
);

CREATE TABLE IF NOT EXISTS job_request_otps (
  job_request_id UUID PRIMARY KEY REFERENCES job_requests(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  door_otp_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring Schedules (Resident-owned, provider-decoupled)
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_number VARCHAR(50) UNIQUE NOT NULL,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  flat_number VARCHAR(50) NOT NULL,
  service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  frequency subscription_frequency NOT NULL DEFAULT 'DAILY',
  preferred_slot VARCHAR(50) NOT NULL,
  selected_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  size_band_input VARCHAR(100),
  dish_notes TEXT,
  kitchen_readiness_confirmed BOOLEAN NOT NULL DEFAULT false,
  stylist_gender_preference VARCHAR(20) DEFAULT 'ANY',
  resident_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  locked_price_per_visit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  provider_payout_per_visit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  next_dispatch_date DATE NOT NULL,
  last_dispatched_job_id UUID REFERENCES job_requests(id),
  history_job_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  history_order_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead Quotes (For lead/quote categories: Interior, Painting, Civil, Carpentry, Movers)
CREATE TABLE IF NOT EXISTS lead_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  provider_name VARCHAR(255) NOT NULL DEFAULT 'Verified provider',
  provider_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  provider_experience_years INT NOT NULL DEFAULT 0,
  quoted_amount NUMERIC(10,2) NOT NULL,
  estimated_days INT NOT NULL,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope_notes TEXT,
  status lead_quote_status_type NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tiffin_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  society_ids UUID[] NOT NULL,
  meal_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  delivery_date DATE NOT NULL,
  cutoff_at TIMESTAMPTZ NOT NULL,
  available_quantity INT NOT NULL CHECK (available_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_type_id UUID REFERENCES service_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_request_id UUID REFERENCES job_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_door_otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cook_missing_ingredients BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meal_photo_url TEXT;

ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_dispatch_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_request_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiffin_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents and notified providers can view dispatch jobs" ON job_requests
  FOR SELECT USING (
    resident_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM providers provider
      WHERE provider.user_id = auth.uid()
        AND notified_provider_ids ? provider.id::TEXT
    )
  );

CREATE POLICY "Residents can create their dispatch jobs" ON job_requests
  FOR INSERT WITH CHECK (resident_id = auth.uid());

CREATE POLICY "Providers can view their dispatch notifications" ON provider_dispatch_notifications
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM providers provider
      WHERE provider.id = provider_dispatch_notifications.provider_id
        AND provider.user_id = auth.uid()
    )
  );

CREATE POLICY "Residents and admins can view their door OTP" ON job_request_otps
  FOR SELECT USING (resident_id = auth.uid() OR is_admin());

CREATE POLICY "Society residents can view available Tiffin menus" ON tiffin_menus
  FOR SELECT USING (
    is_admin()
    OR (is_active AND EXISTS (
      SELECT 1 FROM profiles resident
      WHERE resident.id = auth.uid()
        AND resident.society_id = ANY(tiffin_menus.society_ids)
    ))
  );

CREATE POLICY "Tiffin providers manage their menus" ON tiffin_menus
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM providers provider
      WHERE provider.id = tiffin_menus.provider_id
        AND provider.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM providers provider
      WHERE provider.id = tiffin_menus.provider_id
        AND provider.user_id = auth.uid()
        AND provider.status = 'VERIFIED'
    )
  );

-- Conditional Atomic Claim RPC Function
-- First-writer-wins; returns updated row or NULL if already claimed/expired.
CREATE OR REPLACE FUNCTION verify_job_door_otp(
  p_order_id UUID,
  p_entered_otp TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE orders AS order_row
  SET is_door_otp_verified = TRUE,
      status = 'IN_PROGRESS',
      updated_at = NOW()
  FROM job_requests job
  JOIN providers provider ON provider.id = job.claimed_by_provider_id
  JOIN job_request_otps otp
    ON otp.job_request_id = job.id
   AND otp.resident_id = job.resident_id
  WHERE order_row.id = p_order_id
    AND order_row.job_request_id = job.id
    AND order_row.status = 'ACCEPTED'
    AND provider.user_id = auth.uid()
    AND crypt(p_entered_otp, otp.door_otp_hash) = otp.door_otp_hash;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION claim_job_request(
  p_job_id UUID,
  p_provider_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  claimed_job_id UUID,
  created_order_id UUID,
  provider_payout NUMERIC
) AS $$
DECLARE
  v_job RECORD;
  v_order_id UUID;
BEGIN
  -- The notification and capability checks prevent stale or forged claims.
  UPDATE job_requests
  SET status = 'CLAIMED',
      claimed_by_provider_id = p_provider_id,
      claimed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_job_id
    AND request_type = 'DISPATCH'
    AND status = 'OPEN'
    AND expires_at > NOW()
    AND notified_provider_ids ? p_provider_id::TEXT
    AND EXISTS (
      SELECT 1
      FROM providers p
      JOIN profiles profile ON profile.id = p.user_id
      JOIN provider_service_capabilities capability
        ON capability.provider_id = p.id
       AND capability.service_type_id = job_requests.service_type_id
      WHERE p.id = p_provider_id
        AND profile.id = auth.uid()
        AND p.status = 'VERIFIED'
        AND p.is_vacation_mode = FALSE
        AND capability.task_ids @> job_requests.selected_task_ids
    )
    AND EXISTS (
      SELECT 1
      FROM categories category
      WHERE category.id = job_requests.category_id
        AND (
          category.monetization = 'COMMISSION'
          OR EXISTS (
            SELECT 1
            FROM provider_memberships membership
            WHERE membership.provider_id = p_provider_id
              AND membership.category_group_id = category.membership_group_id
              AND (
                membership.status = 'ACTIVE'
                OR (membership.status = 'TRIAL' AND membership.trial_ends_at > NOW())
                OR (membership.status = 'GRACE' AND membership.grace_period_ends_at > NOW())
              )
          )
        )
    )
  RETURNING * INTO v_job;

  IF FOUND THEN
    v_order_id := uuid_generate_v4();

    INSERT INTO orders (
      id, order_number, customer_id, provider_id, service_type_id, society_id,
      status, scheduled_date, scheduled_slot, delivery_address, special_instructions,
      pricing_model, item_quantity, subtotal, platform_fee, discount_amount,
      discount_source, total_amount, commission_percentage, platform_commission,
      provider_earnings, job_request_id, is_door_otp_verified, created_at, updated_at
    ) VALUES (
      v_order_id,
      'ORD-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', '') FROM 1 FOR 12)),
      v_job.resident_id,
      p_provider_id,
      v_job.service_type_id,
      v_job.society_id,
      'ACCEPTED',
      v_job.scheduled_date,
      v_job.scheduled_slot,
      v_job.flat_number || ', ' || (SELECT society.name FROM societies society WHERE society.id = v_job.society_id),
      CONCAT_WS(E'\n',
        v_job.dish_notes,
        v_job.request_notes,
        CASE WHEN v_job.resident_preferences <> '{}'::jsonb
          THEN 'Household preferences: ' || v_job.resident_preferences::TEXT
        END
      ),
      v_job.pricing_model,
      GREATEST(1, jsonb_array_length(v_job.selected_task_ids)),
      v_job.locked_subtotal,
      v_job.platform_fee,
      0,
      'PLATFORM',
      v_job.total_resident_price,
      CASE WHEN v_job.locked_subtotal > 0
        THEN ROUND(v_job.platform_commission * 100 / v_job.locked_subtotal, 2)
        ELSE 0
      END,
      v_job.platform_commission,
      v_job.provider_payout,
      v_job.id,
      FALSE,
      NOW(),
      NOW()
    );

    UPDATE job_requests SET order_id = v_order_id, updated_at = NOW() WHERE id = v_job.id;
    UPDATE provider_dispatch_notifications
    SET status = CASE WHEN provider_id = p_provider_id THEN 'CLAIMED' ELSE 'EXPIRED' END
    WHERE job_request_id = v_job.id;
    RETURN QUERY SELECT true, v_job.id, v_order_id, v_job.provider_payout;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 0.00::NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
