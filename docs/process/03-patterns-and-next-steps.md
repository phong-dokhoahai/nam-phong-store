# 4-5. Pattern và việc tiếp theo

[Quay lại Process](README.md)

## 4. Pattern đã dùng, cần theo khi làm tiếp

- Feature mới: page ở `src/pages/<Feature>/`, UI + `<feature>Repository.ts` ở `src/components/<feature>/`; repository là nơi duy nhất gọi Supabase client.
- Chứng từ: draft sửa bằng CRUD; xác nhận bằng RPC (`ConfirmStock*Modal` → repository → `.rpc(...)`), có idempotency key.
- Master data mới (danh mục dạng đơn giản): tái dùng `MasterDataPage`.
- Thêm chuỗi UI → thêm key vào **tất cả** `src/locales/*/common.json` (hiện có `en`, `ar`, `es`, `de`, `vi`).
- Menu: sửa `src/layout/AppSidebar.tsx`.

## 5. Việc tiếp theo đề xuất (theo thứ tự ưu tiên)

1. Review, kiểm thử và commit phần Reports đang nằm ở working tree.
2. Lịch sử biến động kho: UI đọc `inventory_movements` (có lọc theo vật liệu/thời gian).
3. Dashboard thật: thay `Dashboard/Ecommerce` bằng số liệu kho (tổng vật liệu, sắp hết, hết hàng, nhập/xuất gần đây).
4. RPC + UI hủy chứng từ với bút toán đảo (ADR-005).
5. Kiểm kê / điều chỉnh tồn qua RPC `stocktake`.
6. Trả hàng bán/mua qua RPC.
7. Quản lý người dùng (ADMIN đổi role, `is_active`).
8. Bổ sung test RPC/RLS/concurrency theo checklist trong [database/08-scope-and-checklist.md](../database/08-scope-and-checklist.md).

Thứ tự là đề xuất; yêu cầu mới nhất của người dùng luôn được ưu tiên. Không tự làm các mục ngoài MVP (xem `PROJECT.md` mục 3).
