insert into public.units (code, name, precision, is_active)
values
  ('vien', 'Vien', 0, true),
  ('bao', 'Bao', 0, true),
  ('cay', 'Cay', 0, true),
  ('kg', 'Kilogram', 3, true),
  ('tan', 'Tan', 3, true),
  ('m', 'Meter', 3, true),
  ('m2', 'Square meter', 3, true),
  ('m3', 'Cubic meter', 3, true)
on conflict (code) do update
set
  name = excluded.name,
  precision = excluded.precision,
  is_active = true,
  updated_at = now();

insert into public.customers (code, name, is_active, note)
values (
  'WALK_IN_CUSTOMER',
  'Walk-in customer',
  true,
  'System customer for retail sales without a named customer.'
)
on conflict (code) do update
set
  name = excluded.name,
  is_active = true,
  note = excluded.note,
  updated_at = now();
