# Database

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 25. Database query

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


## 26. Transaction database

Các nghiệp vụ cập nhật nhiều bảng phải sử dụng database transaction.

Ví dụ:

#### Hoàn thành phiếu nhập

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


## 27. Concurrency

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


## 39. Date/time

Không tự xử lý timezone bằng cộng/trừ giờ thủ công.

Không:

```ts
date.setHours(date.getHours() + 7);
```

trừ khi có lý do được định nghĩa rõ.

Backend nên lưu timestamp theo convention được định nghĩa trong `DATABASE.md`.

Frontend chịu trách nhiệm hiển thị theo timezone.

---


## 53. Database migration

Mọi thay đổi schema phải sử dụng migration.

Không chỉnh database production thủ công rồi bỏ qua migration.

Không sửa migration cũ đã chạy production.

Tạo migration mới.

---


## 54. Seed data

Seed chỉ dành cho:

```text
development
test
initial system data
```

Không đưa dữ liệu test vào production.

---
