-- ============================================================================
-- MIGRATION: 20261013000002_consent_records.sql
-- Consent documents versioning, terms acceptance audit trail, and RLS policies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_consent_slug_version UNIQUE (slug, version)
);

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES consent_documents(id) ON DELETE RESTRICT,
  version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_document_version UNIQUE (user_id, document_id, version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_docs_active ON consent_documents(slug) WHERE is_active = TRUE;

ALTER TABLE consent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Public can read active terms and privacy policies
CREATE POLICY "Public read active consent documents"
  ON consent_documents FOR SELECT
  USING (is_active = TRUE);

-- Users can view their own consent audit history
CREATE POLICY "Users view own consents"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can record their acceptance
CREATE POLICY "Users insert own consents"
  ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
