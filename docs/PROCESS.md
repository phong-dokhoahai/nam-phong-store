# PROCESS.md

Tài liệu tiến trình dự án đã được chia nhỏ theo từng nhóm nội dung để dễ đọc và dễ bảo trì.

AI coding agent phải đọc file điều hướng này **trước khi nhận bất kỳ task nào** để biết dự án đã làm đến đâu, sau đó đọc các file con liên quan tới task.

> **BẮT BUỘC:** mỗi khi hoàn thành một tính năng hoặc một task có thay đổi repository, AI agent phải cập nhật bộ tài liệu process trong cùng task đó, theo [process/04-update-rules.md](process/04-update-rules.md). Task chưa cập nhật process được coi là **chưa hoàn thành**.

**Cập nhật lần cuối:** 2026-11-06 (sau commit `76b1ca8`; 2026-11-06: quy tắc "luôn tái sử dụng/sửa component của template" trong CLAUDE.md + AGENTS.md, việc tiếp theo 0b: sửa `form/date-picker`; 2026-11-06: thêm luồng Bán tại quầy vào `PROJECT.md`; spec + plan thu tiền ngay / thu gộp / hủy / trả hàng / kiểm kê (chưa duyệt, chưa code); kiểm tra dữ liệu nhập ở mọi form nghiệp vụ, primitive `NumberInput` thay `type="number"` (chưa thử trên app với Supabase thật); 2026-11-04: cài 11 skill Founder vào `.claude/skills/` (công cụ cho Claude, không đổi code app); đánh giá app như sản phẩm để bán bằng `founder-board` + `founder-competitors`, kết quả trong `founder/` (không đổi code app, không đổi thứ tự việc tiếp theo); 2026-11-02: thêm dữ liệu mẫu lên DB remote qua `supabase/sample-data.sql`; test 16 màn với ADMIN thật (chỉ đọc), sửa icon "Xem", tràn ngang trang, định dạng số lượng, phân trang phiếu không ổn định; trước đó, sau commit `afb0ce4`: 2026-10-20: review auth, tắt đăng ký công khai, bỏ `/signup`, migration `202610200001` đã push, sửa luồng phiên đăng nhập; 2026-10-22: "ngừng hợp tác" cho khách hàng/NCC, chặn danh mục/đơn vị ngưng dùng trong form vật liệu, xử lý phiếu nháp có đối tượng đã ngừng; PWA phần A: cài app, cache giao diện, báo bản mới, báo offline, xem dữ liệu đã lưu cho ADMIN; thay đổi repo chưa commit).

## Mục lục

| File | Mục | Nội dung |
| --- | --- | --- |
| [process/README.md](process/README.md) | - | Mục lục tổng của bộ process |
| [process/01-status.md](process/01-status.md) | 1 | Trạng thái từng module MVP |
| [process/02-migrations-and-routes.md](process/02-migrations-and-routes.md) | 2-3 | Migration đã có, route đã đăng ký |
| [process/03-patterns-and-next-steps.md](process/03-patterns-and-next-steps.md) | 4-5 | Pattern đã dùng, việc tiếp theo đề xuất |
| [process/04-update-rules.md](process/04-update-rules.md) | 6-7 | Quy tắc bắt buộc cập nhật process, checklist hoàn thành |
| [process/05-daily-log.md](process/05-daily-log.md) | 8 | Nhật ký làm việc hằng ngày theo mẫu báo cáo |

Đây là snapshot. Nguồn sự thật cuối cùng vẫn là code, `supabase/migrations/` và `git log`; nếu snapshot lệch với code, tin code rồi sửa snapshot. Nếu có xung đột với yêu cầu mới nhất của người dùng, ưu tiên yêu cầu mới nhất.
