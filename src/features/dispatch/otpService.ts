import { createHash, randomInt } from 'crypto';

export interface OtpRecord {
  orderId: string;
  type: 'DOOR' | 'START' | 'END';
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  expiresAt: string; // ISO String
  createdAt: string;
}

export interface VerifyOtpResult {
  valid: boolean;
  attemptsRemaining: number;
  error?: string;
}

/**
 * Computes a secure SHA-256 hash of the plain OTP combined with order salt.
 */
export function hashOtp(plainOtp: string, salt: string): string {
  return createHash('sha256').update(`${plainOtp}:${salt}`).digest('hex');
}

/**
 * Generates a random 4-digit numeric OTP and its corresponding SHA-256 hash.
 */
export function generateOtp(
  orderId: string,
  type: 'DOOR' | 'START' | 'END',
  validityMinutes = 60,
): { plainOtp: string; record: OtpRecord } {
  const plainOtp = randomInt(1000, 10000).toString();
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();
  const otpHash = hashOtp(plainOtp, orderId);

  const record: OtpRecord = {
    orderId,
    type,
    otpHash,
    attempts: 0,
    maxAttempts: 3,
    verified: false,
    expiresAt,
    createdAt,
  };

  return { plainOtp, record };
}

/**
 * Server-side verification for OTP with attempt limits and expiry validation.
 */
export function verifyOtp(
  record: OtpRecord,
  enteredOtp: string,
  nowIso = new Date().toISOString(),
): { updatedRecord: OtpRecord; result: VerifyOtpResult } {
  const updated: OtpRecord = { ...record };

  // 1. Check if already verified
  if (updated.verified) {
    return {
      updatedRecord: updated,
      result: { valid: true, attemptsRemaining: updated.maxAttempts - updated.attempts },
    };
  }

  // 2. Check if attempts exceeded
  if (updated.attempts >= updated.maxAttempts) {
    return {
      updatedRecord: updated,
      result: {
        valid: false,
        attemptsRemaining: 0,
        error: 'MAX_ATTEMPTS_EXCEEDED: OTP locked for safety. Please request a new OTP.',
      },
    };
  }

  // 3. Check expiration
  if (new Date(nowIso) > new Date(updated.expiresAt)) {
    return {
      updatedRecord: updated,
      result: {
        valid: false,
        attemptsRemaining: updated.maxAttempts - updated.attempts,
        error: 'OTP_EXPIRED: The verification code has expired.',
      },
    };
  }

  // 4. Verify candidate hash
  updated.attempts += 1;
  const candidateHash = hashOtp(enteredOtp.trim(), updated.orderId);

  if (candidateHash === updated.otpHash) {
    updated.verified = true;
    return {
      updatedRecord: updated,
      result: {
        valid: true,
        attemptsRemaining: updated.maxAttempts - updated.attempts,
      },
    };
  }

  const remaining = Math.max(0, updated.maxAttempts - updated.attempts);
  return {
    updatedRecord: updated,
    result: {
      valid: false,
      attemptsRemaining: remaining,
      error:
        remaining > 0
          ? `INVALID_OTP: ${remaining} attempt(s) remaining.`
          : 'MAX_ATTEMPTS_EXCEEDED: OTP locked.',
    },
  };
}

/**
 * Fallback mechanism: Email OTP generator when SMS/network is degraded at tower entry.
 */
export function generateEmailOtpFallback(
  orderId: string,
  residentEmail: string,
): { plainOtp: string; fallbackNotice: string } {
  const plainOtp = randomInt(1000, 10000).toString();
  return {
    plainOtp,
    fallbackNotice: `Backup entry code dispatched to registered resident email: ${residentEmail}`,
  };
}
