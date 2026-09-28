[Quay lại DATABASE.md](../DATABASE.md)

Bộ tài liệu này chia nhỏ thiết kế cơ sở dữ liệu Supabase PostgreSQL của hệ thống quản lý kho vật liệu xây dựng theo từng nhóm chủ đề.

## Mục lục

| File | Mục | Nội dung |
| --- | --- | --- |
| [01-foundations.md](01-foundations.md) | 1-4 | Mục đích, công nghệ dữ liệu, quy ước dữ liệu, enum |
| [02-auth-and-permissions.md](02-auth-and-permissions.md) | 5 | Supabase Auth, profiles, trigger tạo profile, helper phân quyền |
| [03-master-data.md](03-master-data.md) | 6 | Category, unit, material, customer, supplier |
| [04-documents-and-debt.md](04-documents-and-debt.md) | 7-9 | Nhập hàng, bán hàng, thanh toán và công nợ |
| [05-inventory-returns-stocktake.md](05-inventory-returns-stocktake.md) | 10-12 | Lịch sử tồn kho, trả hàng, kiểm kho |
| [06-rpc-and-transactions.md](06-rpc-and-transactions.md) | 13-15 | Audit, idempotency, RPC bắt buộc, transaction quan trọng |
| [07-security-operations-reporting.md](07-security-operations-reporting.md) | 16-23 | RLS, trigger, index, báo cáo, realtime/storage/edge functions, đối soát, seed data, vận hành |
| [08-scope-and-checklist.md](08-scope-and-checklist.md) | 24-25 | Ngoài phạm vi MVP và checklist triển khai |

Nếu tài liệu database mâu thuẫn với [../BUSINESS_RULES.md](../BUSINESS_RULES.md), ưu tiên business rules và cập nhật lại tài liệu database tương ứng.
