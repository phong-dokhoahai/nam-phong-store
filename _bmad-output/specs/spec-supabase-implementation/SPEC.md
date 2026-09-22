---
id: SPEC-supabase-implementation
companions:
  - ../../../plans/supabase-implementation-plan.md
  - ../../../PROJECT.md
  - ../../../docs/ARCHITECTURE.md
  - ../../../docs/DATABASE.md
  - ../../../docs/BUSINESS_RULES.md
  - ../../../docs/CODING_RULES.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# Supabase Implementation

## Why

Nam Phong Storage needs Supabase implemented as the primary MVP backend so the warehouse system can enforce authentication, authorization, inventory correctness, auditability, and database transactions without adding a separate backend server.

## Capabilities

- **CAP-1**
  - **intent:** The app can use one configured Supabase foundation for browser data access, authentication state, environment validation, and generated database types.
  - **success:** The app has a single Supabase client module, documented public env vars, no leaked privileged keys, and generated TypeScript database types after migrations.

- **CAP-2**
  - **intent:** Users can authenticate through Supabase Auth while application roles and activation state come from trusted database profiles.
  - **success:** Auth users map to profiles, new users cannot self-assign roles, inactive users cannot perform protected operations, and ADMIN/WAREHOUSE_STAFF authorization is enforced by database state.

- **CAP-3**
  - **intent:** The warehouse data model can be created and evolved through Supabase migrations.
  - **success:** Migrations cover enums, profiles, master data, business documents, inventory movements, debt/payment ledgers, audit logs, idempotency keys, triggers, indexes, RLS enablement, policies, and seed data.

- **CAP-4**
  - **intent:** The database can enforce row-level access rules for all application data.
  - **success:** RLS is enabled for public application tables, anonymous users have no warehouse access, policies check active profiles and roles, and sensitive tables reject direct client writes.

- **CAP-5**
  - **intent:** Stock, payment, debt, cancellation, return, stocktake, reconciliation, and document-code operations can complete as authoritative backend transactions.
  - **success:** Required RPCs validate actor, role, state, quantities, money, idempotency, locking, movement/ledger/audit writes, and rollback on failure.

- **CAP-6**
  - **intent:** Frontend features can read and mutate Supabase data through centralized feature APIs and TanStack Query.
  - **success:** Pages/components do not call Supabase directly, feature APIs wrap selects/RPC calls, mutations invalidate affected queries, and confirm/payment/stock operations wait for official RPC results.

- **CAP-7**
  - **intent:** The Supabase implementation can be verified against the business rules that protect stock and debt correctness.
  - **success:** Tests cover RLS, role escalation denial, inactive users, concurrent sales without negative stock, rollback, idempotency, confirmed-document immutability, payment limits, reversals, and reconciliation.

## Constraints

- Use the provided Supabase cloud project as the MVP backend target: `https://amomgyuypbomdvvfdhav.supabase.co`.
- Supabase is the primary backend for MVP; do not add Express, NestJS, or another backend service unless Auth, PostgreSQL, RLS, RPC, Storage, and Edge Functions cannot meet a documented requirement.
- Frontend is not a security boundary; do not trust client-sent user IDs, roles, totals, stock values, paid amounts, or privileged status.
- Only the Supabase URL and publishable/anon key may be exposed through Vite client env; do not expose `service_role` keys, database passwords, third-party secrets, or privileged business logic in client code.
- Inventory and financial operations that touch multiple records must be atomic, auditable, and idempotent where retryable.
- Inventory must not become negative, debt must not become negative, and every stock or payment change must leave traceable movement/ledger history.
- All schema changes must be Supabase migrations; generated database types must not be edited by hand.
- Follow existing TailAdmin/React repo conventions: routes in `src/App.tsx`, user-facing text through i18n, Tailwind v4 tokens, logical RTL utilities, and existing UI primitives.

## Non-goals

- No separate backend server in MVP.
- No ecommerce checkout, online payment gateway, accounting engine, multi-warehouse, multi-branch, offline sync, advanced BI, or AI forecasting implementation in this Supabase rollout.
- No production Supabase connection, secret provisioning, or package installation is required by this planning artifact.

## Success Signal

- A developer can implement the Supabase rollout from the plan and docs, then demonstrate login, role-gated access, protected CRUD, confirmed receipt/order RPCs, no negative stock under concurrent sales, generated database types, and passing RLS/RPC tests.

## Assumptions

- This run records the cloud Supabase project configuration for implementation planning; it does not run Supabase CLI linking, apply migrations, or install dependencies.
