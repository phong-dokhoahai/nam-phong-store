# DATABASE.md

## 1. Mục đích

Tài liệu này mô tả thiết kế cơ sở dữ liệu cho hệ thống quản lý kho vật liệu xây dựng sử dụng **Supabase PostgreSQL**.

Đây là nguồn tham chiếu khi tạo:

- Supabase migrations.
- PostgreSQL tables, enums, indexes, constraints và triggers.
- Row Level Security (RLS) policies.
- PostgreSQL Functions/RPC.
- TypeScript database types.
- Query functions và hooks phía React.

Mục tiêu thiết kế:

- Tồn kho và công nợ luôn chính xác.
- Mọi thay đổi quan trọng đều có lịch sử truy vết.
- Không thể xuất kho âm.
- Chứng từ đã xác nhận không bị sửa hoặc xóa trực tiếp.
- Các nghiệp vụ nhiều bước chạy trong một database transaction.
- Frontend không được tự cập nhật tồn kho, công nợ hoặc số tiền tổng hợp.

Nếu tài liệu này mâu thuẫn với `BUSINESS_RULES.md`, ưu tiên `BUSINESS_RULES.md` và cập nhật lại tài liệu này.

---

## 2. Công nghệ dữ liệu

### 2.1. Thành phần Supabase

| Thành phần | Mục đích |
|---|---|
| Supabase PostgreSQL | Lưu dữ liệu nghiệp vụ |
| Supabase Auth | Đăng nhập và quản lý phiên |
| Row Level Security | Phân quyền truy cập từng bảng |
| PostgreSQL Function/RPC | Nghiệp vụ atomic và đặc quyền |
| Database Trigger | Tạo profile, cập nhật timestamp và bảo vệ dữ liệu |
| Supabase Storage | Chỉ dùng khi cần lưu ảnh/chứng từ đính kèm |
| Supabase Realtime | Chỉ dùng cập nhật giao diện, không thay thế transaction |
| Supabase Edge Functions | Tích hợp bên ngoài hoặc xử lý cần secret |

MVP không có backend server riêng. React truy cập Supabase bằng anon/publishable key. Mọi quyền thực tế phải được database kiểm soát bằng RLS, GRANT và RPC.

### 2.2. Nguyên tắc bảo mật

- Không đưa `service_role` key hoặc secret vào frontend.
- Không tin `user_id`, `created_by`, `role`, tổng tiền hoặc số tồn gửi từ client.
- Database lấy người dùng hiện tại bằng `auth.uid()`.
- Tất cả bảng ứng dụng trong schema `public` phải bật RLS.
- Role phải được kiểm tra lại trong database, không chỉ ẩn nút ở frontend.
- RPC mặc định dùng `SECURITY INVOKER`.
- Chỉ dùng `SECURITY DEFINER` khi thật sự cần vượt RLS.
- Function `SECURITY DEFINER` phải đặt `search_path` cố định, kiểm tra role và giới hạn quyền `EXECUTE`.
- Revoke quyền ghi trực tiếp vào các bảng ledger, movement và cột tổng hợp.

### 2.3. Migration

Mọi thay đổi database nằm trong:

```text
supabase/
├── config.toml
├── migrations/
│   ├── <timestamp>_create_enums.sql
│   ├── <timestamp>_create_profiles.sql
│   ├── <timestamp>_create_master_tables.sql
│   ├── <timestamp>_create_business_tables.sql
│   ├── <timestamp>_create_indexes.sql
│   ├── <timestamp>_create_functions.sql
│   ├── <timestamp>_enable_rls.sql
│   └── <timestamp>_create_policies.sql
└── seed.sql
```

Quy tắc:

- Không sửa thủ công production mà không có migration.
- Migration đã chạy ở môi trường dùng chung không được chỉnh nội dung; tạo migration mới.
- Thử migration và rollback trên local/staging trước production.
- Generate lại TypeScript types sau khi schema thay đổi.

Ví dụ:

```bash
supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
```

Không commit access token, database password hoặc service-role key.

---

## 3. Quy ước dữ liệu

### 3.1. Kiểu dữ liệu

| Dữ liệu | Kiểu PostgreSQL | Ghi chú |
|---|---|---|
| Khóa chính | `UUID` | Default `gen_random_uuid()` |
| ID người dùng | `UUID` | Liên kết `auth.users.id` qua `profiles.id` |
| Số lượng | `NUMERIC(18,3)` | Hỗ trợ kg, tấn, m³ và số lẻ |
| Tiền VND | `BIGINT` | Lưu số nguyên, không dùng float |
| Tỷ lệ | `NUMERIC(7,4)` | Thuế suất/phần trăm |
| Ngày nghiệp vụ | `DATE` | Ngày nhập, bán, kiểm kho |
| Thời điểm | `TIMESTAMPTZ` | Lưu UTC |
| Metadata/audit | `JSONB` | Không thay cột nghiệp vụ chính |

Lưu ý khi dùng Supabase JS:

- `NUMERIC` có thể được trả về dưới dạng chuỗi tùy truy vấn/cấu hình.
- Không thực hiện phép tính quan trọng bằng giá trị chưa parse/validate.
- Tiền và số lượng phải được validate bằng Zod ở frontend và kiểm tra lại trong database.
- Không dùng JavaScript floating-point làm nguồn xác nhận tổng tiền.

### 3.2. Quy ước đặt tên

- Bảng và cột dùng `snake_case`.
- Bảng dùng danh từ số nhiều.
- Khóa chính là `id`.
- Khóa ngoại là `<entity>_id`.
- Thời gian hệ thống là `created_at`, `updated_at`.
- Người thao tác là `created_by`, `confirmed_by`, `cancelled_by`.
- Danh mục đã được sử dụng chỉ được vô hiệu hóa bằng `is_active = false`.
- Chứng từ nghiệp vụ không hard delete.
- `updated_at` được cập nhật bằng trigger dùng chung.

---

## 4. Enum

```sql
create type public.app_role as enum (
  'ADMIN',
  'WAREHOUSE_STAFF'
);

create type public.document_status as enum (
  'DRAFT',
  'CONFIRMED',
  'CANCELLED'
);

create type public.payment_status as enum (
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'OVERPAID'
);

create type public.payment_method as enum (
  'CASH',
  'BANK_TRANSFER',
  'OTHER'
);

create type public.inventory_movement_type as enum (
  'PURCHASE_IN',
  'SALE_OUT',
  'SALE_RETURN_IN',
  'PURCHASE_RETURN_OUT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'REVERSAL_IN',
  'REVERSAL_OUT'
);

create type public.debt_direction as enum (
  'RECEIVABLE',
  'PAYABLE'
);

create type public.debt_entry_type as enum (
  'CHARGE',
  'PAYMENT',
  'RETURN',
  'REVERSAL',
  'ADJUSTMENT'
);
```

Không dùng chuỗi tùy ý thay cho enum ở các trường trạng thái cốt lõi.

---

## 5. Người dùng và phân quyền

### 5.1. Supabase Auth

Supabase quản lý tài khoản trong `auth.users`.

Không tạo lại các trường:

- Password.
- Password hash.
- Refresh token.
- Login session.
- Email verification token.

Frontend dùng Supabase Auth để đăng nhập. Các bảng nghiệp vụ không đọc trực tiếp thông tin nhạy cảm trong `auth.users`.

### 5.2. `profiles`

Mở rộng thông tin người dùng ứng dụng.

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK, FK `auth.users.id ON DELETE CASCADE` |
| `full_name` | VARCHAR(150) | NOT NULL |
| `role` | `app_role` | NOT NULL |
| `is_active` | BOOLEAN | NOT NULL, default false |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() |

Quy tắc:

- Người dùng mới không tự chọn role.
- Tài khoản mới mặc định chưa hoạt động hoặc chỉ được tạo qua quy trình mời nội bộ.
- Chỉ ADMIN được đổi `role` và `is_active`.
- WAREHOUSE_STAFF chỉ xem/sửa thông tin cá nhân được cho phép.
- Không cho người dùng tự nâng quyền qua update metadata.

### 5.3. Trigger tạo profile

Có trigger trên `auth.users` để tạo `public.profiles`.

Function trigger phải:

- Là `SECURITY DEFINER`.
- Đặt `search_path = public`.
- Không lấy role từ `raw_user_meta_data`.
- Gán role/quyền mặc định an toàn.
- Không ghi password hoặc token sang schema public.

### 5.4. Helper phân quyền

Có thể tạo các function ổn định:

```text
current_user_role() -> app_role
is_admin() -> boolean
is_warehouse_staff() -> boolean
is_active_user() -> boolean
```

Các function phải tránh RLS recursion khi đọc `profiles`. Nếu dùng `SECURITY DEFINER`, phải giới hạn `EXECUTE`, cố định `search_path` và chỉ trả thông tin cần thiết.

---

## 6. Danh mục

### 6.1. `categories`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `name` | VARCHAR(150) | NOT NULL |
| `description` | TEXT | NULL |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_by` | UUID | NOT NULL, FK profiles, default `auth.uid()` |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

### 6.2. `units`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(30) | NOT NULL, UNIQUE |
| `name` | VARCHAR(100) | NOT NULL |
| `precision` | SMALLINT | NOT NULL, default 0, CHECK 0..3 |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

MVP: mỗi vật liệu chỉ có một đơn vị tính, không quy đổi đơn vị.

### 6.3. `materials`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `sku` | VARCHAR(80) | NOT NULL, UNIQUE |
| `name` | VARCHAR(200) | NOT NULL |
| `category_id` | UUID | NOT NULL, FK categories |
| `unit_id` | UUID | NOT NULL, FK units |
| `description` | TEXT | NULL |
| `default_purchase_price` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `default_sale_price` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `minimum_stock` | NUMERIC(18,3) | NOT NULL, default 0, CHECK >= 0 |
| `current_stock` | NUMERIC(18,3) | NOT NULL, default 0, CHECK >= 0 |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

`current_stock` là cache để đọc nhanh. Nguồn lịch sử chính thức là `inventory_movements`.

Không cấp quyền update trực tiếp `current_stock` cho client. Chỉ RPC nghiệp vụ được thay đổi cột này.

### 6.4. `customers`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `name` | VARCHAR(200) | NOT NULL |
| `phone` | VARCHAR(30) | NULL |
| `email` | VARCHAR(255) | NULL |
| `address` | TEXT | NULL |
| `tax_code` | VARCHAR(50) | NULL |
| `note` | TEXT | NULL |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

Seed một khách hệ thống `WALK_IN_CUSTOMER` cho khách mua lẻ. Bản ghi này không được xóa/vô hiệu hóa.

### 6.5. `suppliers`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `name` | VARCHAR(200) | NOT NULL |
| `contact_name` | VARCHAR(150) | NULL |
| `phone` | VARCHAR(30) | NULL |
| `email` | VARCHAR(255) | NULL |
| `address` | TEXT | NULL |
| `tax_code` | VARCHAR(50) | NULL |
| `note` | TEXT | NULL |
| `is_active` | BOOLEAN | NOT NULL, default true |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

Nợ đầu kỳ phải được tạo thành dòng `ADJUSTMENT` trong ledger, không lưu bằng số dư có thể sửa trực tiếp.

---

## 7. Nhập hàng

### 7.1. `purchase_receipts`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE, sinh trong RPC |
| `supplier_id` | UUID | NOT NULL, FK suppliers |
| `receipt_date` | DATE | NOT NULL |
| `status` | document_status | NOT NULL, default DRAFT |
| `subtotal` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `discount_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `shipping_fee` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `tax_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `total_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `paid_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `debt_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `payment_status` | payment_status | NOT NULL, default UNPAID |
| `supplier_invoice_number` | VARCHAR(100) | NULL |
| `note` | TEXT | NULL |
| `created_by` | UUID | NOT NULL, FK profiles |
| `confirmed_by`, `cancelled_by` | UUID | NULL, FK profiles |
| `confirmed_at`, `cancelled_at` | TIMESTAMPTZ | NULL |
| `cancellation_reason` | TEXT | NULL |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL |

```text
total_amount = subtotal - discount_amount + shipping_fee + tax_amount
paid_amount  = tổng payment hợp lệ
debt_amount  = total_amount - giá trị trả hàng - paid_amount
```

Client chỉ được tạo/sửa phiếu `DRAFT` theo policy. Xác nhận/hủy bắt buộc qua RPC.

### 7.2. `purchase_receipt_items`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `purchase_receipt_id` | UUID | NOT NULL, FK purchase_receipts ON DELETE CASCADE |
| `material_id` | UUID | NOT NULL, FK materials |
| `material_sku_snapshot` | VARCHAR(80) | NOT NULL khi xác nhận |
| `material_name_snapshot` | VARCHAR(200) | NOT NULL khi xác nhận |
| `unit_name_snapshot` | VARCHAR(100) | NOT NULL khi xác nhận |
| `quantity` | NUMERIC(18,3) | NOT NULL, CHECK > 0 |
| `unit_price` | BIGINT | NOT NULL, CHECK >= 0 |
| `discount_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `line_total` | BIGINT | NOT NULL, CHECK >= 0 |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL |

MVP: `UNIQUE(purchase_receipt_id, material_id)`.

Chỉ cho cascade delete item khi phiếu cha còn `DRAFT`; RPC/trigger phải chặn xóa item của chứng từ đã xác nhận.

---

## 8. Bán hàng

### 8.1. `sales_orders`

Đơn bán kiêm phiếu xuất trong MVP.

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE, sinh trong RPC |
| `customer_id` | UUID | NOT NULL, FK customers |
| `sale_date` | DATE | NOT NULL |
| `status` | document_status | NOT NULL, default DRAFT |
| `subtotal` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `discount_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `shipping_fee` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `tax_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `total_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `paid_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `debt_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `payment_status` | payment_status | NOT NULL, default UNPAID |
| `delivery_address` | TEXT | NULL |
| `note` | TEXT | NULL |
| `created_by` | UUID | NOT NULL, FK profiles |
| `confirmed_by`, `cancelled_by` | UUID | NULL, FK profiles |
| `confirmed_at`, `cancelled_at` | TIMESTAMPTZ | NULL |
| `cancellation_reason` | TEXT | NULL |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL |

### 8.2. `sales_order_items`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `sales_order_id` | UUID | NOT NULL, FK sales_orders ON DELETE CASCADE |
| `material_id` | UUID | NOT NULL, FK materials |
| `material_sku_snapshot` | VARCHAR(80) | NOT NULL khi xác nhận |
| `material_name_snapshot` | VARCHAR(200) | NOT NULL khi xác nhận |
| `unit_name_snapshot` | VARCHAR(100) | NOT NULL khi xác nhận |
| `quantity` | NUMERIC(18,3) | NOT NULL, CHECK > 0 |
| `unit_price` | BIGINT | NOT NULL, CHECK >= 0 |
| `discount_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `line_total` | BIGINT | NOT NULL, CHECK >= 0 |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL |

MVP: `UNIQUE(sales_order_id, material_id)`.

Giá, SKU, tên và đơn vị phải được snapshot khi xác nhận. Không cho sửa item sau xác nhận.

---

## 9. Thanh toán và công nợ

### 9.1. `customer_payments`

Một đơn bán có thể có nhiều lần thanh toán.

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `customer_id` | UUID | NOT NULL, FK customers |
| `sales_order_id` | UUID | NOT NULL trong MVP, FK sales_orders |
| `payment_date` | DATE | NOT NULL |
| `amount` | BIGINT | NOT NULL, CHECK > 0 |
| `method` | payment_method | NOT NULL |
| `reference_number` | VARCHAR(150) | NULL |
| `note` | TEXT | NULL |
| `reversal_of_id` | UUID | NULL, self FK, UNIQUE |
| `reversal_reason` | TEXT | NULL |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Không cấp INSERT/UPDATE/DELETE trực tiếp cho client. Tạo và đảo phiếu thu qua RPC.

### 9.2. `supplier_payments`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `supplier_id` | UUID | NOT NULL, FK suppliers |
| `purchase_receipt_id` | UUID | NOT NULL trong MVP, FK purchase_receipts |
| `payment_date` | DATE | NOT NULL |
| `amount` | BIGINT | NOT NULL, CHECK > 0 |
| `method` | payment_method | NOT NULL |
| `reference_number` | VARCHAR(150) | NULL |
| `note` | TEXT | NULL |
| `reversal_of_id` | UUID | NULL, self FK, UNIQUE |
| `reversal_reason` | TEXT | NULL |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |

### 9.3. `debt_ledger_entries`

Sổ lịch sử công nợ chính thức.

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `direction` | debt_direction | NOT NULL |
| `customer_id` | UUID | NULL, FK customers |
| `supplier_id` | UUID | NULL, FK suppliers |
| `entry_type` | debt_entry_type | NOT NULL |
| `entry_date` | DATE | NOT NULL |
| `amount_delta` | BIGINT | NOT NULL, khác 0; tăng nợ dương, giảm nợ âm |
| `source_type` | VARCHAR(50) | NOT NULL |
| `source_id` | UUID | NOT NULL |
| `description` | TEXT | NULL |
| `reversal_of_id` | UUID | NULL, self FK |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Ràng buộc:

```text
RECEIVABLE => customer_id NOT NULL và supplier_id NULL
PAYABLE    => supplier_id NOT NULL và customer_id NULL
UNIQUE(source_type, source_id, entry_type)
```

Công thức:

```text
customer_debt = sale charges - sale returns - receipts +/- adjustments
supplier_debt = purchase charges - purchase returns - payments +/- adjustments
```

Client chỉ có quyền SELECT theo policy. Chỉ RPC được ghi ledger. Không lưu `current_debt` có thể chỉnh trực tiếp trên customer/supplier.

---

## 10. Lịch sử tồn kho

### 10.1. `inventory_movements`

Mỗi dòng là một lần tăng/giảm tồn và là nguồn lịch sử tồn kho chính thức.

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `material_id` | UUID | NOT NULL, FK materials |
| `movement_type` | inventory_movement_type | NOT NULL |
| `movement_date` | DATE | NOT NULL |
| `quantity_delta` | NUMERIC(18,3) | NOT NULL, khác 0 |
| `unit_cost` | BIGINT | NULL, CHECK >= 0 |
| `source_type` | VARCHAR(50) | NOT NULL |
| `source_id` | UUID | NOT NULL |
| `source_item_id` | UUID | NOT NULL |
| `reversal_of_id` | UUID | NULL, self FK |
| `note` | TEXT | NULL |
| `created_by` | UUID | NOT NULL, FK profiles |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Quy ước:

- Nhập kho: `quantity_delta > 0`.
- Xuất kho: `quantity_delta < 0`.
- `UNIQUE(source_type, source_item_id, movement_type)`.
- Không UPDATE/DELETE movement.
- Hủy nghiệp vụ tạo movement đảo có `reversal_of_id`.
- Client chỉ SELECT; RPC có quyền INSERT.

Đối soát:

```text
materials.current_stock =
  SUM(inventory_movements.quantity_delta)
```

---

## 11. Trả hàng

### 11.1. `sales_returns`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `sales_order_id` | UUID | NOT NULL, FK sales_orders |
| `customer_id` | UUID | NOT NULL, FK customers |
| `return_date` | DATE | NOT NULL |
| `status` | document_status | NOT NULL, default DRAFT |
| `total_amount` | BIGINT | NOT NULL, CHECK >= 0 |
| `refund_amount` | BIGINT | NOT NULL, default 0, CHECK >= 0 |
| `reason` | TEXT | NOT NULL |
| `created_by`, `confirmed_by`, `cancelled_by` | UUID | FK profiles |
| `confirmed_at`, `cancelled_at` | TIMESTAMPTZ | NULL |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL |

### 11.2. `sales_return_items`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `sales_return_id` | UUID | NOT NULL, FK sales_returns |
| `sales_order_item_id` | UUID | NOT NULL, FK sales_order_items |
| `material_id` | UUID | NOT NULL, FK materials |
| `quantity` | NUMERIC(18,3) | NOT NULL, CHECK > 0 |
| `unit_price` | BIGINT | NOT NULL, CHECK >= 0 |
| `line_total` | BIGINT | NOT NULL, CHECK >= 0 |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Tổng số lượng trả không vượt số lượng đã bán.

Xác nhận qua RPC:

- Tạo `SALE_RETURN_IN`.
- Tăng tồn.
- Giảm công nợ khách.
- Nếu hoàn tiền thực tế, tạo phiếu chi/bút toán riêng.

### 11.3. `purchase_returns`

Cấu trúc tương tự `sales_returns`, thay bằng:

- `purchase_receipt_id` FK purchase_receipts.
- `supplier_id` FK suppliers.

### 11.4. `purchase_return_items`

Cấu trúc tương tự `sales_return_items`, thay bằng:

- `purchase_return_id` FK purchase_returns.
- `purchase_receipt_item_id` FK purchase_receipt_items.

Tổng trả không vượt lượng đã nhập và không làm tồn âm. Xác nhận tạo `PURCHASE_RETURN_OUT` và giảm công nợ nhà cung cấp.

---

## 12. Kiểm kho

### 12.1. `stocktakes`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE |
| `stocktake_date` | DATE | NOT NULL |
| `status` | document_status | NOT NULL, default DRAFT |
| `note` | TEXT | NULL |
| `created_by`, `confirmed_by`, `cancelled_by` | UUID | FK profiles |
| `confirmed_at`, `cancelled_at` | TIMESTAMPTZ | NULL |
| `cancellation_reason` | TEXT | NULL |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL |

### 12.2. `stocktake_items`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `stocktake_id` | UUID | NOT NULL, FK stocktakes |
| `material_id` | UUID | NOT NULL, FK materials |
| `system_quantity` | NUMERIC(18,3) | NOT NULL, CHECK >= 0 |
| `actual_quantity` | NUMERIC(18,3) | NOT NULL, CHECK >= 0 |
| `difference_quantity` | NUMERIC(18,3) | NOT NULL |
| `reason` | TEXT | Bắt buộc nếu chênh lệch khác 0 |
| `created_at`, `updated_at` | TIMESTAMPTZ | NOT NULL |

```text
UNIQUE(stocktake_id, material_id)
difference_quantity = actual_quantity - system_quantity
```

Xác nhận qua RPC tạo `ADJUSTMENT_IN` hoặc `ADJUSTMENT_OUT`. Không cập nhật tồn trực tiếp.

---

## 13. Audit và idempotency

### 13.1. `audit_logs`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | NULL, FK profiles; NULL cho system |
| `action` | VARCHAR(100) | NOT NULL |
| `entity_type` | VARCHAR(100) | NOT NULL |
| `entity_id` | UUID | NULL |
| `old_data` | JSONB | NULL, loại bỏ dữ liệu nhạy cảm |
| `new_data` | JSONB | NULL, loại bỏ dữ liệu nhạy cảm |
| `request_id` | VARCHAR(100) | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Audit chỉ append. Client chỉ SELECT theo quyền; không INSERT/UPDATE/DELETE trực tiếp.

Không lưu:

- Access token.
- Refresh token.
- Password.
- Cookie.
- Service-role key.
- Secret của tích hợp bên ngoài.

### 13.2. `document_sequences`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `document_type` | VARCHAR(50) | Composite PK |
| `sequence_date` | DATE | Composite PK |
| `current_value` | BIGINT | NOT NULL, CHECK >= 0 |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

Ví dụ: `PN-20260915-0001`, `BH-20260915-0001`, `PT-20260915-0001`.

Chỉ function sinh mã được update sequence; thao tác phải atomic.

### 13.3. `idempotency_keys`

| Cột | Kiểu | Ràng buộc/Ghi chú |
|---|---|---|
| `id` | UUID | PK |
| `key` | VARCHAR(150) | NOT NULL, UNIQUE |
| `user_id` | UUID | NOT NULL, FK profiles |
| `operation` | VARCHAR(100) | NOT NULL |
| `request_hash` | VARCHAR(128) | NOT NULL |
| `resource_type` | VARCHAR(100) | NULL |
| `resource_id` | UUID | NULL |
| `response_body` | JSONB | NULL |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL |

Cùng key nhưng khác user, operation hoặc request hash phải bị từ chối.

---

## 14. RPC bắt buộc

Frontend không được thay thế các RPC dưới đây bằng chuỗi request độc lập.

| RPC đề xuất | Chức năng |
|---|---|
| `confirm_purchase_receipt` | Xác nhận nhập hàng, tăng tồn, ghi công nợ |
| `cancel_purchase_receipt` | Hủy phiếu nhập và tạo bút toán đảo |
| `confirm_sales_order` | Kiểm tra tồn, xuất kho, ghi công nợ |
| `cancel_sales_order` | Hủy đơn bán và đảo kho/công nợ |
| `record_customer_payment` | Thu tiền khách và giảm công nợ |
| `reverse_customer_payment` | Đảo phiếu thu |
| `record_supplier_payment` | Chi tiền nhà cung cấp và giảm công nợ |
| `reverse_supplier_payment` | Đảo phiếu chi |
| `confirm_sales_return` | Nhập lại hàng khách trả và xử lý công nợ |
| `confirm_purchase_return` | Xuất trả nhà cung cấp |
| `confirm_stocktake` | Tạo điều chỉnh từ chênh lệch kiểm kho |
| `cancel_stocktake` | Đảo điều chỉnh kiểm kho |
| `reconcile_inventory` | Đối soát tồn, chỉ ADMIN |
| `reconcile_debt` | Đối soát công nợ, chỉ ADMIN |

Mỗi RPC nghiệp vụ phải:

1. Xác thực `auth.uid() IS NOT NULL`.
2. Kiểm tra profile tồn tại, active và đúng role.
3. Validate input.
4. Khóa chứng từ/dòng vật liệu cần thiết.
5. Kiểm tra trạng thái hiện tại.
6. Tính lại số lượng và tiền từ dữ liệu database.
7. Thực hiện toàn bộ thay đổi trong một transaction.
8. Ghi movement, ledger và audit.
9. Có idempotency cho thao tác có thể retry.
10. Raise exception để rollback nếu bất kỳ bước nào thất bại.

---

## 15. Transaction quan trọng

### 15.1. Xác nhận phiếu nhập

Trong một transaction:

1. Khóa phiếu và kiểm tra `DRAFT`.
2. Validate supplier, material và items.
3. Tính lại subtotal/discount/tax/total.
4. Snapshot thông tin vật liệu.
5. Chuyển phiếu sang `CONFIRMED`.
6. Tạo `PURCHASE_IN`.
7. Tăng `current_stock` atomic.
8. Tạo `CHARGE` công nợ nhà cung cấp.
9. Nếu thanh toán ngay, tạo payment và ledger `PAYMENT`.
10. Cập nhật paid/debt/payment status.
11. Ghi audit.

### 15.2. Xác nhận đơn bán

Trong một transaction:

1. Khóa đơn và kiểm tra `DRAFT`.
2. Khóa material theo thứ tự ID cố định để hạn chế deadlock.
3. Kiểm tra đủ tồn.
4. Tính lại tiền và snapshot item.
5. Chuyển sang `CONFIRMED`.
6. Tạo `SALE_OUT`.
7. Trừ tồn bằng update có điều kiện `current_stock >= quantity`.
8. Tạo `CHARGE` công nợ khách.
9. Nếu thu ngay, tạo payment và ledger `PAYMENT`.
10. Cập nhật paid/debt/payment status.
11. Ghi audit.

Không tách kiểm tra tồn và trừ tồn thành hai request/transaction.

### 15.3. Thanh toán

1. Khóa chứng từ gốc.
2. Chứng từ phải `CONFIRMED`.
3. Amount > 0 và không vượt nợ còn lại trong MVP.
4. Customer/supplier phải trùng chứng từ.
5. Tạo payment.
6. Tạo ledger `PAYMENT`.
7. Tính lại số tổng hợp/trạng thái.
8. Ghi audit.

### 15.4. Hủy chứng từ

- Không xóa movement/payment/ledger cũ.
- Tạo bút toán đảo có `reversal_of_id`.
- Đảo phiếu nhập không được làm tồn âm.
- Nếu có payment hoặc return, xử lý chứng từ phụ theo đúng thứ tự.
- Bắt buộc lưu người, thời điểm và lý do hủy.
- Không đổi trạng thái bằng update trực tiếp từ client.

---

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

---

## 24. Ngoài phạm vi MVP

Chưa thiết kế chi tiết:

- Nhiều kho và chuyển kho.
- Nhiều đơn vị và quy đổi.
- Lô, kệ, serial, hạn sử dụng.
- Đơn đặt mua tách phiếu nhập.
- Báo giá, giao nhiều đợt, hóa đơn điện tử.
- Một payment phân bổ nhiều chứng từ.
- Tiền trả trước và hạn mức tín dụng.
- Đa tiền tệ.
- FIFO/bình quân tức thời nâng cao.
- Kế toán kép và báo cáo tài chính đầy đủ.
- Public customer portal.

Khi mở rộng phải cập nhật `PROJECT.md`, `BUSINESS_RULES.md`, `ARCHITECTURE.md`, tài liệu này và migration trước khi code.

---

## 25. Checklist triển khai

### Schema

- [ ] Tạo enum trước các bảng sử dụng.
- [ ] Tạo FK, UNIQUE và CHECK constraints.
- [ ] Bật RLS trên tất cả bảng public.
- [ ] Không có policy cho anon.
- [ ] Tạo trigger `updated_at`.
- [ ] Tạo index cho FK và query chính.

### Auth và quyền

- [ ] `profiles.id` liên kết `auth.users.id`.
- [ ] Trigger tạo profile không nhận role từ client metadata.
- [ ] User mới không tự có quyền truy cập kho.
- [ ] Chỉ ADMIN đổi role/is_active.
- [ ] Không có service-role key trong frontend.

### Nghiệp vụ

- [ ] Confirm/cancel/payment/return/stocktake dùng RPC.
- [ ] Client không sửa stock/paid/debt/ledger/movement trực tiếp.
- [ ] RPC dùng `auth.uid()` và kiểm tra active/role.
- [ ] Có idempotency cho confirm và payment.
- [ ] Có row lock và update tồn có điều kiện.
- [ ] Mọi lỗi giữa luồng đều rollback.
- [ ] Hủy tạo bút toán đảo, không xóa lịch sử.

### Kiểm thử

- [ ] Test concurrent sales không làm tồn âm.
- [ ] Test user tự nâng role bị từ chối.
- [ ] Test inactive user không gọi được RPC.
- [ ] Test RLS giữa anonymous/authenticated.
- [ ] Test không sửa item của chứng từ confirmed.
- [ ] Test rollback khi confirm thất bại.
- [ ] Test payment không vượt công nợ.
- [ ] Test return không vượt số lượng gốc.
- [ ] Test cancellation và reversal.
- [ ] Test đối soát tồn và công nợ.

### TypeScript

- [ ] Generate lại `database.types.ts`.
- [ ] Không sửa file generated thủ công.
- [ ] Parse/validate NUMERIC và BIGINT.
- [ ] TanStack Query invalidates đúng query sau RPC.
- [ ] UI không coi optimistic update là xác nhận nghiệp vụ.

