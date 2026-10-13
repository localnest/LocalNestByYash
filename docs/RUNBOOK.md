# LocalNest Engineering Operations Runbook

This runbook documents standard developer operating procedures, environment initialization, database migration execution, and staging deployments.

---

## 1. Quick Onboarding Checklist

1. **Clone & Install Dependencies:**

   ```bash
   git clone https://github.com/localnest/LocalNestByYash.git
   cd LocalNestByYash
   npm install --prefer-offline
   ```

2. **Configure Local Environment:**

   ```bash
   cp .env.example .env.local
   ```

   (In local mock mode, placeholder values work seamlessly with the in-memory adapters.)

3. **Run Verification Suite:**

   ```bash
   npm run verify
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 2. Database Migrations Workflow

LocalNest migrations are versioned sequentially in `supabase/migrations/`:

| Migration File                         | Purpose                                                                    |
| :------------------------------------- | :------------------------------------------------------------------------- |
| `20261013000000_baseline_schema.sql`   | Baseline tables (communities, orders, providers, reviews)                  |
| `20261013000001_missing_tables.sql`    | Operational tables (chat, wallet, notifications, device tokens, fee rules) |
| `20261013000002_consent_records.sql`   | Terms & privacy consent records with versioning                            |
| `20261013000003_comprehensive_rls.sql` | Multi-society Row-Level Security policies across all domains               |
| `20261013000004_storage_buckets.sql`   | Private KYC document storage bucket & public asset buckets                 |
| `20261013000005_auth_triggers.sql`     | `auth.users` profile provisioning trigger & role management                |
| `20261013000006_addons.sql`            | In-service add-ons and admin price caps                                    |

### Executing Migrations Locally (Supabase CLI)

```bash
# Start local Supabase Docker containers
npx supabase start

# Apply all migrations and seed data
npx supabase db reset

# Regenerate TypeScript database types
npm run db:types
```

### Deploying Migrations to Staging / Production

```bash
# Link project
npx supabase link --project-ref <staging-or-prod-ref>

# Push pending migrations
npx supabase db push
```

---

## 3. Vercel Staging Deployments

1. Each pull request opened against `main` automatically creates an isolated Preview Deployment on Vercel.
2. Staging runs against the `localnest-staging` Supabase instance configured in Vercel project environment variables.
