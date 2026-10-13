import { createBrowserClient } from './client.ts';
import type { UserRole } from '../database.types.ts';

export interface AuthSessionUser {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  fullName: string;
}

export async function sendOtp(phoneOrEmail: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient();
  const isPhone = /^\+?[0-9]{10,14}$/.test(phoneOrEmail.replace(/[\s-]/g, ''));

  try {
    if (isPhone) {
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneOrEmail });
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email: phoneOrEmail });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send OTP' };
  }
}

export async function verifyOtp(
  phoneOrEmail: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient();
  const isPhone = /^\+?[0-9]{10,14}$/.test(phoneOrEmail.replace(/[\s-]/g, ''));

  try {
    if (isPhone) {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneOrEmail,
        token,
        type: 'sms',
      });
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.auth.verifyOtp({
        email: phoneOrEmail,
        token,
        type: 'email',
      });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to verify OTP' };
  }
}

export async function signInWithGoogle(
  redirectTo?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = redirectTo || `${origin}/auth/callback`;

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed Google sign-in' };
  }
}

export async function signOut(): Promise<void> {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}
