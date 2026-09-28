# Documents And Debt

[Quay lại Database](README.md)

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
