# Contributing to LocalNest

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
