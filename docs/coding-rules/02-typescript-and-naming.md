# TypeScript và naming

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 5. TypeScript

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


## 6. Naming convention

### Variable / function

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


## 7. Boolean naming

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


## 8. Function naming

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


## 9. Event handler

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


## 10. Constants

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


## 11. Enum

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


## 12. File naming

Sử dụng convention nhất quán của project.

Khuyến nghị:

#### React component

```text
MaterialTable.tsx
MaterialForm.tsx
ImportReceiptDetail.tsx
```

#### Hook

```text
useMaterials.ts
useInventory.ts
```

#### Service

```text
material.service.ts
inventory.service.ts
```

#### Schema

```text
material.schema.ts
receipt.schema.ts
```

#### Type

```text
material.types.ts
inventory.types.ts
```

#### Utility

```text
formatCurrency.ts
calculateDebt.ts
```

Không trộn nhiều naming convention trong cùng project.

---


## 34. Async

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


## 35. Early return

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


## 36. Function size

Function phải có mục đích rõ ràng.

Nếu function:

- quá dài
- có nhiều nhánh
- làm nhiều nghiệp vụ

hãy cân nhắc tách function.

Không tách chỉ để giảm số dòng nếu làm code khó hiểu hơn.

---


## 37. Comments

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


## 38. TODO

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


## 67. Import

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
