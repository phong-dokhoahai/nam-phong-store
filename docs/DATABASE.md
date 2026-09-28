# DATABASE.md

Tài liệu database đã được chia nhỏ theo từng nhóm chủ đề để dễ đọc, dễ cập nhật và giảm xung đột khi chỉnh sửa.

AI coding agent phải đọc file điều hướng này trước khi thay đổi schema, migration, Supabase RPC/RLS hoặc code truy cập dữ liệu. Sau đó đọc các file con liên quan tới task. Với task rộng hoặc ảnh hưởng nhiều nghiệp vụ, đọc toàn bộ bộ tài liệu database.

## Mục lục

| File | Mục | Nội dung |
| --- | --- | --- |
| [database/README.md](database/README.md) | - | Mục lục tổng của bộ tài liệu database |
| [database/01-foundations.md](database/01-foundations.md) | 1-4 | Mục đích, công nghệ dữ liệu, quy ước dữ liệu, enum |
| [database/02-auth-and-permissions.md](database/02-auth-and-permissions.md) | 5 | Supabase Auth, profiles, trigger tạo profile, helper phân quyền |
| [database/03-master-data.md](database/03-master-data.md) | 6 | Category, unit, material, customer, supplier |
| [database/04-documents-and-debt.md](database/04-documents-and-debt.md) | 7-9 | Nhập hàng, bán hàng, thanh toán và công nợ |
| [database/05-inventory-returns-stocktake.md](database/05-inventory-returns-stocktake.md) | 10-12 | Lịch sử tồn kho, trả hàng, kiểm kho |
| [database/06-rpc-and-transactions.md](database/06-rpc-and-transactions.md) | 13-15 | Audit, idempotency, RPC bắt buộc, transaction quan trọng |
| [database/07-security-operations-reporting.md](database/07-security-operations-reporting.md) | 16-23 | RLS, trigger, index, báo cáo, realtime/storage/edge functions, đối soát, seed data, vận hành |
| [database/08-scope-and-checklist.md](database/08-scope-and-checklist.md) | 24-25 | Ngoài phạm vi MVP và checklist triển khai |

Nếu tài liệu này mâu thuẫn với [BUSINESS_RULES.md](BUSINESS_RULES.md), ưu tiên business rules và cập nhật lại tài liệu database tương ứng.