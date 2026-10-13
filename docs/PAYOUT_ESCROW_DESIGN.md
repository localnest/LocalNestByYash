# Razorpay Escrow & Provider Payout Architecture

This document defines the payment lifecycle, escrow holding mechanisms, and provider payout settlement architecture for LocalNest using Razorpay in test and production modes.

---

## 1. Payment Lifecycle & Escrow Mechanics

In a hyperlocal services marketplace, trust between residents and service providers is maintained through an **Escrow Hold & Verification Model**:

```mermaid
sequenceDiagram
    autonumber
    actor Resident
    participant Platform as LocalNest Platform
    participant Escrow as Razorpay Escrow
    actor Provider

    Resident->>Platform: Books Service / Broadcasts Request
    Platform->>Escrow: Create Order & Authorize Payment (₹500)
    Escrow-->>Resident: Payment Successful (Status: HELD_IN_ESCROW)
    Platform->>Provider: Broadcasts Job to Eligible Providers
    Provider->>Platform: Claims Job & Arrives at Society
    Resident->>Provider: Provides Start OTP
    Provider->>Platform: Verifies Start OTP (Status: IN_PROGRESS)
    Provider->>Platform: Finishes Task; Requests Completion OTP
    Resident->>Provider: Provides Completion OTP
    Provider->>Platform: Verifies Completion OTP (Status: COMPLETED)
    Platform->>Escrow: Split & Release Funds:
    Note over Platform,Escrow: Deduct Platform Commission (10% = ₹50)<br/>Credit Provider Ledger (₹450)
    Platform->>Provider: Payout Transfer Initiated (Route / Fund Account)
```

---

## 2. Payout Models: Route vs. Manual Payouts

We evaluated two architectural designs for provider settlements:

### Model A: Razorpay Route (Linked Accounts) — **Recommended**

- **How it works:** Each service provider is onboarded as a Linked Account (`acc_xxxx`) under the LocalNest master merchant account.
- **Transfers:** Transfers are triggered automatically or programmatically upon Completion OTP verification.
- **Benefits:**
  - Zero manual accounting or manual bank entry errors.
  - Native split payments at checkout time with settlement holding (`hold: 1`).
  - Escrow release is as simple as releasing the transfer hold (`POST /v1/transfers/{id}/reversals` or setting `on_hold: false`).
  - Regulatory compliance with RBI marketplace guidelines.

### Model B: Razorpay Payouts (Current Account / Fund Accounts API)

- **How it works:** Resident payments collect into the master account; payouts are disbursed via RazorpayX APIs using UPI VPAs or Bank Accounts.
- **Trade-offs:** Requires a dedicated RazorpayX Current Account and manual balance top-ups. More complex for early-stage test mode.

---

## 3. Test-Mode Environment Configuration

During development and staging, Razorpay is run in **Test Mode**:

1. **Credentials Required:**
   - `RAZORPAY_KEY_ID`: `rzp_test_...`
   - `RAZORPAY_KEY_SECRET`: Secret key for signature generation
   - `RAZORPAY_WEBHOOK_SECRET`: Webhook verification secret

2. **Test Payment Cards & UPI:**
   - UPI: `success@razorpay` (instant success) or `failure@razorpay` (simulated failure).
   - Cards: Razorpay standard test card `4111 1111 1111 1111`, CVV `123`, any future expiry date.

---

## 4. Cancellation & Dispute Settlement Matrix

| Stage                             | Cancellation Actor | Escrow Handling                                      | Penalty / Fee                |
| :-------------------------------- | :----------------- | :--------------------------------------------------- | :--------------------------- |
| **Broadcasting (Unclaimed)**      | Resident           | 100% Instant Refund to Resident                      | ₹0                           |
| **Claimed (>1 hr before slot)**   | Resident           | 100% Refund to Resident Wallet                       | ₹0                           |
| **Claimed (<30 min before slot)** | Resident           | 85% Refund to Resident, 15% Provider Convenience Fee | ₹50 convenience charge       |
| **After Start OTP**               | Any Party          | Dispute frozen; Admin mediation required             | Pro-rated based on work done |
| **Provider No-Show**              | Resident / Auto    | 100% Refund + ₹50 Resident Wallet Credit             | Provider rating penalty      |
