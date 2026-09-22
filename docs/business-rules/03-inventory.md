# Tồn kho

[Quay lại BUSINESS_RULES.md](../BUSINESS_RULES.md)

## 8. Số lượng

Mọi số lượng giao dịch phải thỏa mãn:

```txt
quantity > 0
```

Không chấp nhận:

```txt
0
negative
null
```

Hệ thống phải hỗ trợ số lượng decimal.

Ví dụ:

```txt
1.5 m3
2.75 tấn
12.5 kg
```

---


## 9. Tồn kho

Tồn kho được tính theo nguyên tắc:

```txt
Tồn kho
= nhập kho
- xuất kho
+ khách trả hàng
- trả nhà cung cấp
+ điều chỉnh tăng
- điều chỉnh giảm
```

---


## 10. Không cho phép tồn kho âm

Điều kiện:

```txt
currentStock >= 0
```

Trước khi xác nhận xuất:

```txt
requestedQuantity <= availableStock
```

Ví dụ:

```txt
Tồn: 100

Xuất 80 -> OK
Xuất 100 -> OK
Xuất 101 -> REJECT
```

---


## 11. Current stock và transaction

`currentStock` có thể được lưu trực tiếp trên vật liệu để query nhanh.

Tuy nhiên mọi thay đổi phải đi qua `InventoryTransaction`.

Không được:

```txt
material.currentStock = newValue
```

mà không có transaction tương ứng.

---


## 12. Inventory Transaction

Mỗi thay đổi tồn kho phải tạo một transaction.

Các loại:

```txt
IMPORT
EXPORT

CUSTOMER_RETURN
SUPPLIER_RETURN

ADJUSTMENT_IN
ADJUSTMENT_OUT

INVENTORY_GAIN
INVENTORY_LOSS
```

Transaction tối thiểu phải lưu:

```txt
materialId
type
quantity
quantityBefore
quantityAfter

referenceType
referenceId

reason

createdAt
createdBy
```

Ví dụ:

```txt
quantityBefore = 100
quantity = -20
quantityAfter = 80
```

---


## 13. Transaction phải truy được nguồn

Mọi inventory transaction phải truy được về nghiệp vụ nguồn.

Ví dụ:

```txt
IMPORT
-> PURCHASE_RECEIPT

EXPORT
-> SALES_ORDER

CUSTOMER_RETURN
-> SALES_RETURN
```

Sử dụng:

```txt
referenceType
referenceId
```

---


## 17. Xuất kho

Phiếu xuất kho đại diện cho hàng rời khỏi kho.

Thông tin:

```txt
issueCode
customerId
issueDate
items
note
status
createdBy
```

---


## 18. Trạng thái phiếu xuất

```txt
DRAFT
CONFIRMED
CANCELLED
```

### DRAFT

Không ảnh hưởng tồn kho.

### CONFIRMED

* giảm tồn kho
* không chỉnh trực tiếp
* kiểm tra tồn kho trước khi xác nhận

### CANCELLED

Không ảnh hưởng tồn kho.

---


## 19. Xác nhận xuất kho

Khi xác nhận:

```txt
requestedQuantity <= currentStock
```

Nếu bất kỳ item nào không đủ tồn:

```txt
reject entire confirmation
```

Không xác nhận một phần trừ khi nghiệp vụ sau này định nghĩa rõ partial fulfillment.

---


## 52. Điều chỉnh tồn kho

Điều chỉnh sử dụng khi:

* mất hàng
* hỏng hàng
* sai dữ liệu
* thừa hàng
* thiếu hàng
* kiểm kê chênh lệch

Không dùng điều chỉnh để thay thế nghiệp vụ nhập/xuất bình thường.

---


## 53. Loại điều chỉnh

```txt
ADJUSTMENT_IN
ADJUSTMENT_OUT
```

Mỗi điều chỉnh phải có:

```txt
materialId
quantity
reason
createdBy
approvedBy nếu cần
```

---


## 54. Lý do điều chỉnh

Lý do là bắt buộc.

Ví dụ:

```txt
Hàng hỏng
Sai số liệu
Mất hàng
Kiểm kê thừa
Kiểm kê thiếu
```

---


## 55. Kiểm kê kho

Kiểm kê dùng để so sánh:

```txt
systemQuantity
```

với:

```txt
actualQuantity
```

Công thức:

```txt
difference = actualQuantity - systemQuantity
```

---


## 56. Chênh lệch kiểm kê

Nếu:

```txt
difference > 0
```

tạo:

```txt
INVENTORY_GAIN
```

Nếu:

```txt
difference < 0
```

tạo:

```txt
INVENTORY_LOSS
```

---


## 57. Phiếu kiểm kê

Phiếu kiểm kê có thể có:

```txt
DRAFT
CONFIRMED
CANCELLED
```

Chỉ khi `CONFIRMED` mới cập nhật tồn kho.

---


## 58. Không sửa kết quả kiểm kê đã xác nhận

Nếu kiểm kê sai:

* không sửa trực tiếp
* tạo lần kiểm kê mới
* hoặc adjustment mới

---


## 59. Tồn kho tối thiểu

Material có thể có:

```txt
minimumStock
```

Nếu:

```txt
currentStock <= minimumStock
```

hiển thị cảnh báo:

```txt
LOW_STOCK
```

---


## 60. Hết hàng

Nếu:

```txt
currentStock = 0
```

trạng thái tồn kho có thể hiển thị:

```txt
OUT_OF_STOCK
```

Không nhất thiết thay đổi trạng thái `ACTIVE` của material.

---


## 61. Maximum stock

Có thể hỗ trợ:

```txt
maximumStock
```

Nếu nhập vượt mức:

* cảnh báo
* không bắt buộc block trong MVP

---
