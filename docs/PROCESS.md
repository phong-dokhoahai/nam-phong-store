# PROCESS.md

Tài liệu tiến trình dự án đã được chia nhỏ theo từng nhóm nội dung để dễ đọc và dễ bảo trì.

AI coding agent phải đọc file điều hướng này **trước khi nhận bất kỳ task nào** để biết dự án đã làm đến đâu, sau đó đọc các file con liên quan tới task.

> **BẮT BUỘC:** mỗi khi hoàn thành một tính năng hoặc một task có thay đổi repository, AI agent phải cập nhật bộ tài liệu process trong cùng task đó, theo [process/04-update-rules.md](process/04-update-rules.md). Task chưa cập nhật process được coi là **chưa hoàn thành**.

**Cập nhật lần cuối:** 2026-10-22 (sau commit `afb0ce4`; 2026-10-20: review auth, tắt đăng ký công khai, bỏ `/signup`, migration `202610200001` đã push, sửa luồng phiên đăng nhập; 2026-10-22: "ngừng hợp tác" cho khách hàng/NCC, chặn danh mục/đơn vị ngưng dùng trong form vật liệu, xử lý phiếu nháp có đối tượng đã ngừng; PWA phần A: cài app, cache giao diện, báo bản mới, báo offline, xem dữ liệu đã lưu cho ADMIN; thay đổi repo chưa commit).

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
