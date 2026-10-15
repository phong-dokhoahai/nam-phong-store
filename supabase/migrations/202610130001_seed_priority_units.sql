insert into public.units (code, name, precision, is_active)
values
  ('bao', 'Bao', 0, true),
  ('kg', 'Kilôgam', 3, true),
  ('tan', 'Tấn', 3, true),
  ('pallet', 'Pallet', 0, true),
  ('m3', 'Mét khối', 3, true),
  ('khoi', 'Khối', 3, true),
  ('xe', 'Xe', 0, true)
on conflict (code) do update
set
  name = excluded.name,
  precision = excluded.precision,
  is_active = true,
  updated_at = now();
