# Công nợ và thanh toán

[Quay lại BUSINESS_RULES.md](../BUSINESS_RULES.md)

> Công nợ nhà cung cấp liên quan nhập kho nằm trong [04-purchasing.md](04-purchasing.md); file này tập trung vào công nợ khách hàng và payment transaction dùng chung.

## 24. Tiền tệ

MVP sử dụng:

```txt
VND
```

Tiền được lưu dưới dạng số.

Không lưu:

```txt
"1.250.000 VNĐ"
```

Mà lưu:

```txt
1250000
```

Frontend chịu trách nhiệm format.

---


## 29. Công nợ khách hàng

Khách hàng có thể:

* thanh toán đủ
* thanh toán một phần
* ghi nợ

Mỗi giao dịch bán có:

```txt
totalAmount
paidAmount
remainingAmount
```

Công thức:

```txt
remainingAmount = totalAmount - paidAmount
```

Điều kiện:

```txt
remainingAmount >= 0
```

---


## 30. Trạng thái công nợ khách hàng

```txt
UNPAID
PARTIALLY_PAID
PAID
OVERDUE
```

Logic:

```txt
paidAmount = 0
=> UNPAID
```

```txt
0 < paidAmount < totalAmount
=> PARTIALLY_PAID
```

```txt
paidAmount = totalAmount
=> PAID
```

Nếu:

```txt
remainingAmount > 0
AND currentDate > dueDate
```

thì:

```txt
OVERDUE
```

---


## 31. Hạn thanh toán

Giao dịch ghi nợ có thể có:

```txt
dueDate
```

Nếu không có hạn thanh toán cụ thể, có thể để:

```txt
dueDate = null
```

Không tự coi là overdue khi không có dueDate.

---


## 32. Tổng công nợ khách hàng

Tổng nợ hiện tại của khách hàng:

```txt
customerDebt =
sum(remainingAmount của các khoản nợ chưa thanh toán)
```

Không tính các giao dịch:

```txt
CANCELLED
REFUNDED
REVERSED
```

---


## 33. Hạn mức công nợ khách hàng

Khách hàng có thể có:

```txt
creditLimit
```

Ví dụ:

```txt
creditLimit = 50,000,000
```

Trước khi cho phép phát sinh thêm nợ:

```txt
currentDebt + newDebt <= creditLimit
```

Nếu vượt hạn mức:

```txt
reject
```

Ngoại lệ chỉ ADMIN hoặc role được cấp quyền mới được override.

---


## 34. Khách không có hạn mức

Nếu:

```txt
creditLimit = null
```

có thể hiểu là:

* không kiểm soát hạn mức

Không nên dùng:

```txt
creditLimit = 0
```

để biểu diễn không giới hạn.

---


## 37. Thanh toán nhiều lần

Một khoản nợ có thể được thanh toán nhiều lần.

Ví dụ:

```txt
Tổng tiền: 20,000,000

Lần 1: 5,000,000
Lần 2: 8,000,000
Lần 3: 7,000,000
```

Mỗi lần phải là một `PaymentTransaction`.

Không ghi đè lịch sử thanh toán cũ.

---


## 38. Payment Transaction

Mỗi thanh toán phải lưu:

```txt
amount
paymentMethod

customerId hoặc supplierId

referenceType
referenceId

paidAt
createdAt
createdBy

note
```

---


## 39. Phương thức thanh toán

Có thể sử dụng:

```txt
CASH
BANK_TRANSFER
OTHER
```

Có thể mở rộng:

```txt
CARD
E_WALLET
```

sau này.

---


## 40. Số tiền thanh toán

Điều kiện:

```txt
amount > 0
```

Không cho phép:

```txt
paymentAmount > remainingAmount
```

trừ khi hệ thống sau này hỗ trợ:

```txt
customerBalance
supplierBalance
advancePayment
```

Trong MVP:

```txt
paymentAmount <= remainingAmount
```

---


## 41. Không chỉnh trực tiếp paidAmount

Không được:

```txt
invoice.paidAmount += paymentAmount
```

mà không tạo payment transaction.

Luồng đúng:

1. tạo payment transaction
2. cập nhật paidAmount
3. cập nhật remainingAmount
4. cập nhật paymentStatus

---


## 42. Hủy thanh toán

Payment đã xác nhận không được hard delete.

Nếu nhập sai phải tạo:

```txt
PAYMENT_REVERSAL
```

hoặc đánh dấu:

```txt
REVERSED
```

và ghi nhận transaction ngược.

---


## 43. Công nợ không được âm

Luôn đảm bảo:

```txt
remainingAmount >= 0
```

và:

```txt
paidAmount <= totalAmount
```

---
