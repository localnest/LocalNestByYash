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

## Onboarding message (send this when inviting developers)

> Read `CONTRIBUTING.md` before writing code. Branch protection isn't enforced by GitHub on our
> plan, so we enforce it ourselves: never push to `main`, work on a branch and open a PR, get a
> review from the other developer or me, and never merge while CI or Sonar is red. Run
> `npm install` after cloning so the pre-commit hook is set up. Direct pushes to `main` or
> merging a failing PR will be reverted, and repeated violations lose Write access.

---

## Workflow

1. Branch from `main`: `feat/short-name`, `fix/short-name`, `chore/short-name`.
2. Keep PRs small: one feature or fix, ideally under ~400 changed lines.
3. Run `npm run verify` (types, tests, build) before pushing. Commits auto-format with Prettier.
4. Open a PR using the template. CI (typecheck, lint on changed files, dup check, coverage, build)
   and the SonarQube quality gate must pass; at least one review from another team member is
   required.
5. Squash-merge. Never push to `main` directly.

## Code rules

- **No duplicate logic.** Search first. Shared logic goes in `src/lib`, shared UI in `src/components/ui`.
- **Business rules are pure functions** in `src/lib` with unit tests (see `src/lib/__tests__`).
- **No `any`.** Type everything; validate external data at the boundary.
- **Never compute money, OTPs, or job claims in the browser** for production paths. They belong on the server.
- Files over ~600 lines or functions with complexity over 20 trigger warnings. Split them.
- Do not add dependencies without a reason in the PR description.
- Secrets live in env vars. Copy `.env.example` to `.env.local`. Never commit real keys.

## Definition of done

Works on mobile width, handles loading/error/empty states, has tests, passes CI, no new Sonar issues.

## Database

All schema changes go through migration files in a PR. Nobody edits staging or production by hand.
