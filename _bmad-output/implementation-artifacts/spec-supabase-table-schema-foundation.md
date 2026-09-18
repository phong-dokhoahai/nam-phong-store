---
title: 'Supabase Table Schema Foundation'
type: 'feature'
created: '2026-09-18'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'bd4f6d8200a0d7cee581514c910ca9e0f656b5c3'
context:
  - '{project-root}/plans/supabase-implementation-plan.md'
  - '{project-root}/docs/DATABASE.md'
  - '{project-root}/docs/BUSINESS_RULES.md'
  - '{project-root}/docs/ARCHITECTURE.md'
  - '{project-root}/docs/CODING_RULES.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The repository has Supabase browser configuration, but it does not yet have the Supabase project skeleton or database migrations needed to create the warehouse schema described by `docs/DATABASE.md`. Without versioned migrations, the app cannot safely enforce roles, master data integrity, inventory history, debt history, auditability, or RLS.

**Approach:** Add the Supabase skeleton and a first database implementation that creates the application schema, all documented tables, core constraints, indexes, auth profile helpers, baseline protection triggers, RLS enablement, and safe seed data. This change establishes the table foundation; full confirm/cancel/payment/return/stocktake RPC transaction bodies remain separate follow-up work unless a minimal helper is required for schema or RLS.

## Boundaries & Constraints

**Always:** Use Supabase PostgreSQL migrations under `supabase/migrations`. Keep the existing single browser client at `src/lib/supabase/client.ts`. Follow `docs/DATABASE.md` for table names, enums, columns, constraints, indexes, trigger names, and seed data. Enable RLS for every public application table. Deny anonymous warehouse access by omission of anon policies. Read actor and role from `auth.uid()` and `public.profiles`, not client-sent values or auth metadata. Protect append-only tables and confirmed/cancelled document rows at the database layer where possible.

**Never:** Do not expose or add `service_role`, database passwords, or privileged secrets. Do not add a separate backend server, ORM, or new package. Do not change React routes or UI for this schema-only slice. Do not claim stock/payment/idempotency workflows are complete until the required RPCs are implemented and tested. Do not apply migrations to the remote Supabase project from this session unless explicitly requested after the migration files exist.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh local database | Supabase migrations are applied in order | Enums, functions, tables, triggers, indexes, RLS, policies, and seed data exist | Migration fails loudly on invalid SQL or dependency order |
| New auth user | Supabase inserts into `auth.users` | `public.profiles` row is created with safe inactive default role | Trigger ignores client-supplied role metadata |
| Anonymous warehouse access | anon role selects or mutates application tables | No rows/actions are allowed | RLS/policies deny access |
| Active internal user master data | authenticated active ADMIN or WAREHOUSE_STAFF uses allowed master-data CRUD | Direct CRUD works only for permitted master data fields | RLS rejects inactive users and role escalation |
| Sensitive direct write | client attempts movement/ledger/audit/sequence/idempotency writes or aggregate stock/payment update | Direct client write is blocked by policy, grants, or trigger | Database rejects with authorization or trigger error |

</frozen-after-approval>

## Code Map

- `plans/supabase-implementation-plan.md` -- rollout plan; first slice covers skeleton, auth/profile, master data, baseline RLS, and types, while later phases include RPC transactions.
- `docs/DATABASE.md` -- canonical schema details for enums, all application tables, helper functions, triggers, RLS, indexes, required RPC list, and seed data.
- `docs/BUSINESS_RULES.md` -- business invariants: no negative stock/debt, append-only history, backend enforcement, no direct aggregate mutation.
- `docs/ARCHITECTURE.md` -- Supabase architecture: no backend server, one browser client, RLS/RPC as enforcement layer, migrations for schema changes.
- `docs/CODING_RULES.md` -- migration and safety rules: no unapproved dependencies, small scoped changes, backend enforces business rules.
- `src/lib/supabase/client.ts` -- existing single Supabase browser client; reuse, do not replace.
- `.env.example` and `src/vite-env.d.ts` -- existing public Supabase env documentation and typing; keep as-is unless generated type import requires a small update.
- `package.json` -- already includes `@supabase/supabase-js`; no Supabase CLI script exists and no package install is needed.
- `supabase/` -- absent at planning time; create skeleton, migrations, tests/functions directories, config, seed, and generated type placeholder.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/config.toml` -- add minimal local Supabase config tied to this repo -- establishes project skeleton without secrets.
- [x] `supabase/migrations/202609180001_create_enums_and_helpers.sql` -- create extensions, enums, timestamp/auth helper functions, profile trigger, and shared protection helpers -- supports later tables and RLS without recursion.
- [x] `supabase/migrations/202609180002_create_tables.sql` -- create profiles, master tables, business documents, payments, ledgers, inventory movements, returns, stocktakes, audit logs, sequences, and idempotency keys -- implements the documented table foundation.
- [x] `supabase/migrations/202609180003_create_indexes_triggers_rls.sql` -- add indexes, updated_at triggers, protection triggers, RLS enablement, grants, and baseline policies -- enforces safe access and performance basics.
- [x] `supabase/seed.sql` -- seed units and system walk-in customer data using idempotent inserts -- supports MVP initial data without secrets.
- [x] `src/lib/supabase/database.types.ts` -- add a clearly marked generated-type placeholder if CLI generation cannot run locally -- gives the approved output path for later generation.

**Acceptance Criteria:**
- Given a fresh Supabase database, when migrations run in timestamp order, then all documented application tables and enums are created with primary keys, foreign keys, unique constraints, check constraints, indexes, triggers, and RLS enabled.
- Given a new Supabase Auth user, when `auth.users` receives the row, then `public.profiles` is created with inactive non-admin defaults and no trusted role from metadata.
- Given anonymous access, when any application table is selected, inserted, updated, or deleted through PostgREST, then no warehouse data is exposed or changed.
- Given an active ADMIN, when managing profiles and master data, then RLS permits the documented actions and prevents self-service role escalation by non-admin users.
- Given a direct client write to stock aggregates, ledgers, movements, audit logs, document sequences, idempotency keys, or non-draft document state, when it bypasses RPC, then the database rejects or blocks the mutation.

## Implementation Notes

- Added the Supabase local skeleton with `config.toml`, migrations, seed, functions/tests directories, and generated-type target path.
- Created 23 public application tables, 7 enums, profile creation helpers, role helpers, timestamp helpers, protection triggers, indexes, RLS enablement, grants, and baseline policies.
- Master seed rows use nullable `created_by` because seed execution has no authenticated application user; client writes still require `created_by = auth.uid()` through RLS and actor triggers.
- Full transactional RPCs for confirm/cancel/payment/return/stocktake remain follow-up work by design.
- `supabase db reset` could not run because Docker/Podman is not installed or on PATH; static schema checks cover the matrix structure until a local Supabase database is available.
- Review patch pass added document lifecycle validation, future RPC bypass settings for confirmed-document updates, stricter draft insert policies, line-total checks, refund/payment/reversal/movement consistency checks, party/material consistency foreign keys, and stronger item ownership/active-user RLS guards.

## Spec Change Log

## Review Triage Log

- medium patch: `protect_confirmed_document()` would have blocked future confirmed-document cancellation metadata updates; patched with an explicit `app.allow_document_state_update` bypass for RPC-owned state transitions.
- medium patch: document rows could carry impossible lifecycle metadata; patched with `validate_document_lifecycle()` triggers on receipts, orders, returns, and stocktakes.
- medium patch: paid/debt totals could exceed document total; patched purchase and sales documents with `paid_amount + debt_amount <= total_amount` and MVP no-overpaid checks.
- medium patch: item `line_total` values could drift from quantity, price, and discount; patched receipt/order/return item check constraints.
- maybe-false defer: parent document totals are still not automatically reconciled from child rows; the approved slice explicitly leaves official recalculation to later confirm/cancel/payment RPCs, and runtime behavior must be settled in that RPC slice.
- medium patch: payment and return headers could reference parties different from their source documents; patched composite consistency foreign keys.
- medium patch: return item materials could differ from source document item materials; patched composite consistency foreign keys.
- medium patch: return refunds could exceed return totals; patched refund amount checks.
- medium patch: inventory movement signs could contradict movement type; patched direction check constraints.
- medium patch: ledger and inventory reversals could duplicate or self-reference; patched unique reversal references and no-self-reversal checks.
- medium patch: item update policies checked only the new parent, allowing cross-owner reparent attempts; patched existing-parent ownership/admin checks.
- medium patch: item delete policies omitted active-user checks; patched delete policies to require `public.is_active_user()`.
- medium defer: a fresh project still needs an operational first-admin bootstrap path; docs already say first admin is created through Supabase Auth/Dashboard or a safe admin script, so this is a follow-up operations task rather than schema-table foundation code.
- low false: nullable `created_by` on master tables is intentional for system seed rows; client-created rows still require `created_by = auth.uid()` through RLS and actor triggers.
- low patch: `database.types.ts` looked like real generated output while containing placeholders; patched the comment to say it is a placeholder to replace with Supabase CLI output.
- medium defer: migrations were not applied to a real local database because Docker/Podman is unavailable; static checks passed, but runtime migration execution must run once local Supabase is available.
- medium defer: auth profile trigger behavior is source-checked but not runtime-tested; needs a database test inserting into `auth.users` once local Supabase is available.
- medium defer: RLS/direct-write behavior is source-checked but not verified through actual `anon`/`authenticated` database roles; needs role-based database tests once local Supabase is available.

## Verification

**Commands:**
- `npm run build` -- expected: TypeScript and Vite build succeed after adding any type placeholder.
- `supabase db reset` -- expected: migrations and seed apply successfully when Supabase CLI is available locally.
- `powershell -ExecutionPolicy Bypass -File supabase/tests/schema-static-checks.ps1` -- expected: static migration checks pass.

**Manual checks (if no CLI):**
- Inspect migration SQL for dependency order, RLS enabled on every public application table, no anon policies, no privileged secrets, and idempotent seed inserts.
