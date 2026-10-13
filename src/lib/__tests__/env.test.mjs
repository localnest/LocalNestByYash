import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../env.ts';

test('Env Validation: detects mock mode when env vars are default/unset', () => {
  const result = validateEnv(false);
  assert.equal(result.valid, true);
  assert.equal(result.config.isMockMode, true);
  assert.equal(result.config.isSupabaseLive, false);
  assert.ok(result.warnings.length > 0);
});

test('Env Validation: fails invalid URL protocol', () => {
  const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'ftp://invalid-domain.com';
    const result = validateEnv(false);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('protocol')));
  } finally {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = original;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  }
});

test('Env Validation: passes valid HTTPS URL', () => {
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefgh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'real-anon-key-12345';
    const result = validateEnv(true);
    assert.equal(result.valid, true);
    assert.equal(result.config.isMockMode, false);
    assert.equal(result.config.isSupabaseLive, true);
  } finally {
    if (origUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (origKey !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
});
