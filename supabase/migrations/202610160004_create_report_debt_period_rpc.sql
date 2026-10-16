-- Customer / supplier debt period report (business rules 71-72). ADMIN only.
--
-- closing = opening + increase - payment - return_adjustment + other_adjustment
--
-- All buckets come from debt_ledger_entries (append-only). REVERSAL entries are
-- attributed to the bucket of the entry they reverse (reversal_of_id), so a
-- cancelled payment reduces "payment" rather than appearing as a new charge.
--
-- Overdue debt is not computed: no due date is stored yet, and rule 31 says a
-- debt without dueDate must not be treated as overdue.
create or replace function public.report_debt_period(
  p_direction public.debt_direction,
  p_from date,
  p_to date
)
returns table (
  party_id uuid,
  party_code varchar,
  party_name varchar,
  opening_debt bigint,
  debt_increase bigint,
  payment_amount bigint,
  return_adjustment bigint,
  other_adjustment bigint,
  closing_debt bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'Only ADMIN can view debt reports'
      using errcode = '42501';
  end if;

  if p_direction is null or p_from is null or p_to is null or p_from > p_to then
    raise exception 'Invalid debt report parameters'
      using errcode = '22023';
  end if;

  return query
  with classified as (
    select
      case when p_direction = 'RECEIVABLE' then e.customer_id else e.supplier_id end as party,
      e.entry_date,
      e.amount_delta,
      case
        when e.entry_type = 'REVERSAL' then original.entry_type
        else e.entry_type
      end as bucket
    from public.debt_ledger_entries e
    left join public.debt_ledger_entries original
      on original.id = e.reversal_of_id
    where e.direction = p_direction
      and e.entry_date <= p_to
  ),
  totals as (
    select
      c.party,
      coalesce(sum(c.amount_delta) filter (where c.entry_date < p_from), 0) as opening,
      coalesce(sum(c.amount_delta) filter (
        where c.entry_date >= p_from and c.bucket = 'CHARGE'), 0) as increase,
      -- Payments and returns reduce debt; report them as positive amounts.
      -coalesce(sum(c.amount_delta) filter (
        where c.entry_date >= p_from and c.bucket = 'PAYMENT'), 0) as payment,
      -coalesce(sum(c.amount_delta) filter (
        where c.entry_date >= p_from and c.bucket = 'RETURN'), 0) as returned,
      -- Signed: manual adjustments may increase or decrease debt.
      coalesce(sum(c.amount_delta) filter (
        where c.entry_date >= p_from and c.bucket = 'ADJUSTMENT'), 0) as adjustment,
      coalesce(sum(c.amount_delta), 0) as closing
    from classified c
    group by c.party
  ),
  parties as (
    select id, code, name from public.customers where p_direction = 'RECEIVABLE'
    union all
    select id, code, name from public.suppliers where p_direction = 'PAYABLE'
  )
  select
    p.id,
    p.code::varchar,
    p.name::varchar,
    t.opening::bigint,
    t.increase::bigint,
    t.payment::bigint,
    t.returned::bigint,
    t.adjustment::bigint,
    t.closing::bigint
  from totals t
  join parties p on p.id = t.party
  where t.opening <> 0 or t.closing <> 0 or t.increase <> 0
     or t.payment <> 0 or t.returned <> 0 or t.adjustment <> 0
  order by p.name, p.code;
end;
$$;

revoke all on function public.report_debt_period(public.debt_direction, date, date) from public, anon;
grant execute on function public.report_debt_period(public.debt_direction, date, date) to authenticated;
