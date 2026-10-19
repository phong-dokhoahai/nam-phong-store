-- Atomic draft saving for sales orders (stock issues) and purchase receipts.
--
-- Before this migration the frontend saved a draft with several independent
-- requests (next code -> insert header -> insert items) and "updated" a draft
-- by creating a new one and deleting the old one. That violated
-- ARCHITECTURE.md 3.1: a dropped request could leave orphan drafts, every save
-- consumed a new document code and the draft id changed on each save.
--
-- These RPCs do the whole save in one transaction:
--   * p_id null  -> create a draft with a new document code;
--   * p_id given -> lock that draft, require DRAFT + owner/ADMIN, replace header
--                   and items in place (id and code are preserved).
-- Money is recomputed server-side from the items; client totals are ignored.
-- A draft is always unpaid: paid_amount = 0, debt_amount = total_amount.
--
-- security invoker: RLS still applies to every read/write. The explicit owner
-- check exists because RLS silently turns a forbidden UPDATE into 0 rows.

-- Parses and validates draft items once for both RPCs. Raises on any invalid
-- line so callers can trust the returned rows (line_total is computed here).
create or replace function public.parse_draft_items(p_items jsonb)
returns table (
  material_id uuid,
  quantity numeric(18,3),
  unit_price bigint,
  discount_amount bigint,
  line_total bigint,
  line_no bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
#variable_conflict use_column
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Items must be a JSON array' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as i(material_id uuid, quantity numeric, unit_price bigint, discount_amount bigint)
    where i.material_id is null
       or i.quantity is null or i.quantity <= 0
       or i.unit_price is null or i.unit_price < 0
       or coalesce(i.discount_amount, 0) < 0
       or coalesce(i.discount_amount, 0) > i.quantity * i.unit_price
  ) then
    raise exception 'Invalid item: material, quantity > 0, price >= 0 and discount <= line amount are required'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as i(quantity numeric, unit_price bigint, discount_amount bigint)
    where i.quantity::numeric(18,3) * i.unit_price - coalesce(i.discount_amount, 0)
          <> trunc(i.quantity::numeric(18,3) * i.unit_price - coalesce(i.discount_amount, 0))
  ) then
    raise exception 'Line total must be a whole amount; adjust quantity or price'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as i(material_id uuid)
    group by i.material_id
    having count(*) > 1
  ) then
    raise exception 'A material can appear only once per document'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as i(material_id uuid)
    left join public.materials m on m.id = i.material_id
    where m.id is null or not m.is_active
  ) then
    raise exception 'One or more materials are inactive or not found'
      using errcode = '22023';
  end if;

  return query
  select
    i.material_id,
    i.quantity::numeric(18,3),
    i.unit_price,
    coalesce(i.discount_amount, 0),
    (i.quantity::numeric(18,3) * i.unit_price - coalesce(i.discount_amount, 0))::bigint,
    t.ordinality
  from jsonb_array_elements(p_items) with ordinality as t(item, ordinality)
  cross join lateral jsonb_to_record(t.item)
    as i(material_id uuid, quantity numeric, unit_price bigint, discount_amount bigint);
end;
$$;

create or replace function public.save_sales_order_draft(
  p_id uuid,
  p_customer_id uuid,
  p_sale_date date,
  p_discount_amount bigint,
  p_shipping_fee bigint,
  p_tax_amount bigint,
  p_delivery_address text,
  p_note text,
  p_items jsonb
)
returns public.sales_orders
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  acting_user_id uuid := auth.uid();
  order_row public.sales_orders%rowtype;
  v_subtotal bigint;
  v_total bigint;
begin
  if acting_user_id is null or not coalesce(public.is_active_user(), false) then
    raise exception 'Only active users can save drafts' using errcode = '42501';
  end if;

  if p_customer_id is null or p_sale_date is null then
    raise exception 'Customer and sale date are required' using errcode = '22023';
  end if;

  if coalesce(p_discount_amount, 0) < 0
     or coalesce(p_shipping_fee, 0) < 0
     or coalesce(p_tax_amount, 0) < 0 then
    raise exception 'Discount, shipping fee and tax cannot be negative'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.customers c where c.id = p_customer_id and c.is_active
  ) then
    raise exception 'Customer is inactive or not found' using errcode = '22023';
  end if;

  -- Validates every line (raises on bad input) and computes the subtotal.
  select coalesce(sum(line_total), 0)::bigint
  into v_subtotal
  from public.parse_draft_items(p_items);

  if coalesce(p_discount_amount, 0) > v_subtotal then
    raise exception 'Document discount cannot exceed subtotal'
      using errcode = '22023';
  end if;

  v_total := v_subtotal
    - coalesce(p_discount_amount, 0)
    + coalesce(p_shipping_fee, 0)
    + coalesce(p_tax_amount, 0);

  if p_id is null then
    insert into public.sales_orders (
      code, customer_id, sale_date, status,
      subtotal, discount_amount, shipping_fee, tax_amount, total_amount,
      paid_amount, debt_amount, payment_status,
      delivery_address, note, created_by
    )
    values (
      public.next_document_code('BH', p_sale_date), p_customer_id, p_sale_date, 'DRAFT',
      v_subtotal, coalesce(p_discount_amount, 0), coalesce(p_shipping_fee, 0),
      coalesce(p_tax_amount, 0), v_total,
      0, v_total, 'UNPAID',
      nullif(trim(p_delivery_address), ''), nullif(trim(p_note), ''), acting_user_id
    )
    returning * into order_row;
  else
    -- Plain read first: SELECT ... FOR UPDATE also applies the UPDATE RLS
    -- policy, which would hide a confirmed or foreign draft and turn every
    -- refusal into a misleading "not found".
    select * into order_row from public.sales_orders where id = p_id;

    if not found then
      raise exception 'Sales order not found' using errcode = 'P0002';
    end if;

    if order_row.status <> 'DRAFT' then
      raise exception 'Only DRAFT sales orders can be edited' using errcode = '22023';
    end if;

    if order_row.created_by <> acting_user_id
       and not coalesce(public.is_admin(), false) then
      raise exception 'Only the creator or an ADMIN can edit this draft'
        using errcode = '42501';
    end if;

    -- Lock, then re-check: the document may have been confirmed in between.
    select * into order_row from public.sales_orders where id = p_id for update;

    if not found or order_row.status <> 'DRAFT' then
      raise exception 'The document was changed by someone else; reload and try again'
        using errcode = '40001';
    end if;

    -- debt_amount follows total_amount on a draft; allowed only inside this RPC.
    perform set_config('app.allow_financial_aggregate_update', 'on', true);

    update public.sales_orders
    set
      customer_id = p_customer_id,
      sale_date = p_sale_date,
      subtotal = v_subtotal,
      discount_amount = coalesce(p_discount_amount, 0),
      shipping_fee = coalesce(p_shipping_fee, 0),
      tax_amount = coalesce(p_tax_amount, 0),
      total_amount = v_total,
      paid_amount = 0,
      debt_amount = v_total,
      payment_status = 'UNPAID',
      delivery_address = nullif(trim(p_delivery_address), ''),
      note = nullif(trim(p_note), '')
    where id = p_id
    returning * into order_row;

    perform set_config('app.allow_financial_aggregate_update', '', true);

    delete from public.sales_order_items where sales_order_id = p_id;
  end if;

  insert into public.sales_order_items (
    sales_order_id, material_id, quantity, unit_price, discount_amount, line_total
  )
  select
    order_row.id, material_id, quantity, unit_price, discount_amount, line_total
  from public.parse_draft_items(p_items)
  order by line_no;

  return order_row;
end;
$$;

create or replace function public.save_purchase_receipt_draft(
  p_id uuid,
  p_supplier_id uuid,
  p_receipt_date date,
  p_discount_amount bigint,
  p_shipping_fee bigint,
  p_tax_amount bigint,
  p_supplier_invoice_number text,
  p_note text,
  p_items jsonb
)
returns public.purchase_receipts
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  acting_user_id uuid := auth.uid();
  receipt_row public.purchase_receipts%rowtype;
  v_subtotal bigint;
  v_total bigint;
begin
  if acting_user_id is null or not coalesce(public.is_active_user(), false) then
    raise exception 'Only active users can save drafts' using errcode = '42501';
  end if;

  if p_supplier_id is null or p_receipt_date is null then
    raise exception 'Supplier and receipt date are required' using errcode = '22023';
  end if;

  if coalesce(p_discount_amount, 0) < 0
     or coalesce(p_shipping_fee, 0) < 0
     or coalesce(p_tax_amount, 0) < 0 then
    raise exception 'Discount, shipping fee and tax cannot be negative'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.suppliers s where s.id = p_supplier_id and s.is_active
  ) then
    raise exception 'Supplier is inactive or not found' using errcode = '22023';
  end if;

  -- Validates every line (raises on bad input) and computes the subtotal.
  select coalesce(sum(line_total), 0)::bigint
  into v_subtotal
  from public.parse_draft_items(p_items);

  if coalesce(p_discount_amount, 0) > v_subtotal then
    raise exception 'Document discount cannot exceed subtotal'
      using errcode = '22023';
  end if;

  v_total := v_subtotal
    - coalesce(p_discount_amount, 0)
    + coalesce(p_shipping_fee, 0)
    + coalesce(p_tax_amount, 0);

  if p_id is null then
    insert into public.purchase_receipts (
      code, supplier_id, receipt_date, status,
      subtotal, discount_amount, shipping_fee, tax_amount, total_amount,
      paid_amount, debt_amount, payment_status,
      supplier_invoice_number, note, created_by
    )
    values (
      public.next_document_code('PN', p_receipt_date), p_supplier_id, p_receipt_date, 'DRAFT',
      v_subtotal, coalesce(p_discount_amount, 0), coalesce(p_shipping_fee, 0),
      coalesce(p_tax_amount, 0), v_total,
      0, v_total, 'UNPAID',
      nullif(trim(p_supplier_invoice_number), ''), nullif(trim(p_note), ''), acting_user_id
    )
    returning * into receipt_row;
  else
    -- Plain read first: SELECT ... FOR UPDATE also applies the UPDATE RLS
    -- policy, which would hide a confirmed or foreign draft and turn every
    -- refusal into a misleading "not found".
    select * into receipt_row from public.purchase_receipts where id = p_id;

    if not found then
      raise exception 'Purchase receipt not found' using errcode = 'P0002';
    end if;

    if receipt_row.status <> 'DRAFT' then
      raise exception 'Only DRAFT purchase receipts can be edited' using errcode = '22023';
    end if;

    if receipt_row.created_by <> acting_user_id
       and not coalesce(public.is_admin(), false) then
      raise exception 'Only the creator or an ADMIN can edit this draft'
        using errcode = '42501';
    end if;

    -- Lock, then re-check: the document may have been confirmed in between.
    select * into receipt_row from public.purchase_receipts where id = p_id for update;

    if not found or receipt_row.status <> 'DRAFT' then
      raise exception 'The document was changed by someone else; reload and try again'
        using errcode = '40001';
    end if;

    perform set_config('app.allow_financial_aggregate_update', 'on', true);

    update public.purchase_receipts
    set
      supplier_id = p_supplier_id,
      receipt_date = p_receipt_date,
      subtotal = v_subtotal,
      discount_amount = coalesce(p_discount_amount, 0),
      shipping_fee = coalesce(p_shipping_fee, 0),
      tax_amount = coalesce(p_tax_amount, 0),
      total_amount = v_total,
      paid_amount = 0,
      debt_amount = v_total,
      payment_status = 'UNPAID',
      supplier_invoice_number = nullif(trim(p_supplier_invoice_number), ''),
      note = nullif(trim(p_note), '')
    where id = p_id
    returning * into receipt_row;

    perform set_config('app.allow_financial_aggregate_update', '', true);

    delete from public.purchase_receipt_items where purchase_receipt_id = p_id;
  end if;

  insert into public.purchase_receipt_items (
    purchase_receipt_id, material_id, quantity, unit_price, discount_amount, line_total
  )
  select
    receipt_row.id, material_id, quantity, unit_price, discount_amount, line_total
  from public.parse_draft_items(p_items)
  order by line_no;

  return receipt_row;
end;
$$;

revoke all on function public.parse_draft_items(jsonb) from public, anon;
revoke all on function public.save_sales_order_draft(uuid, uuid, date, bigint, bigint, bigint, text, text, jsonb) from public, anon;
revoke all on function public.save_purchase_receipt_draft(uuid, uuid, date, bigint, bigint, bigint, text, text, jsonb) from public, anon;
grant execute on function public.parse_draft_items(jsonb) to authenticated;
grant execute on function public.save_sales_order_draft(uuid, uuid, date, bigint, bigint, bigint, text, text, jsonb) to authenticated;
grant execute on function public.save_purchase_receipt_draft(uuid, uuid, date, bigint, bigint, bigint, text, text, jsonb) to authenticated;
