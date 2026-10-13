# LocalNest API & Database Contract Specification

This document formally specifies the RPC and Edge Function contracts for core platform operations. All client code and backend implementations must adhere to these schemas, parameter types, response formats, and error codes.

---

## 1. Overview & Architecture Standards

- **Protocols:** Supabase Database RPCs (PostgreSQL functions executed over PostgREST) and Supabase Edge Functions (Deno/TypeScript for third-party payment/messaging integrations).
- **Authentication:** All requests require a valid Supabase JWT Bearer token unless explicitly marked public.
- **Error Format:** Every function returns a standard structured error payload upon failure:
  ```json
  {
    "error": {
      "code": "STRING_CONSTANT_ERROR_CODE",
      "message": "Human-readable explanation",
      "details": {}
    }
  }
  ```

---

## 2. Dispatch & Job Claiming Contracts

### 2.1 `rpc/claim_job_request`

Performs an atomic, concurrency-safe claim on an open job request. Uses PostgreSQL row-level locking (`SELECT ... FOR UPDATE SKIP LOCKED`) ensuring first-writer-wins semantics.

- **Type:** Supabase RPC (PostgreSQL Function)
- **Role Required:** `authenticated` (Provider role)
- **Parameters:**
  ```typescript
  interface ClaimJobRequestParams {
    p_job_id: string; // UUID of the job_requests row
    p_provider_id: string; // UUID of the claiming provider
    p_claim_timeout_seconds?: number; // Optional hold timeout (default: 120s)
  }
  ```
- **Success Response (200 OK):**
  ```typescript
  interface ClaimJobResponse {
    success: true;
    job_id: string;
    provider_id: string;
    status: 'CLAIMED';
    claimed_at: string; // ISO 8601 UTC
    expires_at: string; // ISO 8601 UTC
  }
  ```
- **Error Codes:**
  | Error Code             | HTTP Status     | Description                                                           |
  | :--------------------- | :-------------- | :-------------------------------------------------------------------- |
  | `ALREADY_CLAIMED`      | 409 Conflict    | Job has already been claimed by another provider.                     |
  | `JOB_EXPIRED`          | 410 Gone        | Job broadcasting window expired before claim was received.            |
  | `PROVIDER_UNAVAILABLE` | 400 Bad Request | Provider is on vacation, suspended, or has exceeded daily job limits. |
  | `RADIUS_MISMATCH`      | 403 Forbidden   | Society is outside the provider's active geographic radius.           |

---

## 3. OTP Verification Contracts

### 3.1 `rpc/generate_job_otp`

Generates a cryptographically random 4-digit or 6-digit OTP for starting or completing a service.

- **Parameters:**
  ```typescript
  interface GenerateOtpParams {
    p_job_id: string;
    p_otp_type: 'START' | 'COMPLETE';
  }
  ```
- **Success Response (200 OK):**
  ```typescript
  interface GenerateOtpResponse {
    success: true;
    job_id: string;
    otp_type: 'START' | 'COMPLETE';
    expires_at: string;
  }
  ```

### 3.2 `rpc/verify_job_otp`

Validates the user-provided OTP against the hashed value stored in `job_request_otps`.

- **Parameters:**
  ```typescript
  interface VerifyOtpParams {
    p_job_id: string;
    p_otp_type: 'START' | 'COMPLETE';
    p_otp_code: string; // 4-digit numeric string
  }
  ```
- **Success Response (200 OK):**
  ```typescript
  interface VerifyOtpResponse {
    success: true;
    job_id: string;
    new_status: 'IN_PROGRESS' | 'COMPLETED';
    verified_at: string;
  }
  ```
- **Error Codes:**
  | Error Code              | HTTP Status           | Description                                  |
  | :---------------------- | :-------------------- | :------------------------------------------- |
  | `INVALID_OTP`           | 400 Bad Request       | Supplied OTP does not match.                 |
  | `OTP_EXPIRED`           | 410 Gone              | OTP validity window (15 mins) has lapsed.    |
  | `MAX_ATTEMPTS_EXCEEDED` | 429 Too Many Requests | Exceeded 5 failed attempts; OTP invalidated. |

---

## 4. Cancellation & Dispute Contracts

### 4.1 `rpc/cancel_booking`

Cancels a scheduled booking and calculates penalty/refund ledger entries based on lead time.

- **Parameters:**
  ```typescript
  interface CancelBookingParams {
    p_booking_id: string;
    p_actor_id: string;
    p_actor_role: 'resident' | 'provider' | 'admin';
    p_reason: string;
  }
  ```
- **Success Response (200 OK):**
  ```typescript
  interface CancelBookingResponse {
    success: true;
    booking_id: string;
    status: 'CANCELLED';
    refund_amount: number;
    penalty_fee: number;
    refund_target: 'WALLET' | 'ORIGINAL_PAYMENT';
  }
  ```
- **Error Codes:**
  | Error Code           | HTTP Status     | Description                                         |
  | :------------------- | :-------------- | :-------------------------------------------------- |
  | `ALREADY_STARTED`    | 400 Bad Request | Cannot cancel job once start OTP has been verified. |
  | `UNAUTHORIZED_ACTOR` | 403 Forbidden   | Requesting user is not a party to this booking.     |

---

## 5. Follow-Up & In-Service Add-Ons

### 5.1 `rpc/request_addon`

Provider requests an additional fee/task during an active job (e.g. extra room cleaning, replacement part).

- **Parameters:**
  ```typescript
  interface RequestAddonParams {
    p_booking_id: string;
    p_provider_id: string;
    p_title: string;
    p_amount: number;
    p_description?: string;
  }
  ```
- **Success Response:**
  ```typescript
  interface RequestAddonResponse {
    addon_id: string;
    status: 'PENDING_APPROVAL';
    amount: number;
  }
  ```

### 5.2 `rpc/approve_addon`

Resident accepts an in-service addon and authorizes payment hold.

- **Parameters:**
  ```typescript
  interface ApproveAddonParams {
    p_addon_id: string;
    p_resident_id: string;
    p_payment_method: 'WALLET' | 'ONLINE' | 'CASH';
  }
  ```

---

## 6. Provider Payout & Settlement

### 6.1 `functions/v1/process-provider-payout` (Edge Function)

Processes scheduled weekly or on-demand payouts via Razorpay Route / Fund Accounts.

- **Parameters:**
  ```typescript
  interface ProcessPayoutParams {
    provider_id: string;
    payout_type: 'WEEKLY_CYCLE' | 'INSTANT_ON_DEMAND';
    amount: number;
  }
  ```
- **Success Response (200 OK):**
  ```typescript
  interface ProcessPayoutResponse {
    payout_id: string;
    transfer_id: string;
    net_payout: number;
    platform_commission_deducted: number;
    status: 'QUEUED' | 'PROCESSED';
  }
  ```
- **Error Codes:**
  | Error Code             | Description                                                     |
  | :--------------------- | :-------------------------------------------------------------- |
  | `BELOW_MINIMUM_PAYOUT` | Balance is below the minimum threshold (₹500).                  |
  | `KYC_NOT_VERIFIED`     | Bank account or UPI VPA has not passed penny-drop verification. |
  | `ACCOUNT_SUSPENDED`    | Provider account has active disciplinary sanctions.             |

---

## 7. Customer Support & Complaints

### 7.1 `rpc/file_complaint`

Files a structured dispute with categorization, descriptions, and optional evidence attachments.

- **Parameters:**
  ```typescript
  interface FileComplaintParams {
    p_booking_id: string;
    p_complainant_id: string;
    p_category: 'POOR_SERVICE' | 'NO_SHOW' | 'OVERCHARGED' | 'OFF_PLATFORM_SOLICITATION' | 'OTHER';
    p_description: string;
    p_evidence_urls?: string[];
  }
  ```
- **Success Response:**
  ```typescript
  interface FileComplaintResponse {
    complaint_id: string;
    status: 'OPEN';
    created_at: string;
  }
  ```
