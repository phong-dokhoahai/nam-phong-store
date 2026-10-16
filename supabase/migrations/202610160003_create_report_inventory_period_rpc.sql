-- Inventory period report (business rules 67-68).
--
-- closing = opening + import + customer_return + adjustment_in
--           - export - supplier_return - adjustment_out
--
-- Every bucket is derived from inventory_movements (the audit trail), never
-- from current master data (rule 73). REVERSAL_IN / REVERSAL_OUT rows are
-- attributed to the bucket of the movement they reverse, so cancelling a
-- confirmed receipt reduces "import" instead of appearing as a separate flow.
--
-- security invoker: RLS of the caller applies (active users may read movements).
create or replace function public.report_inventory_period(
  p_from date,
  p_to date,
  p_category_id uuid default null
)
returns table (
  material_id uuid,
  sku varchar,
  name varchar,
  category_id uuid,
  category_name varchar,
  unit_name varchar,
  is_active boolean,
  opening_quantity numeric,
  import_quantity numeric,
  customer_return_quantity numeric,
  adjustment_in_quantity numeric,
  export_quantity numeric,
  supplier_return_quantity numeric,
  adjustment_out_quantity numeric,
  closing_quantity numeric,
  current_stock numeric
)
language plpgsql
stable
security invoker
set search_path = public
as $$
#variable_conflict use_column
begin
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Invalid report period: % to %', p_from, p_to
      using errcode = '22023';
  end if;

  return query
  with classified as (
    select
      mv.material_id,
      mv.movement_date,
      mv.quantity_delta,
      case
        when mv.movement_type in ('REVERSAL_IN', 'REVERSAL_OUT')
          then original.movement_type
        else mv.movement_type
      end as bucket
    from public.inventory_movements mv
    left join public.inventory_movements original
      on original.id = mv.reversal_of_id
    where mv.movement_date <= p_to
  ),
  totals as (
    select
      c.material_id,
      coalesce(sum(c.quantity_delta) filter (where c.movement_date < p_from), 0) as opening,
      coalesce(sum(c.quantity_delta) filter (
        where c.movement_date >= p_from and c.bucket = 'PURCHASE_IN'), 0) as import_qty,
      coalesce(sum(c.quantity_delta) filter (
        where c.movement_date >= p_from and c.bucket = 'SALE_RETURN_IN'), 0) as customer_return_qty,
      coalesce(sum(c.quantity_delta) filter (
        where c.movement_date >= p_from and c.bucket = 'ADJUSTMENT_IN'), 0) as adjustment_in_qty,
      -- Outflow buckets are reported as positive quantities.
      -coalesce(sum(c.quantity_delta) filter (
        where c.movement_date >= p_from and c.bucket = 'SALE_OUT'), 0) as export_qty,
      -coalesce(sum(c.quantity_delta) filter (
        where c.movement_date >= p_from and c.bucket = 'PURCHASE_RETURN_OUT'), 0) as supplier_return_qty,
      -coalesce(sum(c.quantity_delta) filter (
        where c.movement_date >= p_from and c.bucket = 'ADJUSTMENT_OUT'), 0) as adjustment_out_qty,
      coalesce(sum(c.quantity_delta), 0) as closing
    from classified c
    group by c.material_id
  )
  select
    m.id,
    m.sku,
    m.name,
    m.category_id,
    cat.name,
    u.name,
    m.is_active,
    coalesce(t.opening, 0),
    coalesce(t.import_qty, 0),
    coalesce(t.customer_return_qty, 0),
    coalesce(t.adjustment_in_qty, 0),
    coalesce(t.export_qty, 0),
    coalesce(t.supplier_return_qty, 0),
    coalesce(t.adjustment_out_qty, 0),
    coalesce(t.closing, 0),
    m.current_stock
  from public.materials m
  join public.categories cat on cat.id = m.category_id
  join public.units u on u.id = m.unit_id
  left join totals t on t.material_id = m.id
  where (p_category_id is null or m.category_id = p_category_id)
    -- Inactive materials only appear when they still matter for the period.
    and (m.is_active or coalesce(t.opening, 0) <> 0 or coalesce(t.closing, 0) <> 0
         or t.import_qty <> 0 or t.export_qty <> 0
         or t.customer_return_qty <> 0 or t.supplier_return_qty <> 0
         or t.adjustment_in_qty <> 0 or t.adjustment_out_qty <> 0)
  order by m.name, m.sku;
end;
$$;

revoke all on function public.report_inventory_period(date, date, uuid) from public, anon;
grant execute on function public.report_inventory_period(date, date, uuid) to authenticated;
