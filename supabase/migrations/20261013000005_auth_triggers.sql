-- ============================================================================
-- MIGRATION: 20261013000005_auth_triggers.sql
-- Auth user creation trigger, profile provisioning, and role assignment.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'CUSTOMER';
  v_full_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Resident');
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'PROVIDER' THEN
    v_role := 'PROVIDER';
  ELSIF NEW.raw_user_meta_data->>'role' = 'ADMIN' THEN
    v_role := 'ADMIN';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    role,
    society_id,
    flat_number,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    v_full_name,
    v_role,
    (NEW.raw_user_meta_data->>'society_id')::UUID,
    NEW.raw_user_meta_data->>'flat_number',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
