# Contributing to LocalNest

## ⚠️ Branch Safety Agreement (Read First)

Branch protection is **not technically enforced** on this repo (GitHub Free plan, private repo).
The team follows these rules by agreement. **CI is the real gate** — it runs on every PR and on
every push to `main`, so violations show up in the Actions tab even if they can't be blocked.

### The rules

| Rule                                | Reality                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Never push directly to `main`**   | Always open a PR, even for one-line fixes                                                                                                                                    |
| **Never merge a red PR**            | CI must be green; wait for Sonar too once the token is set                                                                                                                   |
| **Never merge your own PR**         | This is a habit, not a setting — GitHub Free can't enforce it on private repos                                                                                               |
| **Run `npm install` after cloning** | This activates the Husky pre-commit hook (Prettier on staged files). Anyone can bypass it with `git commit --no-verify`, so the CI format-check step is the real enforcement |
| **Revert first, fix second**        | If `main` breaks, revert the bad merge before fixing forward                                                                                                                 |

**Violation policy:** first violation → revert and discuss. Repeated violations → Write access removed.

### Two security risks to know

- **Write access lets someone edit `ci.yml`.** A developer could change the workflow to expose
  secrets. Keep only `SONAR_TOKEN` in GitHub Actions secrets for now. **Do not add Razorpay,
  Supabase service-role, or any production key until you're on a paid plan with enforced
  branch protection.**
- **Direct pushes to `main` show up in the Actions tab** (CI still runs on push). Check it daily
  and enable GitHub email notifications for failed workflow runs
  (your account → Settings → Notifications → Actions).

---

## Getting Started

```bash
git clone https://github.com/localnest/LocalNestByYash.git
cd LocalNestByYash
npm ci                         # installs deps and activates Husky pre-commit hook
cp .env.example .env.local     # fill in your local Supabase keys (never commit this file)
npm run dev                    # starts dev server at http://localhost:3000
```

---

## Branch Naming

Format: `type/sNN-N-short-description`

| Type       | When to use                               |
| ---------- | ----------------------------------------- |
| `feat`     | New user-facing feature                   |
| `fix`      | Bug fix                                   |
| `chore`    | Tooling, config, CI, dependencies         |
| `refactor` | Code restructure with no behaviour change |
| `docs`     | Documentation only                        |
| `test`     | Adding or fixing tests only               |

**Examples:** `feat/s04-1-add-missing-tables`, `fix/s03-2-booking-modal-crash`, `docs/s01-3-team-rules`

The sprint number `sNN` keeps branches sortable. The task number `-N` separates parallel tasks in the same sprint.

---

## Workflow Rules

1. **One task = one branch = one PR.** Keep PRs small (aim for < 400 changed lines).
2. **Always branch from the latest `main`.** Before opening a PR, rebase onto `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
3. **Run `npm run verify` before pushing** (`typecheck + test + build`).
4. **Never push directly to `main`.** All CI checks must be green before merge. The lead merges.
5. **Reviews:** reply within 24 hours. Approve only if you've read the diff.
6. **The lead squash-merges** all PRs. Never use a merge commit or rebase merge.

---

## Files You Must Not Edit (Until Told Otherwise)

These files are being split into smaller components. Do not modify them unless your task
explicitly says so — coordinate with the lead first:

- `src/lib/store.tsx` — global state; one person restructures this first
- `src/components/CustomerPortal.tsx` — being split into sub-components
- `src/components/ProviderDashboard.tsx` — being split into sub-components
- `src/components/AdminPanel.tsx` — being split into sub-components

**Backend work** lives in `supabase/` and Supabase Edge Functions — not in `src/`.

---

## Secrets & Environment Variables

- **Never commit secrets.** Use `.env.local` (gitignored). Never commit it.
- **Server-only keys never get the `NEXT_PUBLIC_` prefix.** If it starts with `NEXT_PUBLIC_`, it
  ships to the browser and must be safe to expose publicly.
- Copy `.env.example` to `.env.local` and fill in your local Supabase project keys.
- Production and staging keys live in the team password manager — never in Git, never in chat.

---

## Code Rules

- **No duplicate logic.** Search first. Shared logic → `src/lib`, shared UI → `src/components/ui`.
- **Business rules are pure functions** in `src/lib` with unit tests (see `src/lib/__tests__`).
- **No `any`.** Type everything; validate external data at the boundary.
- **Never compute money, OTPs, or job claims in the browser** for production paths. Server only.
- Files over ~600 lines or functions with cyclomatic complexity > 20 will trigger CI warnings. Split them.
- Do not add dependencies without a reason written in the PR description.

---

## Definition of Done

A task is done when it:

- Works on mobile width (375 px minimum)
- Handles loading, error, and empty states
- Has unit tests for any new pure logic in `src/lib`
- Passes all CI checks (typecheck, lint, dup, coverage, build)
- Has no new Sonar blocker or critical issues
- Has been reviewed and approved by at least one other team member

---

## Database

All schema changes go through migration files in a PR (`supabase/migrations/`).
Nobody edits staging or production databases by hand.
