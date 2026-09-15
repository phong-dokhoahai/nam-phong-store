# PROJECT.md

## 1. Project Overview

### Project Name

Construction Material Warehouse Management System

### Purpose

Xây dựng hệ thống web quản lý kho vật liệu xây dựng.

Hệ thống giúp người dùng:

* Quản lý vật liệu.
* Theo dõi tồn kho.
* Quản lý nhập kho.
* Quản lý xuất kho.
* Quản lý nhà cung cấp.
* Quản lý khách hàng.
* Điều chỉnh tồn kho khi kiểm kê.
* Theo dõi lịch sử biến động kho.
* Xem báo cáo kho cơ bản.

Mục tiêu chính của hệ thống là đảm bảo người quản lý luôn biết:

* Kho hiện có những vật liệu nào.
* Số lượng tồn hiện tại.
* Vật liệu nào sắp hết.
* Vật liệu đã được nhập/xuất khi nào.
* Ai thực hiện các giao dịch kho.
* Tại sao tồn kho thay đổi.

Đây là hệ thống quản lý nội bộ, không phải website thương mại điện tử.

---

## 2. Users

MVP có hai nhóm người dùng chính.

### ADMIN

Có toàn quyền quản lý hệ thống.

Có thể:

* Quản lý tài khoản.
* Quản lý vật liệu.
* Quản lý danh mục.
* Quản lý nhà cung cấp.
* Quản lý khách hàng.
* Nhập kho.
* Xuất kho.
* Điều chỉnh kho.
* Xem lịch sử kho.
* Xem báo cáo.
* Quản lý cấu hình hệ thống.

### WAREHOUSE_STAFF

Nhân viên kho.

Có thể:

* Xem vật liệu.
* Xem tồn kho.
* Tạo phiếu nhập.
* Tạo phiếu xuất.
* Điều chỉnh kho theo quyền được cấp.
* Xem lịch sử giao dịch kho.

Không được quản lý tài khoản hoặc cấu hình hệ thống quan trọng.

---

## 3. MVP Scope

MVP tập trung giải quyết flow chính:

```text
Material
    ↓
Import
    ↓
Inventory
    ↓
Export
    ↓
Inventory History
```

Các module thuộc MVP:

* Authentication.
* Dashboard.
* Material Management.
* Material Category Management.
* Unit Management.
* Supplier Management.
* Customer Management.
* Stock Receipt / Nhập kho.
* Stock Issue / Xuất kho.
* Inventory Management.
* Inventory Adjustment.
* Inventory Transaction History.
* Basic Reports.
* User Management.

Các chức năng chưa thuộc MVP:

* Kế toán đầy đủ.
* Công nợ nâng cao.
* Hóa đơn điện tử.
* Ecommerce.
* Thanh toán online.
* Quản lý giao hàng.
* Mobile App.
* Multi-branch.
* Multi-warehouse nâng cao.
* Barcode/QR chuyên dụng.
* AI dự báo tồn kho.
* CRM.
* ERP integration.

Không tự động implement các chức năng ngoài MVP nếu chưa có yêu cầu.

---

## 4. Core Modules

### Authentication

Quản lý:

* Login.
* Logout.
* Current user.
* Authentication.
* Authorization.

---

### Dashboard

Hiển thị tổng quan tình trạng kho.

Ví dụ:

* Tổng số vật liệu.
* Tổng vật liệu đang tồn.
* Vật liệu sắp hết.
* Vật liệu hết hàng.
* Nhập kho gần đây.
* Xuất kho gần đây.

---

### Materials

Quản lý danh mục vật liệu trong kho.

Ví dụ:

* Xi măng.
* Sắt thép.
* Cát.
* Đá.
* Gạch.
* Sơn.
* Ống nước.
* Vật liệu điện.

Mỗi vật liệu thuộc một:

* Category.
* Unit.

Material sử dụng SKU làm mã định danh nghiệp vụ.

---

### Categories

Phân nhóm vật liệu.

Ví dụ:

```text
Xi măng
Sắt thép
Gạch
Cát đá
Sơn
Thiết bị điện
Thiết bị nước
```

---

### Units

Quản lý đơn vị tính.

Ví dụ:

```text
kg
tấn
bao
viên
cây
m
m²
m³
thùng
cái
```

---

### Suppliers

Quản lý thông tin nhà cung cấp vật liệu.

Supplier được sử dụng trong nghiệp vụ nhập kho.

---

### Customers

Quản lý thông tin khách hàng.

Customer được sử dụng trong nghiệp vụ xuất kho.

MVP chỉ cần quản lý thông tin khách hàng cơ bản.

---

### Stock Receipts

Đại diện cho nghiệp vụ nhập vật liệu vào kho.

Một phiếu nhập có thể chứa nhiều vật liệu.

Khi phiếu nhập hoàn thành:

```text
Inventory increases
```

---

### Stock Issues

Đại diện cho nghiệp vụ xuất vật liệu khỏi kho.

Một phiếu xuất có thể chứa nhiều vật liệu.

Khi phiếu xuất hoàn thành:

```text
Inventory decreases
```

---

### Inventory

Theo dõi tồn kho hiện tại của từng vật liệu.

Inventory cần hỗ trợ:

* Current quantity.
* Minimum stock.
* Low stock detection.
* Out-of-stock detection.

---

### Inventory Adjustment

Dùng khi tồn kho thực tế khác tồn kho hệ thống.

Ví dụ:

```text
System quantity: 100

Actual quantity: 98

Adjustment: -2
```

Mọi adjustment phải có lý do.

---

### Inventory Transactions

Lưu lịch sử mọi biến động tồn kho.

Các loại transaction chính:

```text
IMPORT
EXPORT
ADJUSTMENT_INCREASE
ADJUSTMENT_DECREASE
```

Transaction history là audit log quan trọng của hệ thống.

---

### Reports

MVP chỉ cần báo cáo cơ bản:

* Inventory report.
* Import report.
* Export report.
* Low stock report.

---

## 5. Core Domain

Domain chính của hệ thống:

```text
Category
   │
   ▼
Material ───── Unit
   │
   ▼
Inventory
   │
   ├──── Stock Receipt ─── Supplier
   │
   ├──── Stock Issue ───── Customer
   │
   └──── Inventory Adjustment
                   │
                   ▼
          Inventory Transaction
```

Inventory là trung tâm của hệ thống.

Mọi nghiệp vụ làm thay đổi tồn kho phải tạo lịch sử tương ứng.

---

## 6. Important Business Principles

Các nguyên tắc này áp dụng toàn project.

### Inventory must not become negative

Không cho phép xuất số lượng lớn hơn tồn kho hiện tại, trừ khi business rule sau này explicitly cho phép.

Validation bắt buộc phải được thực hiện ở backend.

---

### Inventory changes require history

Không được thay đổi tồn kho mà không tạo Inventory Transaction.

```text
Inventory Change
+
Inventory Transaction
```

phải luôn đi cùng nhau.

---

### Inventory operations must be atomic

Các nghiệp vụ:

* Nhập kho.
* Xuất kho.
* Điều chỉnh kho.

phải sử dụng database transaction.

Nếu một bước thất bại, toàn bộ nghiệp vụ phải rollback.

---

### Completed transactions are historical data

Không hard-delete tùy tiện:

* Phiếu nhập đã hoàn thành.
* Phiếu xuất đã hoàn thành.
* Inventory Transaction.
* Inventory Adjustment.

Lịch sử kho phải có khả năng audit.

---

### Backend owns business rules

Frontend có thể validate để cải thiện UX.

Nhưng backend luôn là nơi quyết định business rule.

Không dựa vào frontend để bảo vệ dữ liệu tồn kho.

---
## 7. Tech Stack

### Frontend

```text
Vite
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form
Zod
```

### Backend / Platform

```text
Supabase
```

Supabase được sử dụng cho:

- PostgreSQL Database.
- Authentication.
- Row Level Security (RLS).
- Storage nếu cần upload file/hình ảnh.
- Realtime nếu sau này cần cập nhật dữ liệu theo thời gian thực.
- Edge Functions cho các nghiệp vụ backend đặc biệt nếu cần.

### Database

```text
PostgreSQL
```

Database được quản lý thông qua Supabase.

### Authentication

Sử dụng:

```text
Supabase Auth
```

Frontend không tự xử lý password hoặc tự xây authentication server riêng.

Phân quyền phải kết hợp:

```text
Supabase Auth
+
Database roles/permissions
+
Row Level Security
```

### Data Access

Frontend sử dụng Supabase Client để truy cập dữ liệu.

Luồng cơ bản:

```text
Vite React App
      ↓
Supabase Client
      ↓
Supabase
├── Auth
├── PostgreSQL
├── RLS
├── Storage
└── Edge Functions
```

Không có backend server riêng trong MVP nếu nghiệp vụ có thể xử lý an toàn bằng Supabase.

Các nghiệp vụ yêu cầu:

- Logic bảo mật.
- Transaction phức tạp.
- Logic không nên chạy ở client.
- Tích hợp third-party secret.
- Các thao tác đặc quyền.

phải được xử lý thông qua:

```text
PostgreSQL Function / RPC
```

hoặc:

```text
Supabase Edge Function
```

Không đặt secret hoặc privileged business logic trong frontend.

### Architecture

Kiến trúc MVP:

```text
Vite React Application
        ↓
Supabase SDK
        ↓
Supabase Platform
        │
        ├── Authentication
        ├── PostgreSQL
        ├── Row Level Security
        ├── Storage
        ├── Database Functions / RPC
        └── Edge Functions
```

Ưu tiên kiến trúc đơn giản.

Không xây thêm backend NestJS/Express nếu chưa có nhu cầu thực tế.

---

## 8. Project Structure

Project có thể tổ chức như sau:

```text
root/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
│
├── docs/
│
├── PROJECT.md
├── README.md
├── package.json
├── vite.config.ts
└── tsconfig.json
```

Frontend ưu tiên feature-based structure:

```text
src/features/
├── auth/
├── materials/
├── categories/
├── units/
├── suppliers/
├── customers/
├── inventory/
├── stock-receipts/
├── stock-issues/
├── adjustments/
└── reports/
```

Supabase client configuration nên nằm ở:

```text
src/lib/supabase/
```

Ví dụ:

```text
src/lib/supabase/
├── client.ts
├── types.ts
└── helpers.ts
```

Không khởi tạo nhiều Supabase client rải rác trong project.

---

## 9. Technical Principles

### Supabase is the primary backend platform

Không mặc định tạo backend server riêng.

Ưu tiên sử dụng:

```text
Supabase Auth
PostgreSQL
RLS
RPC
Edge Functions
```

trước khi thêm một backend service mới.

### Do not trust the frontend

Frontend không phải security boundary.

Không dựa vào việc:

```text
ẩn button
disable input
check role trên React
```

để bảo vệ dữ liệu.

Authorization quan trọng phải được enforce bằng:

```text
RLS
Database policy
RPC
Edge Function
```

### Row Level Security

Các table chứa dữ liệu nghiệp vụ phải xem xét bật RLS.

Không disable RLS chỉ để frontend truy cập dữ liệu dễ hơn.

Policies phải phản ánh quyền:

```text
ADMIN
WAREHOUSE_STAFF
```

### Sensitive Keys

Frontend chỉ được sử dụng public Supabase configuration phù hợp.

Không expose:

```text
service_role key
third-party secret
private API key
```

trong Vite environment variables phía client.

Các secret phải nằm trong server-side environment hoặc Supabase Edge Function secrets.

### Inventory Operations

Các nghiệp vụ làm thay đổi tồn kho không nên được implement bằng nhiều request độc lập từ frontend.

Ví dụ không nên:

```text
1. Frontend update inventory
2. Frontend insert transaction
3. Frontend update receipt
```

Vì một request có thể thành công trong khi request khác thất bại.

Các nghiệp vụ như:

```text
Complete Stock Receipt
Complete Stock Issue
Inventory Adjustment
```

nên được thực hiện thông qua một Database Function / RPC hoặc server-side operation có transaction.

Ví dụ:

```text
Frontend
   ↓
complete_stock_issue(...)
   ↓
PostgreSQL Transaction
   ├── Validate stock
   ├── Update inventory
   ├── Create inventory transaction
   └── Update stock issue status
```

Nếu một bước thất bại:

```text
ROLLBACK
```

toàn bộ nghiệp vụ.

## 10. Documentation

Thông tin chi tiết sẽ được tách sang thư mục:

```text
docs/
```

```text
docs/
├── BUSINESS_RULES.md
├── DATABASE.md
├── API.md
├── FEATURES.md
└── UI_FLOW.md
```

Vai trò:

### PROJECT.md

Giải thích project là gì và các nguyên tắc tổng thể.

### BUSINESS_RULES.md

Quy định chi tiết nghiệp vụ.

### DATABASE.md

Database schema, entity và relationship.

### API.md

API contracts và conventions.

### FEATURES.md

Requirement chi tiết của từng feature.

### UI_FLOW.md

Screen, navigation và user flow.

Không duplicate quá nhiều thông tin giữa các document.

---

## 11. AI Instructions

Khi AI nhận một coding task:

1. Đọc `PROJECT.md`.
2. Đọc tài liệu liên quan trong `/docs` nếu tồn tại.
3. Kiểm tra code hiện tại.
4. Xác định chính xác module cần thay đổi.
5. Giữ nguyên architecture và convention hiện tại.
6. Không thay đổi business rule nếu không được yêu cầu.
7. Không thêm feature ngoài scope.
8. Không tự ý thay đổi database schema nếu task không yêu cầu.
9. Nếu thay đổi ảnh hưởng nhiều layer, kiểm tra toàn bộ flow liên quan.
10. Ưu tiên thay đổi nhỏ nhất có thể giải quyết đúng yêu cầu.

AI không nên tự suy đoán nghiệp vụ quan trọng.

Nếu implementation hiện tại và documentation khác nhau, ưu tiên requirement/documentation mới nhất.

---

## 12. Priority of Information

Khi có thông tin mâu thuẫn, ưu tiên theo thứ tự:

```text
1. Yêu cầu mới nhất của user
2. Business documentation
3. Database / API specification
4. PROJECT.md
5. Existing implementation
6. AI assumptions
```

AI không được thay đổi business rule chỉ dựa trên assumption.

---

## 13. Project Philosophy

Project ưu tiên:

```text
Correctness
> Maintainability
> Simplicity
> Performance optimization
> Clever abstractions
```

Đặc biệt với nghiệp vụ tồn kho:

```text
Data correctness
```

luôn quan trọng hơn việc tối ưu hoặc rút ngắn code.

Nguyên tắc cốt lõi của hệ thống:

> Mọi thay đổi tồn kho phải xuất phát từ một nghiệp vụ rõ ràng và phải để lại lịch sử có thể kiểm tra lại.
