# Bán hàng và trả hàng khách

[Quay lại BUSINESS_RULES.md](../BUSINESS_RULES.md)

## 21. Giá bán

Mỗi vật liệu có thể có:

```txt
defaultSellingPrice
```

Giá này chỉ là giá gợi ý.

Khi tạo giao dịch bán hàng, giá thực tế phải snapshot vào:

```txt
unitPrice
```

Thay đổi `defaultSellingPrice` không được ảnh hưởng giao dịch cũ.

---


## 22. Giá trị dòng

Công thức:

```txt
lineSubtotal = quantity * unitPrice
```

Nếu giảm giá dòng:

```txt
lineTotal = lineSubtotal - lineDiscount
```

Điều kiện:

```txt
lineDiscount >= 0
lineTotal >= 0
```

---


## 23. Tổng chứng từ

```txt
subtotal = sum(lineSubtotal)
discountAmount = documentDiscount
totalAmount = subtotal - discountAmount
```

Điều kiện:

```txt
subtotal >= 0
discountAmount >= 0
totalAmount >= 0
```

---


## 28. Bán hàng

Bán hàng có thể bao gồm:

```txt
Sales Order
Warehouse Export
Customer Payment
Customer Debt
```

Tùy thiết kế MVP, Sales Order và Warehouse Export có thể là cùng một chứng từ.

Xem thêm quy tắc xuất kho và xác nhận xuất kho trong [03-inventory.md](03-inventory.md).

---


## 44. Trả hàng của khách

Khách có thể trả lại hàng đã mua.

Phiếu trả hàng phải tham chiếu giao dịch gốc nếu có.

Thông tin:

```txt
customerId
originalSaleId
items
reason
returnDate
```

---


## 45. Số lượng khách trả

Điều kiện:

```txt
returnedQuantity <= soldQuantity - previouslyReturnedQuantity
```

Không cho phép trả nhiều hơn số đã mua.

---


## 46. Hàng khách trả nhập lại kho

Nếu hàng được chấp nhận nhập lại:

* tăng tồn kho
* tạo transaction:

```txt
CUSTOMER_RETURN
```

Nếu hàng hỏng và không nhập lại kho:

* không tăng tồn
* vẫn lưu lịch sử trả hàng

---


## 47. Giá trị trả hàng

Giá trị hàng trả nên dựa trên giá bán tại giao dịch gốc.

Không sử dụng giá bán hiện tại.

---


## 48. Ảnh hưởng công nợ khi khách trả hàng

Nếu khách còn nợ:

```txt
remainingDebt giảm
```

Nếu khách đã thanh toán đủ:

có thể phát sinh:

```txt
refundAmount
```

hoặc:

```txt
customerCredit
```

Trong MVP nên ưu tiên `refund`.

---


## 77. Discount

Có thể hỗ trợ discount:

```txt
lineDiscount
documentDiscount
```

Không cho:

```txt
discount < 0
```

hoặc:

```txt
discount > applicableAmount
```

---


## 78. Doanh thu

Doanh thu của giao dịch bán:

```txt
revenue = totalAmount sau discount
```

Không sử dụng giá niêm yết trước discount làm doanh thu thực tế.

---


## 79. Hủy đơn bán

Nếu đơn đang:

```txt
DRAFT
```

có thể cancel trực tiếp.

Nếu đã làm giảm tồn kho:

không được chỉ đổi status.

Phải reverse inventory transaction tương ứng.

---
