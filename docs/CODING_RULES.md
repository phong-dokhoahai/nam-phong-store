# CODING_RULES.md

Tài liệu coding rules đã được chia nhỏ theo từng nhóm quy tắc để dễ đọc và dễ bảo trì.

AI coding agent phải đọc file điều hướng này trước khi thay đổi source code, sau đó đọc các file con liên quan tới task. Với task rộng hoặc chạm nhiều layer, đọc toàn bộ bộ rule.

## Mục lục

| File | Mục | Nội dung |
| --- | --- | --- |
| [coding-rules/README.md](coding-rules/README.md) | - | Mục lục tổng của bộ coding rules |
| [coding-rules/01-foundations.md](coding-rules/01-foundations.md) | 1-4, 58-63, 85-87 | Mục tiêu, nguyên tắc chung, thứ tự ưu tiên tài liệu, tech stack, chống tự đổi business rule, chống over-engineering, dependency, refactor, Definition of Done, checklist |
| [coding-rules/02-typescript-and-naming.md](coding-rules/02-typescript-and-naming.md) | 5-12, 34-38, 67 | TypeScript, naming convention, constants, enum, file naming, async, early return, function size, comments, TODO, import alias |
| [coding-rules/03-frontend.md](coding-rules/03-frontend.md) | 13, 40-50, 64-66 | Component, search/filter/sort/pagination UI, forms, loading/empty state, confirmation, currency/number/unit UI, API calls frontend, server state, global state |
| [coding-rules/04-business-logic.md](coding-rules/04-business-logic.md) | 14-20, 51-52, 68-71, 73-75 | Business logic placement, tiền, tồn kho, inventory transaction, phiếu nhập/xuất, công nợ, soft delete, mã nghiệp vụ, domain separation, audit, idempotency, payment/debt operations, decimal |
| [coding-rules/05-api-backend.md](coding-rules/05-api-backend.md) | 21-24, 28-33, 72, 76-77 | API design, response, HTTP status, validation, error handling/message, logging, auth/authz, environment variables, sensitive data, security, mass assignment |
| [coding-rules/06-database.md](coding-rules/06-database.md) | 25-27, 39, 53-54 | Database query, transaction, concurrency, date/time, migration, seed data |
| [coding-rules/07-testing.md](coding-rules/07-testing.md) | 55-57 | Testing priorities, test naming, test cases |
| [coding-rules/08-ai-agent-rules.md](coding-rules/08-ai-agent-rules.md) | 78-84 | AI coding workflow, reuse pattern, không tự đổi architecture, xử lý thiếu thông tin, sửa bug, implement feature, thay đổi database |

Nếu có xung đột giữa coding rule và business rule, ưu tiên business rule trong [BUSINESS_RULES.md](BUSINESS_RULES.md), trừ khi có yêu cầu mới hơn được xác nhận.