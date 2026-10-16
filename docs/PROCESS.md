# PROCESS.md

Tài liệu tiến trình dự án đã được chia nhỏ theo từng nhóm nội dung để dễ đọc và dễ bảo trì.

AI coding agent phải đọc file điều hướng này **trước khi nhận bất kỳ task nào** để biết dự án đã làm đến đâu, sau đó đọc các file con liên quan tới task.

> **BẮT BUỘC:** mỗi khi hoàn thành một tính năng hoặc một task có thay đổi repository, AI agent phải cập nhật bộ tài liệu process trong cùng task đó, theo [process/04-update-rules.md](process/04-update-rules.md). Task chưa cập nhật process được coi là **chưa hoàn thành**.

**Cập nhật lần cuối:** 2026-10-16 (sau commit `089e5bd`, báo cáo đang ở working tree chưa commit).

## Mục lục

| File | Mục | Nội dung |
| --- | --- | --- |
| [process/README.md](process/README.md) | - | Mục lục tổng của bộ process |
| [process/01-status.md](process/01-status.md) | 1 | Trạng thái từng module MVP |
| [process/02-migrations-and-routes.md](process/02-migrations-and-routes.md) | 2-3 | Migration đã có, route đã đăng ký |
| [process/03-patterns-and-next-steps.md](process/03-patterns-and-next-steps.md) | 4-5 | Pattern đã dùng, việc tiếp theo đề xuất |
| [process/04-update-rules.md](process/04-update-rules.md) | 6-7 | Quy tắc bắt buộc cập nhật process, checklist hoàn thành |

Đây là snapshot. Nguồn sự thật cuối cùng vẫn là code, `supabase/migrations/` và `git log`; nếu snapshot lệch với code, tin code rồi sửa snapshot. Nếu có xung đột với yêu cầu mới nhất của người dùng, ưu tiên yêu cầu mới nhất.
