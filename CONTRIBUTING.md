# Contributing to LocalNest

## ⚠️ Branch Safety Agreement (Read First)

Branch protection is not technically enforced on this repo (GitHub Free plan, private repo).
**The team agrees to follow these rules manually — no exceptions:**

| Rule                                    | Detail                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| **Never push directly to `main`**       | Always open a PR, even for one-line fixes              |
| **Never merge a red PR**                | All CI checks must be green before merging             |
| **Never merge your own PR**             | At least one other team member must review and approve |
| **Never merge without Sonar passing**   | No new blocker/critical issues on new code             |
| **Revert immediately if `main` breaks** | Don't fix forward — revert the bad merge first         |

> Violation of these rules will result in access being revoked.
> We will upgrade to GitHub Team (enforced rules) when production work begins.

---

## Workflow

1. Branch from `main`: `feat/short-name`, `fix/short-name`, `chore/short-name`.
2. Keep PRs small: one feature or fix, ideally under ~400 changed lines.
3. Run `npm run verify` (types, tests, build) before pushing. Commits run lint and Prettier automatically.
4. Open a PR using the template. CI and the SonarQube quality gate must pass; at least one review is required.
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
