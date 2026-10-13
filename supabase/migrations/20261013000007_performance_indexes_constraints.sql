-- ============================================================================
-- MIGRATION: 20261013000007_performance_indexes_constraints.sql
-- High-throughput query performance indexes, foreign key constraints, and check guards.
-- ============================================================================

-- 1. QUERY PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_provider_status ON orders(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders(scheduled_date, scheduled_slot);

CREATE INDEX IF NOT EXISTS idx_job_requests_dispatch ON job_requests(society_id, status)
  WHERE status IN ('OPEN', 'CLAIMED');

CREATE INDEX IF NOT EXISTS idx_providers_catalog ON providers(category_id, status, rating DESC)
  WHERE status = 'VERIFIED';

CREATE INDEX IF NOT EXISTS idx_reviews_provider_rating ON reviews(provider_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_status ON subscriptions(customer_id, status);

-- 2. DOMAIN CHECK CONSTRAINTS
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS chk_review_rating_range,
  ADD CONSTRAINT chk_review_rating_range CHECK (rating >= 1.0 AND rating <= 5.0);

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS chk_order_amounts_positive,
  ADD CONSTRAINT chk_order_amounts_positive CHECK (
    subtotal >= 0 AND platform_fee >= 0 AND total_amount >= 0 AND provider_earnings >= 0
  );

ALTER TABLE job_requests
  DROP CONSTRAINT IF EXISTS chk_job_request_amounts_positive,
  ADD CONSTRAINT chk_job_request_amounts_positive CHECK (
    locked_subtotal >= 0 AND total_resident_price >= 0
  );

ALTER TABLE providers
  DROP CONSTRAINT IF EXISTS chk_provider_radius_valid,
  ADD CONSTRAINT chk_provider_radius_valid CHECK (coverage_radius_km > 0 AND coverage_radius_km <= 50);
