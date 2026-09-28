# Master Data

[Quay lại Database](README.md)

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
