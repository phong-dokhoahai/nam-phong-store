# BUSINESS_RULES.md

Tài liệu business rules đã được chia nhỏ theo từng miền nghiệp vụ để dễ đọc và dễ bảo trì.

## Mục lục

| File | Mục | Nội dung |
| --- | --- | --- |
| [business-rules/README.md](business-rules/README.md) | - | Mục lục tổng của bộ business rules |
| [business-rules/01-foundations.md](business-rules/01-foundations.md) | 1-2, 62-66, 81-87, 89-101, 103 | Nguyên tắc nền tảng, chứng từ, phân quyền, tính toàn vẹn dữ liệu, audit, reconciliation |
| [business-rules/02-master-data.md](business-rules/02-master-data.md) | 3-7, 25-26 | Vật liệu, nhóm vật liệu, đơn vị tính, khách hàng, nhà cung cấp |
| [business-rules/03-inventory.md](business-rules/03-inventory.md) | 8-13, 17-19, 52-61 | Tồn kho, inventory transaction, xuất kho, điều chỉnh tồn, kiểm kê |
| [business-rules/04-purchasing.md](business-rules/04-purchasing.md) | 14-16, 20, 27, 35-36, 49-51, 80 | Nhập kho, mua hàng, giá nhập, công nợ nhà cung cấp, trả nhà cung cấp |
| [business-rules/05-sales.md](business-rules/05-sales.md) | 21-23, 28, 44-48, 77-79 | Bán hàng, giá bán, discount, doanh thu, khách trả hàng, hủy đơn bán |
| [business-rules/06-debt-and-payments.md](business-rules/06-debt-and-payments.md) | 24, 29-34, 37-43 | Tiền tệ, công nợ, thanh toán, payment transaction, hủy thanh toán |
| [business-rules/07-reporting-and-costing.md](business-rules/07-reporting-and-costing.md) | 67-76 | Báo cáo, lợi nhuận, giá vốn, weighted average cost |
| [business-rules/08-mvp-scope.md](business-rules/08-mvp-scope.md) | 102 | Phạm vi MVP và các nghiệp vụ nâng cao để sau |

Nếu implementation hiện tại mâu thuẫn với bộ business rules này, ưu tiên quy tắc trong các file được liên kết ở trên, trừ khi có yêu cầu nghiệp vụ mới hơn được xác nhận.
