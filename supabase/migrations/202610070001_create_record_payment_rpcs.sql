create or replace function public.record_customer_payment(
  sales_order_id uuid,
  amount bigint,
  payment_date date default current_date,
  method public.payment_method default 'CASH',
  reference_number text default null,
  note text default null
)
returns public.customer_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  acting_user_role public.app_role;
  order_row public.sales_orders%rowtype;
  payment_row public.customer_payments%rowtype;
  new_paid_amount bigint;
  new_debt_amount bigint;
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
    raise exception 'Only active ADMIN or WAREHOUSE_STAFF users can record payments';
  end if;

  if amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select *
  into order_row
  from public.sales_orders
  where id = sales_order_id
  for update;

  if not found then
    raise exception 'Sales order not found';
  end if;

  if order_row.status <> 'CONFIRMED'::public.document_status then
    raise exception 'Only CONFIRMED sales orders can receive payments';
  end if;

  if amount > order_row.debt_amount then
    raise exception 'Payment amount cannot exceed remaining debt';
  end if;

  insert into public.customer_payments (
    code,
    customer_id,
    sales_order_id,
    payment_date,
    amount,
    method,
    reference_number,
    note,
    created_by
  )
  values (
    public.next_document_code('PT', payment_date),
    order_row.customer_id,
    order_row.id,
    payment_date,
    amount,
    method,
    nullif(trim(reference_number), ''),
    nullif(trim(note), ''),
    acting_user_id
  )
  returning * into payment_row;

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
    'PAYMENT',
    payment_date,
    -amount,
    'CUSTOMER_PAYMENT',
    payment_row.id,
    'Customer payment',
    acting_user_id
  );

  new_paid_amount = order_row.paid_amount + amount;
  new_debt_amount = order_row.total_amount - new_paid_amount;

  perform set_config('app.allow_document_state_update', 'on', true);
  perform set_config('app.allow_financial_aggregate_update', 'on', true);

  update public.sales_orders
  set
    paid_amount = new_paid_amount,
    debt_amount = new_debt_amount,
    payment_status = case
      when new_debt_amount = 0 then 'PAID'::public.payment_status
      else 'PARTIALLY_PAID'::public.payment_status
    end
  where id = order_row.id;

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
    'RECORD_CUSTOMER_PAYMENT',
    'customer_payments',
    payment_row.id,
    jsonb_build_object(
      'sales_order_id', order_row.id,
      'paid_amount', order_row.paid_amount,
      'debt_amount', order_row.debt_amount
    ),
    jsonb_build_object(
      'sales_order_id', order_row.id,
      'amount', payment_row.amount,
      'paid_amount', new_paid_amount,
      'debt_amount', new_debt_amount
    )
  );

  return payment_row;
end;
$$;

create or replace function public.record_supplier_payment(
  purchase_receipt_id uuid,
  amount bigint,
  payment_date date default current_date,
  method public.payment_method default 'CASH',
  reference_number text default null,
  note text default null
)
returns public.supplier_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  acting_user_role public.app_role;
  receipt_row public.purchase_receipts%rowtype;
  payment_row public.supplier_payments%rowtype;
  new_paid_amount bigint;
  new_debt_amount bigint;
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
    raise exception 'Only active ADMIN or WAREHOUSE_STAFF users can record payments';
  end if;

  if amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select *
  into receipt_row
  from public.purchase_receipts
  where id = purchase_receipt_id
  for update;

  if not found then
    raise exception 'Purchase receipt not found';
  end if;

  if receipt_row.status <> 'CONFIRMED'::public.document_status then
    raise exception 'Only CONFIRMED purchase receipts can receive payments';
  end if;

  if amount > receipt_row.debt_amount then
    raise exception 'Payment amount cannot exceed remaining debt';
  end if;

  insert into public.supplier_payments (
    code,
    supplier_id,
    purchase_receipt_id,
    payment_date,
    amount,
    method,
    reference_number,
    note,
    created_by
  )
  values (
    public.next_document_code('PC', payment_date),
    receipt_row.supplier_id,
    receipt_row.id,
    payment_date,
    amount,
    method,
    nullif(trim(reference_number), ''),
    nullif(trim(note), ''),
    acting_user_id
  )
  returning * into payment_row;

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
    'PAYMENT',
    payment_date,
    -amount,
    'SUPPLIER_PAYMENT',
    payment_row.id,
    'Supplier payment',
    acting_user_id
  );

  new_paid_amount = receipt_row.paid_amount + amount;
  new_debt_amount = receipt_row.total_amount - new_paid_amount;

  perform set_config('app.allow_document_state_update', 'on', true);
  perform set_config('app.allow_financial_aggregate_update', 'on', true);

  update public.purchase_receipts
  set
    paid_amount = new_paid_amount,
    debt_amount = new_debt_amount,
    payment_status = case
      when new_debt_amount = 0 then 'PAID'::public.payment_status
      else 'PARTIALLY_PAID'::public.payment_status
    end
  where id = receipt_row.id;

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
    'RECORD_SUPPLIER_PAYMENT',
    'supplier_payments',
    payment_row.id,
    jsonb_build_object(
      'purchase_receipt_id', receipt_row.id,
      'paid_amount', receipt_row.paid_amount,
      'debt_amount', receipt_row.debt_amount
    ),
    jsonb_build_object(
      'purchase_receipt_id', receipt_row.id,
      'amount', payment_row.amount,
      'paid_amount', new_paid_amount,
      'debt_amount', new_debt_amount
    )
  );

  return payment_row;
end;
$$;

revoke all on function public.record_customer_payment(uuid, bigint, date, public.payment_method, text, text) from public;
revoke all on function public.record_supplier_payment(uuid, bigint, date, public.payment_method, text, text) from public;

grant execute on function public.record_customer_payment(uuid, bigint, date, public.payment_method, text, text) to authenticated;
grant execute on function public.record_supplier_payment(uuid, bigint, date, public.payment_method, text, text) to authenticated;
