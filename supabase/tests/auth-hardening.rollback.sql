-- Behaviour test for the auth helpers, profile self-promotion guard and
-- next_document_code caller check (migration 202610200001).
--
-- Self-contained and side-effect free: the caller wraps it in
--   begin; <migrations under test, if not pushed yet>; <this file>; rollback;
-- Everything (test users, the results table, sequence rows) is created inside
-- that transaction and discarded by the rollback.
--
-- Output: one row per check in public._auth_test_results (ok = true/false).

create table public._auth_test_results (test text primary key, ok boolean, detail text);
grant select, insert on public._auth_test_results to authenticated;

-- ---------------------------------------------------------------- setup ----
-- The profile trigger creates every new user as an inactive WAREHOUSE_STAFF,
-- exactly like a public sign-up. Activation is a privileged change, done here
-- as service_role.
insert into auth.users (id, email) values
  ('00000000-0000-4000-a100-000000000001', 'auth-test-inactive@test.local'),
  ('00000000-0000-4000-a100-000000000002', 'auth-test-staff@test.local'),
  ('00000000-0000-4000-a100-000000000003', 'auth-test-admin@test.local');

select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update public.profiles set is_active = true, role = 'WAREHOUSE_STAFF'
where id = '00000000-0000-4000-a100-000000000002';
update public.profiles set is_active = true, role = 'ADMIN'
where id = '00000000-0000-4000-a100-000000000003';

-- From here on every call runs with the privileges (and RLS) of the app role.
set local role authenticated;

-- ---------------------------------------------------------------- tests ----
do $$
declare
  c_inactive constant text := '{"sub":"00000000-0000-4000-a100-000000000001","role":"authenticated"}';
  c_staff constant text := '{"sub":"00000000-0000-4000-a100-000000000002","role":"authenticated"}';
  c_admin constant text := '{"sub":"00000000-0000-4000-a100-000000000003","role":"authenticated"}';
  c_staff_id constant uuid := '00000000-0000-4000-a100-000000000002';
  c_inactive_id constant uuid := '00000000-0000-4000-a100-000000000001';
  v_admin boolean;
  v_staff boolean;
  v_code text;
  v_role public.app_role;
  v_active boolean;
  v_name text;
begin
  -- ------------------------------------------------ inactive (sign-up) user
  perform set_config('request.jwt.claims', c_inactive, true);

  -- 01: helpers answer false, never NULL, without an active profile.
  v_admin := public.is_admin();
  v_staff := public.is_warehouse_staff();
  insert into public._auth_test_results values ('01 inactive: helpers are false not null',
    v_admin is false and v_staff is false, format('is_admin=%s is_warehouse_staff=%s', v_admin, v_staff));

  -- 02: cannot promote itself to ADMIN (the 202610160005 hole).
  begin
    update public.profiles set role = 'ADMIN' where id = c_inactive_id;
    insert into public._auth_test_results values ('02 inactive: cannot self-promote to ADMIN', false, 'update succeeded');
  exception when others then
    insert into public._auth_test_results values ('02 inactive: cannot self-promote to ADMIN', true, sqlerrm);
  end;

  -- 03: cannot activate itself.
  begin
    update public.profiles set is_active = true where id = c_inactive_id;
    insert into public._auth_test_results values ('03 inactive: cannot self-activate', false, 'update succeeded');
  exception when others then
    insert into public._auth_test_results values ('03 inactive: cannot self-activate', true, sqlerrm);
  end;

  -- 04: cannot draw document numbers.
  begin
    v_code := public.next_document_code('PN', current_date);
    insert into public._auth_test_results values ('04 inactive: next_document_code denied', false, v_code);
  exception when others then
    insert into public._auth_test_results values ('04 inactive: next_document_code denied',
      sqlstate = '42501', sqlstate || ' ' || sqlerrm);
  end;

  -- -------------------------------------------------- active warehouse staff
  perform set_config('request.jwt.claims', c_staff, true);

  -- 05: helpers reflect the role.
  v_admin := public.is_admin();
  v_staff := public.is_warehouse_staff();
  insert into public._auth_test_results values ('05 staff: is_admin false, is_warehouse_staff true',
    v_admin is false and v_staff is true, format('is_admin=%s is_warehouse_staff=%s', v_admin, v_staff));

  -- 06: cannot promote itself to ADMIN.
  begin
    update public.profiles set role = 'ADMIN' where id = c_staff_id;
    insert into public._auth_test_results values ('06 staff: cannot self-promote to ADMIN', false, 'update succeeded');
  exception when others then
    insert into public._auth_test_results values ('06 staff: cannot self-promote to ADMIN', true, sqlerrm);
  end;

  -- 07: may still edit its own name.
  begin
    update public.profiles set full_name = 'Auth test staff renamed' where id = c_staff_id;
    select full_name into v_name from public.profiles where id = c_staff_id;
    insert into public._auth_test_results values ('07 staff: can rename itself',
      v_name = 'Auth test staff renamed', v_name);
  exception when others then
    insert into public._auth_test_results values ('07 staff: can rename itself', false, sqlstate || ' ' || sqlerrm);
  end;

  -- 08: draws consecutive numbers for a known type.
  begin
    v_code := public.next_document_code('pn', date '2099-01-02');
    v_code := v_code || ',' || public.next_document_code('PN', date '2099-01-02');
    insert into public._auth_test_results values ('08 staff: next_document_code numbers in order',
      v_code = 'PN-20990102-0001,PN-20990102-0002', v_code);
  exception when others then
    insert into public._auth_test_results values ('08 staff: next_document_code numbers in order', false, sqlstate || ' ' || sqlerrm);
  end;

  -- 09: rejects an unknown document type.
  begin
    v_code := public.next_document_code('JUNK', current_date);
    insert into public._auth_test_results values ('09 staff: unknown document type rejected', false, v_code);
  exception when others then
    insert into public._auth_test_results values ('09 staff: unknown document type rejected',
      sqlstate = '22023', sqlstate || ' ' || sqlerrm);
  end;

  -- 10: rejects a missing date.
  begin
    v_code := public.next_document_code('BH', null);
    insert into public._auth_test_results values ('10 staff: missing date rejected', false, v_code);
  exception when others then
    insert into public._auth_test_results values ('10 staff: missing date rejected',
      sqlstate = '22023', sqlstate || ' ' || sqlerrm);
  end;

  -- ------------------------------------------------------------------ admin
  perform set_config('request.jwt.claims', c_admin, true);

  -- 11: helpers reflect the role.
  v_admin := public.is_admin();
  v_staff := public.is_warehouse_staff();
  insert into public._auth_test_results values ('11 admin: is_admin true',
    v_admin is true and v_staff is false, format('is_admin=%s is_warehouse_staff=%s', v_admin, v_staff));

  -- 12: an admin can activate an account.
  begin
    update public.profiles set is_active = true where id = c_inactive_id;
    select role, is_active into v_role, v_active from public.profiles where id = c_inactive_id;
    insert into public._auth_test_results values ('12 admin: can activate an account',
      v_active and v_role = 'WAREHOUSE_STAFF', format('role=%s is_active=%s', v_role, v_active));
  exception when others then
    insert into public._auth_test_results values ('12 admin: can activate an account', false, sqlstate || ' ' || sqlerrm);
  end;
end;
$$;

reset role;

-- 13: the public (anon) role cannot execute any callable function in public.
insert into public._auth_test_results
select '13 anon: no executable public functions',
  count(*) = 0,
  coalesce(string_agg(p.proname, ', '), 'none')
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.prorettype <> 'trigger'::regtype
  and has_function_privilege('anon', p.oid, 'execute');

select test, ok, detail from public._auth_test_results order by test;
