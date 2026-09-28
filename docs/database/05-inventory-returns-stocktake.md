# Inventory, Returns And Stocktake

[Quay lại Database](README.md)

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
