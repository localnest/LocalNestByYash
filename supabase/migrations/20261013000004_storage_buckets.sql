-- ============================================================================
-- MIGRATION: 20261013000004_storage_buckets.sql
-- Storage buckets and private document access policies.
-- ============================================================================

-- Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('provider-documents', 'provider-documents', FALSE),
  ('service-images', 'service-images', TRUE),
  ('complaint-evidence', 'complaint-evidence', FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects for provider KYC documents
CREATE POLICY "Providers upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'provider-documents' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Providers and Admins read KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'provider-documents' AND (
      auth.uid()::TEXT = (storage.foldername(name))[1] OR
      current_user_role() = 'ADMIN'
    )
  );

-- Public read for service portfolio & dish images
CREATE POLICY "Public read service images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

CREATE POLICY "Verified providers upload service images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-images' AND
    auth.role() = 'authenticated'
  );
