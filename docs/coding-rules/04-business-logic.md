# Business logic

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 14. Business logic

Business logic không được đặt trực tiếp trong UI nếu có thể tránh.

Không:

```tsx
const total = items.reduce(
  (sum, item) =>
    sum +
    item.quantity *
      item.price -
    item.discount,
  0,
);
```

lặp lại ở nhiều component.

Nên tạo function:

```ts
calculateReceiptTotal(items)
```

Business logic quan trọng phải có một source of truth duy nhất.

---


## 15. Tiền

Không sử dụng floating point một cách tùy tiện cho tiền.

Giá trị tiền lưu trong database theo quy ước của `DATABASE.md`.

Không format tiền ngay trong business logic.

Ví dụ:

```ts
const totalAmount = quantity * unitPrice;
```

Format chỉ ở presentation layer:

```ts
formatCurrency(totalAmount);
```

---


## 16. Số lượng tồn kho

Không trực tiếp update tồn kho từ frontend.

Frontend chỉ gửi nghiệp vụ:

```text
nhập hàng
xuất hàng
điều chỉnh kho
hủy phiếu
```

Backend chịu trách nhiệm cập nhật tồn kho.

Không cho phép client gửi kiểu:

```json
{
  "stockQuantity": 500
}
```

để thay đổi tồn kho trực tiếp nếu nghiệp vụ không phải điều chỉnh tồn kho.

---


## 17. Inventory transaction

Mọi thay đổi tồn kho phải có dấu vết.

Ví dụ:

```text
IMPORT
EXPORT
ADJUSTMENT
RETURN
CANCEL
```

Không update số lượng kho mà không tạo transaction hoặc history tương ứng nếu business rule yêu cầu.

---


## 18. Phiếu nhập / xuất

Phiếu đã hoàn thành không được chỉnh sửa tùy tiện.

Nếu [BUSINESS_RULES.md](../BUSINESS_RULES.md) quy định phiếu completed/confirmed không được sửa:

code phải enforce rule ở backend.

Xem thêm trạng thái và xác nhận phiếu trong [business-rules/03-inventory.md](../business-rules/03-inventory.md), [business-rules/04-purchasing.md](../business-rules/04-purchasing.md), và [business-rules/05-sales.md](../business-rules/05-sales.md).

Frontend disable button chỉ là UX.

Không được coi frontend validation là security hoặc business enforcement.

---


## 19. Công nợ

Logic công nợ phải được xử lý tập trung.

Ví dụ:

```text
debt = totalAmount - paidAmount
```

Không tính công nợ theo nhiều công thức ở nhiều nơi.

Không cho phép:

```ts
paidAmount > totalAmount
```

trừ khi business rule có xử lý overpayment.

Các thay đổi:

```text
thanh toán
hoàn tiền
hủy phiếu
điều chỉnh
```

phải cập nhật công nợ đúng theo [BUSINESS_RULES.md](../BUSINESS_RULES.md).

Xem thêm quy tắc công nợ và thanh toán trong [business-rules/06-debt-and-payments.md](../business-rules/06-debt-and-payments.md).

---


## 20. Soft delete

Các entity nghiệp vụ quan trọng không được hard delete nếu database/business rule đang sử dụng soft delete.

Ví dụ:

```text
Material
Supplier
Customer
Receipt
InventoryTransaction
Payment
```

Nếu entity đã phát sinh transaction, ưu tiên:

```text
isActive = false
```

hoặc:

```text
deletedAt
```

thay vì xóa record.

---


## 51. Material code

Mã vật liệu phải unique nếu business rule quy định.

Không sử dụng tên vật liệu làm primary identifier.

Ví dụ:

```text
XM-HOLCIM-50KG
CAT-VANG-001
THEP-D16
```

---


## 52. Receipt code

Không generate receipt code ở frontend.

Backend phải chịu trách nhiệm tạo mã.

Ví dụ:

```text
PN-20260914-0001
PX-20260914-0001
```

Cơ chế generate phải chống duplicate khi nhiều request đồng thời.

---


## 68. Circular dependency

Không tạo circular dependency giữa module.

Ví dụ tránh:

```text
material -> inventory -> receipt -> material
```

Shared logic phải đặt ở layer phù hợp.

---


## 69. Domain separation

Không trộn domain không liên quan.

Ví dụ:

```text
materials
inventory
suppliers
customers
receipts
payments
debts
```

nên có module riêng nếu architecture hiện tại hỗ trợ.

---


## 70. Audit

Các action quan trọng nên lưu thông tin người thực hiện nếu business rule yêu cầu.

Ví dụ:

```text
createdBy
updatedBy
cancelledBy
confirmedBy
```

Đặc biệt:

```text
điều chỉnh tồn kho
hủy phiếu
thanh toán
```

---


## 71. Audit timestamps

Entity nghiệp vụ nên sử dụng timestamps thống nhất:

```text
createdAt
updatedAt
```

và khi cần:

```text
deletedAt
cancelledAt
confirmedAt
paidAt
```

Không tạo naming tùy ý như:

```text
createDate
dateCreated
creationTime
```

trong các module khác nhau.

---


## 73. Idempotency

Các nghiệp vụ quan trọng phải cân nhắc duplicate request.

Ví dụ:

```text
confirm receipt
cancel receipt
payment callback
create payment
```

Request gửi hai lần không được gây double stock hoặc double payment.

---


## 74. Payment / debt operations

Nếu có module thanh toán:

không update trực tiếp:

```text
paidAmount
debtAmount
```

từ frontend.

Frontend gửi transaction thanh toán.

Backend tính lại trạng thái tài chính.

Ví dụ:

```text
receipt total: 10,000,000
paid: 6,000,000
debt: 4,000,000
```

---


## 75. Decimal

Các field như:

```text
quantity
unitPrice
totalAmount
```

phải dùng kiểu dữ liệu phù hợp theo `DATABASE.md`.

Không convert sang JavaScript `Number` một cách thiếu kiểm soát nếu database đang sử dụng Decimal.

---
