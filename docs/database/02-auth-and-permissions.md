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
