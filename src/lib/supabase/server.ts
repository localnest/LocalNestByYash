import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types.ts';
import { env } from '../env.ts';

/**
 * Creates a typed Supabase server client for Route Handlers or Server Actions.
 * By default, uses anonKey. If useServiceRole is true, uses SUPABASE_SERVICE_ROLE_KEY.
 */
export function createServerClient(useServiceRole: boolean = false): SupabaseClient<Database> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
  const key = useServiceRole
    ? env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
    : env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
