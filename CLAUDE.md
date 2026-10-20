# CLAUDE.md — Nam Phong Storage

Hệ thống web nội bộ quản lý kho vật liệu xây dựng: vật liệu, danh mục, đơn vị, nhà cung cấp, khách hàng, nhập kho, xuất kho/bán hàng, thanh toán/công nợ, tồn kho, báo cáo. Hai vai trò: `ADMIN` và `WAREHOUSE_STAFF`. Xây trên template TailAdmin React Pro; Supabase (Auth, PostgreSQL, RLS, RPC) thay cho backend riêng.

Quy ước UI, routing, i18n, styling và bảng primitive của template: @AGENTS.md

## Lệnh

Package manager là **bun** (`bun.lock`); `npm run …` cũng chạy được.

| Việc | Lệnh |
| --- | --- |
| Cài dependency | `bun install` |
| Dev server | `bun run dev` |
| Type check + build production | `bun run build` (`tsc -b && vite build`) |
| Lint | `bun run lint` |
| Static check auth/route | `node --test scripts/auth-static-checks.test.mjs` |
| Static check schema/migration | `powershell -File supabase/tests/schema-static-checks.ps1` |
| Test RPC trên DB thật | `supabase/tests/*.rollback.sql`, luôn bọc trong `begin; … rollback;` (máy không có Docker, không có DB local) |
| Sinh lại type DB | `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts` |

Chưa có unit test frontend. Tối thiểu sau khi sửa code: `bun run build` và `bun run lint` phải pass.

## Đọc gì trước khi làm

Luôn đọc `docs/PROCESS.md` (dự án đang ở đâu). Sau đó chỉ đọc phần liên quan:

| Task chạm tới | Đọc |
| --- | --- |
| Nghiệp vụ (tồn kho, chứng từ, công nợ, giá vốn) | `docs/BUSINESS_RULES.md` → file con trong `docs/business-rules/` |
| Schema, RLS, RPC, migration | `docs/DATABASE.md` → `docs/database/` |
| Cấu trúc, dependency, data flow | `docs/ARCHITECTURE.md` |
| Viết/sửa code | `docs/CODING_RULES.md` → `docs/coding-rules/` |
| Phạm vi MVP, vai trò người dùng | `PROJECT.md` |

Không cần đọc cả repo cho task nhỏ. Nếu tài liệu lệch với code thì tin code, rồi sửa tài liệu.

## Kiến trúc: những điều không được phá

- **Data access:** Supabase client chỉ khởi tạo ở `src/lib/supabase/client.ts`. Mỗi feature có một `<feature>Repository.ts` trong `src/components/<feature>/`, là nơi **duy nhất** gọi Supabase (ngoài `src/auth/authService.ts`). Page/component không gọi `supabase` trực tiếp.
- **Nghiệp vụ atomic chạy bằng RPC:** confirm, cancel, payment, return, stocktake, lưu nháp chứng từ (`save_*_draft`) đều là một PostgreSQL RPC. Không ghép nhiều request từ browser cho một nghiệp vụ. Thao tác nhạy cảm truyền idempotency key.
- **Append-only:** `inventory_movements`, `debt_ledger_entries` và audit không bao giờ sửa/xóa; sửa sai bằng bút toán đảo (ADR-005).
- **Tồn kho và công nợ** chỉ thay đổi qua RPC; client không ghi trực tiếp số tồn, số đã trả hay tổng tiền.
- **Phân quyền:** frontend (`ProtectedRoute`, `AdminRoute` trong `src/auth/`) chỉ để cải thiện UX; security boundary thật là RLS + kiểm tra trong RPC. Báo cáo doanh thu/công nợ chỉ dành cho ADMIN.
- **Cấu trúc:** route trong `src/App.tsx`, page trong `src/pages/<Feature>/`, UI nghiệp vụ trong `src/components/<feature>/`. Không tạo `src/features/`. Shared code không import ngược feature.
- **Danh mục đơn giản** (categories, units, suppliers, customers) tái dùng `src/components/master-data/MasterDataPage`.

## Quy ước riêng của dự án

- **Tiền:** dùng `formatCurrency()` trong `src/utils/formatCurrency.ts`, không tự format ở component. Số lượng có thể là số thập phân (1.5 m³), không ép kiểu integer.
- **Type DB:** `src/lib/supabase/database.types.ts` là file sinh tự động, không sửa tay. Mỗi migration đổi schema/RPC phải sinh lại.
- **Migration:** `supabase/migrations/YYYYMMDDNNNN_<slug>.sql`. Chỉ đổi schema bằng migration mới, không sửa migration đã push.
- **Chuỗi hiển thị:** thêm key vào **cả 5** file `src/locales/{en,ar,es,de,vi}/common.json`. Ngôn ngữ chính của người dùng là `vi`.
- **Menu:** sửa `src/layout/AppSidebar.tsx`.
- **Báo cáo theo kỳ:** tính trong RPC `security invoker` từ movement/ledger; lọc ngày dùng `reports/DateRangeFields`; xuất PDF qua `reports/ExportPdfButton`.
- **Secret:** `.env` chỉ chứa `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`. `service_role` không bao giờ xuất hiện trong source frontend, biến `VITE_*`, log hoặc commit.

## Phải hỏi trước

- Cài package mới.
- Chạy migration hoặc thay đổi dữ liệu trên **DB Supabase remote** (đây là DB production). Test RPC chỉ trong transaction rollback.
- Xóa dữ liệu, xóa file không do mình tạo, `git push`, force push.
- Đổi luật nghiệp vụ, quyền hoặc phạm vi MVP.

Các quyết định kỹ thuật thông thường thì tự chọn theo convention hiện có và nói rõ trong báo cáo.

## Definition of Done

Một task có thay đổi repository chỉ xong khi:

1. `bun run build` và `bun run lint` pass; RPC mới có test `*.rollback.sql`.
2. Đã cập nhật `docs/PROCESS.md` và `docs/process/` theo `docs/process/04-update-rules.md`: trạng thái module, migration/route, việc tiếp theo, một dòng trong nhật ký ngày (`05-daily-log.md`, tiếng Anh, đúng mẫu), dòng "Cập nhật lần cuối".
3. Đã ghi log thực thi vào `.ai/logs/YYYY-MM-DD_<task-slug>.md` theo `docs/LOGGING_RULES.md`.
4. Báo cáo đúng sự thật: phần chưa test (ví dụ chưa thử trên trình duyệt, chưa push DB) phải ghi rõ, không đánh dấu ✅.
