# Báo cáo và giá vốn

[Quay lại BUSINESS_RULES.md](../BUSINESS_RULES.md)

## 67. Báo cáo tồn kho

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


## 68. Công thức closing stock

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


## 69. Báo cáo nhập kho

Có thể lọc theo:

* thời gian
* nhà cung cấp
* vật liệu
* người tạo
* trạng thái

---


## 70. Báo cáo xuất kho / bán hàng

Có thể lọc theo:

* thời gian
* khách hàng
* vật liệu
* người bán
* trạng thái

---


## 71. Báo cáo công nợ khách hàng

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


## 72. Báo cáo công nợ nhà cung cấp

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


## 73. Báo cáo không lấy từ dữ liệu đã bị thay đổi

Báo cáo lịch sử phải dựa vào:

* transaction
* snapshot
* chứng từ tại thời điểm phát sinh

Không tính lại lịch sử bằng giá hiện tại.

---


## 74. Lợi nhuận

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


## 75. Weighted Average Cost

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


## 76. Không chỉnh giá vốn lịch sử tùy ý

Thay đổi giá nhập mặc định không được tác động vào:

```txt
COGS
grossProfit
historical reports
```

---
