# 2-3. Migration và route

[Quay lại Process](README.md)

## 2. Migration đã có (theo thứ tự)

| Migration | Nội dung |
| --- | --- |
| `202609180001`–`0004` | Enum/helper, master tables, document tables, index/trigger/RLS |
| `202609280001`, `202610050001`, `202610050002` | Cho phép service_role bootstrap profile, `is_admin` |
| `202610050003` | RPC `confirm_purchase_receipt` |
| `202610060001` | RPC `confirm_sales_order` |
| `202610070001` | RPC `record_customer_payment`, `record_supplier_payment` |
| `202610130001` | Seed đơn vị ưu tiên |
| `202610160001`–`0004` | View `v_low_stock_materials`, `v_daily_sales_summary`, RPC `report_inventory_period`, `report_debt_period` (đã push) |
| `202610160005` | **Bảo mật:** `is_admin()` trả NULL khi chưa có profile active làm trigger `protect_profile_admin_fields` không chặn → user mới đăng ký có thể tự nâng lên ADMIN. Sửa bằng `coalesce(..., false)` cho trigger và `report_debt_period`. Đã push |
| `202610160006` | **Sửa lỗi:** `next_document_code` luôn lỗi `42702 document_type is ambiguous` (tham số trùng tên cột) → trên production **không tạo được** phiếu nhập/xuất/thu/chi. Thêm `#variable_conflict use_column`. Đã push |
| `202610160007` | RPC `save_sales_order_draft`, `save_purchase_receipt_draft` (+ helper `parse_draft_items`): lưu nháp atomic thay cho chuỗi request create-new/delete-old ở frontend. Đã push; test 15/15 sau push |
| `202610200001` | **Bảo mật auth:** `is_admin()`/`is_warehouse_staff()` trả `false` thay vì NULL khi không có profile active; `next_document_code` (security definer) chỉ cho user active và chỉ nhận loại `PN`/`BH`/`PT`/`PC`, trước đó mọi tài khoản đăng nhập kể cả chưa kích hoạt đều đốt được số chứng từ. Đã push; test `auth-hardening.rollback.sql` 13/13 và `save-document-draft.rollback.sql` 15/15, trước và sau push |

Migration mới phải đặt tên `YYYYMMDDNNNN_<mô_tả>.sql`, lớn hơn migration cuối cùng ở trên.

## 3. Route đã đăng ký (`src/App.tsx`)

- `/` chuyển hướng tới `/inventory` (2026-10-19; trước đó là dashboard demo bán hàng của template).
- Mọi user đã đăng nhập: `/inventory`, `/materials`, `/categories`, `/units`, `/suppliers`, `/customers`, `/stock-receipts`, `/stock-issues`, `/payments`, `/reports/inventory`, `/reports/low-stock`, `/reports/purchases`, `/reports/sales`.
- Chỉ ADMIN (`AdminRoute`): `/reports/revenue`, `/reports/customer-debt`, `/reports/supplier-debt`.
- Công khai: chỉ `/signin`. Route `/signup` (form mẫu của template) đã bỏ ngày 2026-10-20; đăng ký công khai cũng đã tắt trên Supabase Auth (tài khoản do ADMIN tạo).
- Các route demo của template (`/calendar`, `/blank`, `/form-elements`, `/basic-tables`, `/alerts`…, `/line-chart`, `/bar-chart`) vẫn còn, không thuộc nghiệp vụ; có thể dọn khi được yêu cầu.
