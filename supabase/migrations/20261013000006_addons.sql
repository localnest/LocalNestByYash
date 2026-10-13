-- ============================================================================
-- MIGRATION: 20261013000006_addons.sql
-- In-service add-ons, price caps, custom extras workflow, and RLS policies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES service_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  admin_max_price_cap NUMERIC(10, 2) NOT NULL CHECK (admin_max_price_cap >= price),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE addon_approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS order_addon_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES service_addons(id) ON DELETE SET NULL,
  addon_title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  status addon_approval_status DEFAULT 'PENDING',
  notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  resident_rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_addons_service ON service_addons(service_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_order ON order_addon_requests(order_id);

ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_addon_requests ENABLE ROW LEVEL SECURITY;

-- Service Addons: Public read for active add-ons
CREATE POLICY "Public read active service addons"
  ON service_addons FOR SELECT
  USING (is_active = TRUE);

-- Admin manage addons
CREATE POLICY "Admin manage service addons"
  ON service_addons FOR ALL
  USING (current_user_role() = 'ADMIN');

-- Order Addon Requests: Order participants can view
CREATE POLICY "Order participants view addon requests"
  ON order_addon_requests FOR SELECT
  USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()) OR
    current_user_role() = 'ADMIN'
  );

-- Providers can request add-ons for active orders
CREATE POLICY "Providers request addons"
  ON order_addon_requests FOR INSERT
  WITH CHECK (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

-- Residents can approve/reject add-on requests for their orders
CREATE POLICY "Residents respond to addon requests"
  ON order_addon_requests FOR UPDATE
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );
