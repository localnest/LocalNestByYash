-- ============================================================================
-- MIGRATION: 20261013000009_bank_penny_drop.sql
-- Provider bank details and penny-drop bank account verification.
-- ============================================================================

CREATE TYPE bank_verification_status AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW');

CREATE TABLE IF NOT EXISTS provider_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE UNIQUE,
  account_holder_name TEXT NOT NULL,
  account_number_hash TEXT NOT NULL,
  masked_account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  verification_status bank_verification_status DEFAULT 'PENDING',
  penny_drop_reference TEXT,
  beneficiary_match_score NUMERIC(5, 2),
  failure_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_provider ON provider_bank_accounts(provider_id);

ALTER TABLE provider_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Providers view their own bank details
CREATE POLICY "Providers view own bank account"
  ON provider_bank_accounts FOR SELECT
  USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    current_user_role() = 'ADMIN'
  );

-- Providers insert own bank account
CREATE POLICY "Providers insert own bank account"
  ON provider_bank_accounts FOR INSERT
  WITH CHECK (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

-- Providers update own bank account if pending/failed
CREATE POLICY "Providers update own bank account"
  ON provider_bank_accounts FOR UPDATE
  USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()) OR
    current_user_role() = 'ADMIN'
  );
