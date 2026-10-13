## What and why

<!-- One or two sentences. Link the task/ticket. -->

## Type

- [ ] Feature - [ ] Bug fix - [ ] Refactor - [ ] Docs/config

## Checklist (all must be true before requesting review)

- [ ] I searched for existing code that does this and reused it (no copy-paste)
- [ ] Business rules are in `src/lib` as pure functions with tests
- [ ] New or changed logic has tests; a bug fix has a test that fails without the fix
- [ ] No secrets, keys, or personal data committed
- [ ] DB changes are in a migration file and RLS policies are included
- [ ] Money, auth, OTP, or dispatch changes: noted below for extra review
- [ ] `npm run verify` passes locally
- [ ] UI change: screenshots (mobile + desktop) attached

## How I tested it

<!-- Steps, or screenshots -->

## Risks / rollback

<!-- What could break? How do we undo it? -->
