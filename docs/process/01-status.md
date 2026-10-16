# 1. Trạng thái module

[Quay lại Process](README.md)

Ký hiệu: ✅ xong · 🟡 đang làm / xong một phần · ⬜ chưa làm · ➖ ngoài MVP.

| Module | Trạng thái | Ghi chú |
| --- | --- | --- |
| Database schema, enum, RLS, trigger, index | ✅ | Migration `202609180001`–`0004`; 23 bảng gồm cả returns, stocktake, audit |
| Authentication, `ProtectedRoute`, `AdminRoute` | ✅ | `src/auth/`; profile bootstrap qua trigger + migration service_role |
| Vật liệu (Materials) CRUD | ✅ | `src/components/materials/`, route `/materials` |
| Danh mục / Đơn vị / NCC / Khách hàng | ✅ | Dùng chung `src/components/master-data/` (`MasterDataPage`); seed đơn vị ưu tiên |
| Nhập kho (Stock receipt) | ✅ | Draft CRUD + RPC `confirm_purchase_receipt` |
| Xuất kho / bán hàng (Stock issue) | ✅ | Draft CRUD + RPC `confirm_sales_order` |
| Thanh toán / công nợ (Payments) | ✅ | RPC `record_customer_payment`, `record_supplier_payment`; `debt_ledger_entries` |
| Tồn kho (Inventory) | 🟡 | Trang `/inventory` đọc tồn từ `materials`; chưa có màn lịch sử movement |
| Báo cáo (Reports) | 🟡 | Có inventory period, low stock, purchases, sales, revenue, customer/supplier debt, export PDF; **chưa commit**, cần review/test |
| Dashboard | ⬜ | `/` vẫn là demo `Dashboard/Ecommerce` của template, chưa nối dữ liệu kho |
| Hủy chứng từ (cancel + bút toán đảo) | ⬜ | Chưa có RPC |
| Trả hàng (sales/purchase return) | ⬜ | Có bảng, chưa có RPC và UI |
| Kiểm kê / điều chỉnh kho (stocktake) | ⬜ | Có bảng, chưa có RPC và UI |
| Lịch sử biến động kho (`inventory_movements`) | ⬜ | Bảng được ghi bởi RPC confirm; chưa có UI xem |
| Quản lý người dùng (User Management) | ⬜ | Chưa có UI; role/is_active chỉ ADMIN đổi |
| Kiểm thử tự động | 🟡 | Mới có `supabase/tests/schema-static-checks.ps1`; chưa có test RPC/RLS/concurrency (xem [database/08-scope-and-checklist.md](../database/08-scope-and-checklist.md)) |
| Sinh lại `database.types.ts` | 🟡 | Phải sinh lại sau mỗi migration đổi schema/RPC |
