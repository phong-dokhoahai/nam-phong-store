# CODING_RULES.md

> Tài liệu này định nghĩa các quy tắc bắt buộc khi viết, sửa hoặc refactor code trong dự án.
>
> AI coding agent phải đọc file này trước khi thay đổi source code.

---

# 1. Mục tiêu

Code trong dự án phải ưu tiên:

1. Dễ đọc.
2. Dễ bảo trì.
3. Type-safe.
4. Ít duplicate.
5. Business logic rõ ràng.
6. Không over-engineering.
7. Không tự ý thay đổi nghiệp vụ.
8. Không phá vỡ API contract hiện tại.
9. Dễ mở rộng khi hệ thống kho phát triển.

Ưu tiên **code đơn giản và rõ ràng** hơn abstraction phức tạp.

---

# 2. Nguyên tắc chung

Luôn tuân thủ:

- Không viết code không cần thiết.
- Không tạo abstraction khi chỉ sử dụng một lần và chưa có nhu cầu thực tế.
- Không duplicate business logic.
- Không hard-code dữ liệu nghiệp vụ.
- Không sử dụng magic number hoặc magic string.
- Không tự ý thêm dependency nếu chưa thực sự cần.
- Không thay đổi cấu trúc project lớn nếu task không yêu cầu.
- Không refactor code ngoài phạm vi task nếu không cần thiết.
- Không sửa behavior hiện tại nếu task không yêu cầu.

Khi sửa code:

> Ưu tiên thay đổi nhỏ nhất có thể nhưng vẫn đảm bảo thiết kế đúng.

---

# 3. Thứ tự ưu tiên tài liệu

Khi code, AI phải ưu tiên thông tin theo thứ tự:

1. `PROJECT.md`
2. `BUSINESS_RULES.md`
3. `DATABASE.md`
4. `CODING_RULES.md`
5. Code hiện tại
6. Yêu cầu trong task hiện tại

Nếu phát hiện mâu thuẫn giữa code và business rule:

**Không tự ý quyết định.**

Phải ưu tiên `BUSINESS_RULES.md` và ghi chú rõ phần code hiện tại đang không đúng nghiệp vụ.

---

# 4. Tech stack

Tuân thủ tech stack được định nghĩa trong `PROJECT.md`.

Không tự ý thay:

- framework
- database
- ORM
- state management
- validation library
- UI library
- authentication strategy

chỉ vì có giải pháp khác "tốt hơn".

Nếu cần dependency mới, phải có lý do rõ ràng.

---

# 5. TypeScript

Dự án sử dụng TypeScript.

Không sử dụng:

```ts
any
```

trừ trường hợp bất khả kháng khi tương tác với thư viện bên ngoài.

Ưu tiên:

```ts
unknown
```

sau đó validate/type guard.

Ví dụ:

```ts
function parseValue(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Invalid value");
  }

  return value;
}
```

Không sử dụng:

```ts
as any
```

để bỏ qua lỗi TypeScript.

Không ép kiểu chỉ để compiler hết báo lỗi.

---

# 6. Naming convention

## Variable / function

Sử dụng:

```ts
camelCase
```

Ví dụ:

```ts
materialName
warehouseId
calculateInventory
createImportReceipt
```

Tên phải thể hiện đúng ý nghĩa.

Không dùng:

```ts
data
item
temp
value
result
obj
```

nếu có thể đặt tên rõ hơn.

Ví dụ không tốt:

```ts
const data = await getData();
```

Nên:

```ts
const inventoryItems = await getInventoryItems();
```

---

# 7. Boolean naming

Boolean phải bắt đầu bằng:

```text
is
has
can
should
```

Ví dụ:

```ts
isActive
isDeleted
hasDebt
canEditReceipt
shouldUpdateStock
```

Không dùng:

```ts
active
deleted
permission
```

nếu giá trị là boolean.

---

# 8. Function naming

Function phải bắt đầu bằng động từ.

Ví dụ:

```ts
getMaterial()
createMaterial()
updateMaterial()
deleteMaterial()

calculateInventory()
validateStockQuantity()
generateReceiptCode()
```

Không dùng:

```ts
material()
stock()
receipt()
```

---

# 9. Event handler

Frontend event handler sử dụng prefix:

```text
handle
```

Ví dụ:

```ts
handleSubmit
handleDelete
handleChangeQuantity
handleSelectSupplier
```

Prop callback có thể sử dụng:

```text
on
```

Ví dụ:

```ts
onSubmit
onDelete
onChange
```

---

# 10. Constants

Không sử dụng magic string.

Không:

```ts
if (status === "completed") {
}
```

Nên:

```ts
enum ReceiptStatus {
  DRAFT = "DRAFT",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
```

hoặc constant phù hợp với convention hiện tại.

---

# 11. Enum

Các trạng thái nghiệp vụ nên sử dụng enum hoặc union type rõ ràng.

Ví dụ:

```ts
export enum TransactionType {
  IMPORT = "IMPORT",
  EXPORT = "EXPORT",
  ADJUSTMENT = "ADJUSTMENT",
}
```

Không tự ý thêm trạng thái mới nếu chưa được định nghĩa trong nghiệp vụ.

---

# 12. File naming

Sử dụng convention nhất quán của project.

Khuyến nghị:

### React component

```text
MaterialTable.tsx
MaterialForm.tsx
ImportReceiptDetail.tsx
```

### Hook

```text
useMaterials.ts
useInventory.ts
```

### Service

```text
material.service.ts
inventory.service.ts
```

### Schema

```text
material.schema.ts
receipt.schema.ts
```

### Type

```text
material.types.ts
inventory.types.ts
```

### Utility

```text
formatCurrency.ts
calculateDebt.ts
```

Không trộn nhiều naming convention trong cùng project.

---

# 13. Component

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

# 14. Business logic

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

# 15. Tiền

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

# 16. Số lượng tồn kho

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

# 17. Inventory transaction

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

# 18. Phiếu nhập / xuất

Phiếu đã hoàn thành không được chỉnh sửa tùy tiện.

Nếu `BUSINESS_RULES.md` quy định phiếu completed/confirmed không được sửa:

code phải enforce rule ở backend.

Frontend disable button chỉ là UX.

Không được coi frontend validation là security hoặc business enforcement.

---

# 19. Công nợ

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

phải cập nhật công nợ đúng theo `BUSINESS_RULES.md`.

---

# 20. Soft delete

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

# 21. API design

REST API sử dụng resource naming rõ ràng.

Ví dụ:

```text
GET    /materials
GET    /materials/:id
POST   /materials
PATCH  /materials/:id
DELETE /materials/:id
```

Không tạo endpoint dạng:

```text
/getMaterials
/createMaterial
/updateMaterial
```

trừ khi architecture hiện tại đã quy định khác.

---

# 22. API response

Response format phải nhất quán.

Ví dụ:

```json
{
  "data": {},
  "message": "Success"
}
```

List:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Không tự ý thay đổi response contract của API đang được sử dụng.

---

# 23. HTTP status

Sử dụng HTTP status đúng mục đích.

```text
200 OK
201 Created
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity

500 Internal Server Error
```

Không trả:

```http
200 OK
```

cho mọi lỗi.

---

# 24. Validation

Mọi input từ client phải validate ở backend.

Bao gồm:

```text
body
query
params
```

Ví dụ phải validate:

```text
quantity > 0
price >= 0
paidAmount >= 0
name không rỗng
ID hợp lệ
```

Frontend validation chỉ giúp UX.

Backend validation là bắt buộc.

---

# 25. Database query

Không query database trong vòng lặp nếu có thể tránh.

Không:

```ts
for (const item of items) {
  await db.material.findUnique(...);
}
```

nếu có thể query batch.

Tránh N+1 query.

---

# 26. Transaction database

Các nghiệp vụ cập nhật nhiều bảng phải sử dụng database transaction.

Ví dụ:

### Hoàn thành phiếu nhập

Có thể bao gồm:

```text
update receipt
create receipt items
update inventory
create inventory transactions
update supplier debt
```

Các thao tác trên phải atomic.

Nếu một bước fail:

> Toàn bộ transaction phải rollback.

---

# 27. Concurrency

Không sử dụng flow:

```text
READ stock
↓
stock = stock - quantity
↓
UPDATE stock
```

một cách không an toàn khi nhiều request có thể chạy đồng thời.

Phải sử dụng cơ chế phù hợp của database/ORM:

```text
atomic update
transaction
row locking
optimistic locking
```

đặc biệt với tồn kho.

---

# 28. Error handling

Không swallow error.

Không:

```ts
try {
  await createReceipt();
} catch (error) {}
```

Phải:

- handle
- log
- hoặc rethrow

phù hợp.

---

# 29. Error message

Không trả lỗi kỹ thuật nội bộ cho client.

Không:

```json
{
  "error": "PrismaClientKnownRequestError..."
}
```

Nên:

```json
{
  "message": "Không thể tạo phiếu nhập."
}
```

Server log giữ technical error.

---

# 30. Logging

Không sử dụng:

```ts
console.log()
```

tùy tiện trong production code.

Không log:

```text
password
access token
refresh token
cookie
secret
database connection string
```

Log nên có context.

Ví dụ:

```text
receiptId
materialId
userId
action
```

---

# 31. Authentication

Không tự implement encryption/password hashing nếu đã có thư viện chuẩn.

Password phải hash ở backend.

Không lưu plain password.

Không expose:

```text
passwordHash
refreshToken
internalSecret
```

trong API response.

---

# 32. Authorization

Không chỉ kiểm tra quyền ở frontend.

Ví dụ:

```tsx
{isAdmin && <DeleteButton />}
```

chỉ là UI.

Backend vẫn phải kiểm tra:

```text
user role
permission
resource ownership
```

trước khi thực hiện action.

---

# 33. Environment variables

Không hard-code:

```text
API URL
database URL
JWT secret
password
API key
```

Sử dụng environment variable.

Không commit `.env`.

Cung cấp:

```text
.env.example
```

nhưng không chứa secret thật.

---

# 34. Async

Ưu tiên:

```ts
async/await
```

thay vì chain `.then()` dài.

Không:

```ts
getMaterials()
  .then(...)
  .then(...)
  .catch(...);
```

nếu async/await dễ đọc hơn.

---

# 35. Early return

Ưu tiên early return để giảm nesting.

Không:

```ts
if (user) {
  if (user.isActive) {
    if (user.canEdit) {
      // logic
    }
  }
}
```

Nên:

```ts
if (!user) return;
if (!user.isActive) return;
if (!user.canEdit) return;

// logic
```

---

# 36. Function size

Function phải có mục đích rõ ràng.

Nếu function:

- quá dài
- có nhiều nhánh
- làm nhiều nghiệp vụ

hãy cân nhắc tách function.

Không tách chỉ để giảm số dòng nếu làm code khó hiểu hơn.

---

# 37. Comments

Không comment điều code đã nói rõ.

Không:

```ts
// Increase quantity by 1
quantity += 1;
```

Comment nên giải thích:

```text
WHY
```

thay vì:

```text
WHAT
```

Ví dụ:

```ts
// Không cho phép tồn kho âm vì hệ thống không hỗ trợ backorder.
```

---

# 38. TODO

Không để TODO mơ hồ.

Không:

```ts
// TODO fix later
```

Nếu bắt buộc:

```ts
// TODO: Handle stock reservation when order module is implemented.
```

---

# 39. Date/time

Không tự xử lý timezone bằng cộng/trừ giờ thủ công.

Không:

```ts
date.setHours(date.getHours() + 7);
```

trừ khi có lý do được định nghĩa rõ.

Backend nên lưu timestamp theo convention được định nghĩa trong `DATABASE.md`.

Frontend chịu trách nhiệm hiển thị theo timezone.

---

# 40. Search

Search user-entered text phải:

- trim
- handle empty string
- không phân biệt hoa thường nếu nghiệp vụ phù hợp

Không gửi request liên tục theo từng keystroke nếu search API.

Sử dụng debounce khi cần.

---

# 41. Pagination

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

# 42. Filter

Filter phải được gửi xuống backend nếu dataset lớn.

Không fetch hàng nghìn records rồi filter phía frontend.

---

# 43. Sorting

Không tin giá trị sort field trực tiếp từ client để tạo dynamic SQL.

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

# 44. Forms

Form phải:

- có validation
- disable submit khi đang submit
- chống double-submit
- hiển thị lỗi rõ ràng

Không để user click nhiều lần tạo nhiều phiếu.

Backend cũng phải có protection phù hợp với nghiệp vụ quan trọng.

---

# 45. Loading state

Mọi async UI cần xử lý:

```text
loading
success
empty
error
```

Không chỉ implement happy path.

---

# 46. Empty state

Danh sách rỗng phải có empty state rõ ràng.

Ví dụ:

```text
Chưa có vật liệu nào.
```

thay vì chỉ hiển thị table trống.

---

# 47. Confirmation

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

# 48. Currency UI

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

# 49. Number formatting

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

# 50. Unit

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

# 51. Material code

Mã vật liệu phải unique nếu business rule quy định.

Không sử dụng tên vật liệu làm primary identifier.

Ví dụ:

```text
XM-HOLCIM-50KG
CAT-VANG-001
THEP-D16
```

---

# 52. Receipt code

Không generate receipt code ở frontend.

Backend phải chịu trách nhiệm tạo mã.

Ví dụ:

```text
PN-20260914-0001
PX-20260914-0001
```

Cơ chế generate phải chống duplicate khi nhiều request đồng thời.

---

# 53. Database migration

Mọi thay đổi schema phải sử dụng migration.

Không chỉnh database production thủ công rồi bỏ qua migration.

Không sửa migration cũ đã chạy production.

Tạo migration mới.

---

# 54. Seed data

Seed chỉ dành cho:

```text
development
test
initial system data
```

Không đưa dữ liệu test vào production.

---

# 55. Testing

Ưu tiên test business logic quan trọng.

Đặc biệt:

```text
calculate receipt total
calculate debt
stock import
stock export
stock adjustment
cancel receipt
payment
refund
```

Không cần test implementation detail.

Test behavior.

---

# 56. Test naming

Tên test phải mô tả behavior.

Ví dụ:

```ts
it("should reject export when stock is insufficient")
```

Không:

```ts
it("test export")
```

---

# 57. Test cases

Với logic quan trọng cần test:

```text
normal case
boundary case
invalid input
failure case
```

Ví dụ xuất kho:

```text
quantity < stock
quantity = stock
quantity > stock
quantity = 0
quantity < 0
```

---

# 58. Không tự ý thay đổi business rule

AI không được tự thêm rule.

Ví dụ không tự quyết định:

```text
cho phép tồn âm
không cho phép tồn âm
cho phép sửa phiếu completed
cách tính công nợ
cách xử lý hoàn hàng
```

Nếu chưa có rule:

phải kiểm tra `BUSINESS_RULES.md`.

Nếu vẫn không có, giữ behavior hiện tại và ghi chú assumption.

---

# 59. Không over-engineering

Không tự thêm:

```text
CQRS
Event Sourcing
Microservices
DDD framework phức tạp
Kafka
Redis
Message Queue
Repository abstraction nhiều tầng
```

nếu MVP chưa cần.

Ưu tiên architecture đơn giản.

---

# 60. Không premature optimization

Không tối ưu khi chưa có vấn đề thực tế.

Ưu tiên:

```text
correctness
readability
maintainability
```

sau đó mới tới optimization.

---

# 61. Dependency

Trước khi thêm package:

1. Kiểm tra project đã có solution chưa.
2. Kiểm tra có thể giải quyết đơn giản bằng native API không.
3. Chỉ thêm dependency khi thực sự có lợi.

Không thêm package chỉ để dùng một function đơn giản.

---

# 62. Dead code

Không để:

```text
unused import
unused component
unused function
commented code
```

sau khi hoàn thành task.

Không giữ code cũ bằng comment.

Git đã lưu history.

---

# 63. Refactor

Khi refactor phải đảm bảo:

```text
behavior before = behavior after
```

trừ khi task yêu cầu thay đổi behavior.

Không kết hợp:

```text
feature lớn
+
refactor lớn
```

trong cùng thay đổi nếu không cần thiết.

---

# 64. API calls ở frontend

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

# 65. Server state

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

# 66. Global state

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

# 67. Import

Sử dụng import alias theo config project.

Ví dụ:

```ts
import { formatCurrency } from "@/utils/formatCurrency";
```

thay vì:

```ts
import { formatCurrency } from "../../../../utils/formatCurrency";
```

nếu project đã hỗ trợ alias.

---

# 68. Circular dependency

Không tạo circular dependency giữa module.

Ví dụ tránh:

```text
material -> inventory -> receipt -> material
```

Shared logic phải đặt ở layer phù hợp.

---

# 69. Domain separation

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

# 70. Audit

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

# 71. Audit timestamps

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

# 72. Sensitive data

Không expose dữ liệu không cần thiết cho frontend.

API chỉ trả field client cần.

Không dùng:

```ts
select *
```

mặc định nếu entity chứa field nhạy cảm.

---

# 73. Idempotency

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

# 74. Payment / debt operations

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

# 75. Decimal

Các field như:

```text
quantity
unitPrice
totalAmount
```

phải dùng kiểu dữ liệu phù hợp theo `DATABASE.md`.

Không convert sang JavaScript `Number` một cách thiếu kiểm soát nếu database đang sử dụng Decimal.

---

# 76. Security

Luôn validate và sanitize dữ liệu phù hợp.

Không tin dữ liệu client.

Cẩn thận với:

```text
SQL injection
XSS
CSRF
broken authorization
mass assignment
```

Không expose stack trace production.

---

# 77. Mass assignment

Không truyền trực tiếp:

```ts
db.material.create({
  data: req.body,
});
```

Nên map các field được phép:

```ts
db.material.create({
  data: {
    code: input.code,
    name: input.name,
    unitId: input.unitId,
  },
});
```

---

# 78. AI coding rule

Khi AI nhận task:

Trước khi code phải xác định:

```text
module liên quan
business rule liên quan
database entities liên quan
API hiện tại
code pattern hiện tại
```

Không generate solution mới hoàn toàn nếu project đã có pattern.

---

# 79. AI phải reuse pattern hiện tại

Trước khi tạo:

```text
component
API
hook
service
modal
table
form
validation
```

phải tìm implementation tương tự trong project.

Nếu đã có pattern:

> Copy architecture/pattern, không copy-paste business logic.

---

# 80. AI không được tự thay architecture

AI không được vì thấy giải pháp khác tốt hơn mà tự thay:

```text
folder structure
state management
API pattern
database abstraction
form library
UI library
```

Architecture change phải là task riêng.

---

# 81. AI khi thiếu thông tin

Nếu task có thể hoàn thành an toàn với assumption nhỏ:

- giữ behavior hiện tại
- chọn solution đơn giản nhất
- ghi rõ assumption

Không tự phát minh business rule.

---

# 82. AI khi sửa bug

Ưu tiên:

```text
xác định root cause
↓
sửa root cause
↓
test affected flow
```

Không chỉ che symptom.

Không thêm workaround nếu có thể sửa nguyên nhân trực tiếp.

---

# 83. AI khi implement feature

Thứ tự kiểm tra:

```text
1. Business rule
2. Database
3. Backend
4. API contract
5. Frontend
6. Validation
7. Error states
8. Tests
```

Không bắt đầu từ UI nếu feature phụ thuộc nghiệp vụ/backend.

---

# 84. AI khi thay đổi database

Nếu thay đổi schema:

phải kiểm tra ảnh hưởng tới:

```text
migration
existing data
API
types
business logic
frontend
tests
```

Không chỉ sửa schema rồi dừng lại.

---

# 85. Definition of Done

Một task chỉ được coi là hoàn thành khi:

- code compile
- không còn TypeScript error
- không có unused import
- không có obvious runtime error
- validation đã xử lý
- error state đã xử lý
- business rule đúng
- không phá code hiện tại
- migration được tạo nếu cần
- test được cập nhật nếu logic quan trọng thay đổi

---

# 86. Checklist trước khi hoàn thành

AI phải tự kiểm tra:

```text
[ ] Có vi phạm BUSINESS_RULES.md không?
[ ] Có duplicate logic không?
[ ] Có dùng any không cần thiết không?
[ ] Có magic string/magic number không?
[ ] Validation backend đầy đủ chưa?
[ ] Authorization backend đầy đủ chưa?
[ ] Database transaction có cần không?
[ ] Có nguy cơ double request không?
[ ] Có nguy cơ race condition tồn kho không?
[ ] Error state đã xử lý chưa?
[ ] Loading state đã xử lý chưa?
[ ] Empty state đã xử lý chưa?
[ ] Có code thừa không?
[ ] Có dependency mới không cần thiết không?
[ ] Có thay đổi API contract ngoài ý muốn không?
[ ] Có thay đổi business behavior ngoài phạm vi task không?
```

---

# 87. Nguyên tắc quan trọng nhất

Khi phải lựa chọn giữa:

```text
code thông minh
```

và:

```text
code đơn giản, rõ ràng
```

ưu tiên:

> **Code đơn giản, rõ ràng.**

Khi phải lựa chọn giữa:

```text
refactor rộng
```

và:

```text
thay đổi nhỏ đúng yêu cầu
```

ưu tiên:

> **Thay đổi nhỏ đúng yêu cầu.**

Khi code và business rule mâu thuẫn:

> **Business rule là nguồn sự thật.**

Khi frontend và backend cùng validate một rule:

> **Backend là nơi bắt buộc enforce rule.**

Đối với tồn kho và công nợ:

> **Mọi thay đổi phải có lịch sử và có thể truy vết.**