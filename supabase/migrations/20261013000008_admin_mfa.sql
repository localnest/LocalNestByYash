-- ============================================================================
-- MIGRATION: 20261013000008_admin_mfa.sql
-- Administrative audit logging and role escalation security controls.
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_id);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view audit logs
CREATE POLICY "Admins view audit logs"
  ON admin_audit_logs FOR SELECT
  USING (current_user_role() = 'ADMIN');

-- System or authenticated admin can insert audit logs
CREATE POLICY "Admins insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (current_user_role() = 'ADMIN');
