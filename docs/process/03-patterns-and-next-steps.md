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
- Màu nền/viền/chữ lặp lại dùng token ngữ nghĩa (`bg-surface`, `border-line`, `text-fg`, `text-fg-muted`…) định nghĩa trong `src/index.css`; đổi giao diện toàn app → sửa token/primitive, không sửa từng trang.
- Bố cục trang nghiệp vụ: `PageHeader` (tiêu đề + mô tả + `DataSourceBadge` + nút chính) → stat (nếu có ý nghĩa, bấm để lọc) → `FilterToolbar` + bảng. Không bọc danh sách trong `ComponentCard`, không breadcrumb.
- Màn danh sách: `useAsyncData` (tải + lỗi + thử lại) → `AsyncContent` (skeleton / panel lỗi) → bảng `ui/table` (`TableContainer`, `align`) + `usePagedItems` + `ListPagination`; toolbar = `FilterToolbar` + `DataSourceBadge`; xác nhận = `ConfirmDialog`. Mẫu tham khảo: `src/pages/Inventory/Inventory.tsx` (đơn giản), `src/pages/Materials/Materials.tsx` (CRUD), `src/pages/StockReceipts/StockReceipts.tsx` (phân trang server + chọn mặc định).
- Báo cáo theo kỳ: tính từ `inventory_movements` / `debt_ledger_entries` trong RPC `security invoker`; bút toán đảo quy về nhóm gốc; bộ lọc ngày dùng `reports/DateRangeFields`; xuất PDF qua `reports/ExportPdfButton` + `ReportPdfDocument`.

## 5. Việc tiếp theo đề xuất (theo thứ tự ưu tiên)

1. Tắt "Allow new users to sign up" trên Supabase nếu không cần đăng ký công khai; tạo thử phiếu nhập/xuất/thu trên app để xác nhận luồng tạo chứng từ (đã sửa `next_document_code`).
2. Thử các luồng ghi trên Supabase thật sau khi đăng nhập (tạo/sửa vật liệu, lưu nháp + xác nhận phiếu, ghi nhận thanh toán, báo cáo có dữ liệu). Giao diện đã được xem bằng ảnh chụp Chrome headless với dữ liệu demo, chưa thao tác với DB thật.
3. Dịch 56 chuỗi `payments.*` trong `en`/`ar`/`es`/`de` (đang để tiếng Việt).
4. Quyết định màu trạng thái chứng từ `CANCELLED` (danh sách nhập/xuất: xám; báo cáo: đỏ) rồi gom thành một `DocumentStatusBadge` dùng chung.
5. `bun.lock` chưa có `@react-pdf/renderer` (đã có trong `package.json`): chạy `bun install` để đồng bộ lockfile.
6. `form/group-input/PhoneInput` còn dùng thuộc tính vật lý (`right-*`, `pl-*`, `rounded-l-*`) — vỡ RTL; sửa khi dùng component này.
7. Lint còn 25 lỗi có sẵn ngoài phạm vi refactor (`VectorMap` `any`, `set-state-in-effect` ở `ThemeContext`/`CalendarEventModal`, `AuthProvider` refs, `svg.d.ts`).
8. Quyết định giữ hay xóa route `/signup` (form mẫu không hoạt động) và các route demo của template; cân nhắc tự host font Be Vietnam Pro nếu máy kho không có Internet (hiện tải từ Google Fonts, có font dự phòng).
9. Lịch sử biến động kho: UI đọc `inventory_movements` (có lọc theo vật liệu/thời gian).
10. Dashboard thật: thay `Dashboard/Ecommerce` bằng số liệu kho (tổng vật liệu, sắp hết, hết hàng, nhập/xuất gần đây).
11. RPC + UI hủy chứng từ với bút toán đảo (ADR-005).
12. Kiểm kê / điều chỉnh tồn qua RPC `stocktake`.
13. Trả hàng bán/mua qua RPC.
14. Quản lý người dùng (ADMIN đổi role, `is_active`).
15. Bổ sung test RPC/RLS/concurrency theo checklist trong [database/08-scope-and-checklist.md](../database/08-scope-and-checklist.md).

Thứ tự là đề xuất; yêu cầu mới nhất của người dùng luôn được ưu tiên. Không tự làm các mục ngoài MVP (xem `PROJECT.md` mục 3).
