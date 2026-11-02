# Auth And Permissions

[Quay lại Database](README.md)

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
- Không có đăng ký công khai: "Allow new users to sign up" đã tắt trên Supabase Auth (2026-10-20, `enable_signup = false` trong `supabase/config.toml`) và app không có trang `/signup`. Tài khoản do ADMIN tạo qua Auth admin API (`auth.admin.createUser`, như `scripts/bootstrap-admin.mjs`).
- Lớp phòng thủ thứ hai nếu đăng ký bị bật lại: trigger vẫn tạo profile `WAREHOUSE_STAFF` + `is_active = false`, và RLS/RPC từ chối tài khoản chưa hoạt động.
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

Các helper boolean luôn trả `true`/`false`, không bao giờ `NULL` (migration `202610200001`): `NOT NULL` là `NULL` và làm guard dạng `if not is_admin()` bị bỏ qua (lỗ hổng tự nâng quyền đã vá ở `202610160005`). Mọi function `SECURITY DEFINER` được gọi trực tiếp từ client phải tự kiểm tra `is_active_user()`, ví dụ `next_document_code`. Test: `supabase/tests/auth-hardening.rollback.sql`.

### 5.5. First ADMIN bootstrap

The first active ADMIN account is created with the local operator script:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
npm run admin:bootstrap
```

`ADMIN_EMAIL` is optional and defaults to `dokhoahaiphong@gmail.com`. The script creates or updates the Supabase Auth user, then ensures `public.profiles.role = 'ADMIN'` and `public.profiles.is_active = true`.

The `service_role` database role requires `SELECT`, `INSERT`, and `UPDATE` on `public.profiles` for this bootstrap upsert, plus `EXECUTE` on `public.is_admin()` for the profile trigger. These privileges are granted by the `grant_service_role_profiles_bootstrap` and `grant_service_role_is_admin` migrations; the trigger permits service-role changes to `role` and `is_active`.

Never write a real password or `SUPABASE_SERVICE_ROLE_KEY` into migrations, seed data, source files, frontend `VITE_*` variables, or logs. `ADMIN_PASSWORD` must come from the local shell environment or the script's interactive prompt.
