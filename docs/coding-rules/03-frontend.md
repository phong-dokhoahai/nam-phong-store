# Frontend

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 13. Component

Một component chỉ nên chịu trách nhiệm cho một nhóm chức năng rõ ràng.

Không tạo component hàng trăm dòng chứa:

- API call
- validation
- business logic
- UI
- modal
- table
- calculation

trong cùng một file.

Tách khi component trở nên khó đọc.

Ví dụ:

```text
MaterialPage
├── MaterialFilters
├── MaterialTable
├── MaterialFormModal
└── DeleteMaterialDialog
```

---


## 40. Search

Search user-entered text phải:

- trim
- handle empty string
- không phân biệt hoa thường nếu nghiệp vụ phù hợp

Không gửi request liên tục theo từng keystroke nếu search API.

Sử dụng debounce khi cần.

---


## 41. Pagination

List có khả năng lớn phải hỗ trợ pagination.

Ví dụ:

```text
materials
customers
suppliers
receipts
inventory transactions
payments
debt history
```

Không load toàn bộ database chỉ để hiển thị bảng.

---


## 42. Filter

Filter phải được gửi xuống backend nếu dataset lớn.

Không fetch hàng nghìn records rồi filter phía frontend.

---


## 43. Sorting

Không tin giá trị sort field trực tiếp từ client để tạo dynamic SQL.

Backend vẫn phải validate/whitelist input theo [05-api-backend.md](05-api-backend.md).

Chỉ cho phép whitelist.

Ví dụ:

```ts
const allowedSortFields = [
  "createdAt",
  "name",
  "quantity",
];
```

---


## 44. Forms

Form phải:

- có validation
- disable submit khi đang submit
- chống double-submit
- hiển thị lỗi rõ ràng

Không để user click nhiều lần tạo nhiều phiếu.

Backend cũng phải có protection phù hợp với nghiệp vụ quan trọng.

---


## 45. Loading state

Mọi async UI cần xử lý:

```text
loading
success
empty
error
```

Không chỉ implement happy path.

---


## 46. Empty state

Danh sách rỗng phải có empty state rõ ràng.

Ví dụ:

```text
Chưa có vật liệu nào.
```

thay vì chỉ hiển thị table trống.

---


## 47. Confirmation

Các thao tác ảnh hưởng dữ liệu quan trọng phải có confirm phù hợp.

Ví dụ:

```text
Hủy phiếu
Xóa vật liệu
Điều chỉnh tồn kho
Xóa thanh toán
```

Không confirm cho mọi action nhỏ gây khó chịu người dùng.

---


## 48. Currency UI

Tiền Việt Nam hiển thị thống nhất.

Ví dụ:

```text
1.250.000 ₫
```

Sử dụng một utility chung:

```ts
formatCurrency()
```

Không format tiền riêng ở từng component.

---


## 49. Number formatting

Số lượng vật liệu phải hỗ trợ đúng loại dữ liệu.

Một số vật liệu có thể dùng:

```text
kg
m³
m²
bao
viên
cây
thùng
```

Không mặc định tất cả quantity là integer nếu nghiệp vụ cho phép decimal.

Ví dụ:

```text
1.5 m³ cát
```

---


## 50. Unit

Không lưu unit dưới dạng text tùy ý nếu hệ thống đã có bảng/enum đơn vị.

Sử dụng ID/reference phù hợp.

Không để:

```text
kg
KG
Kg
kilogram
```

tồn tại đồng thời.

---


## 64. API calls ở frontend

API call phải được tập trung tại layer phù hợp.

Không gọi API rải rác trong nhiều component nếu project có:

```text
services
api
queries
hooks
```

Ví dụ:

```text
features/material/api/
features/material/hooks/
```

---


## 65. Server state

Server state không được duplicate vào local/global state nếu không cần.

Ví dụ dữ liệu:

```text
materials
suppliers
inventory
receipts
```

nên sử dụng data-fetching strategy của project.

Không copy toàn bộ response vào state khác chỉ để render.

---


## 66. Global state

Không đưa mọi thứ vào global state.

Global state chỉ dành cho dữ liệu thực sự global.

Ví dụ:

```text
authenticated user
global permissions
app settings
```

Form state hoặc modal state nên giữ local nếu phù hợp.

---
