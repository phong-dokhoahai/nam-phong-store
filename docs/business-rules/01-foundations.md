# Quy tắc nền tảng

[Quay lại BUSINESS_RULES.md](../BUSINESS_RULES.md)

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

Nếu implementation hiện tại mâu thuẫn với tài liệu này, ưu tiên quy tắc trong bộ business rules được liên kết từ `../BUSINESS_RULES.md`, trừ khi có yêu cầu nghiệp vụ mới hơn được xác nhận.

---


## 2. Nguyên tắc chung

### 2.1. Không hard delete dữ liệu nghiệp vụ

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

### 2.2. Không sửa lịch sử đã xác nhận

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

### 2.3. Backend là nơi enforce business rule

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


## 62. Mã chứng từ

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


## 63. Sinh mã

Mã có thể được backend sinh tự động.

Không dựa vào frontend để đảm bảo uniqueness.

---


## 64. Ngày chứng từ

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


## 65. Không cho transactionDate tùy ý nếu không có quyền

Nhân viên bình thường có thể bị giới hạn không được tạo giao dịch quá xa trong quá khứ.

ADMIN có thể được cấp quyền backdate.

Quy tắc cụ thể có thể cấu hình sau.

---


## 66. Snapshot dữ liệu lịch sử

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


## 81. Atomic transaction

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


## 82. Concurrent stock update

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


## 83. Duplicate request

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


## 84. Audit log

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


## 85. Quyền người dùng

Các role MVP:

```txt
ADMIN
WAREHOUSE_STAFF
```

---


## 86. ADMIN

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


## 87. WAREHOUSE_STAFF

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


## 89. Dữ liệu tài chính nhạy cảm

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


## 90. Search và filter

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


## 91. Phân trang

Các danh sách lớn bắt buộc hỗ trợ pagination.

Không tải toàn bộ transaction history về frontend.

---


## 92. Sort

Các danh sách transaction mặc định có thể sort:

```txt
transactionDate DESC
createdAt DESC
```

---


## 93. Timezone

Backend nên lưu timestamp ở UTC.

Frontend hiển thị theo timezone hệ thống.

Ngày nghiệp vụ phải tránh lỗi lệch ngày do timezone.

---


## 94. Precision

Quantity nên dùng decimal.

Ví dụ:

```txt
DECIMAL(18,3)
```

hoặc precision phù hợp.

Tiền VND có thể dùng integer/bigint.

Không dùng floating point cho tiền.

---


## 95. Quy tắc dữ liệu âm

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


## 96. Ghi chú và lý do

Các hành động bất thường phải yêu cầu reason.

Ví dụ:

* điều chỉnh tồn
* reversal payment
* hủy chứng từ
* override credit limit
* chỉnh giá đặc biệt

---


## 97. Nguyên tắc source of truth

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


## 98. Reconciliation

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


## 99. Công nợ reconciliation

Tương tự:

```txt
invoice.paidAmount
```

phải có thể đối chiếu với:

```txt
SUM(valid payment transactions)
```

---


## 100. Business rule khi implement feature mới

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


## 101. Quy tắc bắt buộc

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


## 103. Ưu tiên khi có xung đột

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
