# Environment Architecture & Configuration Guide

This document defines the environment tiers, Supabase project isolation, and secret management policies for LocalNest.

---

## 1. Environments Overview

LocalNest operates across three distinct environments. Each environment has its own isolated infrastructure, database, and credentials.

| Environment           | Purpose                                    | Hosting / Execution                            | Database / Backend                        |
| :-------------------- | :----------------------------------------- | :--------------------------------------------- | :---------------------------------------- |
| **Local Development** | Day-to-day feature development and testing | Local machine (`npm run dev`)                  | Local Supabase CLI / Dev Supabase project |
| **Staging / Preview** | Integration testing, PR preview builds, QA | Preview deployments (e.g. Vercel Preview)      | Dedicated Staging Supabase project        |
| **Production**        | Live end-user service                      | Production deployment (e.g. Vercel Production) | Dedicated Production Supabase project     |

---

## 2. Supabase Project Isolation

To prevent test data from contaminating real data and avoid schema drift, each tier uses separate Supabase resources:

### Local (`local`)

- **Supabase Project:** Dev project or local Supabase emulator via Docker (`supabase start`).
- **Data Policy:** Mock/seed data only. Safe to reset (`npx supabase db reset`).
- **Configuration:** Set in `.env.local` (copied from `.env.example`).

### Staging / Preview (`staging`)

- **Supabase Project:** Dedicated `localnest-staging` project.
- **Data Policy:** Sanitized test data and QA test accounts. Never real customer or payment data.
- **Configuration:** Injected via deployment platform environment settings (Preview scope).

### Production (`production`)

- **Supabase Project:** Dedicated `localnest-production` project.
- **Data Policy:** Real customer data protected by strict Row-Level Security (RLS), Point-in-Time Recovery (PITR), and automated backups.
- **Configuration:** Injected via deployment platform environment settings (Production scope). Restricted admin access only.

---

## 3. Secret Storage & Sharing Policy

> [!CAUTION]
> **Zero-tolerance policy:** Never commit credentials, private keys, service role keys, or real tokens to Git, PR descriptions, issue trackers, or chat platforms (Slack, Discord, WhatsApp, etc.).

### Where Secrets Are Stored

1. **Local Developer Machines:**
   - Stored strictly in local `.env.local` files.
   - `.env.local` is ignored by git in `.gitignore`. Never use `git add -f` to force-track it.

2. **Team Secret Sharing:**
   - Secrets are distributed exclusively through the team's secure password manager / team vault (e.g., Bitwarden / 1Password).
   - Ask the team lead or repository administrator for vault access during onboarding.

3. **CI / GitHub Actions:**
   - Stored in GitHub Repository Secrets (`Settings > Secrets and variables > Actions`).
   - Only non-production automation tokens (e.g., `SONAR_TOKEN`) are configured here.

4. **Staging & Production Deployments:**
   - Managed directly in the hosting platform's environment settings (e.g., Vercel Project Settings > Environment Variables).
   - Access to view production secrets is restricted to project administrators.

---

## 4. Environment Variables Reference

| Variable Name                   | Scope           | Required In          | Description                                                 |
| :------------------------------ | :-------------- | :------------------- | :---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client & Server | Local, Staging, Prod | URL of the Supabase project instance                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Local, Staging, Prod | Public anon key for client-side API requests                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-Only     | Staging, Prod        | Admin key bypassing RLS (backend operations only)           |
| `RAZORPAY_KEY_ID`               | Server-Only     | Staging, Prod        | Razorpay key identifier for payments                        |
| `RAZORPAY_KEY_SECRET`           | Server-Only     | Staging, Prod        | Razorpay secret for authenticating payment APIs             |
| `RAZORPAY_WEBHOOK_SECRET`       | Server-Only     | Staging, Prod        | Secret for validating incoming webhook signatures           |
| `FCM_SERVER_CREDENTIALS`        | Server-Only     | Staging, Prod        | Firebase credentials for cloud messaging/push notifications |

> **Note on Next.js Scopes:**
>
> - Variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript. Only put public-facing endpoints and keys here.
> - Variables without `NEXT_PUBLIC_` are kept server-side and never exposed to browser clients.

---

## 5. Adding New Environment Variables

When a new environment variable is needed for a feature:

1. Add the variable to `.env.example` with clear documentation comments and a blank/placeholder value.
2. Document the variable in the table above in `docs/ENVIRONMENTS.md`.
3. Add the staging/production values to the team password vault and deployment dashboard.
4. Notify the team in PR review that a new variable is required for local testing.

---

## 6. Key Rotation & Leak Protocol

If a key is accidentally exposed in Git or chat:

1. **Immediately revoke the key** in the respective provider dashboard (Supabase, Razorpay, etc.).
2. Generate a new key and update the team password vault and hosting platform variables.
3. If committed to git history, rewrite repository history (using tools such as `git filter-repo` or BFG Repo-Cleaner) to purge the credential, or delete and recreate the repository if needed.
