/**
 * Supabase Client Initialization & Typed Helpers
 * Re-exports browser and server clients with full TypeScript schema types.
 */

export * from './supabase/client.ts';
export * from './supabase/server.ts';
export type * from './database.types.ts';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof process !== 'undefined' &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'
  );
};

export const getSupabaseConfig = () => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    isLive: isSupabaseConfigured(),
  };
};
