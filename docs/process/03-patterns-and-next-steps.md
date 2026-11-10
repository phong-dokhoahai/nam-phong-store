# 4-5. Pattern và việc tiếp theo

[Quay lại Process](README.md)

## 4. Pattern đã dùng, cần theo khi làm tiếp

- Feature mới: page ở `src/pages/<Feature>/`, UI + `<feature>Repository.ts` ở `src/components/<feature>/`; repository là nơi duy nhất gọi Supabase client.
- RPC mới: test bằng file `supabase/tests/*.rollback.sql` chạy trên DB thật trong `begin … rollback` (máy không có Docker); xem `save-document-draft.rollback.sql`.
- Chứng từ: lưu nháp bằng một RPC `save_*_draft` (không ghép nhiều request; giữ id/mã, tổng tính ở DB); xác nhận bằng RPC (`ConfirmStock*Modal` → repository → `.rpc(...)`), có idempotency key.
- Master data mới (danh mục dạng đơn giản): tái dùng `MasterDataPage`.
- Ô nhập tiền/số lượng: `form/input/NumberInput` (`kind="money"` | `"quantity"`), không dùng `<Input type="number">`. Kiểm tra form: `utils/validation` (`validateText`, `fieldLimits` theo varchar trong DB, định dạng email/SĐT/MST/mã); validator riêng của feature trả lỗi theo từng ô (`materials/materialValidation.ts`, `master-data/masterDataValidation.ts`), hiện sau lần bấm lưu đầu tiên bằng `error` + `hint` của `InputField`. Dòng chứng từ: `utils/documentLines` (cùng luật với RPC `parse_draft_items`) qua `getReceiptLineError` / `getIssueLineError`, dùng chung cho editor và `validateDraft` của page.
- Thêm chuỗi UI → thêm key vào **tất cả** `src/locales/*/common.json` (hiện có `en`, `ar`, `es`, `de`, `vi`).
- Menu: sửa `src/layout/AppSidebar.tsx`.
- UI: dùng primitive theo bảng "Primitive map" trong `AGENTS.md`; không viết `<button>/<input>/<select>/<textarea>/<label>` thô hay khung báo lỗi/rỗng/đang tải tự style. Primitive thiếu tính năng → mở rộng primitive.
- Màu nền/viền/chữ lặp lại dùng token ngữ nghĩa (`bg-surface`, `border-line`, `text-fg`, `text-fg-muted`…) định nghĩa trong `src/index.css`; đổi giao diện toàn app → sửa token/primitive, không sửa từng trang.
- Bố cục trang nghiệp vụ: `PageHeader` (tiêu đề + mô tả + `DataSourceBadge` + nút chính) → stat (nếu có ý nghĩa, bấm để lọc) → `FilterToolbar` + bảng. Không bọc danh sách trong `ComponentCard`, không breadcrumb.
- Màn danh sách: `useAsyncData` (tải + lỗi + thử lại) → `AsyncContent` (skeleton / panel lỗi) → bảng `ui/table` (`TableContainer`, `align`) + `usePagedItems` + `ListPagination`; toolbar = `FilterToolbar` + `DataSourceBadge`; xác nhận = `ConfirmDialog`. Mẫu tham khảo: `src/pages/Inventory/Inventory.tsx` (đơn giản), `src/pages/Materials/Materials.tsx` (CRUD), `src/pages/StockReceipts/StockReceipts.tsx` (phân trang server + chọn mặc định).
- Màn đọc dữ liệu cần xem được khi offline: truyền `offlineKey` vào `useAsyncData` (key phải chứa mọi tham số của request: trang, bộ lọc) và `cachedAt` vào `DataSourceBadge`. Chỉ lưu cho ADMIN (scope do `AuthProvider` đặt), xóa khi đăng xuất. Không cache ở service worker cho request Supabase.
- Báo cáo theo kỳ: tính từ `inventory_movements` / `debt_ledger_entries` trong RPC `security invoker`; bút toán đảo quy về nhóm gốc; bộ lọc ngày dùng `reports/DateRangeFields`; xuất PDF qua `reports/ExportPdfButton` + `ReportPdfDocument`.

## 5. Việc tiếp theo đề xuất (theo thứ tự ưu tiên)

00. **Bán tại quầy** (thêm vào `PROJECT.md` mục 4 ngày 2026-11-06): thiết kế màn một bước. Mục tiêu: đơn 1 mặt hàng trả đủ xong trong 3–4 thao tác. Hiện cần ~12 thao tác qua 2 màn. Kế hoạch [plans/2026-11-06-counter-sale-debt-loop.md](../superpowers/plans/2026-11-06-counter-sale-debt-loop.md) chưa được duyệt và chưa chạy. Phần RPC của Task 1 (thu tiền ngay trong `confirm_sales_order`) dùng lại được; phần UI của Task 1 phải làm lại theo luồng mới. Chờ người dùng chốt thiết kế màn.
0. PWA phần A (2026-10-22): deploy bản build lên HTTPS rồi thử trên điện thoại/máy tính với tài khoản ADMIN thật: cài app, mở các màn danh sách khi có mạng, tắt mạng → mở lại app (kể cả sau >1 giờ để token hết hạn), có mạng lại → tự tải mới; deploy bản mới → thông báo "Tải lại".
0a. PWA phần B: thiết kế "quản lý offline, có mạng thì đồng bộ" (người dùng yêu cầu 2026-10-22). Cần chốt với người dùng: những màn nào (danh mục/vật liệu hay cả chứng từ), xử lý xung đột (trùng mã, bản ghi đã bị sửa/ngừng trên server, tồn kho không đủ khi xác nhận), idempotency key cho hàng đợi. Đụng luật nghiệp vụ → phải hỏi trước, viết spec trong `docs/superpowers/specs/`.
0b. Sửa `form/date-picker` của template thành component controlled (`value`/`onChange`, `disabled`, `error`/`hint`, style `controlStyles`, gắn flatpickr bằng ref thay cho `#id`, tiếng Việt `dd/mm/yyyy`) rồi thay 5 ô `InputField type="date"` (phiếu nhập, phiếu xuất, thanh toán, 2 ô `reports/DateRangeFields`). Theo quy tắc "luôn tái sử dụng component của template" (CLAUDE.md, 2026-11-06).
1. Tạo thử phiếu nhập/xuất/thu trên app để xác nhận luồng tạo chứng từ (`next_document_code` đã sửa lỗi ở `202610160006` và thêm kiểm tra user active ở `202610200001`; đã test bằng SQL rollback, chưa thử trên app).
1a. Đăng nhập thử trên trình duyệt với Supabase thật sau khi sửa luồng auth (2026-10-20, mới kiểm chứng bằng client giả): đăng nhập, đăng xuất, mở lại tab, tài khoản bị khóa. `.env` vẫn chứa `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ACCESS_TOKEN`/`ADMIN_PASSWORD` theo quyết định của người dùng (không xóa).
1b. Cột "Dòng hàng" ở danh sách phiếu nhập/xuất cộng số lượng khác đơn vị ("2 dòng / 10.020" = 20 bao + 10.000 viên) — con số vô nghĩa; đề xuất chỉ hiện số dòng hoặc liệt kê theo đơn vị. Chờ người dùng quyết định.
2. Thử các luồng ghi trên Supabase thật sau khi đăng nhập (tạo/sửa vật liệu, lưu nháp + xác nhận phiếu, ghi nhận thanh toán, báo cáo có dữ liệu). Từ 2026-11-02 DB đã có dữ liệu mẫu (`supabase/sample-data.sql`, xem [02](02-migrations-and-routes.md)); đã đăng nhập ADMIN thật và xem cả 16 màn nghiệp vụ trên Chrome headless (desktop + mobile tối), chỉ đọc. **Còn chưa thử:** các thao tác ghi trên giao diện (tạo/sửa/xác nhận phiếu, thanh toán, ngừng hợp tác), xuất PDF, tài khoản WAREHOUSE_STAFF, PWA offline khi đã đăng nhập. Trả hàng/kiểm kê mẫu chỉ ở trạng thái nháp vì chưa có RPC xác nhận.
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
