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
| `202610160001`–`0005` | View `v_low_stock_materials`, `v_daily_sales_summary`, RPC `report_inventory_period`, `report_debt_period`, sửa kiểm tra admin NULL |

Migration mới phải đặt tên `YYYYMMDDNNNN_<mô_tả>.sql`, lớn hơn migration cuối cùng ở trên.

## 3. Route đã đăng ký (`src/App.tsx`)

- Mọi user đã đăng nhập: `/inventory`, `/materials`, `/categories`, `/units`, `/suppliers`, `/customers`, `/stock-receipts`, `/stock-issues`, `/payments`, `/reports/inventory`, `/reports/low-stock`, `/reports/purchases`, `/reports/sales`.
- Chỉ ADMIN (`AdminRoute`): `/reports/revenue`, `/reports/customer-debt`, `/reports/supplier-debt`.
- Công khai: `/signin`, `/signup`.
- Các route demo của template (`/calendar`, `/blank`, `/form-elements`, `/basic-tables`, `/alerts`…, `/line-chart`, `/bar-chart`) vẫn còn, không thuộc nghiệp vụ; có thể dọn khi được yêu cầu.
