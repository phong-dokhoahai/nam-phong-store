-- Behaviour test for save_sales_order_draft / save_purchase_receipt_draft.
--
-- Self-contained and side-effect free: the caller wraps it in
--   begin; <migrations under test, if not pushed yet>; <this file>; rollback;
-- Everything (test users, master data, documents, the results table) is
-- created inside that transaction and discarded by the rollback.
--
-- Output: one row per check in public._draft_test_results (ok = true/false).

create table public._draft_test_results (test text primary key, ok boolean, detail text);
grant select, insert on public._draft_test_results to authenticated;

-- ---------------------------------------------------------------- setup ----
-- Two staff users. The profile trigger creates them inactive; activating is a
-- privileged change, done here as service_role.
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-000000000001', 'draft-test-1@test.local'),
  ('00000000-0000-4000-a000-000000000002', 'draft-test-2@test.local');

select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update public.profiles
set is_active = true, role = 'WAREHOUSE_STAFF'
where id in ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002');

-- Master data owned by user 1 (created_by must equal auth.uid()).
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}',
  true
);

insert into public.categories (id, code, name)
values ('00000000-0000-4000-b000-000000000001', 'DRAFT-TEST-CAT', 'Draft test category');

insert into public.materials (id, sku, name, category_id, unit_id, is_active)
select v.id::uuid, v.sku, v.name, '00000000-0000-4000-b000-000000000001',
       (select id from public.units order by code limit 1), v.active
from (values
  ('00000000-0000-4000-c000-000000000001', 'DRAFT-TEST-M1', 'Draft test M1', true),
  ('00000000-0000-4000-c000-000000000002', 'DRAFT-TEST-M2', 'Draft test M2', true),
  ('00000000-0000-4000-c000-000000000003', 'DRAFT-TEST-M3', 'Draft test M3 (inactive)', false)
) as v(id, sku, name, active);

insert into public.customers (id, code, name)
values ('00000000-0000-4000-d000-000000000001', 'DRAFT-TEST-C1', 'Draft test customer');

insert into public.suppliers (id, code, name)
values ('00000000-0000-4000-e000-000000000001', 'DRAFT-TEST-S1', 'Draft test supplier');

-- From here on every call runs with the privileges (and RLS) of the app role.
set local role authenticated;

-- ---------------------------------------------------------------- tests ----
do $$
declare
  c_user1 constant text := '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}';
  c_user2 constant text := '{"sub":"00000000-0000-4000-a000-000000000002","role":"authenticated"}';
  c_cust constant uuid := '00000000-0000-4000-d000-000000000001';
  c_supp constant uuid := '00000000-0000-4000-e000-000000000001';
  so public.sales_orders;
  so2 public.sales_orders;
  so3 public.sales_orders;
  pr public.purchase_receipts;
  pr2 public.purchase_receipts;
  n integer;
  stock numeric;
begin
  perform set_config('request.jwt.claims', c_user1, true);

  -- 01: create a sales draft with two lines; totals come from the DB.
  begin
    select * into so from public.save_sales_order_draft(
      null, c_cust, current_date, 0, 0, 0, '  Site A  ', '   ',
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":2,"unit_price":1000,"discount_amount":100},
        {"material_id":"00000000-0000-4000-c000-000000000002","quantity":1.5,"unit_price":2000}]'
    );
    select count(*) into n from public.sales_order_items where sales_order_id = so.id;
    insert into public._draft_test_results values ('01 create sales draft',
      so.status = 'DRAFT' and n = 2 and so.subtotal = 4900 and so.total_amount = 4900
        and so.debt_amount = 4900 and so.paid_amount = 0
        and so.delivery_address = 'Site A' and so.note is null,
      format('code=%s subtotal=%s total=%s items=%s', so.code, so.subtotal, so.total_amount, n));
  exception when others then
    insert into public._draft_test_results values ('01 create sales draft', false, sqlstate || ' ' || sqlerrm);
  end;

  -- 02: update in place: same id and code, items replaced, totals recomputed.
  begin
    select * into so2 from public.save_sales_order_draft(
      so.id, c_cust, current_date, 400, 50, 10, '', 'updated',
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":3,"unit_price":1000}]'
    );
    select count(*) into n from public.sales_order_items where sales_order_id = so.id;
    insert into public._draft_test_results values ('02 update keeps id/code',
      so2.id = so.id and so2.code = so.code and n = 1 and so2.subtotal = 3000
        and so2.total_amount = 2660 and so2.debt_amount = 2660
        and so2.delivery_address is null and so2.note = 'updated',
      format('code=%s total=%s items=%s', so2.code, so2.total_amount, n));
  exception when others then
    insert into public._draft_test_results values ('02 update keeps id/code', false, sqlstate || ' ' || sqlerrm);
  end;

  -- 03: the update did not consume a document code (no gap in numbering).
  begin
    select * into so3 from public.save_sales_order_draft(
      null, c_cust, current_date, 0, 0, 0, null, null,
      '[{"material_id":"00000000-0000-4000-c000-000000000002","quantity":1,"unit_price":500}]'
    );
    insert into public._draft_test_results values ('03 no code gap after update',
      right(so3.code, 4)::int = right(so.code, 4)::int + 1,
      format('first=%s next=%s', so.code, so3.code));
  exception when others then
    insert into public._draft_test_results values ('03 no code gap after update', false, sqlstate || ' ' || sqlerrm);
  end;

  -- 04-08: invalid input is rejected and nothing is written.
  begin
    perform public.save_sales_order_draft(null, c_cust, current_date, 0, 0, 0, null, null,
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":1,"unit_price":1},
        {"material_id":"00000000-0000-4000-c000-000000000001","quantity":2,"unit_price":1}]');
    insert into public._draft_test_results values ('04 duplicate material rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('04 duplicate material rejected', sqlstate = '22023', sqlerrm);
  end;

  begin
    perform public.save_sales_order_draft(null, c_cust, current_date, 999999, 0, 0, null, null,
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":1,"unit_price":1000}]');
    insert into public._draft_test_results values ('05 discount > subtotal rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('05 discount > subtotal rejected', sqlstate = '22023', sqlerrm);
  end;

  begin
    perform public.save_sales_order_draft(null, c_cust, current_date, 0, 0, 0, null, null,
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":0.333,"unit_price":1}]');
    insert into public._draft_test_results values ('06 fractional line total rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('06 fractional line total rejected', sqlstate = '22023', sqlerrm);
  end;

  begin
    perform public.save_sales_order_draft(null, c_cust, current_date, 0, 0, 0, null, null,
      '[{"material_id":"00000000-0000-4000-c000-000000000003","quantity":1,"unit_price":1}]');
    insert into public._draft_test_results values ('07 inactive material rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('07 inactive material rejected', sqlstate = '22023', sqlerrm);
  end;

  begin
    perform public.save_sales_order_draft(null, c_cust, current_date, 0, 0, 0, null, null,
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":0,"unit_price":1}]');
    insert into public._draft_test_results values ('08 zero quantity rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('08 zero quantity rejected', sqlstate = '22023', sqlerrm);
  end;

  -- 09: another staff member cannot edit user 1's draft.
  begin
    perform set_config('request.jwt.claims', c_user2, true);
    perform public.save_sales_order_draft(so.id, c_cust, current_date, 0, 0, 0, null, 'hijack',
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":1,"unit_price":1}]');
    insert into public._draft_test_results values ('09 non-owner edit rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('09 non-owner edit rejected', sqlstate = '42501', sqlerrm);
  end;
  perform set_config('request.jwt.claims', c_user1, true);

  -- 10: unauthenticated caller is rejected.
  begin
    perform set_config('request.jwt.claims', '{"role":"authenticated"}', true);
    perform public.save_sales_order_draft(null, c_cust, current_date, 0, 0, 0, null, null, '[]');
    insert into public._draft_test_results values ('10 no user rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('10 no user rejected', sqlstate = '42501', sqlerrm);
  end;
  perform set_config('request.jwt.claims', c_user1, true);

  -- 11: unknown draft id.
  begin
    perform public.save_sales_order_draft('00000000-0000-4000-f000-000000000099', c_cust, current_date,
      0, 0, 0, null, null, '[]');
    insert into public._draft_test_results values ('11 unknown id rejected', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('11 unknown id rejected', sqlstate = 'P0002', sqlerrm);
  end;

  -- 12: purchase draft create + update in place.
  begin
    select * into pr from public.save_purchase_receipt_draft(
      null, c_supp, current_date, 0, 0, 0, ' INV-1 ', null,
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":5,"unit_price":800}]'
    );
    select * into pr2 from public.save_purchase_receipt_draft(
      pr.id, c_supp, current_date, 0, 0, 0, 'INV-2', 'n',
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":10,"unit_price":800}]'
    );
    select count(*) into n from public.purchase_receipt_items where purchase_receipt_id = pr.id;
    insert into public._draft_test_results values ('12 purchase draft create/update',
      pr.supplier_invoice_number = 'INV-1' and pr2.id = pr.id and pr2.code = pr.code
        and pr2.total_amount = 8000 and pr2.supplier_invoice_number = 'INV-2' and n = 1,
      format('code=%s total=%s items=%s', pr2.code, pr2.total_amount, n));
  exception when others then
    insert into public._draft_test_results values ('12 purchase draft create/update', false, sqlstate || ' ' || sqlerrm);
  end;

  -- 13: an RPC-saved draft passes the existing confirm RPC (integration).
  begin
    perform public.confirm_purchase_receipt(pr.id);
    select current_stock into stock from public.materials
    where id = '00000000-0000-4000-c000-000000000001';
    insert into public._draft_test_results values ('13 confirm saved purchase draft',
      stock = 10, format('M1 stock=%s', stock));
  exception when others then
    insert into public._draft_test_results values ('13 confirm saved purchase draft', false, sqlstate || ' ' || sqlerrm);
  end;

  -- 14: a confirmed document can no longer be saved as a draft.
  begin
    perform public.save_purchase_receipt_draft(pr.id, c_supp, current_date, 0, 0, 0, null, null,
      '[{"material_id":"00000000-0000-4000-c000-000000000001","quantity":1,"unit_price":1}]');
    insert into public._draft_test_results values ('14 confirmed doc not editable', false, 'no error');
  exception when others then
    insert into public._draft_test_results values ('14 confirmed doc not editable', sqlstate = '22023', sqlerrm);
  end;

  -- 15: the updated sales draft (3 x M1) confirms against the new stock.
  begin
    perform public.confirm_sales_order(so.id);
    select current_stock into stock from public.materials
    where id = '00000000-0000-4000-c000-000000000001';
    insert into public._draft_test_results values ('15 confirm saved sales draft',
      stock = 7, format('M1 stock=%s', stock));
  exception when others then
    insert into public._draft_test_results values ('15 confirm saved sales draft', false, sqlstate || ' ' || sqlerrm);
  end;
end;
$$;

reset role;
select test, ok, detail from public._draft_test_results order by test;
