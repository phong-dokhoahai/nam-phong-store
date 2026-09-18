create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;

  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not public.is_admin() then
    raise exception 'Only ADMIN can change profile role or activation state';
  end if;

  return new;
end;
$$;

create or replace function public.protect_material_current_stock()
returns trigger
language plpgsql
as $$
begin
  if new.current_stock is distinct from old.current_stock
     and coalesce(current_setting('app.allow_stock_update', true), '') <> 'on' then
    raise exception 'current_stock can only be changed by stock RPCs';
  end if;

  return new;
end;
$$;

create or replace function public.protect_financial_aggregates()
returns trigger
language plpgsql
as $$
begin
  if (new.paid_amount is distinct from old.paid_amount
      or new.debt_amount is distinct from old.debt_amount
      or new.payment_status is distinct from old.payment_status)
     and coalesce(current_setting('app.allow_financial_aggregate_update', true), '') <> 'on' then
    raise exception 'payment aggregates can only be changed by financial RPCs';
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profiles_protect_admin_fields
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger categories_validate_actor before insert or update on public.categories
  for each row execute function public.validate_document_actor();
create trigger units_set_updated_at before update on public.units
  for each row execute function public.set_updated_at();
create trigger units_validate_actor before insert or update on public.units
  for each row execute function public.validate_document_actor();
create trigger materials_set_updated_at before update on public.materials
  for each row execute function public.set_updated_at();
create trigger materials_validate_actor before insert or update on public.materials
  for each row execute function public.validate_document_actor();
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger customers_validate_actor before insert or update on public.customers
  for each row execute function public.validate_document_actor();
create trigger suppliers_set_updated_at before update on public.suppliers
  for each row execute function public.set_updated_at();
create trigger suppliers_validate_actor before insert or update on public.suppliers
  for each row execute function public.validate_document_actor();
create trigger purchase_receipts_set_updated_at before update on public.purchase_receipts
  for each row execute function public.set_updated_at();
create trigger purchase_receipts_validate_actor before insert or update on public.purchase_receipts
  for each row execute function public.validate_document_actor();
create trigger purchase_receipts_validate_lifecycle before insert or update on public.purchase_receipts
  for each row execute function public.validate_document_lifecycle();
create trigger purchase_receipt_items_set_updated_at before update on public.purchase_receipt_items
  for each row execute function public.set_updated_at();
create trigger sales_orders_set_updated_at before update on public.sales_orders
  for each row execute function public.set_updated_at();
create trigger sales_orders_validate_actor before insert or update on public.sales_orders
  for each row execute function public.validate_document_actor();
create trigger sales_orders_validate_lifecycle before insert or update on public.sales_orders
  for each row execute function public.validate_document_lifecycle();
create trigger sales_order_items_set_updated_at before update on public.sales_order_items
  for each row execute function public.set_updated_at();
create trigger sales_returns_set_updated_at before update on public.sales_returns
  for each row execute function public.set_updated_at();
create trigger sales_returns_validate_actor before insert or update on public.sales_returns
  for each row execute function public.validate_document_actor();
create trigger sales_returns_validate_lifecycle before insert or update on public.sales_returns
  for each row execute function public.validate_document_lifecycle();
create trigger sales_return_items_set_updated_at before update on public.sales_return_items
  for each row execute function public.set_updated_at();
create trigger purchase_returns_set_updated_at before update on public.purchase_returns
  for each row execute function public.set_updated_at();
create trigger purchase_returns_validate_actor before insert or update on public.purchase_returns
  for each row execute function public.validate_document_actor();
create trigger purchase_returns_validate_lifecycle before insert or update on public.purchase_returns
  for each row execute function public.validate_document_lifecycle();
create trigger purchase_return_items_set_updated_at before update on public.purchase_return_items
  for each row execute function public.set_updated_at();
create trigger stocktakes_set_updated_at before update on public.stocktakes
  for each row execute function public.set_updated_at();
create trigger stocktakes_validate_actor before insert or update on public.stocktakes
  for each row execute function public.validate_document_actor();
create trigger stocktakes_validate_lifecycle before insert or update on public.stocktakes
  for each row execute function public.validate_document_lifecycle();
create trigger stocktake_items_set_updated_at before update on public.stocktake_items
  for each row execute function public.set_updated_at();
create trigger document_sequences_set_updated_at before update on public.document_sequences
  for each row execute function public.set_updated_at();

create trigger materials_protect_current_stock before update on public.materials
  for each row execute function public.protect_material_current_stock();

create trigger purchase_receipts_protect_financial_aggregates before update on public.purchase_receipts
  for each row execute function public.protect_financial_aggregates();
create trigger sales_orders_protect_financial_aggregates before update on public.sales_orders
  for each row execute function public.protect_financial_aggregates();

create trigger purchase_receipts_protect_confirmed before update or delete on public.purchase_receipts
  for each row execute function public.protect_confirmed_document();
create trigger sales_orders_protect_confirmed before update or delete on public.sales_orders
  for each row execute function public.protect_confirmed_document();
create trigger sales_returns_protect_confirmed before update or delete on public.sales_returns
  for each row execute function public.protect_confirmed_document();
create trigger purchase_returns_protect_confirmed before update or delete on public.purchase_returns
  for each row execute function public.protect_confirmed_document();
create trigger stocktakes_protect_confirmed before update or delete on public.stocktakes
  for each row execute function public.protect_confirmed_document();

create trigger purchase_receipt_items_protect_parent before update or delete on public.purchase_receipt_items
  for each row execute function public.protect_draft_child_rows('purchase_receipts', 'purchase_receipt_id');
create trigger sales_order_items_protect_parent before update or delete on public.sales_order_items
  for each row execute function public.protect_draft_child_rows('sales_orders', 'sales_order_id');
create trigger sales_return_items_protect_parent before update or delete on public.sales_return_items
  for each row execute function public.protect_draft_child_rows('sales_returns', 'sales_return_id');
create trigger purchase_return_items_protect_parent before update or delete on public.purchase_return_items
  for each row execute function public.protect_draft_child_rows('purchase_returns', 'purchase_return_id');
create trigger stocktake_items_protect_parent before update or delete on public.stocktake_items
  for each row execute function public.protect_draft_child_rows('stocktakes', 'stocktake_id');

create trigger inventory_movements_append_only before update or delete on public.inventory_movements
  for each row execute function public.protect_append_only_rows();
create trigger debt_ledger_entries_append_only before update or delete on public.debt_ledger_entries
  for each row execute function public.protect_append_only_rows();
create trigger audit_logs_append_only before update or delete on public.audit_logs
  for each row execute function public.protect_append_only_rows();
create trigger customer_payments_append_only before update or delete on public.customer_payments
  for each row execute function public.protect_append_only_rows();
create trigger supplier_payments_append_only before update or delete on public.supplier_payments
  for each row execute function public.protect_append_only_rows();

create index profiles_role_is_active_idx on public.profiles(role, is_active);
create index materials_category_is_active_idx on public.materials(category_id, is_active);
create index materials_name_idx on public.materials(name);
create index materials_unit_id_idx on public.materials(unit_id);
create index customers_phone_idx on public.customers(phone);
create index customers_name_idx on public.customers(name);
create index suppliers_phone_idx on public.suppliers(phone);
create index suppliers_name_idx on public.suppliers(name);
create index purchase_receipts_supplier_date_idx on public.purchase_receipts(supplier_id, receipt_date desc);
create index purchase_receipts_status_date_idx on public.purchase_receipts(status, receipt_date desc);
create index purchase_receipts_payment_status_date_idx on public.purchase_receipts(payment_status, receipt_date desc);
create index purchase_receipt_items_material_id_idx on public.purchase_receipt_items(material_id);
create index sales_orders_customer_date_idx on public.sales_orders(customer_id, sale_date desc);
create index sales_orders_status_date_idx on public.sales_orders(status, sale_date desc);
create index sales_orders_payment_status_date_idx on public.sales_orders(payment_status, sale_date desc);
create index sales_order_items_material_id_idx on public.sales_order_items(material_id);
create index inventory_movements_material_date_idx on public.inventory_movements(material_id, movement_date, created_at);
create index inventory_movements_source_idx on public.inventory_movements(source_type, source_id);
create index debt_ledger_entries_customer_date_idx on public.debt_ledger_entries(customer_id, entry_date, created_at);
create index debt_ledger_entries_supplier_date_idx on public.debt_ledger_entries(supplier_id, entry_date, created_at);
create index debt_ledger_entries_source_idx on public.debt_ledger_entries(source_type, source_id);
create index customer_payments_customer_date_idx on public.customer_payments(customer_id, payment_date desc);
create index customer_payments_sales_order_id_idx on public.customer_payments(sales_order_id);
create index supplier_payments_supplier_date_idx on public.supplier_payments(supplier_id, payment_date desc);
create index supplier_payments_purchase_receipt_id_idx on public.supplier_payments(purchase_receipt_id);
create index sales_returns_order_date_idx on public.sales_returns(sales_order_id, return_date desc);
create index sales_return_items_material_id_idx on public.sales_return_items(material_id);
create index purchase_returns_receipt_date_idx on public.purchase_returns(purchase_receipt_id, return_date desc);
create index purchase_return_items_material_id_idx on public.purchase_return_items(material_id);
create index stocktakes_status_date_idx on public.stocktakes(status, stocktake_date desc);
create index stocktake_items_material_id_idx on public.stocktake_items(material_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index audit_logs_user_idx on public.audit_logs(user_id, created_at desc);
create index idempotency_keys_expires_at_idx on public.idempotency_keys(expires_at);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.units enable row level security;
alter table public.materials enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_receipts enable row level security;
alter table public.purchase_receipt_items enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.customer_payments enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.debt_ledger_entries enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.sales_returns enable row level security;
alter table public.sales_return_items enable row level security;
alter table public.purchase_returns enable row level security;
alter table public.purchase_return_items enable row level security;
alter table public.stocktakes enable row level security;
alter table public.stocktake_items enable row level security;
alter table public.audit_logs enable row level security;
alter table public.document_sequences enable row level security;
alter table public.idempotency_keys enable row level security;

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.categories,
  public.units,
  public.materials,
  public.customers,
  public.suppliers,
  public.purchase_receipts,
  public.purchase_receipt_items,
  public.sales_orders,
  public.sales_order_items,
  public.sales_returns,
  public.sales_return_items,
  public.purchase_returns,
  public.purchase_return_items,
  public.stocktakes,
  public.stocktake_items
to authenticated;

grant select on
  public.customer_payments,
  public.supplier_payments,
  public.debt_ledger_entries,
  public.inventory_movements,
  public.audit_logs,
  public.document_sequences,
  public.idempotency_keys
to authenticated;

create policy profiles_select_self_or_admin
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_insert_admin
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

create policy profiles_update_self_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy master_select_active_users on public.categories
  for select to authenticated using (public.is_active_user());
create policy master_insert_active_users on public.categories
  for insert to authenticated with check (public.is_active_user() and created_by = auth.uid());
create policy master_update_active_users on public.categories
  for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy master_delete_admin on public.categories
  for delete to authenticated using (public.is_admin());

create policy units_select_active_users on public.units
  for select to authenticated using (public.is_active_user());
create policy units_insert_active_users on public.units
  for insert to authenticated with check (public.is_active_user() and created_by = auth.uid());
create policy units_update_active_users on public.units
  for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy units_delete_admin on public.units
  for delete to authenticated using (public.is_admin());

create policy materials_select_active_users on public.materials
  for select to authenticated using (public.is_active_user());
create policy materials_insert_active_users on public.materials
  for insert to authenticated with check (public.is_active_user() and created_by = auth.uid());
create policy materials_update_active_users on public.materials
  for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy materials_delete_admin on public.materials
  for delete to authenticated using (public.is_admin());

create policy customers_select_active_users on public.customers
  for select to authenticated using (public.is_active_user());
create policy customers_insert_active_users on public.customers
  for insert to authenticated with check (public.is_active_user() and created_by = auth.uid());
create policy customers_update_active_users on public.customers
  for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy customers_delete_admin on public.customers
  for delete to authenticated using (public.is_admin() and code <> 'WALK_IN_CUSTOMER');

create policy suppliers_select_active_users on public.suppliers
  for select to authenticated using (public.is_active_user());
create policy suppliers_insert_active_users on public.suppliers
  for insert to authenticated with check (public.is_active_user() and created_by = auth.uid());
create policy suppliers_update_active_users on public.suppliers
  for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy suppliers_delete_admin on public.suppliers
  for delete to authenticated using (public.is_admin());

create policy purchase_receipts_select_active_users on public.purchase_receipts
  for select to authenticated using (public.is_active_user());
create policy purchase_receipts_insert_draft on public.purchase_receipts
  for insert to authenticated with check (
    public.is_active_user()
    and status = 'DRAFT'
    and created_by = auth.uid()
    and paid_amount = 0
    and debt_amount = total_amount
    and payment_status = 'UNPAID'
    and confirmed_by is null
    and confirmed_at is null
    and cancelled_by is null
    and cancelled_at is null
    and cancellation_reason is null
  );
create policy purchase_receipts_update_own_draft on public.purchase_receipts
  for update to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()))
  with check (status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));
create policy purchase_receipts_delete_own_draft on public.purchase_receipts
  for delete to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));

create policy sales_orders_select_active_users on public.sales_orders
  for select to authenticated using (public.is_active_user());
create policy sales_orders_insert_draft on public.sales_orders
  for insert to authenticated with check (
    public.is_active_user()
    and status = 'DRAFT'
    and created_by = auth.uid()
    and paid_amount = 0
    and debt_amount = total_amount
    and payment_status = 'UNPAID'
    and confirmed_by is null
    and confirmed_at is null
    and cancelled_by is null
    and cancelled_at is null
    and cancellation_reason is null
  );
create policy sales_orders_update_own_draft on public.sales_orders
  for update to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()))
  with check (status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));
create policy sales_orders_delete_own_draft on public.sales_orders
  for delete to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));

create policy sales_returns_select_active_users on public.sales_returns
  for select to authenticated using (public.is_active_user());
create policy sales_returns_insert_draft on public.sales_returns
  for insert to authenticated with check (
    public.is_active_user()
    and status = 'DRAFT'
    and created_by = auth.uid()
    and refund_amount = 0
    and confirmed_by is null
    and confirmed_at is null
    and cancelled_by is null
    and cancelled_at is null
    and cancellation_reason is null
  );
create policy sales_returns_update_own_draft on public.sales_returns
  for update to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()))
  with check (status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));
create policy sales_returns_delete_own_draft on public.sales_returns
  for delete to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));

create policy purchase_returns_select_active_users on public.purchase_returns
  for select to authenticated using (public.is_active_user());
create policy purchase_returns_insert_draft on public.purchase_returns
  for insert to authenticated with check (
    public.is_active_user()
    and status = 'DRAFT'
    and created_by = auth.uid()
    and refund_amount = 0
    and confirmed_by is null
    and confirmed_at is null
    and cancelled_by is null
    and cancelled_at is null
    and cancellation_reason is null
  );
create policy purchase_returns_update_own_draft on public.purchase_returns
  for update to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()))
  with check (status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));
create policy purchase_returns_delete_own_draft on public.purchase_returns
  for delete to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));

create policy stocktakes_select_active_users on public.stocktakes
  for select to authenticated using (public.is_active_user());
create policy stocktakes_insert_draft on public.stocktakes
  for insert to authenticated with check (
    public.is_active_user()
    and status = 'DRAFT'
    and created_by = auth.uid()
    and confirmed_by is null
    and confirmed_at is null
    and cancelled_by is null
    and cancelled_at is null
    and cancellation_reason is null
  );
create policy stocktakes_update_own_draft on public.stocktakes
  for update to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()))
  with check (status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));
create policy stocktakes_delete_own_draft on public.stocktakes
  for delete to authenticated using (public.is_active_user() and status = 'DRAFT' and (created_by = auth.uid() or public.is_admin()));

create policy purchase_receipt_items_select_active_users on public.purchase_receipt_items
  for select to authenticated using (public.is_active_user());
create policy purchase_receipt_items_insert_draft_parent on public.purchase_receipt_items
  for insert to authenticated with check (
    public.is_active_user()
    and exists (
      select 1 from public.purchase_receipts pr
      where pr.id = purchase_receipt_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  );
create policy purchase_receipt_items_update_draft_parent on public.purchase_receipt_items
  for update to authenticated using (
    public.is_active_user()
    and exists (
      select 1 from public.purchase_receipts pr
      where pr.id = purchase_receipt_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.purchase_receipts pr
      where pr.id = purchase_receipt_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  );
create policy purchase_receipt_items_delete_draft_parent on public.purchase_receipt_items
  for delete to authenticated using (
    public.is_active_user()
    and
    exists (
      select 1 from public.purchase_receipts pr
      where pr.id = purchase_receipt_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  );

create policy sales_order_items_select_active_users on public.sales_order_items
  for select to authenticated using (public.is_active_user());
create policy sales_order_items_insert_draft_parent on public.sales_order_items
  for insert to authenticated with check (
    public.is_active_user()
    and exists (
      select 1 from public.sales_orders so
      where so.id = sales_order_id
        and so.status = 'DRAFT'
        and (so.created_by = auth.uid() or public.is_admin())
    )
  );
create policy sales_order_items_update_draft_parent on public.sales_order_items
  for update to authenticated using (
    public.is_active_user()
    and exists (
      select 1 from public.sales_orders so
      where so.id = sales_order_id
        and so.status = 'DRAFT'
        and (so.created_by = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.sales_orders so
      where so.id = sales_order_id
        and so.status = 'DRAFT'
        and (so.created_by = auth.uid() or public.is_admin())
    )
  );
create policy sales_order_items_delete_draft_parent on public.sales_order_items
  for delete to authenticated using (
    public.is_active_user()
    and
    exists (
      select 1 from public.sales_orders so
      where so.id = sales_order_id
        and so.status = 'DRAFT'
        and (so.created_by = auth.uid() or public.is_admin())
    )
  );

create policy sales_return_items_select_active_users on public.sales_return_items
  for select to authenticated using (public.is_active_user());
create policy sales_return_items_insert_draft_parent on public.sales_return_items
  for insert to authenticated with check (
    public.is_active_user()
    and exists (
      select 1 from public.sales_returns sr
      where sr.id = sales_return_id
        and sr.status = 'DRAFT'
        and (sr.created_by = auth.uid() or public.is_admin())
    )
  );
create policy sales_return_items_update_draft_parent on public.sales_return_items
  for update to authenticated using (
    public.is_active_user()
    and exists (
      select 1 from public.sales_returns sr
      where sr.id = sales_return_id
        and sr.status = 'DRAFT'
        and (sr.created_by = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.sales_returns sr
      where sr.id = sales_return_id
        and sr.status = 'DRAFT'
        and (sr.created_by = auth.uid() or public.is_admin())
    )
  );
create policy sales_return_items_delete_draft_parent on public.sales_return_items
  for delete to authenticated using (
    public.is_active_user()
    and
    exists (
      select 1 from public.sales_returns sr
      where sr.id = sales_return_id
        and sr.status = 'DRAFT'
        and (sr.created_by = auth.uid() or public.is_admin())
    )
  );

create policy purchase_return_items_select_active_users on public.purchase_return_items
  for select to authenticated using (public.is_active_user());
create policy purchase_return_items_insert_draft_parent on public.purchase_return_items
  for insert to authenticated with check (
    public.is_active_user()
    and exists (
      select 1 from public.purchase_returns pr
      where pr.id = purchase_return_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  );
create policy purchase_return_items_update_draft_parent on public.purchase_return_items
  for update to authenticated using (
    public.is_active_user()
    and exists (
      select 1 from public.purchase_returns pr
      where pr.id = purchase_return_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.purchase_returns pr
      where pr.id = purchase_return_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  );
create policy purchase_return_items_delete_draft_parent on public.purchase_return_items
  for delete to authenticated using (
    public.is_active_user()
    and
    exists (
      select 1 from public.purchase_returns pr
      where pr.id = purchase_return_id
        and pr.status = 'DRAFT'
        and (pr.created_by = auth.uid() or public.is_admin())
    )
  );

create policy stocktake_items_select_active_users on public.stocktake_items
  for select to authenticated using (public.is_active_user());
create policy stocktake_items_insert_draft_parent on public.stocktake_items
  for insert to authenticated with check (
    public.is_active_user()
    and exists (
      select 1 from public.stocktakes s
      where s.id = stocktake_id
        and s.status = 'DRAFT'
        and (s.created_by = auth.uid() or public.is_admin())
    )
  );
create policy stocktake_items_update_draft_parent on public.stocktake_items
  for update to authenticated using (
    public.is_active_user()
    and exists (
      select 1 from public.stocktakes s
      where s.id = stocktake_id
        and s.status = 'DRAFT'
        and (s.created_by = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.stocktakes s
      where s.id = stocktake_id
        and s.status = 'DRAFT'
        and (s.created_by = auth.uid() or public.is_admin())
    )
  );
create policy stocktake_items_delete_draft_parent on public.stocktake_items
  for delete to authenticated using (
    public.is_active_user()
    and
    exists (
      select 1 from public.stocktakes s
      where s.id = stocktake_id
        and s.status = 'DRAFT'
        and (s.created_by = auth.uid() or public.is_admin())
    )
  );

create policy customer_payments_select_active_users on public.customer_payments
  for select to authenticated using (public.is_active_user());
create policy supplier_payments_select_active_users on public.supplier_payments
  for select to authenticated using (public.is_active_user());
create policy debt_ledger_entries_select_active_users on public.debt_ledger_entries
  for select to authenticated using (public.is_active_user());
create policy inventory_movements_select_active_users on public.inventory_movements
  for select to authenticated using (public.is_active_user());
create policy audit_logs_select_admin_or_self on public.audit_logs
  for select to authenticated using (public.is_admin() or user_id = auth.uid());
create policy document_sequences_select_admin on public.document_sequences
  for select to authenticated using (public.is_admin());
create policy idempotency_keys_select_admin_or_self on public.idempotency_keys
  for select to authenticated using (public.is_admin() or user_id = auth.uid());
