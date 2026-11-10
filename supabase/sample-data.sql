-- Sample data: about 10 rows per table, for trying the app.
--
-- Run inside a transaction by a wrapper that decides commit or rollback:
--   begin; <this file>; commit;   (or rollback; for a dry run)
--
-- Acts as the ADMIN profile below (auth.uid()), through the same RPCs the app
-- uses, so stock, movements, debt ledger, audit logs and document numbers are
-- produced by the database rules, not written by hand:
--   master data       → plain inserts (as the app does)
--   receipts / sales  → save_*_draft + confirm_* (8 confirmed, 2 drafts each)
--   payments          → record_customer_payment / record_supplier_payment
--   returns/stocktake → DRAFT only (no confirm RPC exists yet), so they do not
--                       change stock or debt
--   idempotency_keys  → no RPC writes it yet; rows are inserted directly
--                       (expire after 1 day)
-- Every row is tagged "[Dữ liệu mẫu]" in a note/description field where the
-- table has one. Confirmed documents and ledger rows are append-only and
-- cannot be deleted afterwards (ADR-005).

select set_config(
  'request.jwt.claims',
  '{"sub":"fe2bc9c7-47c4-466b-aa9c-77ec7b6f47be","role":"authenticated"}',
  true
);
set local role authenticated;

-- ------------------------------------------------------------ master data --
insert into public.units (code, name, precision) values
  ('vien', 'Viên', 0),
  ('cay', 'Cây', 0),
  ('tam', 'Tấm', 0),
  ('cuon', 'Cuộn', 0),
  ('thung', 'Thùng', 0),
  ('lit', 'Lít', 3),
  ('m', 'Mét', 3),
  ('m2', 'Mét vuông', 3),
  ('bo', 'Bộ', 0),
  ('hop', 'Hộp', 0);

insert into public.categories (code, name, description) values
  ('XI-MANG', 'Xi măng', '[Dữ liệu mẫu] Xi măng bao các loại'),
  ('THEP', 'Sắt thép', '[Dữ liệu mẫu] Thép cây, thép cuộn'),
  ('GACH', 'Gạch xây', '[Dữ liệu mẫu] Gạch đặc, gạch lỗ'),
  ('GACH-OP', 'Gạch ốp lát', '[Dữ liệu mẫu] Gạch men, granite'),
  ('CAT-DA', 'Cát đá', '[Dữ liệu mẫu] Cát xây, cát tô, đá các loại'),
  ('SON', 'Sơn', '[Dữ liệu mẫu] Sơn nước, sơn chống thấm'),
  ('ONG-NUOC', 'Ống nước', '[Dữ liệu mẫu] Ống và phụ kiện cấp thoát nước'),
  ('DIEN', 'Thiết bị điện', '[Dữ liệu mẫu] Dây điện, ổ cắm, công tắc'),
  ('NGOI', 'Ngói lợp', '[Dữ liệu mẫu] Ngói, tôn lợp'),
  ('GO', 'Gỗ & ván', '[Dữ liệu mẫu] Gỗ xẻ, ván ép, cốp pha');

insert into public.suppliers (code, name, contact_name, phone, email, address, tax_code, note) values
  ('NCC-MINHPHAT', 'Công ty TNHH VLXD Minh Phát', 'Nguyễn Văn Minh', '0901000001', 'minhphat@example.com', '12 Quốc lộ 1A, Bình Chánh, TP.HCM', '0310000001', '[Dữ liệu mẫu]'),
  ('NCC-THEPVIET', 'Đại lý Thép Việt', 'Trần Thị Lan', '0901000002', 'thepviet@example.com', '45 Kinh Dương Vương, Bình Tân, TP.HCM', '0310000002', '[Dữ liệu mẫu]'),
  ('NCC-GACHTHANHTAM', 'Gạch Tuynel Thành Tâm', 'Lê Văn Tâm', '0901000003', 'thanhtam@example.com', 'Tân Uyên, Bình Dương', '0310000003', '[Dữ liệu mẫu]'),
  ('NCC-CERAMIC', 'Nhà phân phối Gạch men Ánh Dương', 'Phạm Thu Hà', '0901000004', 'anhduong@example.com', '88 Trường Chinh, Tân Bình, TP.HCM', '0310000004', '[Dữ liệu mẫu]'),
  ('NCC-CATDA', 'Bãi Cát Đá Hưng Thịnh', 'Võ Văn Hưng', '0901000005', 'hungthinh@example.com', 'Bến Lức, Long An', '0310000005', '[Dữ liệu mẫu]'),
  ('NCC-SONMAI', 'Cửa hàng Sơn Mai Anh', 'Đặng Mai Anh', '0901000006', 'maianh@example.com', '210 Lê Văn Việt, TP. Thủ Đức', '0310000006', '[Dữ liệu mẫu]'),
  ('NCC-ONGNHUA', 'Đại lý Ống nhựa Phú Lợi', 'Huỳnh Văn Lợi', '0901000007', 'phuloi@example.com', '17 Nguyễn Ảnh Thủ, Hóc Môn, TP.HCM', '0310000007', '[Dữ liệu mẫu]'),
  ('NCC-DIENQUANG', 'Thiết bị điện Quang Huy', 'Bùi Quang Huy', '0901000008', 'quanghuy@example.com', '5 Âu Cơ, Tân Phú, TP.HCM', '0310000008', '[Dữ liệu mẫu]'),
  ('NCC-NGOIDONGNAI', 'Ngói Đồng Nai Phước An', 'Lý Phước An', '0901000009', 'phuocan@example.com', 'Biên Hòa, Đồng Nai', '0310000009', '[Dữ liệu mẫu]'),
  ('NCC-GOTANPHAT', 'Xưởng Gỗ Tấn Phát', 'Đỗ Tấn Phát', '0901000010', 'tanphat@example.com', 'Thuận An, Bình Dương', '0310000010', '[Dữ liệu mẫu]');

insert into public.customers (code, name, phone, email, address, tax_code, note) values
  ('KH-ANKHANG', 'Công ty Xây dựng An Khang', '0912000001', 'ankhang@example.com', '30 Nguyễn Văn Linh, Quận 7, TP.HCM', '0320000001', '[Dữ liệu mẫu]'),
  ('KH-HUNG-Q7', 'Anh Trần Văn Hùng (công trình Q.7)', '0912000002', null, 'Hẻm 120 Huỳnh Tấn Phát, Quận 7', null, '[Dữ liệu mẫu]'),
  ('KH-THANHCONG', 'Nhà thầu Thành Công', '0912000003', 'thanhcong@example.com', '9 Phạm Văn Đồng, Gò Vấp, TP.HCM', '0320000003', '[Dữ liệu mẫu]'),
  ('KH-LINH-BT', 'Chị Nguyễn Thị Linh (nhà phố Bình Thạnh)', '0912000004', null, '52 Xô Viết Nghệ Tĩnh, Bình Thạnh', null, '[Dữ liệu mẫu]'),
  ('KH-PHUCLOC', 'Công ty TNHH Phúc Lộc Home', '0912000005', 'phucloc@example.com', '101 Cộng Hòa, Tân Bình, TP.HCM', '0320000005', '[Dữ liệu mẫu]'),
  ('KH-DAIPHAT', 'Đội thợ Đại Phát', '0912000006', null, 'Nhà Bè, TP.HCM', null, '[Dữ liệu mẫu]'),
  ('KH-SAOVIET', 'Công ty CP Xây lắp Sao Việt', '0912000007', 'saoviet@example.com', '66 Võ Văn Kiệt, Quận 1, TP.HCM', '0320000007', '[Dữ liệu mẫu]'),
  ('KH-TUAN-TD', 'Anh Lê Minh Tuấn (Thủ Đức)', '0912000008', null, '14 Đỗ Xuân Hợp, TP. Thủ Đức', null, '[Dữ liệu mẫu]'),
  ('KH-HOANGGIA', 'Công ty Nội thất Hoàng Gia', '0912000009', 'hoanggia@example.com', '230 Lũy Bán Bích, Tân Phú, TP.HCM', '0320000009', '[Dữ liệu mẫu]'),
  ('KH-BINHAN', 'Cửa hàng VLXD Bình An (đại lý cấp 2)', '0912000010', 'binhan@example.com', 'Dĩ An, Bình Dương', '0320000010', '[Dữ liệu mẫu]');

insert into public.materials (
  sku, name, category_id, unit_id, description,
  default_purchase_price, default_sale_price, minimum_stock
)
select v.sku, v.name, c.id, u.id, '[Dữ liệu mẫu] ' || v.descr, v.buy, v.sell, v.min_stock
from (values
  ('XM-PCB40-HT', 'Xi măng Hà Tiên PCB40', 'XI-MANG', 'bao', 'Bao 50 kg', 82000, 95000, 100),
  ('XM-PCB30-NS', 'Xi măng Nghi Sơn PCB30', 'XI-MANG', 'bao', 'Bao 50 kg', 76000, 88000, 100),
  ('THEP-CB300-D10', 'Thép CB300 D10', 'THEP', 'cay', 'Cây 11,7 m', 98000, 112000, 200),
  ('THEP-CB400-D16', 'Thép CB400 D16', 'THEP', 'cay', 'Cây 11,7 m', 255000, 285000, 100),
  ('GACH-DAC-4L', 'Gạch đặc 4 lỗ Tuynel', 'GACH', 'vien', '8 x 8 x 18 cm', 1200, 1550, 5000),
  ('GACH-OP-6060', 'Gạch granite 60x60 bóng kính', 'GACH-OP', 'm2', 'Thùng 4 viên = 1,44 m²', 145000, 175000, 50),
  ('CAT-XAY', 'Cát xây tô', 'CAT-DA', 'm3', 'Cát vàng hạt trung', 280000, 350000, 20),
  ('DA-1X2', 'Đá 1x2 xanh', 'CAT-DA', 'm3', 'Đá đổ bê tông', 330000, 400000, 20),
  ('SON-NOI-5L', 'Sơn nước nội thất 5L', 'SON', 'thung', 'Màu trắng, lau chùi được', 620000, 720000, 10),
  ('ONG-PVC-D21', 'Ống nhựa PVC D21', 'ONG-NUOC', 'cay', 'Cây 4 m', 28000, 36000, 100)
) as v(sku, name, cat, unit, descr, buy, sell, min_stock)
join public.categories c on c.code = v.cat
join public.units u on u.code = v.unit;

-- -------------------------------------------------------------- documents --
do $$
declare
  material_skus constant text[] := array[
    'XM-PCB40-HT', 'XM-PCB30-NS', 'THEP-CB300-D10', 'THEP-CB400-D16', 'GACH-DAC-4L',
    'GACH-OP-6060', 'CAT-XAY', 'DA-1X2', 'SON-NOI-5L', 'ONG-PVC-D21'
  ];
  -- Quantity received per receipt line; sales take 10–20 % of it.
  base_quantity constant numeric[] := array[200, 200, 300, 100, 10000, 120, 30, 30, 20, 300];
  supplier_codes constant text[] := array[
    'NCC-MINHPHAT', 'NCC-THEPVIET', 'NCC-GACHTHANHTAM', 'NCC-CERAMIC', 'NCC-CATDA',
    'NCC-SONMAI', 'NCC-ONGNHUA', 'NCC-DIENQUANG', 'NCC-NGOIDONGNAI', 'NCC-GOTANPHAT'
  ];
  customer_codes constant text[] := array[
    'KH-ANKHANG', 'KH-HUNG-Q7', 'KH-THANHCONG', 'KH-LINH-BT', 'KH-PHUCLOC',
    'KH-DAIPHAT', 'KH-SAOVIET', 'KH-TUAN-TD', 'KH-HOANGGIA', 'KH-BINHAN'
  ];
  m public.materials[];
  receipt_ids uuid[] := array[]::uuid[];
  order_ids uuid[] := array[]::uuid[];
  pr public.purchase_receipts;
  so public.sales_orders;
  doc_date date;
  i integer;
  a integer;
  b integer;
  ret_id uuid;
  item record;
begin
  select array_agg(x order by array_position(material_skus, x.sku::text))
  into m
  from public.materials x
  where x.sku = any (material_skus);

  -- 10 purchase receipts, lines (i, i+4); 1–8 confirmed, 9–10 drafts.
  for i in 1..10 loop
    a := i;
    b := ((i + 3) % 10) + 1;
    doc_date := current_date - (21 - i);
    select * into pr from public.save_purchase_receipt_draft(
      null,
      (select id from public.suppliers where code = supplier_codes[i]),
      doc_date, 0, case when i % 2 = 0 then 300000 else 0 end, 0,
      format('HD-%s', 1000 + i), '[Dữ liệu mẫu]',
      jsonb_build_array(
        jsonb_build_object('material_id', m[a].id, 'quantity', base_quantity[a], 'unit_price', m[a].default_purchase_price),
        jsonb_build_object('material_id', m[b].id, 'quantity', base_quantity[b], 'unit_price', m[b].default_purchase_price)
      )
    );
    receipt_ids := receipt_ids || pr.id;
    if i <= 8 then
      perform public.confirm_purchase_receipt(pr.id);
    end if;
  end loop;

  -- 10 sales orders, lines (i, i+2); 1–8 confirmed, 9–10 drafts.
  for i in 1..10 loop
    a := i;
    b := ((i + 1) % 10) + 1;
    doc_date := current_date - (10 - i);
    select * into so from public.save_sales_order_draft(
      null,
      (select id from public.customers where code = customer_codes[i]),
      doc_date, 0, case when i % 3 = 0 then 200000 else 0 end, 0,
      format('Giao tại công trình khách hàng %s', customer_codes[i]), '[Dữ liệu mẫu]',
      jsonb_build_array(
        jsonb_build_object('material_id', m[a].id, 'quantity', base_quantity[a] * 0.2, 'unit_price', m[a].default_sale_price),
        jsonb_build_object('material_id', m[b].id, 'quantity', base_quantity[b] * 0.1, 'unit_price', m[b].default_sale_price)
      )
    );
    order_ids := order_ids || so.id;
    if i <= 8 then
      perform public.confirm_sales_order(so.id);
    end if;
  end loop;

  -- 10 supplier payments: half of receipts 1–8, plus a second one on 1 and 2.
  for i in 1..10 loop
    select * into pr from public.purchase_receipts
    where id = receipt_ids[case when i <= 8 then i else i - 8 end];
    perform public.record_supplier_payment(
      pr.id,
      case when i <= 8 then round(pr.total_amount * 0.5, -3)::bigint
           else round(pr.total_amount * 0.2, -3)::bigint end,
      least(pr.receipt_date + 2 + (i / 9) * 3, current_date),
      (case when i % 2 = 0 then 'BANK_TRANSFER' else 'CASH' end)::public.payment_method,
      case when i % 2 = 0 then format('UNC-%s', 5000 + i) end,
      '[Dữ liệu mẫu]'
    );
  end loop;

  -- 10 customer payments: 60 % of orders 1–8, plus a second one on 1 and 2.
  for i in 1..10 loop
    select * into so from public.sales_orders
    where id = order_ids[case when i <= 8 then i else i - 8 end];
    perform public.record_customer_payment(
      so.id,
      case when i <= 8 then round(so.total_amount * 0.6, -3)::bigint
           else round(so.total_amount * 0.2, -3)::bigint end,
      least(so.sale_date + 1 + (i / 9), current_date),
      (case when i % 3 = 0 then 'BANK_TRANSFER' else 'CASH' end)::public.payment_method,
      case when i % 3 = 0 then format('CK-%s', 7000 + i) end,
      '[Dữ liệu mẫu]'
    );
  end loop;

  -- 10 draft sales returns (one line each) on confirmed orders 1–8, 1–2.
  for i in 1..10 loop
    select soi.*, s.customer_id, s.sale_date into item
    from public.sales_order_items soi
    join public.sales_orders s on s.id = soi.sales_order_id
    where soi.sales_order_id = order_ids[case when i <= 8 then i else i - 8 end]
    order by soi.created_at, soi.material_sku_snapshot
    offset case when i <= 8 then 0 else 1 end limit 1;

    insert into public.sales_returns (
      code, sales_order_id, customer_id, return_date, status, total_amount, reason
    ) values (
      format('THB-%s-%s', to_char(least(item.sale_date + 1, current_date), 'YYYYMMDD'), lpad(i::text, 4, '0')),
      item.sales_order_id, item.customer_id, least(item.sale_date + 1, current_date),
      'DRAFT', item.unit_price, '[Dữ liệu mẫu] Hàng bể vỡ khi giao, khách trả lại'
    ) returning id into ret_id;

    insert into public.sales_return_items (
      sales_return_id, sales_order_item_id, material_id, quantity, unit_price, line_total
    ) values (ret_id, item.id, item.material_id, 1, item.unit_price, item.unit_price);
  end loop;

  -- 10 draft purchase returns (one line each) on confirmed receipts 1–8, 1–2.
  for i in 1..10 loop
    select pri.*, r.supplier_id, r.receipt_date into item
    from public.purchase_receipt_items pri
    join public.purchase_receipts r on r.id = pri.purchase_receipt_id
    where pri.purchase_receipt_id = receipt_ids[case when i <= 8 then i else i - 8 end]
    order by pri.created_at, pri.material_sku_snapshot
    offset case when i <= 8 then 0 else 1 end limit 1;

    insert into public.purchase_returns (
      code, purchase_receipt_id, supplier_id, return_date, status, total_amount, reason
    ) values (
      format('THM-%s-%s', to_char(item.receipt_date + 1, 'YYYYMMDD'), lpad(i::text, 4, '0')),
      item.purchase_receipt_id, item.supplier_id, item.receipt_date + 1,
      'DRAFT', item.unit_price * 2, '[Dữ liệu mẫu] Hàng không đúng quy cách, trả nhà cung cấp'
    ) returning id into ret_id;

    insert into public.purchase_return_items (
      purchase_return_id, purchase_receipt_item_id, material_id, quantity, unit_price, line_total
    ) values (ret_id, item.id, item.material_id, 2, item.unit_price, item.unit_price * 2);
  end loop;

  -- 10 draft stocktakes, two materials each; even ones find a shortfall of 1.
  for i in 1..10 loop
    insert into public.stocktakes (code, stocktake_date, status, note)
    values (
      format('KK-%s-%s', to_char(current_date - (10 - i), 'YYYYMMDD'), lpad(i::text, 4, '0')),
      current_date - (10 - i), 'DRAFT', '[Dữ liệu mẫu] Kiểm kê định kỳ'
    ) returning id into ret_id;

    insert into public.stocktake_items (stocktake_id, material_id, system_quantity, actual_quantity, reason)
    select ret_id, x.id, x.current_stock,
           case when i % 2 = 0 and x.current_stock >= 1 then x.current_stock - 1 else x.current_stock end,
           case when i % 2 = 0 and x.current_stock >= 1 then 'Hao hụt khi bốc xếp' end
    from public.materials x
    where x.id in (m[i].id, m[(i % 10) + 1].id);
  end loop;
end;
$$;

-- --------------------------------------------------------- idempotency ----
-- No RLS insert policy for app users: written as the table owner.
reset role;

insert into public.idempotency_keys (
  key, user_id, operation, request_hash, resource_type, resource_id, response_body, expires_at
)
select
  format('sample-confirm-%s', r.code),
  'fe2bc9c7-47c4-466b-aa9c-77ec7b6f47be',
  r.operation,
  md5(r.id::text),
  r.resource_type,
  r.id,
  jsonb_build_object('code', r.code, 'status', 'CONFIRMED', 'sample', true),
  now() + interval '1 day'
from (
  (select id, code, 'confirm_purchase_receipt' operation, 'purchase_receipt' resource_type
   from public.purchase_receipts where status = 'CONFIRMED' and note = '[Dữ liệu mẫu]'
   order by code limit 5)
  union all
  (select id, code, 'confirm_sales_order', 'sales_order'
   from public.sales_orders where status = 'CONFIRMED' and note = '[Dữ liệu mẫu]'
   order by code limit 5)
) r;
