# Supabase Implementation Plan

## Purpose

Implement Supabase as the backend platform for Nam Phong Storage while preserving the warehouse rules in `PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, and `docs/BUSINESS_RULES.md`.

## Phase 0 - Decisions Before Coding

- Use the Supabase cloud project at `https://amomgyuypbomdvvfdhav.supabase.co` as the current MVP backend target.
- Use the provided Supabase publishable key for the browser client through Vite env.
- Confirm MVP roles remain `ADMIN` and `WAREHOUSE_STAFF` only.
- Use a linked cloud project workflow for Supabase migrations and type generation.
- Confirm whether returns, debt ledger, and payments are part of the first implementation slice or a later slice.

## Phase 1 - Supabase Project Skeleton

- Add `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`, `supabase/tests/`, and `supabase/seed.sql`.
- Add `.env.example` entries for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the cloud project URL and publishable key.
- Add `src/lib/supabase/client.ts` as the only browser client initialization point.
- Add generated database type target at `src/lib/supabase/database.types.ts` or the repo-approved equivalent.
- Ensure `.env` and secrets remain ignored.

## Phase 2 - Schema Migrations

- Create enums: `app_role`, `document_status`, `payment_status`, `payment_method`, `inventory_movement_type`, `debt_direction`, and `debt_entry_type`.
- Create auth/profile tables and helpers: `profiles`, `handle_new_user`, `current_user_role`, `is_admin`, `is_warehouse_staff`, and `is_active_user`.
- Create master data tables: `categories`, `units`, `materials`, `customers`, and `suppliers`.
- Create business document tables: purchase receipts/items, sales orders/items, payments, returns, stocktakes/items, debt ledger, inventory movements, audit logs, document sequences, and idempotency keys according to `docs/DATABASE.md`.
- Add constraints, FK indexes, timestamp triggers, immutable confirmed-document protection, append-only ledger/movement/audit protection, and seed data.

## Phase 3 - RLS And Grants

- Enable RLS on every public application table before frontend access.
- Deny anonymous data access.
- Allow profile self-read while reserving role and activation changes for ADMIN.
- Allow direct CRUD only for safe draft/master-data operations defined in `docs/DATABASE.md`.
- Block direct client writes to `current_stock`, payment aggregates, debt aggregates, movements, ledgers, audit logs, idempotency keys, document sequences, and confirmed/cancelled document state.
- Add tests for anonymous denial, role escalation denial, inactive users, and role-specific read/write paths.

## Phase 4 - Required RPC Layer

- Implement document code generation with atomic sequences.
- Implement `confirm_purchase_receipt` and `cancel_purchase_receipt`.
- Implement `confirm_sales_order` and `cancel_sales_order`.
- Implement customer/supplier payment record and reversal RPCs.
- Implement return and stocktake confirmation/cancellation RPCs when those modules enter scope.
- Implement reconciliation RPCs for inventory and debt, ADMIN-only.
- Every RPC must use `auth.uid()`, verify active profile/role, validate inputs, lock rows in stable order, recalculate totals from database rows, write movement/ledger/audit rows, enforce idempotency for retryable operations, and rollback on any failure.

## Phase 5 - Frontend Integration

- Add an auth provider/session hook around Supabase Auth.
- Add route guards for UX only; keep authorization enforced by RLS/RPC.
- Move data access into feature APIs, not pages or presentational components.
- Use TanStack Query query keys per feature with pagination, filters, search, and server-side sorting.
- Call RPCs for confirm/cancel/payment/return/stocktake operations; do not compose those flows from multiple browser requests.
- Invalidate materials, inventory, documents, debts, reports, and dashboard queries after successful RPC results.
- Regenerate and consume database types after migration changes.

## Phase 6 - Verification

- Run typecheck, lint, and frontend build.
- Add database/integration tests for RLS, RPC authorization, rollback, idempotency, concurrent stock updates, payment limits, confirmed-document immutability, reversal behavior, and reconciliation.
- Add e2e smoke tests for login, role-gated routes, creating master data, confirming receipt, confirming sale, and verifying stock/history updates.
- Verify no `service_role` key or secret appears in source, `VITE_*`, logs, or committed files.

## First Implementation Slice

1. Supabase skeleton, env example, and centralized client.
2. Auth/profile migration with safe profile creation and role helpers.
3. Master data schema for categories, units, materials, customers, suppliers.
4. RLS baseline and tests for auth/profile/master data.
5. Generated database types and frontend auth/session integration.

## Acceptance Checklist

- [ ] One browser Supabase client exists and no feature initializes another client.
- [ ] Public env vars are documented; privileged keys are absent from frontend code.
- [ ] Migrations create schema, constraints, RLS, policies, helpers, triggers, indexes, and seed data.
- [ ] User roles come from `profiles`, not client metadata.
- [ ] Anonymous users cannot read or write warehouse data.
- [ ] Inactive users cannot execute protected RPCs.
- [ ] Client cannot directly update stock, debt, payment aggregates, movements, ledgers, audit logs, or confirmed documents.
- [ ] Confirm/cancel/payment/stocktake operations run through RPC transactions.
- [ ] Concurrent sale confirmation cannot make stock negative.
- [ ] Duplicate confirm/payment requests do not create duplicate business transactions.
- [ ] Generated TypeScript database types are up to date.
- [ ] Tests cover the security and data-integrity rules above.
