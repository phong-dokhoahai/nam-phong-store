# Database Foundations

[Quay lại Database](README.md)

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
