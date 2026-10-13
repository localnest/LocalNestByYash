import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types.ts';
import { env } from '../env.ts';

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Creates or retrieves a typed Supabase browser client.
 * In mock mode, returns a client configured with fallback placeholders.
 */
export function createBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

  browserClient = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
