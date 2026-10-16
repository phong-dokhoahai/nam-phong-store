-- Daily revenue summary (ADMIN only).
-- net_revenue = confirmed sales total - confirmed customer returns (docs/database 19).
-- Revenue is based on documents, not on payments (cash flow) or debt.
-- security_invoker keeps RLS; is_admin() additionally hides every row from non-admins.
create or replace view public.v_daily_sales_summary
with (security_invoker = true) as
with sales as (
  select
    sale_date as summary_date,
    count(*) as order_count,
    sum(subtotal) as subtotal,
    sum(discount_amount) as discount_amount,
    sum(shipping_fee + tax_amount) as shipping_and_tax,
    sum(total_amount) as total_amount
  from public.sales_orders
  where status = 'CONFIRMED'
  group by sale_date
),
returns as (
  select
    return_date as summary_date,
    count(*) as return_count,
    sum(total_amount) as return_amount
  from public.sales_returns
  where status = 'CONFIRMED'
  group by return_date
)
select
  coalesce(s.summary_date, r.summary_date) as summary_date,
  coalesce(s.order_count, 0) as order_count,
  coalesce(s.subtotal, 0)::bigint as subtotal,
  coalesce(s.discount_amount, 0)::bigint as discount_amount,
  coalesce(s.shipping_and_tax, 0)::bigint as shipping_and_tax,
  coalesce(s.total_amount, 0)::bigint as total_amount,
  coalesce(r.return_count, 0) as return_count,
  coalesce(r.return_amount, 0)::bigint as return_amount,
  (coalesce(s.total_amount, 0) - coalesce(r.return_amount, 0))::bigint as net_revenue
from sales s
full outer join returns r on r.summary_date = s.summary_date
where public.is_admin();

revoke all on public.v_daily_sales_summary from public, anon;
grant select on public.v_daily_sales_summary to authenticated;
