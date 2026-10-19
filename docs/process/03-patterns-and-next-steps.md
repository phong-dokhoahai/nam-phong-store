# 4-5. Pattern và việc tiếp theo

[Quay lại Process](README.md)

## 4. Pattern đã dùng, cần theo khi làm tiếp

- Feature mới: page ở `src/pages/<Feature>/`, UI + `<feature>Repository.ts` ở `src/components/<feature>/`; repository là nơi duy nhất gọi Supabase client.
- RPC mới: test bằng file `supabase/tests/*.rollback.sql` chạy trên DB thật trong `begin … rollback` (máy không có Docker); xem `save-document-draft.rollback.sql`.
- Chứng từ: lưu nháp bằng một RPC `save_*_draft` (không ghép nhiều request; giữ id/mã, tổng tính ở DB); xác nhận bằng RPC (`ConfirmStock*Modal` → repository → `.rpc(...)`), có idempotency key.
- Master data mới (danh mục dạng đơn giản): tái dùng `MasterDataPage`.
- Thêm chuỗi UI → thêm key vào **tất cả** `src/locales/*/common.json` (hiện có `en`, `ar`, `es`, `de`, `vi`).
- Menu: sửa `src/layout/AppSidebar.tsx`.
- UI: dùng primitive theo bảng "Primitive map" trong `AGENTS.md`; không viết `<button>/<input>/<select>/<textarea>/<label>` thô hay khung báo lỗi/rỗng/đang tải tự style. Primitive thiếu tính năng → mở rộng primitive.
- Báo cáo theo kỳ: tính từ `inventory_movements` / `debt_ledger_entries` trong RPC `security invoker`; bút toán đảo quy về nhóm gốc; bộ lọc ngày dùng `reports/DateRangeFields`; xuất PDF qua `reports/ExportPdfButton` + `ReportPdfDocument`.

## 5. Việc tiếp theo đề xuất (theo thứ tự ưu tiên)

1. Tắt "Allow new users to sign up" trên Supabase nếu không cần đăng ký công khai; tạo thử phiếu nhập/xuất/thu trên app để xác nhận luồng tạo chứng từ (đã sửa `next_document_code`).
2. Kiểm thử UI trên trình duyệt (light/dark, RTL `ar`) cho Reports và các màn đã chuyển sang primitive, rồi commit refactor primitive.
3. `bun.lock` chưa có `@react-pdf/renderer` (đã có trong `package.json`): chạy `bun install` để đồng bộ lockfile.
4. `form/group-input/PhoneInput` còn dùng thuộc tính vật lý (`right-*`, `pl-*`, `rounded-l-*`) — vỡ RTL; sửa khi dùng component này.
5. Lịch sử biến động kho: UI đọc `inventory_movements` (có lọc theo vật liệu/thời gian).
6. Dashboard thật: thay `Dashboard/Ecommerce` bằng số liệu kho (tổng vật liệu, sắp hết, hết hàng, nhập/xuất gần đây).
7. RPC + UI hủy chứng từ với bút toán đảo (ADR-005).
8. Kiểm kê / điều chỉnh tồn qua RPC `stocktake`.
9. Trả hàng bán/mua qua RPC.
10. Quản lý người dùng (ADMIN đổi role, `is_active`).
11. Bổ sung test RPC/RLS/concurrency theo checklist trong [database/08-scope-and-checklist.md](../database/08-scope-and-checklist.md).

Thứ tự là đề xuất; yêu cầu mới nhất của người dùng luôn được ưu tiên. Không tự làm các mục ngoài MVP (xem `PROJECT.md` mục 3).
