---
title: 'Stock Receipt / Nhap kho'
type: 'feature'
created: '2026-10-05'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '5e7f42fbdb5914a13f8f1a14e0d6fd3c3e1f50c1'
context:
  - '{project-root}/PROJECT.md'
  - '{project-root}/docs/business-rules/03-inventory.md'
  - '{project-root}/docs/business-rules/04-purchasing.md'
  - '{project-root}/docs/database/04-documents-and-debt.md'
  - '{project-root}/docs/database/05-inventory-returns-stocktake.md'
  - '{project-root}/docs/database/06-rpc-and-transactions.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The app has material, supplier, and database foundations, but users cannot create a stock receipt, add material lines, confirm it, and see inventory increase. Without this flow, `current_stock` cannot change through a valid warehouse business operation.

**Approach:** Add the minimal Stock Receipt MVP: a protected dashboard page for creating draft purchase receipts with material lines, a Supabase repository using existing table/RPC boundaries, and a database migration for `confirm_purchase_receipt`. Confirmation must run atomically in PostgreSQL, snapshot item data, update `materials.current_stock`, create `inventory_movements`, create payable debt ledger when unpaid, update receipt totals/status, and write audit.

## Boundaries & Constraints

**Always:** Quantities must be decimal-capable and `> 0`; line totals and receipt totals are recalculated from database data at confirmation. `materials.current_stock`, receipt financial aggregates, `inventory_movements`, `debt_ledger_entries`, and audit must only be changed by the RPC using the existing trigger bypass settings. Confirming a receipt requires active authenticated `ADMIN` or `WAREHOUSE_STAFF`, an existing `DRAFT` receipt, at least one item, active supplier, active materials, and valid item prices. The first MVP records all confirmed receipt value as payable debt: `paid_amount = 0`, `debt_amount = total_amount`, `payment_status = UNPAID`.

**Never:** Do not add a backend server, new packages, payment recording, cancellation/reversal, purchase orders, multi-warehouse behavior, or direct client-side stock updates. Do not modify confirmed receipt rows/items through ordinary UI CRUD. Do not hard-delete confirmed historical data.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create draft receipt | Active supplier, receipt date, one or more active material lines with quantity `> 0` and unit price `>= 0` | Draft receipt and item rows are saved; totals reflect line subtotal minus receipt discount plus fees/tax | Client shows validation error for missing supplier/date/items or invalid quantity/price |
| Confirm receipt | Draft receipt with valid items | One RPC transaction confirms receipt, snapshots SKU/name/unit, inserts `PURCHASE_IN` movements, increases stock, inserts payable `CHARGE` ledger, writes audit | RPC raises a stable failure and rolls back the whole operation |
| Empty draft confirmation | Draft receipt has no items | Receipt remains `DRAFT`; no stock, movement, ledger, or audit mutation occurs | UI shows returned error message |
| Repeat confirmation | Receipt is already `CONFIRMED` or not `DRAFT` | No duplicate stock movement or debt ledger is created | RPC rejects status mismatch |

</frozen-after-approval>

## Code Map

- `supabase/migrations/202609180001_create_enums_and_helpers.sql` -- existing roles, document status, payment status, movement types, profile helpers, and trigger bypass conventions.
- `supabase/migrations/202609180003_create_document_tables.sql` -- existing `purchase_receipts`, `purchase_receipt_items`, `inventory_movements`, `debt_ledger_entries`, `audit_logs`, and `document_sequences` schema.
- `supabase/migrations/202609180004_create_indexes_triggers_rls.sql` -- existing RLS policies, grants, append-only protections, draft-only item mutations, current stock protection, and financial aggregate protection.
- `src/lib/supabase/client.ts` -- single Supabase browser client and `isSupabaseConfigured` flag.
- `src/components/materials/materialsRepository.ts` and `src/components/master-data/masterDataRepository.ts` -- current repository style, Supabase/demo fallback pattern, row mapping, and component-local state approach.
- `src/pages/Materials/Materials.tsx` and `src/components/master-data/MasterDataPage.tsx` -- page composition pattern with `PageBreadCrumb`, `ComponentCard`, loading/error states, modals, and local filtering.
- `src/App.tsx` -- route registration under protected `AppLayout`.
- `src/layout/AppSidebar.tsx` -- Inventory submenu where the stock receipt route should be added using i18n key lookup.
- `src/locales/*/common.json` -- all supported locale dictionaries; add stock receipt keys to every locale even if Vietnamese is the primary user-facing language.
- `src/lib/supabase/database.types.ts` -- generated schema types. Update only if doing so manually in a tightly scoped way is safer than leaving RPC/table types stale.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/202610050003_create_confirm_purchase_receipt_rpc.sql` -- add `next_document_code` helper if missing and `confirm_purchase_receipt(receipt_id uuid)` RPC with permission checks, row locking, recalculation, stock movement, debt ledger, audit, grants, and stable rollback behavior.
- [x] `src/components/stock-receipts/types.ts` -- define receipt, line, lookup, source, form value, and status view model types for the page.
- [x] `src/components/stock-receipts/stockReceiptsRepository.ts` -- fetch receipt payload, create/update draft receipts and items, call `confirm_purchase_receipt`, map Supabase rows, and provide demo fallback behavior.
- [x] `src/components/stock-receipts/*` -- add focused table, toolbar, line editor, and confirmation modal components following existing TailAdmin styling and logical RTL-safe utilities.
- [x] `src/pages/StockReceipts/StockReceipts.tsx` -- compose the stock receipt experience: load payload, create draft, add/edit/remove material lines, confirm, refresh state, and show loading/empty/error states.
- [x] `src/App.tsx` and `src/layout/AppSidebar.tsx` -- register `/stock-receipts` under the protected dashboard and add it to Inventory navigation.
- [x] `src/locales/en/common.json`, `src/locales/vi/common.json`, `src/locales/ar/common.json`, `src/locales/es/common.json`, `src/locales/de/common.json` -- add all user-facing strings used by the new page and navigation item.
- [x] `supabase/tests/schema-static-checks.ps1` or a new static test script -- cover that the migration defines the RPC, uses stock/financial trigger bypass settings, inserts movement/ledger/audit, and grants execute to `authenticated`.

**Acceptance Criteria:**
- Given an active user opens the app, when they navigate to Inventory, then "Stock Receipts" is available and opens a protected receipt management page.
- Given a user fills supplier, date, and valid material lines, when they save a draft, then the draft and its lines appear in the receipt list with calculated totals.
- Given a draft receipt with valid lines, when the user confirms it, then the database confirms the receipt atomically and each material stock increases by the received quantity.
- Given any confirmation validation fails, when the RPC raises an error, then the receipt remains draft and no partial stock movement, debt ledger, or audit row is left behind.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Keep the page operational rather than decorative: list receipts on the left/top, edit the currently selected draft in a dense form area, and use a confirmation modal for the irreversible stock mutation. The UI may calculate subtotals for feedback, but the RPC remains authoritative for final totals and stock changes.

## Verification

**Commands:**
- `npm run build` -- expected: TypeScript and Vite build complete successfully.
- `npm run lint` -- expected: no lint errors introduced by stock receipt code.
- `powershell -ExecutionPolicy Bypass -File supabase/tests/schema-static-checks.ps1` -- expected: existing schema checks plus stock receipt RPC checks pass.

**Result Notes:**
- `npm run build` -- passed.
- `npx eslint src/components/stock-receipts src/pages/StockReceipts/StockReceipts.tsx src/App.tsx` -- passed for the new feature and route registration files.
- `powershell -ExecutionPolicy Bypass -File supabase/tests/schema-static-checks.ps1` -- passed.
- `npm run lint` -- blocked by pre-existing lint errors outside the stock receipt implementation (`src/components/calendar/CalendarEventModal.tsx`, `src/components/common/VectorMap.tsx`, `src/context/ThemeContext.tsx`, `src/layout/AppSidebar.tsx`, `src/svg.d.ts`).
