# API và backend

[Quay lại CODING_RULES.md](../CODING_RULES.md)

## 21. API design

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


## 22. API response

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


## 23. HTTP status

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


## 24. Validation

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


## 28. Error handling

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


## 29. Error message

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


## 30. Logging

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


## 31. Authentication

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


## 32. Authorization

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


## 33. Environment variables

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


## 72. Sensitive data

Không expose dữ liệu không cần thiết cho frontend.

API chỉ trả field client cần.

Không dùng:

```ts
select *
```

mặc định nếu entity chứa field nhạy cảm.

---


## 76. Security

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


## 77. Mass assignment

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
