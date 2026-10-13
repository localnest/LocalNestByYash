-- ============================================================================
-- MIGRATION: 20261013000003_comprehensive_rls.sql
-- Comprehensive Row Level Security (RLS) policies across all domain tables.
-- ============================================================================

-- Helper functions for role and society checking
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_society()
RETURNS UUID AS $$
  SELECT society_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. PROFILES RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- 2. PROVIDERS RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view verified providers" ON providers;
CREATE POLICY "Public view verified providers"
  ON providers FOR SELECT
  USING (status = 'VERIFIED' OR user_id = auth.uid() OR current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Providers manage own profile" ON providers;
CREATE POLICY "Providers manage own profile"
  ON providers FOR UPDATE
  USING (user_id = auth.uid());

-- 3. ORDERS RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view orders" ON orders;
CREATE POLICY "Participants view orders"
  ON orders FOR SELECT
  USING (
    customer_id = auth.uid() OR
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    current_user_role() = 'ADMIN'
  );

DROP POLICY IF EXISTS "Customers create orders" ON orders;
CREATE POLICY "Customers create orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Participants update orders" ON orders;
CREATE POLICY "Participants update orders"
  ON orders FOR UPDATE
  USING (
    customer_id = auth.uid() OR
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    current_user_role() = 'ADMIN'
  );

-- 4. JOB REQUESTS (DISPATCH) RLS
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Residents view own job requests" ON job_requests;
CREATE POLICY "Residents view own job requests"
  ON job_requests FOR SELECT
  USING (
    resident_id = auth.uid() OR
    (status = 'OPEN' AND EXISTS (
      SELECT 1 FROM providers p WHERE p.user_id = auth.uid() AND p.status = 'VERIFIED'
    )) OR
    claimed_by_provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    current_user_role() = 'ADMIN'
  );

DROP POLICY IF EXISTS "Residents insert job requests" ON job_requests;
CREATE POLICY "Residents insert job requests"
  ON job_requests FOR INSERT
  WITH CHECK (resident_id = auth.uid());

-- 5. REVIEWS & COMPLAINTS RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = TRUE OR customer_id = auth.uid());

CREATE POLICY "Residents create reviews"
  ON reviews FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Residents view own complaints"
  ON complaints FOR SELECT
  USING (
    customer_id = auth.uid() OR
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    current_user_role() = 'ADMIN'
  );

CREATE POLICY "Residents file complaints"
  ON complaints FOR INSERT
  WITH CHECK (customer_id = auth.uid());
