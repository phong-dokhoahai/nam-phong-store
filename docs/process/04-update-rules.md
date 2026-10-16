# 6-7. Quy tắc cập nhật process

[Quay lại Process](README.md)

## 6. Rule bắt buộc

**Mỗi khi hoàn thành một tính năng hoặc một task có thay đổi repository (code, migration, route, cấu hình), AI agent BẮT BUỘC cập nhật bộ process trong cùng task đó, trước khi báo hoàn thành.**

- Task chưa cập nhật process được coi là **chưa hoàn thành**.
- Cập nhật cả khi tính năng mới xong một phần: đổi sang 🟡 và ghi rõ phần còn thiếu.
- Task không đổi tiến trình (chỉ đọc, hỏi đáp, sửa typo, refactor không đổi hành vi): không cần sửa bảng, nhưng vẫn phải kiểm tra snapshot còn đúng; nếu phát hiện lệch với code thì sửa.
- Không bao giờ đánh dấu ✅ cho phần chưa chạy/kiểm thử được; ghi rõ "chưa test" trong cột ghi chú.

Cần cập nhật gì:

| Thay đổi trong task | File cần sửa |
| --- | --- |
| Module/tính năng đổi trạng thái | [01-status.md](01-status.md) — cột trạng thái + ghi chú |
| Thêm migration mới | [02-migrations-and-routes.md](02-migrations-and-routes.md) — mục 2 |
| Thêm/xóa/đổi quyền route | [02-migrations-and-routes.md](02-migrations-and-routes.md) — mục 3 |
| Tạo pattern mới cần tái dùng | [03-patterns-and-next-steps.md](03-patterns-and-next-steps.md) — mục 4 |
| Hoàn thành hoặc phát sinh việc tiếp theo | [03-patterns-and-next-steps.md](03-patterns-and-next-steps.md) — mục 5 (xóa mục xong, thêm mục mới) |
| Mọi lần cập nhật | [PROCESS.md](../PROCESS.md) — dòng **Cập nhật lần cuối** (ngày tuyệt đối `YYYY-MM-DD` + commit/ghi chú) |

## 7. Checklist hoàn thành task

- [ ] Trạng thái module trong `01-status.md` khớp với code hiện tại?
- [ ] Migration và route mới đã ghi vào `02-migrations-and-routes.md`?
- [ ] Danh sách việc tiếp theo trong `03-patterns-and-next-steps.md` đã cập nhật?
- [ ] Dòng **Cập nhật lần cuối** trong `PROCESS.md` đã đổi?
- [ ] Không chép chi tiết nghiệp vụ/schema/log vào process (chỉ trỏ link)?
