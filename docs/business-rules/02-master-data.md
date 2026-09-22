# Dữ liệu danh mục

[Quay lại BUSINESS_RULES.md](../BUSINESS_RULES.md)

## 3. Vật liệu

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


## 4. Mã vật liệu

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


## 5. Trạng thái vật liệu

Các trạng thái:

```txt
ACTIVE
INACTIVE
```

#### ACTIVE

Có thể được sử dụng trong giao dịch mới.

#### INACTIVE

Không được chọn cho giao dịch mới.

Lịch sử giao dịch cũ vẫn phải được giữ nguyên.

---


## 6. Nhóm vật liệu

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


## 7. Đơn vị tính

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


## 25. Khách hàng

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


## 26. Nhà cung cấp

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
