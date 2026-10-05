---
title: 'Add admin account bootstrap'
type: 'feature'
created: '2026-09-28'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '3a7677894208ad755c0a99d23526babc7febcb7d'
context:
  - '{project-root}/docs/DATABASE.md'
  - '{project-root}/docs/CODING_RULES.md'
  - '{project-root}/docs/ARCHITECTURE.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The project has Supabase Auth and `profiles` role enforcement, but there is no safe operational path to create the first active ADMIN account. The requested target admin email is `dokhoahaiphong@gmail.com`.

**Approach:** Add a privileged bootstrap path that creates or updates the Supabase Auth user and ensures the matching `public.profiles` row is active with `role = 'ADMIN'`. Do not commit the requested password or any service-role secret; runtime credentials must come from local environment or an operator-provided secret.

## Boundaries & Constraints

**Always:** Use Supabase Auth as the password owner; set full application permissions by updating `profiles.role` to `ADMIN` and `profiles.is_active` to true; keep secrets out of source, logs, migrations, seed files, and frontend `VITE_*` variables; make the operation idempotent for an existing email.

**Never:** Do not store the plaintext password in the repository; do not insert fake password hashes directly into `auth.users`; do not weaken RLS/policies to create the account; do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

**Decision:** Implement the safe local bootstrap script path. `SUPABASE_SERVICE_ROLE_KEY` may be read from the local `.env`, but the admin password must be supplied only at runtime via `ADMIN_PASSWORD` or an interactive prompt and must not be written to files, seed data, migrations, or logs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create first admin | Valid Supabase URL, service-role key, target email, and password; no existing Auth user | Auth user is created and profile is active ADMIN | Fail loudly without logging password or service-role key |
| Promote existing user | Auth user already exists for the target email | Password is updated if supplied, and profile is active ADMIN | If profile trigger did not create a profile, create/update profile safely |
| Missing privileged config | Service-role key or URL is absent | Operation does not run | Print actionable missing-variable names only |
| Unsafe secret placement | Password is only present in source or frontend env | Implementation refuses that approach | Keep password in env/prompt outside committed files |

</frozen-after-approval>

## Code Map

- `supabase/migrations/202609180001_create_enums_and_helpers.sql` -- owns `profiles`, auth profile trigger, and `is_admin()` helper; reuse the profile contract.
- `supabase/migrations/202609180004_create_indexes_triggers_rls.sql` -- protects profile role/activation changes through RLS and triggers for normal clients; bootstrap must use privileged server-side credentials.
- `supabase/seed.sql` -- safe system seed data only; do not add real admin email or password here.
- `package.json` -- currently has no bootstrap script; add one if the chosen path is a local operator script.
- `.gitignore` -- ignores `.env` and `*.local`, so local secret files can stay uncommitted.
- `docs/database/02-auth-and-permissions.md` -- documents that new users default inactive and cannot choose their own role.
- `docs/database/08-scope-and-checklist.md` -- states first ADMIN is created through Supabase Auth/Dashboard or a safe administration script.
- `src/auth/*` -- login flow already expects an active ADMIN/WAREHOUSE_STAFF profile; no UI change should be required for bootstrap.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/bootstrap-admin.mjs` -- create an idempotent Node script using `@supabase/supabase-js` admin API and env variables -- provides a safe first-admin operational path without committing secrets.
- [x] `package.json` -- add an `admin:bootstrap` script -- makes the operation discoverable.
- [x] `docs/database/02-auth-and-permissions.md` or a short docs note -- document required env vars and the no-plaintext-secret rule -- prevents future unsafe seed/migration edits.
- [x] `scripts/auth-static-checks.test.mjs` or a new static test -- verify the bootstrap script does not hardcode the target password or service role -- protects the security boundary.
- [x] `supabase/migrations/202609280001_allow_service_role_profile_bootstrap.sql` -- allow the existing profile protection trigger to accept Supabase `service_role` profile activation changes -- lets the privileged bootstrap path promote an existing inactive profile without weakening normal client access.

**Acceptance Criteria:**
- Given valid privileged Supabase environment variables and a target password, when the bootstrap script runs for `dokhoahaiphong@gmail.com`, then the Auth user exists and `public.profiles` has `role = 'ADMIN'` and `is_active = true`.
- Given the target Auth user already exists, when the bootstrap script runs again, then it remains idempotent and leaves the profile active ADMIN.
- Given missing `SUPABASE_SERVICE_ROLE_KEY`, when the bootstrap script runs, then it exits non-zero with missing-variable guidance and no partial account changes.
- Given repository search after implementation, when searching for the requested plaintext password or service-role key, then neither appears in committed files.

## Implementation Notes

- Added `scripts/bootstrap-admin.mjs` with idempotent Supabase Auth create/update behavior and profile activation for the target admin email.
- Added `npm run admin:bootstrap` and documented the first-admin bootstrap flow in the database auth document.
- Added a migration that lets Supabase `service_role` update `profiles.role` and `profiles.is_active` through the existing profile-protection trigger without weakening normal authenticated-client access.
- The script reads `SUPABASE_SERVICE_ROLE_KEY` from local environment or `.env`, but deliberately ignores `ADMIN_PASSWORD` from `.env`; the password must come from the process environment or the hidden interactive prompt.
- Did not run the real bootstrap mutation from this session because `ADMIN_PASSWORD` was not available as a process environment variable and passing it through tool input would expose it in execution metadata.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
| --- | --- | --- | --- |
| Existing `profiles_protect_admin_fields` trigger would reject service-role profile role/is_active updates because `public.is_admin()` is false without a user `auth.uid()`. | high | patch | The script's `.from("profiles").upsert` must update the trigger-created inactive WAREHOUSE profile; the original trigger only allowed active ADMIN users, so first-admin bootstrap could fail for both new and existing users. Patched by allowing `auth.role() = 'service_role'` in the trigger while preserving the ADMIN path for normal clients. |

## Design Notes

The safe default is a local operator script rather than migration or seed SQL. Supabase Auth owns password hashing and session state, while the app's authorization model comes from `public.profiles`.

## Verification

**Commands:**
- `node --test scripts/auth-static-checks.test.mjs` -- expected: existing auth smoke checks still pass.
- `npm run build` -- expected: TypeScript and Vite build succeed.
- `rg -n "<requested-password>|SUPABASE_SERVICE_ROLE_KEY=.*|service_role" . -g "!node_modules"` -- expected: no plaintext password or committed service-role value; documentation may mention variable names only.

**Manual checks:**
- Run the approved bootstrap flow against the intended Supabase project and sign in with the target email.
