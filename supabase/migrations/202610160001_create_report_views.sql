-- Read-only report views. security_invoker keeps the RLS of the calling user.
create or replace view public.v_low_stock_materials
with (security_invoker = true) as
select
  m.id,
  m.sku,
  m.name,
  m.category_id,
  c.name as category_name,
  u.name as unit_name,
  m.minimum_stock,
  m.current_stock,
  greatest(m.minimum_stock - m.current_stock, 0) as shortage_quantity,
  (m.current_stock = 0) as is_out_of_stock
from public.materials m
join public.categories c on c.id = m.category_id
join public.units u on u.id = m.unit_id
where m.is_active
  and m.current_stock <= m.minimum_stock;

revoke all on public.v_low_stock_materials from public, anon;
grant select on public.v_low_stock_materials to authenticated;
