$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$migrationDir = Join-Path $root "migrations"
$migrationSql = Get-ChildItem -LiteralPath $migrationDir -Filter "*.sql" |
  Sort-Object Name |
  ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw } |
  Out-String

function Assert-Contains {
  param(
    [string] $Pattern,
    [string] $Message
  )

  if ($migrationSql -notmatch $Pattern) {
    throw $Message
  }
}

function Assert-NotContains {
  param(
    [string] $Pattern,
    [string] $Message
  )

  if ($migrationSql -match $Pattern) {
    throw $Message
  }
}

$tables = @(
  "profiles",
  "categories",
  "units",
  "materials",
  "customers",
  "suppliers",
  "purchase_receipts",
  "purchase_receipt_items",
  "sales_orders",
  "sales_order_items",
  "customer_payments",
  "supplier_payments",
  "debt_ledger_entries",
  "inventory_movements",
  "sales_returns",
  "sales_return_items",
  "purchase_returns",
  "purchase_return_items",
  "stocktakes",
  "stocktake_items",
  "audit_logs",
  "document_sequences",
  "idempotency_keys"
)

foreach ($table in $tables) {
  Assert-Contains "create table public\.$table\b" "Missing table public.$table."
  Assert-Contains "alter table public\.$table enable row level security;" "Missing RLS enablement for public.$table."
}

$enums = @(
  "app_role",
  "document_status",
  "payment_status",
  "payment_method",
  "inventory_movement_type",
  "debt_direction",
  "debt_entry_type"
)

foreach ($enum in $enums) {
  Assert-Contains "create type public\.$enum as enum" "Missing enum public.$enum."
}

Assert-Contains "create trigger on_auth_user_created" "Missing auth user profile trigger."
Assert-Contains "'WAREHOUSE_STAFF',\s+false" "New profile default must be inactive WAREHOUSE_STAFF."
Assert-NotContains "raw_user_meta_data->>'role'" "Profile trigger must not trust role metadata."

Assert-Contains "revoke all on all tables in schema public from anon;" "Missing anon table revoke."
Assert-NotContains "to anon" "Anon policies or grants must not exist."

Assert-Contains "protect_profile_admin_fields" "Missing profile role and activation protection."
Assert-Contains "Only ADMIN can change profile role or activation state" "Missing profile role escalation guard."
Assert-Contains "customers_delete_admin[\s\S]*code <> 'WALK_IN_CUSTOMER'" "Walk-in customer must not be deletable by policy."
Assert-Contains "customers_walk_in_active" "Walk-in customer must remain active by constraint."

Assert-Contains "protect_material_current_stock" "Missing current_stock protection."
Assert-Contains "protect_financial_aggregates" "Missing payment aggregate protection."
Assert-Contains "validate_document_lifecycle" "Missing document lifecycle validation."
Assert-Contains "purchase_receipts_validate_lifecycle" "Missing purchase receipt lifecycle trigger."
Assert-Contains "sales_orders_validate_lifecycle" "Missing sales order lifecycle trigger."
Assert-Contains "line_total = \(quantity \* unit_price\) - discount_amount" "Missing discounted item line total checks."
Assert-Contains "foreign key \(sales_order_id, customer_id\) references public\.sales_orders\(id, customer_id\)" "Missing customer payment party consistency FK."
Assert-Contains "foreign key \(purchase_receipt_id, supplier_id\) references public\.purchase_receipts\(id, supplier_id\)" "Missing supplier payment party consistency FK."
Assert-Contains "inventory_movements_direction_check" "Missing inventory movement direction check."
Assert-Contains "purchase_receipt_items_update_draft_parent[\s\S]*using \(\s*public\.is_active_user\(\)[\s\S]*pr\.created_by = auth\.uid\(\)" "Missing existing-parent guard on item updates."
Assert-Contains "inventory_movements_append_only" "Missing append-only inventory movement guard."
Assert-Contains "debt_ledger_entries_append_only" "Missing append-only debt ledger guard."
Assert-Contains "audit_logs_append_only" "Missing append-only audit log guard."

Assert-Contains "grant select on\s+public\.customer_payments" "Sensitive payment tables should only grant SELECT directly."
Assert-NotContains "grant select, insert, update, delete on[^\n;]*public\.inventory_movements" "Inventory movements must not receive direct write grants."
Assert-NotContains "grant select, insert, update, delete on[^\n;]*public\.debt_ledger_entries" "Debt ledger must not receive direct write grants."
Assert-NotContains "grant select, insert, update, delete on[^\n;]*public\.audit_logs" "Audit logs must not receive direct write grants."
Assert-NotContains "grant select, insert, update, delete on[^\n;]*public\.document_sequences" "Document sequences must not receive direct write grants."
Assert-NotContains "grant select, insert, update, delete on[^\n;]*public\.idempotency_keys" "Idempotency keys must not receive direct write grants."

Assert-Contains "create or replace function public\.next_document_code" "Missing atomic document code helper."
Assert-Contains "on conflict \(document_type, sequence_date\)[\s\S]*current_value = public\.document_sequences\.current_value \+ 1" "Document code helper must atomically increment sequences."
Assert-Contains "create or replace function public\.confirm_purchase_receipt\(receipt_id uuid\)" "Missing confirm_purchase_receipt RPC."
Assert-Contains "acting_user_id uuid := auth\.uid\(\)" "Purchase receipt confirmation must use auth.uid()."
Assert-Contains "acting_user_role not in \('ADMIN'::public\.app_role, 'WAREHOUSE_STAFF'::public\.app_role\)" "Purchase receipt confirmation must enforce ADMIN or WAREHOUSE_STAFF."
Assert-Contains "where id = receipt_id\s+for update;" "Purchase receipt confirmation must lock the receipt row."
Assert-Contains "receipt_row\.status <> 'DRAFT'::public\.document_status" "Purchase receipt confirmation must reject non-draft receipts."
Assert-Contains "item_count = 0" "Purchase receipt confirmation must reject empty drafts."
Assert-Contains "pri\.quantity <= 0" "Purchase receipt confirmation must reject invalid quantities."
Assert-Contains "pri\.unit_price < 0" "Purchase receipt confirmation must reject invalid prices."
Assert-Contains "m\.is_active = false" "Purchase receipt confirmation must reject inactive materials."
Assert-Contains "set_config\('app\.allow_stock_update', 'on', true\)" "Purchase receipt confirmation must use stock trigger bypass."
Assert-Contains "set_config\('app\.allow_document_state_update', 'on', true\)" "Purchase receipt confirmation must use document state trigger bypass."
Assert-Contains "set_config\('app\.allow_financial_aggregate_update', 'on', true\)" "Purchase receipt confirmation must use financial aggregate trigger bypass."
Assert-Contains "insert into public\.inventory_movements" "Purchase receipt confirmation must create inventory movements."
Assert-Contains "'PURCHASE_IN'" "Purchase receipt confirmation must create PURCHASE_IN movements."
Assert-Contains "update public\.materials[\s\S]*set current_stock = quantity_after" "Purchase receipt confirmation must increase material stock."
Assert-Contains "insert into public\.debt_ledger_entries" "Purchase receipt confirmation must create debt ledger entries."
Assert-Contains "'PAYABLE'" "Purchase receipt confirmation must create payable debt."
Assert-Contains "'CHARGE'" "Purchase receipt confirmation must create a charge ledger entry."
Assert-Contains "insert into public\.audit_logs" "Purchase receipt confirmation must create audit logs."
Assert-Contains "grant execute on function public\.confirm_purchase_receipt\(uuid\) to authenticated;" "Missing execute grant for confirm_purchase_receipt."
Assert-Contains "create or replace function public\.record_customer_payment" "Missing record_customer_payment RPC."
Assert-Contains "create or replace function public\.record_supplier_payment" "Missing record_supplier_payment RPC."
Assert-Contains "amount > order_row\.debt_amount" "Customer payment RPC must reject overpayment."
Assert-Contains "amount > receipt_row\.debt_amount" "Supplier payment RPC must reject overpayment."
Assert-Contains "set_config\('app\.allow_document_state_update', 'on', true\)" "Payment RPCs must use document update trigger bypass."
Assert-Contains "'CUSTOMER_PAYMENT'" "Customer payment RPC must create ledger from customer payment source."
Assert-Contains "'SUPPLIER_PAYMENT'" "Supplier payment RPC must create ledger from supplier payment source."
Assert-Contains "grant execute on function public\.record_customer_payment" "Missing execute grant for record_customer_payment."
Assert-Contains "grant execute on function public\.record_supplier_payment" "Missing execute grant for record_supplier_payment."

Write-Output "Schema static checks passed."
