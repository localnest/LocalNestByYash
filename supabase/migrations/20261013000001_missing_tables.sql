-- ============================================================================
-- MIGRATION: 20261013000001_missing_tables.sql
-- Adds missing core operational tables: Chat, Wallet, Notifications,
-- Device Tokens, and Dynamic Fee Rules with Row-Level Security (RLS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHAT THREADS & MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('resident', 'provider', 'system', 'admin')),
  content TEXT NOT NULL,
  filtered BOOLEAN DEFAULT FALSE,
  filter_reason TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_order_id ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);

-- ----------------------------------------------------------------------------
-- 2. RESIDENT WALLET & LEDGER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  credit_balance NUMERIC(10, 2) DEFAULT 0.00 CHECK (credit_balance >= 0),
  lifetime_earned NUMERIC(10, 2) DEFAULT 0.00,
  streak_count INT DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE wallet_transaction_type AS ENUM (
  'EARN_3_PERCENT',
  'STREAK_BONUS',
  'REDEMPTION',
  'COMPENSATION',
  'EXPIRY',
  'REFUND'
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type wallet_transaction_type NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_resident ON wallet_transactions(resident_id);

-- ----------------------------------------------------------------------------
-- 3. GENERAL NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TYPE notification_channel AS ENUM ('IN_APP', 'PUSH', 'SMS', 'WHATSAPP');

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel notification_channel DEFAULT 'IN_APP',
  category TEXT DEFAULT 'ORDER_UPDATE',
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ----------------------------------------------------------------------------
-- 4. DEVICE TOKENS (Push Notification / FCM)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);

-- ----------------------------------------------------------------------------
-- 5. FEE RULES & CONVENIENCE TIERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fee_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  flat_convenience_fee NUMERIC(8, 2) DEFAULT 20.00,
  min_order_amount NUMERIC(8, 2) DEFAULT 100.00,
  free_travel_radius_km NUMERIC(5, 2) DEFAULT 2.00,
  travel_rate_per_km NUMERIC(6, 2) DEFAULT 15.00,
  max_travel_charge NUMERIC(8, 2) DEFAULT 100.00,
  surge_multiplier NUMERIC(3, 2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_rules ENABLE ROW LEVEL SECURITY;

-- Chat: only participants can view their messages
CREATE POLICY "Chat participants can read messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() IN (
    SELECT resident_id FROM chat_threads WHERE id = chat_messages.thread_id
  ));

-- Wallet: users can only see their own wallet balance and ledger
CREATE POLICY "Users view own wallet balance"
  ON wallet_balances FOR SELECT
  USING (auth.uid() = resident_id);

CREATE POLICY "Users view own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = resident_id);

-- Notifications: users see only their own notifications
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Device tokens: users manage their own tokens
CREATE POLICY "Users manage own device tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Fee rules: public read for active rules
CREATE POLICY "Public read fee rules"
  ON fee_rules FOR SELECT
  USING (is_active = TRUE);
