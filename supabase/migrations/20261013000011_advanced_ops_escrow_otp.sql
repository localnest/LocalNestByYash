-- ==============================================================================
-- Migration: 20261013000011_advanced_ops_escrow_otp.sql
-- Description: Schema and tables for Door/Start/End OTP, Escrow Holds,
--              Cancellation Ledgers, Follow-up Visits, and Weekly Payouts.
-- ==============================================================================

-- 1. Extend Orders table with Start/End OTP and Photo URLs
ALTER TABLE IF EXISTS orders
ADD COLUMN IF NOT EXISTS door_otp_hash TEXT,
ADD COLUMN IF NOT EXISTS start_otp_hash TEXT,
ADD COLUMN IF NOT EXISTS end_otp_hash TEXT,
ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_book_same_provider BOOLEAN DEFAULT FALSE;

-- 2. Escrow Holds Table (S11.2, S11.4)
CREATE TABLE IF NOT EXISTS escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES providers(id),
  gross_amount NUMERIC(10, 2) NOT NULL,
  commission_rate NUMERIC(4, 2) NOT NULL,
  commission_amount NUMERIC(10, 2) NOT NULL,
  provider_payout_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'HELD_IN_ESCROW' CHECK (status IN ('HELD_IN_ESCROW', 'RELEASED_TO_PROVIDER', 'REFUNDED_TO_RESIDENT', 'HELD_IN_DISPUTE')),
  held_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

-- 3. Cancellation Ledger Table (N04.1, N04.2)
CREATE TABLE IF NOT EXISTS cancellation_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  cancelled_by_role TEXT NOT NULL CHECK (cancelled_by_role IN ('CUSTOMER', 'PROVIDER', 'ADMIN', 'SYSTEM')),
  user_id UUID REFERENCES profiles(id),
  reason_code TEXT NOT NULL,
  penalty_fee NUMERIC(10, 2) DEFAULT 0,
  refund_amount NUMERIC(10, 2) DEFAULT 0,
  provider_compensation NUMERIC(10, 2) DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Follow-up Visits Table (N05.1a, N05.1b)
CREATE TABLE IF NOT EXISTS followup_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id),
  resident_id UUID REFERENCES profiles(id),
  reason_case TEXT NOT NULL CHECK (reason_case IN ('PART_NEEDED', 'PROVIDER_FAULT', 'CUSTOMER_RESCHEDULED', 'MATERIALS_PENDING', 'FOLLOWUP_INSPECTION', 'WARRANTY_CLAIM')),
  state TEXT NOT NULL DEFAULT 'INITIAL_INCOMPLETE' CHECK (state IN ('INITIAL_INCOMPLETE', 'FOLLOWUP_SCHEDULED', 'FOLLOWUP_IN_PROGRESS', 'FOLLOWUP_COMPLETED', 'ESCALATED_DISPUTE', 'RESOLVED_REFUNDED')),
  part_cost NUMERIC(10, 2) DEFAULT 0,
  resident_extra_charge NUMERIC(10, 2) DEFAULT 0,
  provider_revisit_payout NUMERIC(10, 2) DEFAULT 0,
  scheduled_slot TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 5. Weekly Payout Ledger Table (S12.2)
CREATE TABLE IF NOT EXISTS weekly_payout_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id),
  payout_date DATE NOT NULL,
  total_gross NUMERIC(10, 2) NOT NULL,
  total_commission_deducted NUMERIC(10, 2) NOT NULL,
  penalty_dues_deducted NUMERIC(10, 2) DEFAULT 0,
  net_payout_paid NUMERIC(10, 2) NOT NULL,
  bank_account_masked TEXT NOT NULL,
  ifsc TEXT NOT NULL,
  utr_reference TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS) on all new tables
ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_payout_ledger ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Admins full access to escrow" ON escrow_holds
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Residents read own escrow" ON escrow_holds
  FOR SELECT TO authenticated
  USING (resident_id = auth.uid());

CREATE POLICY "Providers read own escrow" ON escrow_holds
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Admins full access to cancellation ledger" ON cancellation_ledger
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Users read own cancellations" ON cancellation_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access to followup visits" ON followup_visits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Parties view own followups" ON followup_visits
  FOR SELECT TO authenticated
  USING (resident_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY "Admins full access to weekly payout ledger" ON weekly_payout_ledger
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Providers view own payout ledger" ON weekly_payout_ledger
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid());
