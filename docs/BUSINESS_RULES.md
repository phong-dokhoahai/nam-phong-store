# BUSINESS_RULES.md

## 1. Mục đích

Tài liệu này định nghĩa các quy tắc nghiệp vụ cốt lõi của hệ thống quản lý kho vật liệu xây dựng.

Tài liệu được dùng làm nguồn tham chiếu cho:

* phân tích nghiệp vụ
* thiết kế database
* thiết kế API
* validation backend
* validation frontend
* implementation
* kiểm thử
* báo cáo
* AI coding assistant

Nếu implementation hiện tại mâu thuẫn với tài liệu này, ưu tiên quy tắc trong `BUSINESS_RULES.md`, trừ khi có yêu cầu nghiệp vụ mới hơn được xác nhận.

---

# 2. Nguyên tắc chung

## 2.1. Không hard delete dữ liệu nghiệp vụ

Các dữ liệu đã phát sinh giao dịch không được hard delete.

Bao gồm:

* vật liệu
* nhóm vật liệu
* đơn vị tính
* khách hàng
* nhà cung cấp
* phiếu nhập
* phiếu xuất
* đơn bán hàng
* thanh toán
* công nợ
* inventory transaction
* kiểm kê
* điều chỉnh tồn kho

Có thể sử dụng:

```txt
status = INACTIVE
```

hoặc:

```txt
deletedAt
```

tùy entity.

---

## 2.2. Không sửa lịch sử đã xác nhận

Các chứng từ ở trạng thái:

```txt
CONFIRMED
COMPLETED
```

không được chỉnh sửa trực tiếp dữ liệu ảnh hưởng tới:

* tồn kho
* doanh thu
* chi phí
* công nợ
* thanh toán

Nếu phát hiện sai phải tạo nghiệp vụ mới để:

```txt
REVERSAL
ADJUSTMENT
RETURN
```

---

## 2.3. Backend là nơi enforce business rule

Frontend validation chỉ nhằm cải thiện trải nghiệm người dùng.

Các rule quan trọng bắt buộc phải được kiểm tra ở backend.

Ví dụ:

* quyền truy cập
* tồn kho không âm
* trạng thái chứng từ
* số lượng
* số tiền
* công nợ
* hạn mức nợ
* uniqueness
* xác nhận nhập/xuất kho

---

# 3. Vật liệu

Một vật liệu đại diện cho một loại hàng hóa được quản lý trong kho.

Ví dụ:

```txt
Xi măng PCB40
Cát vàng
Đá 1x2
Thép D10
Gạch đỏ
```

Mỗi vật liệu nên có:

```txt
code
name
categoryId
unitId
defaultPurchasePrice
defaultSellingPrice
currentStock
minimumStock
maximumStock
status
description
```

---

# 4. Mã vật liệu

Mã vật liệu phải duy nhất.

Ví dụ:

```txt
XM-PCB40
CAT-VANG
DA-1X2
THEP-D10
```

Quy tắc:

* không được trùng mã
* không phân biệt khoảng trắng đầu/cuối
* nên normalize trước khi lưu
* vật liệu đã phát sinh giao dịch không được đổi mã
* không được tái sử dụng mã của vật liệu đã ngừng hoạt động

---

# 5. Trạng thái vật liệu

Các trạng thái:

```txt
ACTIVE
INACTIVE
```

### ACTIVE

Có thể được sử dụng trong giao dịch mới.

### INACTIVE

Không được chọn cho giao dịch mới.

Lịch sử giao dịch cũ vẫn phải được giữ nguyên.

---

# 6. Nhóm vật liệu

Vật liệu có thể được phân loại theo nhóm.

Ví dụ:

```txt
Xi măng
Sắt thép
Cát đá
Gạch
Sơn
Thiết bị
```

Nhóm đã được sử dụng không được hard delete.

Có thể chuyển sang:

```txt
INACTIVE
```

---

# 7. Đơn vị tính

Mỗi vật liệu phải có một đơn vị tính chính.

Ví dụ:

```txt
bao
kg
tấn
m3
viên
cây
thùng
cuộn
```

Trong MVP:

* mỗi vật liệu có một đơn vị tính
* chưa hỗ trợ conversion giữa nhiều đơn vị

Ví dụ:

```txt
Xi măng -> bao
Cát -> m3
Thép -> cây
```

---

# 8. Số lượng

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

# 9. Tồn kho

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

# 10. Không cho phép tồn kho âm

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

# 11. Current stock và transaction

`currentStock` có thể được lưu trực tiếp trên vật liệu để query nhanh.

Tuy nhiên mọi thay đổi phải đi qua `InventoryTransaction`.

Không được:

```txt
material.currentStock = newValue
```

mà không có transaction tương ứng.

---

# 12. Inventory Transaction

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

# 13. Transaction phải truy được nguồn

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

# 14. Nhập kho

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

# 15. Trạng thái phiếu nhập

```txt
DRAFT
CONFIRMED
CANCELLED
```

## DRAFT

* có thể chỉnh sửa
* có thể xóa
* chưa thay đổi tồn kho
* chưa ghi nhận công nợ

## CONFIRMED

* tăng tồn kho
* có thể phát sinh công nợ nhà cung cấp
* không được chỉnh trực tiếp
* không được hard delete

## CANCELLED

* không ảnh hưởng tồn kho
* không được chỉnh sửa

---

# 16. Xác nhận phiếu nhập

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

# 17. Xuất kho

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

# 18. Trạng thái phiếu xuất

```txt
DRAFT
CONFIRMED
CANCELLED
```

## DRAFT

Không ảnh hưởng tồn kho.

## CONFIRMED

* giảm tồn kho
* không chỉnh trực tiếp
* kiểm tra tồn kho trước khi xác nhận

## CANCELLED

Không ảnh hưởng tồn kho.

---

# 19. Xác nhận xuất kho

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

# 20. Giá nhập

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

# 21. Giá bán

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

# 22. Giá trị dòng

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

# 23. Tổng chứng từ

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

# 24. Tiền tệ

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

# 25. Khách hàng

Khách hàng gồm:

```txt
code
name
phone
address
email
creditLimit
status
note
```

Trạng thái:

```txt
ACTIVE
INACTIVE
```

Khách đã phát sinh giao dịch không được hard delete.

---

# 26. Nhà cung cấp

Nhà cung cấp gồm:

```txt
code
name
phone
address
email
status
note
```

Trạng thái:

```txt
ACTIVE
INACTIVE
```

Nhà cung cấp đã phát sinh giao dịch không được hard delete.

---

# 27. Mua hàng

Mua hàng có thể bao gồm:

```txt
Purchase Order
Goods Receipt
Supplier Payment
Supplier Debt
```

Trong MVP có thể bỏ Purchase Order nếu quy trình thực tế chỉ cần nhập kho trực tiếp.

---

# 28. Bán hàng

Bán hàng có thể bao gồm:

```txt
Sales Order
Warehouse Export
Customer Payment
Customer Debt
```

Tùy thiết kế MVP, Sales Order và Warehouse Export có thể là cùng một chứng từ.

---

# 29. Công nợ khách hàng

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

# 30. Trạng thái công nợ khách hàng

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

# 31. Hạn thanh toán

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

# 32. Tổng công nợ khách hàng

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

# 33. Hạn mức công nợ khách hàng

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

# 34. Khách không có hạn mức

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

# 35. Công nợ nhà cung cấp

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

# 36. Tổng công nợ nhà cung cấp

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

# 37. Thanh toán nhiều lần

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

# 38. Payment Transaction

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

# 39. Phương thức thanh toán

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

# 40. Số tiền thanh toán

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

# 41. Không chỉnh trực tiếp paidAmount

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

# 42. Hủy thanh toán

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

# 43. Công nợ không được âm

Luôn đảm bảo:

```txt
remainingAmount >= 0
```

và:

```txt
paidAmount <= totalAmount
```

---

# 44. Trả hàng của khách

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

# 45. Số lượng khách trả

Điều kiện:

```txt
returnedQuantity <= soldQuantity - previouslyReturnedQuantity
```

Không cho phép trả nhiều hơn số đã mua.

---

# 46. Hàng khách trả nhập lại kho

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

# 47. Giá trị trả hàng

Giá trị hàng trả nên dựa trên giá bán tại giao dịch gốc.

Không sử dụng giá bán hiện tại.

---

# 48. Ảnh hưởng công nợ khi khách trả hàng

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

# 49. Trả hàng nhà cung cấp

Có thể trả lại hàng cho nhà cung cấp.

Phiếu trả phải tham chiếu phiếu nhập ban đầu nếu có.

---

# 50. Số lượng trả nhà cung cấp

```txt
returnQuantity <= receivedQuantity - previouslyReturnedQuantity
```

Đồng thời:

```txt
returnQuantity <= currentStock
```

nếu hàng cần xuất khỏi kho.

---

# 51. Ảnh hưởng trả nhà cung cấp

Khi xác nhận:

* giảm tồn kho
* tạo `SUPPLIER_RETURN`
* giảm công nợ nhà cung cấp hoặc phát sinh khoản nhà cung cấp phải hoàn lại

---

# 52. Điều chỉnh tồn kho

Điều chỉnh sử dụng khi:

* mất hàng
* hỏng hàng
* sai dữ liệu
* thừa hàng
* thiếu hàng
* kiểm kê chênh lệch

Không dùng điều chỉnh để thay thế nghiệp vụ nhập/xuất bình thường.

---

# 53. Loại điều chỉnh

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

# 54. Lý do điều chỉnh

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

# 55. Kiểm kê kho

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

# 56. Chênh lệch kiểm kê

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

# 57. Phiếu kiểm kê

Phiếu kiểm kê có thể có:

```txt
DRAFT
CONFIRMED
CANCELLED
```

Chỉ khi `CONFIRMED` mới cập nhật tồn kho.

---

# 58. Không sửa kết quả kiểm kê đã xác nhận

Nếu kiểm kê sai:

* không sửa trực tiếp
* tạo lần kiểm kê mới
* hoặc adjustment mới

---

# 59. Tồn kho tối thiểu

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

# 60. Hết hàng

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

# 61. Maximum stock

Có thể hỗ trợ:

```txt
maximumStock
```

Nếu nhập vượt mức:

* cảnh báo
* không bắt buộc block trong MVP

---

# 62. Mã chứng từ

Các chứng từ nên có mã duy nhất.

Ví dụ:

```txt
PN-202609-0001
PX-202609-0001
BH-202609-0001
TT-202609-0001
KK-202609-0001
```

Không được có hai chứng từ cùng loại trùng mã.

---

# 63. Sinh mã

Mã có thể được backend sinh tự động.

Không dựa vào frontend để đảm bảo uniqueness.

---

# 64. Ngày chứng từ

Phân biệt:

```txt
createdAt
transactionDate
confirmedAt
```

`createdAt` là thời gian record được tạo.

`transactionDate` là ngày nghiệp vụ.

`confirmedAt` là thời gian xác nhận.

---

# 65. Không cho transactionDate tùy ý nếu không có quyền

Nhân viên bình thường có thể bị giới hạn không được tạo giao dịch quá xa trong quá khứ.

ADMIN có thể được cấp quyền backdate.

Quy tắc cụ thể có thể cấu hình sau.

---

# 66. Snapshot dữ liệu lịch sử

Chứng từ quan trọng nên lưu snapshot cần thiết tại thời điểm phát sinh.

Ví dụ:

```txt
materialName
unitName
customerName
supplierName
unitPrice
```

nhằm tránh dữ liệu lịch sử thay đổi khi master data thay đổi.

---

# 67. Báo cáo tồn kho

Báo cáo tồn kho gồm tối thiểu:

```txt
material
openingStock
totalImport
totalExport
adjustment
closingStock
```

---

# 68. Công thức closing stock

```txt
closingStock =
openingStock
+ import
+ customerReturn
+ adjustmentIn
- export
- supplierReturn
- adjustmentOut
```

---

# 69. Báo cáo nhập kho

Có thể lọc theo:

* thời gian
* nhà cung cấp
* vật liệu
* người tạo
* trạng thái

---

# 70. Báo cáo xuất kho / bán hàng

Có thể lọc theo:

* thời gian
* khách hàng
* vật liệu
* người bán
* trạng thái

---

# 71. Báo cáo công nợ khách hàng

Tối thiểu hiển thị:

```txt
customer
openingDebt
debtIncrease
payment
returnAdjustment
closingDebt
overdueDebt
```

---

# 72. Báo cáo công nợ nhà cung cấp

Tối thiểu hiển thị:

```txt
supplier
openingDebt
purchaseDebt
payment
returnAdjustment
closingDebt
overdueDebt
```

---

# 73. Báo cáo không lấy từ dữ liệu đã bị thay đổi

Báo cáo lịch sử phải dựa vào:

* transaction
* snapshot
* chứng từ tại thời điểm phát sinh

Không tính lại lịch sử bằng giá hiện tại.

---

# 74. Lợi nhuận

Nếu hệ thống hỗ trợ báo cáo lợi nhuận:

```txt
grossProfit = revenue - costOfGoodsSold
```

Không được đơn giản dùng:

```txt
currentPurchasePrice
```

để tính cost của giao dịch lịch sử.

Phương pháp tính giá vốn cần được định nghĩa riêng.

MVP có thể chọn:

```txt
Weighted Average Cost
```

nếu cần.

---

# 75. Weighted Average Cost

Nếu dùng bình quân gia quyền:

Sau mỗi lần nhập:

```txt
newAverageCost =
(oldStock * oldAverageCost + importQuantity * importPrice)
/
(oldStock + importQuantity)
```

Xuất kho không thay đổi average cost.

---

# 76. Không chỉnh giá vốn lịch sử tùy ý

Thay đổi giá nhập mặc định không được tác động vào:

```txt
COGS
grossProfit
historical reports
```

---

# 77. Discount

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

# 78. Doanh thu

Doanh thu của giao dịch bán:

```txt
revenue = totalAmount sau discount
```

Không sử dụng giá niêm yết trước discount làm doanh thu thực tế.

---

# 79. Hủy đơn bán

Nếu đơn đang:

```txt
DRAFT
```

có thể cancel trực tiếp.

Nếu đã làm giảm tồn kho:

không được chỉ đổi status.

Phải reverse inventory transaction tương ứng.

---

# 80. Hủy phiếu nhập

Nếu chưa xác nhận:

```txt
DRAFT -> CANCELLED
```

Nếu đã xác nhận:

không được hủy đơn giản.

Phải tạo nghiệp vụ reversal hoặc trả nhà cung cấp tùy trường hợp.

---

# 81. Atomic transaction

Các nghiệp vụ ảnh hưởng nhiều entity phải chạy trong database transaction.

Ví dụ xác nhận bán hàng:

1. kiểm tra stock
2. update stock
3. tạo inventory transaction
4. update sale
5. ghi nhận debt
6. ghi nhận payment

Nếu một bước lỗi:

```txt
rollback toàn bộ
```

---

# 82. Concurrent stock update

Backend phải xử lý trường hợp nhiều người xuất cùng một vật liệu đồng thời.

Không được chỉ:

1. GET stock
2. frontend kiểm tra
3. gửi confirm

Backend phải kiểm tra lại trong transaction.

Có thể dùng:

* database locking
* atomic update
* optimistic concurrency

---

# 83. Duplicate request

Các API confirm quan trọng nên tránh xử lý trùng request.

Ví dụ:

```txt
confirm receipt
confirm sale
record payment
```

Nếu client gửi request hai lần không được tạo hai transaction giống nhau.

Có thể sử dụng:

```txt
idempotencyKey
```

hoặc kiểm tra status trước khi xử lý.

---

# 84. Audit log

Các hành động quan trọng phải được audit.

Ví dụ:

```txt
CREATE
UPDATE
CONFIRM
CANCEL
PAY
REFUND
ADJUST_STOCK
CHANGE_PRICE
CHANGE_PERMISSION
```

Audit cần biết:

```txt
actor
action
entityType
entityId
timestamp
before
after
reason
```

---

# 85. Quyền người dùng

Các role MVP:

```txt
ADMIN
WAREHOUSE_STAFF
```

---

# 86. ADMIN

Có quyền:

* quản lý user
* quản lý material
* quản lý supplier
* quản lý customer
* nhập kho
* xuất kho
* bán hàng
* thanh toán
* công nợ
* kiểm kê
* điều chỉnh tồn
* xem báo cáo
* cấu hình hệ thống

---

# 87. WAREHOUSE_STAFF

Có thể:

* xem vật liệu
* xem tồn
* tạo phiếu nhập
* xác nhận nhập nếu được cấp quyền
* tạo phiếu xuất
* xác nhận xuất nếu được cấp quyền
* kiểm kê

Không mặc định được:

* thay đổi giá bán
* quản lý công nợ
* xem lợi nhuận
* quản lý user

---

# 89. Dữ liệu tài chính nhạy cảm

Các dữ liệu sau có thể giới hạn role:

```txt
purchasePrice
averageCost
grossProfit
supplierDebt
customerDebt
```

Không mặc định hiển thị cho mọi user.

---

# 90. Search và filter

Danh sách nghiệp vụ nên hỗ trợ filter theo:

```txt
status
dateRange
material
customer
supplier
code
```

Search không thay đổi business rule.

---

# 91. Phân trang

Các danh sách lớn bắt buộc hỗ trợ pagination.

Không tải toàn bộ transaction history về frontend.

---

# 92. Sort

Các danh sách transaction mặc định có thể sort:

```txt
transactionDate DESC
createdAt DESC
```

---

# 93. Timezone

Backend nên lưu timestamp ở UTC.

Frontend hiển thị theo timezone hệ thống.

Ngày nghiệp vụ phải tránh lỗi lệch ngày do timezone.

---

# 94. Precision

Quantity nên dùng decimal.

Ví dụ:

```txt
DECIMAL(18,3)
```

hoặc precision phù hợp.

Tiền VND có thể dùng integer/bigint.

Không dùng floating point cho tiền.

---

# 95. Quy tắc dữ liệu âm

Không cho giá trị âm đối với:

```txt
quantity
unitPrice
discount
payment
stock
debt
```

Hướng transaction tăng/giảm nên thể hiện qua:

```txt
type
```

hoặc signed quantity nội bộ đã được quy định rõ.

---

# 96. Ghi chú và lý do

Các hành động bất thường phải yêu cầu reason.

Ví dụ:

* điều chỉnh tồn
* reversal payment
* hủy chứng từ
* override credit limit
* chỉnh giá đặc biệt

---

# 97. Nguyên tắc source of truth

Đối với tồn kho:

```txt
InventoryTransaction
```

là nguồn truy vết.

`currentStock` là giá trị tổng hợp tối ưu cho truy vấn.

Đối với thanh toán:

```txt
PaymentTransaction
```

là nguồn lịch sử.

`paidAmount` là giá trị tổng hợp.

---

# 98. Reconciliation

Hệ thống nên có khả năng kiểm tra:

```txt
material.currentStock
```

so với:

```txt
SUM(inventoryTransactions)
```

Nếu lệch:

* cảnh báo
* không tự sửa âm thầm

---

# 99. Công nợ reconciliation

Tương tự:

```txt
invoice.paidAmount
```

phải có thể đối chiếu với:

```txt
SUM(valid payment transactions)
```

---

# 100. Business rule khi implement feature mới

Khi thêm nghiệp vụ mới phải kiểm tra:

1. Có làm thay đổi tồn kho không?
2. Có cần InventoryTransaction không?
3. Có phát sinh doanh thu/chi phí không?
4. Có ảnh hưởng công nợ không?
5. Có PaymentTransaction không?
6. Có cần snapshot dữ liệu không?
7. Có được sửa sau confirm không?
8. Nếu sai thì reversal thế nào?
9. Có cần audit không?
10. Role nào được phép thực hiện?

---

# 101. Quy tắc bắt buộc

Các nguyên tắc sau không được vi phạm trừ khi business requirement thay đổi:

1. Không cho tồn kho âm.
2. Mọi thay đổi tồn kho phải có transaction.
3. Không chỉnh trực tiếp lịch sử đã confirmed.
4. Không hard delete transaction nghiệp vụ.
5. Payment phải có lịch sử.
6. Công nợ phải truy vết được.
7. Không cho công nợ âm.
8. Không cho thanh toán vượt khoản phải trả trong MVP.
9. Giao dịch cũ không thay đổi khi master data thay đổi.
10. Giá cũ không thay đổi khi default price thay đổi.
11. Các operation quan trọng phải atomic.
12. Backend phải enforce business rule.
13. Các hành động nhạy cảm phải có audit.
14. Tồn kho và công nợ phải có khả năng reconciliation.
15. Mọi chứng từ phải có thể truy ngược về nghiệp vụ nguồn.

---

# 102. Phạm vi MVP

MVP nên hỗ trợ đầy đủ:

* quản lý vật liệu
* nhóm vật liệu
* đơn vị tính
* tồn kho
* nhập kho
* xuất kho
* khách hàng
* nhà cung cấp
* bán hàng
* giá bán
* giá nhập
* công nợ khách hàng
* công nợ nhà cung cấp
* thanh toán nhiều lần
* kiểm kê
* điều chỉnh tồn kho
* trả hàng khách hàng
* trả hàng nhà cung cấp
* cảnh báo tồn kho thấp
* báo cáo tồn kho
* báo cáo nhập xuất
* báo cáo công nợ
* audit cơ bản
* phân quyền cơ bản

Các nghiệp vụ nâng cao có thể triển khai sau:

* nhiều kho
* chuyển kho
* nhiều đơn vị tính
* quy đổi đơn vị
* lot/batch
* serial number
* barcode
* purchase order
* quotation
* delivery
* reservation stock
* customer advance
* supplier advance
* nhiều chi nhánh
* nhiều bảng giá
* approval workflow
* FIFO/LIFO nâng cao
* kế toán đầy đủ

---

# 103. Ưu tiên khi có xung đột

Khi có xung đột giữa các mục tiêu kỹ thuật, ưu tiên theo thứ tự:

```txt
1. Tính đúng nghiệp vụ
2. Tính toàn vẹn dữ liệu
3. Khả năng truy vết
4. Bảo mật và phân quyền
5. Hiệu năng
6. Sự tiện lợi khi implementation
```

Không được hy sinh tính đúng dữ liệu chỉ để đơn giản hóa code.
