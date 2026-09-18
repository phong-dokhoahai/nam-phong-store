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

Write-Output "Schema static checks passed."
