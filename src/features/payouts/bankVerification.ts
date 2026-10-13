/**
 * Bank Details & Penny-Drop Verification Service
 * Validates Indian IFSC codes, account numbers, and simulates penny-drop verification.
 */

export interface BankAccountInput {
  providerId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface BankVerificationResult {
  valid: boolean;
  maskedAccount: string;
  accountNumberHash: string;
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
  referenceId?: string;
  failureReason?: string;
}

/**
 * Validates RBI IFSC code format (4 letters, 0, 6 alphanumeric characters).
 * Example: HDFC0001234, SBIN0004567
 */
export function validateIfsc(ifsc: string): boolean {
  if (!ifsc) return false;
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return regex.test(ifsc.trim().toUpperCase());
}

/**
 * Validates standard Indian bank account length (9 to 18 digits).
 */
export function validateAccountNumber(accountNumber: string): boolean {
  if (!accountNumber) return false;
  const clean = accountNumber.trim();
  return /^[0-9]{9,18}$/.test(clean);
}

/**
 * Masks account number for secure display, revealing only last 4 digits.
 */
export function maskAccountNumber(accountNumber: string): string {
  const clean = accountNumber.trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return '•'.repeat(Math.min(clean.length - 4, 8)) + last4;
}

/**
 * Generates pseudo-hash for duplicate detection without storing plain account numbers.
 */
export function hashAccountNumber(accountNumber: string): string {
  let hash = 0;
  const clean = accountNumber.trim();
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Performs penny-drop verification (via Razorpay Fund Account or local mock simulator).
 */
export async function verifyBankAccountPennyDrop(
  input: BankAccountInput,
): Promise<BankVerificationResult> {
  const isIfscValid = validateIfsc(input.ifscCode);
  if (!isIfscValid) {
    return {
      valid: false,
      maskedAccount: maskAccountNumber(input.accountNumber),
      accountNumberHash: hashAccountNumber(input.accountNumber),
      status: 'FAILED',
      failureReason:
        'Invalid IFSC code format (must be 11 characters starting with 4 letters and 0)',
    };
  }

  const isAccountValid = validateAccountNumber(input.accountNumber);
  if (!isAccountValid) {
    return {
      valid: false,
      maskedAccount: maskAccountNumber(input.accountNumber),
      accountNumberHash: hashAccountNumber(input.accountNumber),
      status: 'FAILED',
      failureReason: 'Account number must be between 9 and 18 numeric digits',
    };
  }

  // Simulate penny-drop verification success
  const referenceId = `pny_${Date.now().toString(36)}`;
  return {
    valid: true,
    maskedAccount: maskAccountNumber(input.accountNumber),
    accountNumberHash: hashAccountNumber(input.accountNumber),
    status: 'VERIFIED',
    referenceId,
  };
}
