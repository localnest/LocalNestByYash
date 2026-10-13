# Admin Security, Role Escalation & MFA Guide

This document defines the security policies, Multi-Factor Authentication (MFA) requirements, and audit trail procedures for administrative users in LocalNest.

---

## 1. Multi-Factor Authentication (MFA) Requirement

All users with the `ADMIN` role must have Two-Factor Authentication (TOTP via Google Authenticator, 1Password, or Authy) enabled:

1. **Enrollment Flow:**
   - Admin logs in via email/password or magic link.
   - Application calls Supabase MFA enrollment API:
     ```typescript
     const { data, error } = await supabase.auth.mfa.enroll({
       factorType: 'totp',
     });
     ```
   - Admin scans QR code and enters 6-digit challenge code to verify.
2. **Session Level Enforcement:**
   - Supabase Auth provides Assurance Level `aal2` (Authenticator Assurance Level 2) for MFA-verified sessions.
   - All administrative actions require `aal2` verification.

---

## 2. Removing Hardcoded Admin in Production

- In local mock development mode, demo selectors in `AuthScreen.tsx` populate quick demo profiles for convenient pair programming.
- In staging and production environments (`NODE_ENV === 'production'`), demo credentials are disabled. Real admin accounts are provisioned exclusively via the Supabase Admin API with secure, randomly generated invitations and mandatory MFA.

---

## 3. Administrative Audit Log

All administrative actions (modifying commission rules, banning providers, issuing discretionary customer refunds, overriding dispatch claims) must be logged in the `admin_audit_logs` table for compliance and security auditing.
