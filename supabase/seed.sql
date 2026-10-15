insert into public.units (code, name, precision, is_active)
values
  ('vien', 'Viên', 0, true),
  ('bao', 'Bao', 0, true),
  ('cay', 'Cây', 0, true),
  ('kg', 'Kilôgam', 3, true),
  ('tan', 'Tấn', 3, true),
  ('pallet', 'Pallet', 0, true),
  ('m', 'Mét', 3, true),
  ('m2', 'Mét vuông', 3, true),
  ('m3', 'Mét khối', 3, true),
  ('khoi', 'Khối', 3, true),
  ('xe', 'Xe', 0, true)
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
