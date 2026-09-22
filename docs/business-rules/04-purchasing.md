# Mua hàng và nhập kho

[Quay lại BUSINESS_RULES.md](../BUSINESS_RULES.md)

> Quy tắc payment transaction dùng chung nằm trong [06-debt-and-payments.md](06-debt-and-payments.md).

## 14. Nhập kho

Phiếu nhập kho đại diện cho hàng thực tế được nhập vào kho.

Thông tin:

```txt
receiptCode
supplierId
receiptDate
items
note
status
createdBy
```

---


## 15. Trạng thái phiếu nhập

```txt
DRAFT
CONFIRMED
CANCELLED
```

### DRAFT

* có thể chỉnh sửa
* có thể xóa
* chưa thay đổi tồn kho
* chưa ghi nhận công nợ

### CONFIRMED

* tăng tồn kho
* có thể phát sinh công nợ nhà cung cấp
* không được chỉnh trực tiếp
* không được hard delete

### CANCELLED

* không ảnh hưởng tồn kho
* không được chỉnh sửa

---


## 16. Xác nhận phiếu nhập

Khi xác nhận phiếu nhập:

1. kiểm tra trạng thái phải là `DRAFT`
2. kiểm tra có ít nhất một item
3. kiểm tra quantity > 0
4. kiểm tra giá hợp lệ
5. cập nhật tồn kho
6. tạo inventory transaction
7. ghi nhận giá trị nhập hàng
8. ghi nhận công nợ nếu chưa thanh toán đủ

Toàn bộ thao tác phải nằm trong cùng database transaction.

---


## 20. Giá nhập

Mỗi lần nhập có thể có giá khác nhau.

Ví dụ:

```txt
Lần 1:
100 bao x 80,000

Lần 2:
100 bao x 85,000
```

Giá phải lưu tại từng dòng giao dịch:

```txt
unitPrice
```

Không được sử dụng giá hiện tại của material để tính lại giao dịch lịch sử.

---


## 27. Mua hàng

Mua hàng có thể bao gồm:

```txt
Purchase Order
Goods Receipt
Supplier Payment
Supplier Debt
```

Trong MVP có thể bỏ Purchase Order nếu quy trình thực tế chỉ cần nhập kho trực tiếp.

---


## 35. Công nợ nhà cung cấp

Phiếu nhập có:

```txt
totalAmount
paidAmount
remainingAmount
```

Công thức:

```txt
remainingAmount = totalAmount - paidAmount
```

Trạng thái:

```txt
UNPAID
PARTIALLY_PAID
PAID
OVERDUE
```

---


## 36. Tổng công nợ nhà cung cấp

```txt
supplierDebt =
sum(remainingAmount của các khoản nhập chưa thanh toán)
```

Không tính chứng từ:

```txt
CANCELLED
REVERSED
```

---


## 49. Trả hàng nhà cung cấp

Có thể trả lại hàng cho nhà cung cấp.

Phiếu trả phải tham chiếu phiếu nhập ban đầu nếu có.

---


## 50. Số lượng trả nhà cung cấp

```txt
returnQuantity <= receivedQuantity - previouslyReturnedQuantity
```

Đồng thời:

```txt
returnQuantity <= currentStock
```

nếu hàng cần xuất khỏi kho.

---


## 51. Ảnh hưởng trả nhà cung cấp

Khi xác nhận:

* giảm tồn kho
* tạo `SUPPLIER_RETURN`
* giảm công nợ nhà cung cấp hoặc phát sinh khoản nhà cung cấp phải hoàn lại

---


## 80. Hủy phiếu nhập

Nếu chưa xác nhận:

```txt
DRAFT -> CANCELLED
```

Nếu đã xác nhận:

không được hủy đơn giản.

Phải tạo nghiệp vụ reversal hoặc trả nhà cung cấp tùy trường hợp.

---
