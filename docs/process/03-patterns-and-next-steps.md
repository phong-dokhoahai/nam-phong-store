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
- Màn đọc dữ liệu cần xem được khi offline: truyền `offlineKey` vào `useAsyncData` (key phải chứa mọi tham số của request: trang, bộ lọc) và `cachedAt` vào `DataSourceBadge`. Chỉ lưu cho ADMIN (scope do `AuthProvider` đặt), xóa khi đăng xuất. Không cache ở service worker cho request Supabase.
- Báo cáo theo kỳ: tính từ `inventory_movements` / `debt_ledger_entries` trong RPC `security invoker`; bút toán đảo quy về nhóm gốc; bộ lọc ngày dùng `reports/DateRangeFields`; xuất PDF qua `reports/ExportPdfButton` + `ReportPdfDocument`.

## 5. Việc tiếp theo đề xuất (theo thứ tự ưu tiên)

0. PWA phần A (2026-10-22): deploy bản build lên HTTPS rồi thử trên điện thoại/máy tính với tài khoản ADMIN thật: cài app, mở các màn danh sách khi có mạng, tắt mạng → mở lại app (kể cả sau >1 giờ để token hết hạn), có mạng lại → tự tải mới; deploy bản mới → thông báo "Tải lại".
0a. PWA phần B: thiết kế "quản lý offline, có mạng thì đồng bộ" (người dùng yêu cầu 2026-10-22). Cần chốt với người dùng: những màn nào (danh mục/vật liệu hay cả chứng từ), xử lý xung đột (trùng mã, bản ghi đã bị sửa/ngừng trên server, tồn kho không đủ khi xác nhận), idempotency key cho hàng đợi. Đụng luật nghiệp vụ → phải hỏi trước, viết spec trong `docs/superpowers/specs/`.
1. Tạo thử phiếu nhập/xuất/thu trên app để xác nhận luồng tạo chứng từ (`next_document_code` đã sửa lỗi ở `202610160006` và thêm kiểm tra user active ở `202610200001`; đã test bằng SQL rollback, chưa thử trên app).
1a. Đăng nhập thử trên trình duyệt với Supabase thật sau khi sửa luồng auth (2026-10-20, mới kiểm chứng bằng client giả): đăng nhập, đăng xuất, mở lại tab, tài khoản bị khóa. `.env` vẫn chứa `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ACCESS_TOKEN`/`ADMIN_PASSWORD` theo quyết định của người dùng (không xóa).
2. Thử các luồng ghi trên Supabase thật sau khi đăng nhập (tạo/sửa vật liệu, lưu nháp + xác nhận phiếu, ghi nhận thanh toán, báo cáo có dữ liệu). Giao diện đã được xem bằng ảnh chụp Chrome headless với dữ liệu demo, chưa thao tác với DB thật.
2a. Cân nhắc chặn danh mục/đơn vị ngưng dùng ở DB (trigger trên `materials` khi tạo hoặc đổi `category_id`/`unit_id`); hiện chỉ chặn ở form vật liệu. Cân nhắc chức năng gộp khách hàng/NCC trùng (chuyển phiếu + công nợ sang bản chính).
3. Dịch 56 chuỗi `payments.*` trong `en`/`ar`/`es`/`de` (đang để tiếng Việt).
4. Quyết định màu trạng thái chứng từ `CANCELLED` (danh sách nhập/xuất: xám; báo cáo: đỏ) rồi gom thành một `DocumentStatusBadge` dùng chung.
5. `bun.lock` chưa có `@react-pdf/renderer` (đã có trong `package.json`): chạy `bun install` để đồng bộ lockfile.
6. `form/group-input/PhoneInput` còn dùng thuộc tính vật lý (`right-*`, `pl-*`, `rounded-l-*`) — vỡ RTL; sửa khi dùng component này.
7. Lint còn 24 lỗi có sẵn ngoài phạm vi refactor (`VectorMap` `any`, `set-state-in-effect` ở `ThemeContext`/`CalendarEventModal`/`SidebarContext`/`LanguageContext`, `svg.d.ts`); lỗi ref của `AuthProvider` đã hết sau khi viết lại (2026-10-20).
8. Quyết định giữ hay xóa các route demo của template (`/signup` đã bỏ ngày 2026-10-20); cân nhắc tự host font Be Vietnam Pro nếu máy kho không có Internet (hiện tải từ Google Fonts, có font dự phòng; từ 2026-10-22 service worker cache font sau lần tải đầu).
9. Lịch sử biến động kho: UI đọc `inventory_movements` (có lọc theo vật liệu/thời gian).
10. Dashboard thật: thay `Dashboard/Ecommerce` bằng số liệu kho (tổng vật liệu, sắp hết, hết hàng, nhập/xuất gần đây).
11. RPC + UI hủy chứng từ với bút toán đảo (ADR-005).
12. Kiểm kê / điều chỉnh tồn qua RPC `stocktake`.
13. Trả hàng bán/mua qua RPC.
14. Quản lý người dùng (ADMIN đổi role, `is_active`).
15. Bổ sung test RPC/RLS/concurrency theo checklist trong [database/08-scope-and-checklist.md](../database/08-scope-and-checklist.md).

Thứ tự là đề xuất; yêu cầu mới nhất của người dùng luôn được ưu tiên. Không tự làm các mục ngoài MVP (xem `PROJECT.md` mục 3).
