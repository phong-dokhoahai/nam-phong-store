# Security, Operations And Reporting

[Quay lại Database](README.md)

## 16. Row Level Security

### 16.1. Nguyên tắc chung

Bật RLS trên toàn bộ bảng trong `public`:

```sql
alter table public.profiles enable row level security;
alter table public.materials enable row level security;
-- Thực hiện tương tự cho mọi bảng ứng dụng.
```

Không tạo policy cho role `anon`. Người chưa đăng nhập không đọc hoặc ghi dữ liệu kho.

### 16.2. Ma trận quyền

| Nhóm bảng | ADMIN | WAREHOUSE_STAFF |
|---|---|---|
| Profile của chính mình | Read | Read |
| Quản lý profile/role | CRUD | Không |
| Category, unit, material | CRUD | Read/Create/Update theo nghiệp vụ |
| Customer, supplier | CRUD | Read/Create/Update |
| Draft receipt/order/return/stocktake | CRUD | CRUD theo policy |
| Chứng từ confirmed/cancelled | Read, thao tác qua RPC | Read, thao tác qua RPC được cấp |
| Inventory movements | Read | Read |
| Debt ledger | Read | Read |
| Payment | Read và RPC | Read và RPC được cấp |
| Audit logs | Read | Không hoặc chỉ dữ liệu do mình tạo |
| Reconciliation | RPC | Không |

### 16.3. Điều kiện policy tối thiểu

Mọi policy của người dùng nội bộ phải yêu cầu:

```text
auth.uid() IS NOT NULL
profiles.is_active = true
profiles.id = auth.uid()
```

Policy cho draft phải kiểm tra:

- Trạng thái là `DRAFT`.
- User có role được phép.
- Item chỉ được sửa nếu chứng từ cha còn `DRAFT`.
- Không được thay `created_by` sang user khác.

RLS không thay thế constraint và transaction. RPC vẫn phải validate trạng thái và role.

### 16.4. Quyền bảng nhạy cảm

Đối với các bảng sau, client không có quyền ghi trực tiếp:

- `inventory_movements`.
- `debt_ledger_entries`.
- `audit_logs`.
- `document_sequences`.
- `idempotency_keys`.
- Các payment đã ghi nhận.
- Các cột `current_stock`, `paid_amount`, `debt_amount`, `payment_status`.
- Trạng thái/chữ ký xác nhận và hủy.

Nếu PostgREST column-level privileges trở nên khó duy trì, chỉ cho client đọc bảng và chuyển toàn bộ mutation liên quan sang RPC.

---

## 17. Trigger và bảo vệ dữ liệu

Tối thiểu cần:

| Trigger/function | Mục đích |
|---|---|
| `handle_new_user` | Tạo profile an toàn sau khi tạo auth user |
| `set_updated_at` | Tự cập nhật `updated_at` |
| `protect_confirmed_document` | Chặn sửa dữ liệu bất biến của chứng từ confirmed |
| `protect_append_only_rows` | Chặn update/delete movement, ledger và audit |
| `validate_document_actor` | Đặt actor từ `auth.uid()` khi phù hợp |

Không dùng trigger để che giấu toàn bộ nghiệp vụ phức tạp. Luồng xác nhận/hủy vẫn phải nằm trong RPC rõ ràng và có test.

---

## 18. Index

```text
profiles(role, is_active)

materials(category_id, is_active)
materials(name)
customers(phone)
customers(name)
suppliers(phone)
suppliers(name)

purchase_receipts(supplier_id, receipt_date DESC)
purchase_receipts(status, receipt_date DESC)
purchase_receipts(payment_status, receipt_date DESC)
purchase_receipt_items(material_id)

sales_orders(customer_id, sale_date DESC)
sales_orders(status, sale_date DESC)
sales_orders(payment_status, sale_date DESC)
sales_order_items(material_id)

inventory_movements(material_id, movement_date, created_at)
inventory_movements(source_type, source_id)

debt_ledger_entries(customer_id, entry_date, created_at)
debt_ledger_entries(supplier_id, entry_date, created_at)
debt_ledger_entries(source_type, source_id)

customer_payments(customer_id, payment_date DESC)
customer_payments(sales_order_id)
supplier_payments(supplier_id, payment_date DESC)
supplier_payments(purchase_receipt_id)

audit_logs(entity_type, entity_id, created_at DESC)
audit_logs(user_id, created_at DESC)
idempotency_keys(expires_at)
```

Chỉ thêm `pg_trgm`/full-text index sau khi đo query thực tế.

---

## 19. Báo cáo và view

| Báo cáo | Nguồn chính |
|---|---|
| Tồn hiện tại | materials.current_stock, đối soát movements |
| Thẻ kho | inventory_movements |
| Nhập hàng | purchase receipts/items CONFIRMED |
| Bán hàng/doanh thu | sales orders/items trừ sales returns |
| Công nợ khách | ledger RECEIVABLE |
| Công nợ nhà cung cấp | ledger PAYABLE |
| Lịch sử thu/chi | customer/supplier payments và reversal |
| Hàng sắp hết | current_stock <= minimum_stock |
| Chênh lệch kiểm kho | stocktakes/items |

Có thể tạo view chỉ đọc:

```text
v_inventory_on_hand
v_low_stock_materials
v_customer_debt_balances
v_supplier_debt_balances
v_daily_sales_summary
v_daily_purchase_summary
```

View phải tuân thủ quyền của user. Không dùng `SECURITY DEFINER` cho view/function báo cáo nếu không có lý do và kiểm soát rõ ràng.

Doanh thu, dòng tiền và công nợ là ba khái niệm khác nhau:

- Doanh thu dựa trên hàng bán hợp lệ sau giảm giá và trả hàng.
- Dòng tiền dựa trên payment thực tế.
- Công nợ là phần chưa thanh toán sau các điều chỉnh.

---

## 20. Realtime, Storage và Edge Functions

### 20.1. Realtime

Chỉ bật cho bảng thật sự cần đồng bộ nhiều thiết bị, ví dụ:

- `materials` để cập nhật tồn hiển thị.
- Chứng từ để cập nhật trạng thái.

Realtime không đảm bảo nghiệp vụ atomic và không được dùng để trừ tồn hoặc tính công nợ.

### 20.2. Storage

Nếu có ảnh vật liệu/chứng từ:

- Lưu file trong Storage.
- Database chỉ lưu bucket/path/metadata.
- Bucket và object phải có policy.
- Không lưu public URL vĩnh viễn cho file riêng tư.
- Không lưu file binary trực tiếp trong bảng nghiệp vụ.

### 20.3. Edge Functions

Chỉ dùng khi:

- Tích hợp API ngoài cần secret.
- Gửi email/thông báo.
- Xử lý file.
- Webhook.
- Nghiệp vụ không phù hợp chạy hoàn toàn trong PostgreSQL.

Edge Function xử lý kho/công nợ vẫn phải gọi RPC để transaction nằm trong database.

---

## 21. Đối soát

Job hoặc RPC chỉ đọc phải phát hiện:

1. `current_stock` khác tổng movement.
2. `paid_amount` khác tổng payment hợp lệ.
3. `debt_amount` khác ledger.
4. Chứng từ confirmed thiếu movement/ledger.
5. Movement hoặc ledger trùng nguồn.
6. Return vượt số lượng chứng từ gốc.
7. Chứng từ cancelled thiếu bút toán đảo.
8. Profile inactive vẫn tạo nghiệp vụ.
9. Dữ liệu actor không trùng người thực hiện RPC.

Không tự sửa âm thầm. Sai lệch phải được cảnh báo và sửa bằng nghiệp vụ điều chỉnh có lý do/audit.

---

## 22. Seed data

`supabase/seed.sql` nên có:

- Đơn vị: viên, bao, cây, kg, tấn, m, m², m³.
- Nhóm vật liệu mẫu chỉ cho local/development.
- Khách lẻ `WALK_IN_CUSTOMER`.
- Dữ liệu sequence ban đầu nếu cần.

Tài khoản ADMIN đầu tiên:

- Tạo qua Supabase Auth/Dashboard hoặc script quản trị an toàn.
- Sau đó cập nhật profile bằng quyền quản trị.
- Không ghi email/mật khẩu thật trong `seed.sql`.

---

## 23. Backup và vận hành

- Dùng backup/PITR phù hợp với gói Supabase đang sử dụng.
- Thử restore định kỳ.
- Backup trước migration production quan trọng.
- Không coi migration rollback là phương án phục hồi dữ liệu duy nhất.
- Theo dõi slow query và index usage.
- Đặt timeout phù hợp cho RPC/transaction.
- Không để transaction mở trong thời gian chờ tương tác người dùng.
- Dọn idempotency key hết hạn bằng scheduled job an toàn.
- Log lỗi RPC không được chứa dữ liệu nhạy cảm.
