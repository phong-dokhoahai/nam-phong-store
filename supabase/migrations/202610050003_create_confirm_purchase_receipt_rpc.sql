create or replace function public.next_document_code(
  document_type text,
  document_date date default current_date
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value bigint;
  normalized_type text := upper(trim(document_type));
begin
  if normalized_type = '' then
    raise exception 'Document type is required';
  end if;

  insert into public.document_sequences (
    document_type,
    sequence_date,
    current_value
  )
  values (
    normalized_type,
    document_date,
    1
  )
  on conflict (document_type, sequence_date)
  do update set
    current_value = public.document_sequences.current_value + 1,
    updated_at = now()
  returning current_value into next_value;

  return format(
    '%s-%s-%s',
    normalized_type,
    to_char(document_date, 'YYYYMMDD'),
    lpad(next_value::text, 4, '0')
  );
end;
$$;

create unique index if not exists inventory_movements_source_item_type_uidx
  on public.inventory_movements(source_type, source_item_id, movement_type);

create unique index if not exists debt_ledger_entries_source_entry_type_uidx
  on public.debt_ledger_entries(source_type, source_id, entry_type);

create or replace function public.confirm_purchase_receipt(receipt_id uuid)
returns public.purchase_receipts
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  acting_user_role public.app_role;
  receipt_row public.purchase_receipts%rowtype;
  confirmed_receipt public.purchase_receipts%rowtype;
  item_count integer;
  calculated_subtotal bigint;
  calculated_total bigint;
  item_row record;
  quantity_before numeric(18,3);
  quantity_after numeric(18,3);
begin
  if acting_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select p.role
  into acting_user_role
  from public.profiles p
  where p.id = acting_user_id
    and p.is_active = true;

  if acting_user_role not in ('ADMIN'::public.app_role, 'WAREHOUSE_STAFF'::public.app_role) then
    raise exception 'Only active ADMIN or WAREHOUSE_STAFF users can confirm purchase receipts';
  end if;

  select *
  into receipt_row
  from public.purchase_receipts
  where id = receipt_id
  for update;

  if not found then
    raise exception 'Purchase receipt not found';
  end if;

  if receipt_row.status <> 'DRAFT'::public.document_status then
    raise exception 'Only DRAFT purchase receipts can be confirmed';
  end if;

  if not exists (
    select 1
    from public.suppliers s
    where s.id = receipt_row.supplier_id
      and s.is_active = true
  ) then
    raise exception 'Supplier is inactive or not found';
  end if;

  select count(*), coalesce(sum(pri.line_total), 0)::bigint
  into item_count, calculated_subtotal
  from public.purchase_receipt_items pri
  where pri.purchase_receipt_id = receipt_row.id;

  if item_count = 0 then
    raise exception 'Purchase receipt must have at least one item';
  end if;

  if exists (
    select 1
    from public.purchase_receipt_items pri
    join public.materials m on m.id = pri.material_id
    where pri.purchase_receipt_id = receipt_row.id
      and (
        pri.quantity <= 0
        or pri.unit_price < 0
        or pri.discount_amount < 0
        or pri.line_total <> (pri.quantity * pri.unit_price) - pri.discount_amount
        or m.is_active = false
      )
  ) then
    raise exception 'Purchase receipt has inactive materials or invalid item values';
  end if;

  if receipt_row.discount_amount > calculated_subtotal then
    raise exception 'Receipt discount cannot exceed subtotal';
  end if;

  calculated_total =
    calculated_subtotal
    - receipt_row.discount_amount
    + receipt_row.shipping_fee
    + receipt_row.tax_amount;

  if calculated_total < 0 then
    raise exception 'Receipt total cannot be negative';
  end if;

  perform 1
  from public.materials m
  join public.purchase_receipt_items pri on pri.material_id = m.id
  where pri.purchase_receipt_id = receipt_row.id
  order by m.id
  for update of m;

  update public.purchase_receipt_items pri
  set
    material_sku_snapshot = m.sku,
    material_name_snapshot = m.name,
    unit_name_snapshot = u.name
  from public.materials m
  join public.units u on u.id = m.unit_id
  where pri.purchase_receipt_id = receipt_row.id
    and pri.material_id = m.id;

  perform set_config('app.allow_stock_update', 'on', true);
  perform set_config('app.allow_document_state_update', 'on', true);
  perform set_config('app.allow_financial_aggregate_update', 'on', true);

  for item_row in
    select
      pri.id,
      pri.material_id,
      pri.quantity,
      pri.unit_price
    from public.purchase_receipt_items pri
    where pri.purchase_receipt_id = receipt_row.id
    order by pri.material_id
  loop
    select m.current_stock
    into quantity_before
    from public.materials m
    where m.id = item_row.material_id
    for update;

    quantity_after = quantity_before + item_row.quantity;

    update public.materials
    set current_stock = quantity_after
    where id = item_row.material_id;

    insert into public.inventory_movements (
      material_id,
      movement_type,
      movement_date,
      quantity_delta,
      unit_cost,
      source_type,
      source_id,
      source_item_id,
      note,
      created_by
    )
    values (
      item_row.material_id,
      'PURCHASE_IN',
      receipt_row.receipt_date,
      item_row.quantity,
      item_row.unit_price,
      'PURCHASE_RECEIPT',
      receipt_row.id,
      item_row.id,
      'Confirmed purchase receipt',
      acting_user_id
    );
  end loop;

  update public.purchase_receipts
  set
    status = 'CONFIRMED',
    subtotal = calculated_subtotal,
    total_amount = calculated_total,
    paid_amount = 0,
    debt_amount = calculated_total,
    payment_status = 'UNPAID',
    confirmed_by = acting_user_id,
    confirmed_at = now()
  where id = receipt_row.id
  returning * into confirmed_receipt;

  if calculated_total > 0 then
    insert into public.debt_ledger_entries (
      direction,
      supplier_id,
      entry_type,
      entry_date,
      amount_delta,
      source_type,
      source_id,
      description,
      created_by
    )
    values (
      'PAYABLE',
      receipt_row.supplier_id,
      'CHARGE',
      receipt_row.receipt_date,
      calculated_total,
      'PURCHASE_RECEIPT',
      receipt_row.id,
      'Purchase receipt payable',
      acting_user_id
    );
  end if;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  )
  values (
    acting_user_id,
    'CONFIRM_PURCHASE_RECEIPT',
    'purchase_receipts',
    receipt_row.id,
    jsonb_build_object('status', receipt_row.status),
    jsonb_build_object(
      'status', confirmed_receipt.status,
      'subtotal', confirmed_receipt.subtotal,
      'total_amount', confirmed_receipt.total_amount,
      'debt_amount', confirmed_receipt.debt_amount
    )
  );

  return confirmed_receipt;
end;
$$;

revoke all on function public.next_document_code(text, date) from public;
revoke all on function public.confirm_purchase_receipt(uuid) from public;

grant execute on function public.next_document_code(text, date) to authenticated;
grant execute on function public.confirm_purchase_receipt(uuid) to authenticated;
