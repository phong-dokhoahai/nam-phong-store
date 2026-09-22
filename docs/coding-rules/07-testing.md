# Testing

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 55. Testing

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


## 56. Test naming

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


## 57. Test cases

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
