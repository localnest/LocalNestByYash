/**
 * Typed Environment Variable Loader & Startup Validation
 * Ensures runtime safety and type-safe access across client and server.
 */

export interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  FCM_SERVER_CREDENTIALS?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  isMockMode: boolean;
  isSupabaseLive: boolean;
}

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvConfig;
}

const PLACEHOLDER_URL = 'https://your-project.supabase.co';
const PLACEHOLDER_KEY = 'your-anon-key';

function isPlaceholder(value: string | undefined, placeholder: string): boolean {
  return !value || value === placeholder;
}

function checkUrlValidity(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return `NEXT_PUBLIC_SUPABASE_URL must use http or https protocol (got: ${rawUrl})`;
    }
    return null;
  } catch {
    return `NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${rawUrl}"`;
  }
}

function checkClientLeaks(): string | null {
  if (typeof window !== 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'CRITICAL SECURITY: SUPABASE_SERVICE_ROLE_KEY is accessible on the client window!';
  }
  return null;
}

function buildEnvConfig(
  rawUrl: string | undefined,
  rawKey: string | undefined,
  isLive: boolean,
): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development';
  return {
    NEXT_PUBLIC_SUPABASE_URL: rawUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: rawKey,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID?.trim(),
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET?.trim(),
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET?.trim(),
    FCM_SERVER_CREDENTIALS: process.env.FCM_SERVER_CREDENTIALS?.trim(),
    NODE_ENV: nodeEnv,
    isMockMode: !isLive,
    isSupabaseLive: isLive,
  };
}

export function validateEnv(strict: boolean = false): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const isLive =
    !isPlaceholder(rawUrl, PLACEHOLDER_URL) &&
    !isPlaceholder(rawKey, PLACEHOLDER_KEY) &&
    Boolean(rawUrl);

  if (rawUrl && rawUrl !== PLACEHOLDER_URL) {
    const urlError = checkUrlValidity(rawUrl);
    if (urlError) errors.push(urlError);
  }

  if (strict && !isLive) {
    errors.push('Strict environment validation required live Supabase configuration.');
  } else if (!isLive) {
    warnings.push(
      'Running in local mock/demo mode. Supabase credentials are placeholder or unset.',
    );
  }

  const leakError = checkClientLeaks();
  if (leakError) errors.push(leakError);

  const config = buildEnvConfig(rawUrl, rawKey, isLive);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

// Global cached config
export const env = validateEnv(false).config;

export function getEnv(): EnvConfig {
  return env;
}
