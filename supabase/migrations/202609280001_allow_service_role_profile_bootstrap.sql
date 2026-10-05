create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;

  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Only ADMIN can change profile role or activation state';
  end if;

  return new;
end;
$$;
