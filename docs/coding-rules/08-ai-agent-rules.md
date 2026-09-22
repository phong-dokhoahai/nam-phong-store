# AI agent rules

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 78. AI coding rule

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


## 79. AI phải reuse pattern hiện tại

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


## 80. AI không được tự thay architecture

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


## 81. AI khi thiếu thông tin

Nếu task có thể hoàn thành an toàn với assumption nhỏ:

- giữ behavior hiện tại
- chọn solution đơn giản nhất
- ghi rõ assumption

Không tự phát minh business rule.

---


## 82. AI khi sửa bug

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


## 83. AI khi implement feature

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


## 84. AI khi thay đổi database

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
