create or replace function public.confirm_sales_order(order_id uuid)
returns public.sales_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  acting_user_role public.app_role;
  order_row public.sales_orders%rowtype;
  confirmed_order public.sales_orders%rowtype;
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
    raise exception 'Only active ADMIN or WAREHOUSE_STAFF users can confirm sales orders';
  end if;

  select *
  into order_row
  from public.sales_orders
  where id = order_id
  for update;

  if not found then
    raise exception 'Sales order not found';
  end if;

  if order_row.status <> 'DRAFT'::public.document_status then
    raise exception 'Only DRAFT sales orders can be confirmed';
  end if;

  if not exists (
    select 1
    from public.customers c
    where c.id = order_row.customer_id
      and c.is_active = true
  ) then
    raise exception 'Customer is inactive or not found';
  end if;

  select count(*), coalesce(sum(soi.line_total), 0)::bigint
  into item_count, calculated_subtotal
  from public.sales_order_items soi
  where soi.sales_order_id = order_row.id;

  if item_count = 0 then
    raise exception 'Sales order must have at least one item';
  end if;

  if exists (
    select 1
    from public.sales_order_items soi
    join public.materials m on m.id = soi.material_id
    where soi.sales_order_id = order_row.id
      and (
        soi.quantity <= 0
        or soi.unit_price < 0
        or soi.discount_amount < 0
        or soi.line_total <> (soi.quantity * soi.unit_price) - soi.discount_amount
        or m.is_active = false
      )
  ) then
    raise exception 'Sales order has inactive materials or invalid item values';
  end if;

  if order_row.discount_amount > calculated_subtotal then
    raise exception 'Sales order discount cannot exceed subtotal';
  end if;

  calculated_total =
    calculated_subtotal
    - order_row.discount_amount
    + order_row.shipping_fee
    + order_row.tax_amount;

  if calculated_total < 0 then
    raise exception 'Sales order total cannot be negative';
  end if;

  perform 1
  from public.materials m
  join public.sales_order_items soi on soi.material_id = m.id
  where soi.sales_order_id = order_row.id
  order by m.id
  for update of m;

  if exists (
    select 1
    from public.sales_order_items soi
    join public.materials m on m.id = soi.material_id
    where soi.sales_order_id = order_row.id
      and soi.quantity > m.current_stock
  ) then
    raise exception 'Insufficient stock for one or more materials';
  end if;

  update public.sales_order_items soi
  set
    material_sku_snapshot = m.sku,
    material_name_snapshot = m.name,
    unit_name_snapshot = u.name
  from public.materials m
  join public.units u on u.id = m.unit_id
  where soi.sales_order_id = order_row.id
    and soi.material_id = m.id;

  perform set_config('app.allow_stock_update', 'on', true);
  perform set_config('app.allow_document_state_update', 'on', true);
  perform set_config('app.allow_financial_aggregate_update', 'on', true);

  for item_row in
    select
      soi.id,
      soi.material_id,
      soi.quantity,
      soi.unit_price
    from public.sales_order_items soi
    where soi.sales_order_id = order_row.id
    order by soi.material_id
  loop
    select m.current_stock
    into quantity_before
    from public.materials m
    where m.id = item_row.material_id
    for update;

    quantity_after = quantity_before - item_row.quantity;

    if quantity_after < 0 then
      raise exception 'Insufficient stock for material %', item_row.material_id;
    end if;

    update public.materials
    set current_stock = quantity_after
    where id = item_row.material_id
      and current_stock >= item_row.quantity;

    if not found then
      raise exception 'Insufficient stock for material %', item_row.material_id;
    end if;

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
      'SALE_OUT',
      order_row.sale_date,
      -item_row.quantity,
      item_row.unit_price,
      'SALES_ORDER',
      order_row.id,
      item_row.id,
      'Confirmed sales order',
      acting_user_id
    );
  end loop;

  update public.sales_orders
  set
    status = 'CONFIRMED',
    subtotal = calculated_subtotal,
    total_amount = calculated_total,
    paid_amount = 0,
    debt_amount = calculated_total,
    payment_status = 'UNPAID',
    confirmed_by = acting_user_id,
    confirmed_at = now()
  where id = order_row.id
  returning * into confirmed_order;

  if calculated_total > 0 then
    insert into public.debt_ledger_entries (
      direction,
      customer_id,
      entry_type,
      entry_date,
      amount_delta,
      source_type,
      source_id,
      description,
      created_by
    )
    values (
      'RECEIVABLE',
      order_row.customer_id,
      'CHARGE',
      order_row.sale_date,
      calculated_total,
      'SALES_ORDER',
      order_row.id,
      'Sales order receivable',
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
    'CONFIRM_SALES_ORDER',
    'sales_orders',
    order_row.id,
    jsonb_build_object('status', order_row.status),
    jsonb_build_object(
      'status', confirmed_order.status,
      'subtotal', confirmed_order.subtotal,
      'total_amount', confirmed_order.total_amount,
      'debt_amount', confirmed_order.debt_amount
    )
  );

  return confirmed_order;
end;
$$;

revoke all on function public.confirm_sales_order(uuid) from public;
grant execute on function public.confirm_sales_order(uuid) to authenticated;
