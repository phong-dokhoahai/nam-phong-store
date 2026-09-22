# Nguyên tắc nền tảng

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 1. Mục tiêu

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


## 2. Nguyên tắc chung

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


## 3. Thứ tự ưu tiên tài liệu

Khi code, AI phải ưu tiên thông tin theo thứ tự:

1. `PROJECT.md`
2. [BUSINESS_RULES.md](../BUSINESS_RULES.md) và các file business rules được liên kết từ đó
3. [DATABASE.md](../DATABASE.md)
4. [CODING_RULES.md](../CODING_RULES.md) và các file coding rules được liên kết từ đó
5. Code hiện tại
6. Yêu cầu trong task hiện tại

Nếu phát hiện mâu thuẫn giữa code và business rule:

**Không tự ý quyết định.**

Phải ưu tiên [BUSINESS_RULES.md](../BUSINESS_RULES.md) và các file business rules được liên kết từ đó, đồng thời ghi chú rõ phần code hiện tại đang không đúng nghiệp vụ.

---


## 4. Tech stack

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


## 58. Không tự ý thay đổi business rule

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

phải kiểm tra [BUSINESS_RULES.md](../BUSINESS_RULES.md) và các file business rules được liên kết từ đó.

Nếu vẫn không có, giữ behavior hiện tại và ghi chú assumption.

---


## 59. Không over-engineering

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


## 60. Không premature optimization

Không tối ưu khi chưa có vấn đề thực tế.

Ưu tiên:

```text
correctness
readability
maintainability
```

sau đó mới tới optimization.

---


## 61. Dependency

Trước khi thêm package:

1. Kiểm tra project đã có solution chưa.
2. Kiểm tra có thể giải quyết đơn giản bằng native API không.
3. Chỉ thêm dependency khi thực sự có lợi.

Không thêm package chỉ để dùng một function đơn giản.

---


## 62. Dead code

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


## 63. Refactor

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


## 85. Definition of Done

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


## 86. Checklist trước khi hoàn thành

AI phải tự kiểm tra:

```text
[ ] Có vi phạm [BUSINESS_RULES.md](../BUSINESS_RULES.md) không?
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


## 87. Nguyên tắc quan trọng nhất

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
