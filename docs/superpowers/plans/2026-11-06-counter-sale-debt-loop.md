# Counter Sale, Grouped Debt Collection, Cancel / Returns / Stocktake — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect money in the same step as confirming a sale, collect one lump sum per customer across old invoices, and fix confirmed documents through cancel (with reversals and refund), sales/purchase returns, and stocktake.

**Architecture:** Every business action is one PostgreSQL RPC in a new migration (security definer for state changes, security invoker for draft saves, like the existing ones). Each RPC has a `supabase/tests/*.rollback.sql` behaviour test. The frontend calls each RPC from the feature's repository. New screens follow the stock-issues pattern: page → repository → table → editor modal → confirm dialog.

**Tech Stack:** PostgreSQL / Supabase RPC, React 19 + TypeScript, Tailwind v4, react-i18next.

**Spec:** `docs/superpowers/specs/2026-11-06-counter-sale-debt-loop-design.md`

## Global Constraints

- Read `CLAUDE.md` and `AGENTS.md` before writing code. They are binding: one repository per feature is the only caller of `supabase`; use primitives from the AGENTS.md "Primitive map"; keys go in all 5 `src/locales/{en,ar,es,de,vi}/common.json` (vi is the main language, en must be real English; ar/es/de may copy en); use logical CSS properties; money via `formatCurrency`, quantities via `formatQuantity`.
- Migrations go in `supabase/migrations/202611060001_…sql` to `…0006_…sql`. Never edit an existing migration.
- Every RPC starts with: `auth.uid()` not null → active profile → role check → input validation → lock the document (`for update`) → lock materials `order by id` → status check → recompute from DB → write movements, ledger, audit → `raise exception` on any failure. `revoke all … from public; grant execute … to authenticated;`. Internal helpers get `revoke all … from public, authenticated`.
- Writes to protected columns are switched on with `set_config('app.allow_stock_update' | 'app.allow_document_state_update' | 'app.allow_financial_aggregate_update', 'on', true)`, as in `202610060001_create_confirm_sales_order_rpc.sql`.
- Append-only tables (`inventory_movements`, `debt_ledger_entries`, `customer_payments`, `supplier_payments`, `audit_logs`) are only ever INSERTed into.
- Invariants every DB test must check at the end: for each touched material, `current_stock = SUM(quantity_delta)`; for each touched customer or supplier, `SUM(ledger.amount_delta) = SUM(debt_amount of its CONFIRMED documents)`.
- Roles: cancel (receipt, order) and `confirm_stocktake` are ADMIN only. Everything else is ADMIN or WAREHOUSE_STAFF.
- **DB tests run on the remote production DB, inside a transaction that is rolled back.** Wrapper: `begin;` + the migrations under test (not pushed yet) + the test file + `rollback;`, saved in the scratchpad and run with `supabase db query --linked -f <wrapper>`. **The controller must get the user's approval before the first remote run.** Pushing migrations (`supabase db push`) needs separate approval and is NOT part of any task.
- No `git commit` in any task (the user commits). After each task: `bun run build` passes. `bun run lint` must not add new errors on top of the existing 24.

## Review Focus

1. **Paying exactly the total, or a decimal-quantity sale.** `p_paid_amount = total_amount` must give `PAID` with debt 0. 1.5 m³ × price must still work. Test T1-05.
2. **Lump sum larger than total debt, or a customer with no debt.** Must be rejected with a clear message, writing nothing. Test T2-03, T2-04.
3. **Cancelling a purchase receipt whose goods were already sold.** Stock would go negative, so it must be rejected and nothing changes. Test T3-06.
4. **Returning a line twice across two drafts.** The second confirm must be rejected even though each draft was valid when saved. Test T4-05.
5. **Stock changed between saving a stocktake draft and confirming it.** Confirm must set stock to the counted number, not apply the old difference. Test T6-04.

---

### Task 1: Collect payment at sale confirmation

**Files:**
- Create: `supabase/migrations/202611060001_confirm_sales_order_with_payment.sql`
- Create: `supabase/tests/confirm-sales-payment.rollback.sql`
- Modify: `src/components/stock-issues/StockIssuesRepository.ts` (`confirmStockIssue`, `confirmDemoStockIssue`)
- Modify: `src/components/stock-issues/ConfirmStockIssueModal.tsx`
- Modify: `src/pages/StockIssues/StockIssues.tsx` (`handleConfirm`)
- Modify: 5 locale files (`stockIssues.confirm.*`)

**Interfaces:**
- Produces (SQL):
  - `alter table customer_payments add column allocation_group_id uuid null` + index.
  - Internal helper `public.apply_customer_payment(p_order public.sales_orders, p_amount bigint, p_payment_date date, p_method public.payment_method, p_reference_number text, p_note text, p_allocation_group_id uuid, p_actor uuid) returns public.customer_payments`. It assumes the order row is locked, CONFIRMED and the caller authorized. It inserts the payment (code `next_document_code('PT', p_payment_date)`), the ledger `PAYMENT` entry (−amount, source `CUSTOMER_PAYMENT`), updates paid/debt/payment_status (`debt=0 → PAID`, else `PARTIALLY_PAID`) and writes the audit row `RECORD_CUSTOMER_PAYMENT`. It raises if `p_amount <= 0` or `p_amount > debt_amount`. Not executable by `authenticated`.
  - `record_customer_payment(...)` is re-created with the same signature and behaviour, now calling the helper.
  - `drop function confirm_sales_order(uuid)`; create `public.confirm_sales_order(order_id uuid, p_paid_amount bigint default 0, p_payment_method public.payment_method default 'CASH', p_reference_number text default null) returns public.sales_orders`. Same as today, then, if `p_paid_amount > 0`, it calls the helper with `payment_date = sale_date`. Rules: `p_paid_amount < 0` raises 'Paid amount cannot be negative'; `p_paid_amount > total` raises 'Paid amount cannot exceed the order total'. The audit `new_data` includes `paid_amount`.
- Produces (TS): `confirmStockIssue(issue: StockIssue, payment: { paidAmount: number; method: "CASH" | "BANK_TRANSFER" | "OTHER" }): Promise<void>`. `confirmDemoStockIssue(issue, paidAmount)` returns the issue with paid/debt/status set.

- [ ] **Step 1: Write the failing test** `supabase/tests/confirm-sales-payment.rollback.sql`, in the structure of `supabase/tests/save-document-draft.rollback.sql` (results table `_confirm_pay_results`, setup as service_role, then `set local role authenticated`, one `begin … exception` block per check). Setup: 1 staff user, 1 material with stock from a confirmed purchase receipt (via `save_purchase_receipt_draft` + `confirm_purchase_receipt`), 1 customer. Checks:
  - `01 confirm without payment`: `confirm_sales_order(id)` → paid 0, debt = total, `UNPAID`, 0 rows in `customer_payments`.
  - `02 partial payment`: total 10000, `p_paid_amount` 4000 → paid 4000, debt 6000, `PARTIALLY_PAID`, 1 payment with code like 'PT-%', ledger sum for the customer = 6000 + other open debt.
  - `03 overpay rejected`: 10001 on a total of 10000 → error, order still DRAFT, no payment.
  - `04 negative rejected`: −1 → error.
  - `05 exact total + decimal qty`: 1.5 × 2000 = 3000, pay 3000 → `PAID`, debt 0.
  - `06 bank transfer`: method `BANK_TRANSFER` stored on the payment.
  - `07 old record_customer_payment still works` on order 02: pay 6000 → `PAID`.
  - `08 helper not callable`: calling `apply_customer_payment` as `authenticated` → error with sqlstate `42501`.
  - `09 invariants`: stock = SUM(movements); ledger = SUM(debt of confirmed orders) for the customer.
- [ ] **Step 2: Run it without the new migration and check it fails.** Wrapper: begin + test + rollback. Expected: checks 02–08 false (function signature does not exist). *Ask the user before this first remote run.*
- [ ] **Step 3: Write the migration** per the Interfaces block.
- [ ] **Step 4: Run with the migration.** Wrapper: begin + migration + test + rollback. Expected: all 9 rows `ok = true`. Also run `powershell -File supabase/tests/schema-static-checks.ps1` and expect it to pass.
- [ ] **Step 5: Frontend.**
  - `ConfirmStockIssueModal` children: an `InputField type="number"` "Khách trả ngay" (min 0, max total, **default = total**) and a `Select` for the method (CASH / BANK_TRANSFER / OTHER, keys reused from `payments.*` if present).
  - Below them, a line "Còn nợ: {formatCurrency(total − paid)}".
  - Show a `FieldError` when the value is out of range and disable confirm.
  - Page `handleConfirm` passes the values.
  - Demo mode keeps working.
- [ ] **Step 6:** `bun run build` passes; `bun run lint` adds no new errors.

### Task 2: Collect one amount per customer, oldest invoices first

**Files:**
- Create: `supabase/migrations/202611060002_record_customer_payment_allocated.sql`
- Create: `supabase/tests/customer-payment-allocated.rollback.sql`
- Create: `src/components/payments/allocatePayment.ts`
- Create: `src/components/payments/CustomerLumpPaymentModal.tsx`
- Modify: `src/components/payments/paymentsRepository.ts`, `types.ts`, `PaymentsTable.tsx` or `PaymentHistoryTable.tsx` (group badge), `src/pages/Payments/Payments.tsx` (header action "Thu theo khách"), 5 locale files (`payments.lump.*`)

**Interfaces:**
- Consumes: `apply_customer_payment` (Task 1).
- Produces (SQL): `public.record_customer_payment_allocated(p_customer_id uuid, p_amount bigint, p_payment_date date default current_date, p_method public.payment_method default 'CASH', p_reference_number text default null, p_note text default null) returns setof public.customer_payments`.
  - Roles: ADMIN or STAFF.
  - Customer must exist; it may be inactive.
  - Lock that customer's CONFIRMED orders with `debt_amount > 0`, `order by sale_date, code for update`.
  - Raise 'Customer has no open debt' if none. Raise 'Payment amount cannot exceed total customer debt' if `p_amount > SUM(debt)`. Raise if `p_amount <= 0`.
  - Allocate oldest first, each slice `least(remaining, debt_amount)`, every slice via the helper with one shared `allocation_group_id = gen_random_uuid()`.
- Produces (TS):
  - `allocatePayment(documents: { id: string; code: string; date: string; debtAmount: number }[], amount: number): { id: string; code: string; applied: number }[]`. Pure function, same order as the SQL (date, then code).
  - `recordCustomerPaymentAllocated(values: { customerId: string; amount: number; paymentDate: string; method: PaymentMethod; referenceNumber: string; note: string }): Promise<void>`.
  - `PaymentTransaction` gains `allocationGroupId: string | null` and `reversalOfId: string | null`. The payment select adds `allocation_group_id, reversal_of_id`.

- [ ] **Step 1: Write the failing test** (same structure). Setup: one customer with 3 confirmed orders: 2026-10-01 BH-…-0001 debt 3000, 2026-10-01 BH-…-0002 debt 5000, 2026-10-05 debt 4000. Also another customer with debt 1000. Checks:
  - `01 allocate 6000`: 2 rows; order1 gets 3000 (`PAID`), order2 gets 3000 (`PARTIALLY_PAID`, debt 2000); order3 untouched; both rows share the same non-null `allocation_group_id`.
  - `02 pay rest exactly`: pay 6000 → order2 2000 + order3 4000, all `PAID`.
  - `03 over total rejected`: amount 1 more than total debt → error, no rows inserted.
  - `04 no debt rejected`: customer from 02 → 'Customer has no open debt'.
  - `05 other customer untouched`: the second customer's debt is still 1000.
  - `06 inactive customer`: deactivate the second customer (as admin), pay 1000 → `PAID`.
  - `07 zero/negative rejected`.
  - `08 invariants`.
- [ ] **Step 2:** Run without the migration → fails. **Step 3:** Write the migration. **Step 4:** Run with migrations 0001 + 0002 → all ok.
- [ ] **Step 5: Frontend.**
  - `CustomerLumpPaymentModal` (Modal size `lg`): customer `Select` (customers with open debt, built from the already-loaded documents), amount, date, method, reference, note.
  - A preview table from `allocatePayment` (code, date, debt, applied) and a total-debt line. Validate amount ≤ total debt.
  - Submit calls the repository.
  - Payments list: rows with a shared group show a small `Badge` "Thu gộp"; rows with `reversalOfId` show a `Badge` "Hoàn tiền" (Task 3 creates those).
  - Demo mode: apply locally with `allocatePayment`.
- [ ] **Step 6:** build + lint.

### Task 3: Cancel purchase receipts and sales orders (ADMIN)

**Files:**
- Create: `supabase/migrations/202611060003_cancel_documents.sql`, `supabase/tests/cancel-documents.rollback.sql`
- Create: `src/components/common/CancelDocumentDialog.tsx`
- Modify: both repositories (`cancelStockIssue`, `cancelStockReceipt`), both tables/pages (row action "Hủy" visible when `useAuth().profile?.role === "ADMIN"` and status ≠ CANCELLED), the payments list if it filters by order status, 5 locale files (`common.cancelDocument.*`, `stockIssues.actions.cancel`, `stockReceipts.actions.cancel`)

**Interfaces:**
- Produces (SQL):
  - `public.cancel_sales_order(p_order_id uuid, p_reason text) returns public.sales_orders`
  - `public.cancel_purchase_receipt(p_receipt_id uuid, p_reason text) returns public.purchase_receipts`
  - ADMIN only. `trim(p_reason)` must be non-empty.
  - DRAFT → CANCELLED: only the status and cancel metadata change.
  - CANCELLED → raise 'Document is already cancelled'.
  - If a CONFIRMED return references the document → raise 'Document has confirmed returns and cannot be cancelled'.
  - CONFIRMED, in this order:
    1. Every payment of the document with `reversal_of_id is null` and not yet reversed gets a reversal payment row (same customer/supplier and document, same amount, `reversal_of_id`, `reversal_reason = p_reason`, `payment_date = current_date`, new PT/PC code), plus a ledger `REVERSAL` entry `+amount` (receivable) or `+amount` (payable) with `reversal_of_id` = that payment's ledger entry.
    2. The `CHARGE` entry gets a ledger `REVERSAL` with `−total` and `reversal_of_id`.
    3. Each original movement (`SALE_OUT` / `PURCHASE_IN` with `source_id` = document) gets `REVERSAL_IN` / `REVERSAL_OUT` with the opposite delta, `reversal_of_id`, same `source_type` / `source_item_id`. Stock is updated. For receipts, a material whose `current_stock` would go below 0 → raise 'Insufficient stock to cancel purchase receipt'.
    4. Set `status = CANCELLED`, `cancelled_by`, `cancelled_at = now()`, `cancellation_reason`, `paid_amount = 0`, `debt_amount = 0`, `payment_status = 'UNPAID'`.
    5. Audit `CANCEL_SALES_ORDER` / `CANCEL_PURCHASE_RECEIPT` with the old status, the reason, and the refunded amount.
- Produces (TS): `cancelStockIssue(id: string, reason: string): Promise<void>`, `cancelStockReceipt(id: string, reason: string): Promise<void>`. `CancelDocumentDialog` props: `{ isOpen, code: string, paidAmount: number, isBusy, error, onClose, onConfirm: (reason: string) => void }`. It wraps `ConfirmDialog tone="danger"` with a required `TextArea` reason and, when `paidAmount > 0`, an `InlineAlert` "Sẽ ghi hoàn {formatCurrency(paidAmount)} cho khách/NCC".

- [ ] **Step 1: Write the failing test.** Setup: admin + staff user, 2 materials, a confirmed receipt (stock 10), an order confirmed with a partial payment, plus one more `record_customer_payment`. Checks:
  - `01 staff cannot cancel` → error `42501` or a message containing ADMIN.
  - `02 reason required`: '  ' → error.
  - `03 cancel paid order`: stock back to before the sale; 2 reversal payments linked by `reversal_of_id`; order CANCELLED with paid 0 / debt 0; customer ledger sum = 0 for this order's source entries; `cancelled_by` = admin.
  - `04 cancel twice` → 'already cancelled'.
  - `05 cancel draft`: status CANCELLED, no movements.
  - `06 receipt with sold goods`: sell 8 of 10, then cancel the receipt → 'Insufficient stock…', nothing changed.
  - `07 cancel receipt after cancelling the sale`: ok, stock 0, supplier ledger sum matches the confirmed receipts' debt.
  - `08 invariants`.
- [ ] **Step 2–4:** Fail without the migration, then pass with migrations 0001–0003.
- [ ] **Step 5: Frontend** per the Interfaces block. After success, reload the list. Show DB error text through `getErrorMessage`.
- [ ] **Step 6:** build + lint.

### Task 4: Sales returns

**Files:**
- Create: `supabase/migrations/202611060004_sales_returns.sql`, `supabase/tests/sales-returns.rollback.sql`
- Create: `src/pages/SalesReturns/SalesReturns.tsx`; `src/components/sales-returns/` with `types.ts`, `salesReturnsRepository.ts`, `SalesReturnsTable.tsx`, `SalesReturnEditor.tsx`, `SalesReturnFormModal.tsx`, `ConfirmSalesReturnModal.tsx`
- Modify: `src/App.tsx` (route `/sales-returns`), `src/layout/AppSidebar.tsx` (item `salesReturns` after `stockIssues`), 5 locale files (`salesReturns.*`, `nav.salesReturns` or whatever key style AppSidebar uses)

**Interfaces:**
- Produces (SQL):
  - Re-create `next_document_code` (copy from `202610200001_harden_auth_helpers.sql`) and add types `'THB'`, `'THM'`, `'KK'` to the allow-list and its comment. Nothing else changes.
  - `public.save_sales_return_draft(p_id uuid, p_sales_order_id uuid, p_return_date date, p_reason text, p_items jsonb) returns public.sales_returns`. Security invoker, like `save_sales_order_draft`: create when `p_id` is null, else replace the items of an own DRAFT (ADMIN may edit anyone's). Items `[{sales_order_item_id, quantity}]`; `unit_price` comes from the order item; `line_total = quantity * unit_price` must be a whole number (same error as drafts). The order must be CONFIRMED. Each item must belong to it. Quantity > 0 and ≤ sold − already returned in CONFIRMED returns. `reason` is required. `customer_id` comes from the order. `total_amount = SUM(line_total)`. Code `THB`.
  - `public.confirm_sales_return(p_return_id uuid) returns public.sales_returns`. ADMIN or STAFF. Lock the return, the order, then the materials. Re-check quantities against CONFIRMED returns. Raise if `total > order.total_amount − SUM(previous confirmed returns.total_amount)`. For each line, a `SALE_RETURN_IN` movement (+qty, source_type `SALES_RETURN`, source_id = return, source_item_id = return item, unit_cost = unit_price) and stock up. Then `debt_reduction = least(total, order.debt_amount)`. If > 0: ledger `RETURN` `−debt_reduction` (source `SALES_RETURN`) and `order.debt_amount −= debt_reduction`, with `payment_status`: debt 0 → `PAID`, else paid > 0 → `PARTIALLY_PAID`, else `UNPAID`. Set `refund_amount = total − debt_reduction`, status CONFIRMED, confirmed_by/at. Audit `CONFIRM_SALES_RETURN`.
- Produces (TS):
  - `fetchSalesReturnsPayload({ page, pageSize, status? })` returning `{ source, returns, totalCount, orders }`. `orders` = CONFIRMED sales orders with their items and returnable quantity, computed from `sales_order_items` minus `sales_return_items` of CONFIRMED returns, via a nested select.
  - `saveSalesReturnDraft(id: string | null, values: { salesOrderId; returnDate; reason; lines: { salesOrderItemId; quantity }[] })`, `confirmSalesReturn(id)`.
  - Demo fixtures are optional: when Supabase is not configured, show an empty list with `DataSourceBadge` "demo".

- [ ] **Step 1: Write the failing test.** Setup: an order with 2 lines (M1 4 × 1000, M2 2.5 × 2000), confirmed with payment 3000 (debt 6000). Checks:
  - `01 draft`: return 1 × M1 → DRAFT, total 1000, code like 'THB-%', unit_price 1000.
  - `02 too many`: return 5 × M1 → error.
  - `03 confirm`: stock M1 +1, order debt 5000, ledger RETURN −1000, refund 0.
  - `04 refund when paid`: pay the remaining 5000, return 2.5 × M2 (5000) → debt 0, refund_amount 5000, no ledger entry.
  - `05 double return across drafts`: two drafts each 3 × M1 (only 3 returnable), confirm the first ok, the second → error.
  - `06 draft of non-confirmed order` → error.
  - `07 code type THB accepted, unknown 'XX' rejected`.
  - `08 invariants`.
- [ ] **Step 2–4:** Fail, then pass with 0001–0004.
- [ ] **Step 5: Frontend.**
  - Page per the AGENTS.md app page layout: `PageHeader` with the create button, `FilterToolbar` (status), table (code, order code, customer, date, total, refund, status, actions: view/edit draft, confirm).
  - Editor: pick a confirmed order (`Select`); its lines appear with sold, returned and returnable quantities and an input per line (0 = skip); reason `TextArea`; total preview.
  - Confirm dialog shows total, debt reduction and refund.
- [ ] **Step 6:** build + lint.

### Task 5: Purchase returns

**Files:** the mirror of Task 4.
- `supabase/migrations/202611060005_purchase_returns.sql`, `supabase/tests/purchase-returns.rollback.sql`
- `src/pages/PurchaseReturns/PurchaseReturns.tsx`, `src/components/purchase-returns/*` (same file set and names with `PurchaseReturn`)
- Route `/purchase-returns`, sidebar item `purchaseReturns` after `stockReceipts`, locales `purchaseReturns.*`

**Interfaces:**
- Consumes: `next_document_code('THM')` (Task 4).
- Produces (SQL):
  - `public.save_purchase_return_draft(p_id uuid, p_purchase_receipt_id uuid, p_return_date date, p_reason text, p_items jsonb)` with items `[{purchase_receipt_item_id, quantity}]`.
  - `public.confirm_purchase_return(p_return_id uuid)`: same rules as Task 4 with these differences: the movement is `PURCHASE_RETURN_OUT` (−qty, source_type `PURCHASE_RETURN`); stock must stay ≥ 0, else 'Insufficient stock for purchase return'; the ledger is PAYABLE `RETURN`; `refund_amount` is what the supplier owes back; audit `CONFIRM_PURCHASE_RETURN`.
- Produces (TS): `fetchPurchaseReturnsPayload`, `savePurchaseReturnDraft`, `confirmPurchaseReturn`, shaped like Task 4.

- [ ] **Step 1: Write the failing test.** Checks: `01 draft`, `02 too many`, `03 confirm reduces stock and supplier debt`, `04 refund when receipt fully paid`, `05 stock already sold → error`, `06 double return across drafts`, `07 invariants`.
- [ ] **Step 2–4:** Fail, then pass with 0001–0005.
- [ ] **Step 5: Frontend** mirrors Task 4. **Step 6:** build + lint.

### Task 6: Stocktake

**Files:**
- `supabase/migrations/202611060006_stocktakes.sql`, `supabase/tests/stocktakes.rollback.sql`
- `src/pages/Stocktakes/Stocktakes.tsx`, `src/components/stocktakes/` (`types.ts`, `stocktakesRepository.ts`, `StocktakesTable.tsx`, `StocktakeEditor.tsx`, `StocktakeFormModal.tsx`, `ConfirmStocktakeModal.tsx`)
- Route `/stocktakes`, sidebar item `stocktakes` after `inventoryOverview`, locales `stocktakes.*`

**Interfaces:**
- Produces (SQL):
  - `public.save_stocktake_draft(p_id uuid, p_stocktake_date date, p_note text, p_items jsonb) returns public.stocktakes`. Security invoker; any active user may create, owner or ADMIN may edit. Items `[{material_id, actual_quantity, reason}]`: active materials, unique, `actual_quantity >= 0`, `system_quantity` = the material's `current_stock` at save time, `reason` required when they differ. Code `KK`.
  - `public.confirm_stocktake(p_stocktake_id uuid) returns public.stocktakes`. **ADMIN only.** Lock the stocktake, then the materials by id. For each item:
    1. Set `system_quantity = current_stock` now (the item is still DRAFT). If they differ and the reason is empty, raise 'Reason is required for material %'.
    2. If `delta = actual − current_stock` is not 0, write an `ADJUSTMENT_IN` or `ADJUSTMENT_OUT` movement (source_type `STOCKTAKE`, source_item_id = item id, note = reason) and set `current_stock = actual`.
    3. Set status CONFIRMED and confirmed_by/at. Audit `CONFIRM_STOCKTAKE` with the item count and the deltas.
- Produces (TS): `fetchStocktakesPayload`, `saveStocktakeDraft`, `confirmStocktake`. The confirm button is visible only to ADMIN.

- [ ] **Step 1: Write the failing test.** Checks:
  - `01 staff saves draft` with system_quantity = stock.
  - `02 reason required when different` → error.
  - `03 staff cannot confirm` → error.
  - `04 stock changed after draft`: draft counted 7 when stock was 10; a sale of 2 happens; admin confirms → stock 7, one ADJUSTMENT_OUT of −1, item system_quantity 8.
  - `05 no difference → no movement`.
  - `06 increase → ADJUSTMENT_IN`.
  - `07 confirmed stocktake cannot be saved again`.
  - `08 invariants`.
- [ ] **Step 2–4:** Fail, then pass with 0001–0006.
- [ ] **Step 5: Frontend.**
  - Editor: add materials (searchable `Select`), show system stock, input the counted quantity, show the difference with `formatQuantity`, and require a reason input when there is a difference.
  - "Thêm tất cả vật liệu" button fills every active material.
  - List and confirm as in Task 4.
- [ ] **Step 6:** build + lint.

### Task 7: Docs, process and final verification

**Files:** `docs/business-rules/05-sales.md`, `06-debt-and-payments.md`, `03-inventory.md` (the new rules: pay at confirm, grouped collection, cancel refunds payments, return value cap, stocktake confirm ADMIN-only); `docs/database/06-rpc-and-transactions.md` (mark the implemented RPCs, add `record_customer_payment_allocated`, `save_*_return_draft`, `save_stocktake_draft`); `docs/process/01-status.md`, `02-migrations-and-routes.md`, `03-patterns-and-next-steps.md`, `05-daily-log.md`, `docs/PROCESS.md`; `.ai/logs/2026-11-06_counter-sale-debt-loop.md`; `supabase/tests/schema-static-checks.ps1` (assert the new functions exist).

- [ ] **Step 1:** Run all rollback tests together: migrations 0001–0006 + the 6 new tests + the two existing tests (`save-document-draft`, `auth-hardening`) in one wrapper. Expect every row ok. (The existing tests call `confirm_sales_order(id)`, which must still work through the defaults.)
- [ ] **Step 2:** `bun run build`, `bun run lint`, `node --test scripts/auth-static-checks.test.mjs`, `powershell -File supabase/tests/schema-static-checks.ps1` → all pass, with no new lint errors.
- [ ] **Step 3:** Update the docs and process files. Status rows stay 🟡 with "chưa push DB, chưa thử trên trình duyệt" until that is done.
