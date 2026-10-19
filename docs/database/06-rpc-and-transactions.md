# RPC And Transactions

[Quay lại Database](README.md)

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
| `save_purchase_receipt_draft` | Tạo/sửa phiếu nhập nháp (header + dòng) trong một transaction, giữ nguyên id và mã, tính lại tổng ở DB |
| `save_sales_order_draft` | Tạo/sửa đơn bán nháp (header + dòng) trong một transaction, giữ nguyên id và mã, tính lại tổng ở DB |
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
