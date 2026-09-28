# Scope And Checklist

[Quay lại Database](README.md)

## 24. Ngoài phạm vi MVP

Chưa thiết kế chi tiết:

- Nhiều kho và chuyển kho.
- Nhiều đơn vị và quy đổi.
- Lô, kệ, serial, hạn sử dụng.
- Đơn đặt mua tách phiếu nhập.
- Báo giá, giao nhiều đợt, hóa đơn điện tử.
- Một payment phân bổ nhiều chứng từ.
- Tiền trả trước và hạn mức tín dụng.
- Đa tiền tệ.
- FIFO/bình quân tức thời nâng cao.
- Kế toán kép và báo cáo tài chính đầy đủ.
- Public customer portal.

Khi mở rộng phải cập nhật `PROJECT.md`, `BUSINESS_RULES.md`, `ARCHITECTURE.md`, tài liệu này và migration trước khi code.

---

## 25. Checklist triển khai

### Schema

- [ ] Tạo enum trước các bảng sử dụng.
- [ ] Tạo FK, UNIQUE và CHECK constraints.
- [ ] Bật RLS trên tất cả bảng public.
- [ ] Không có policy cho anon.
- [ ] Tạo trigger `updated_at`.
- [ ] Tạo index cho FK và query chính.

### Auth và quyền

- [ ] `profiles.id` liên kết `auth.users.id`.
- [ ] Trigger tạo profile không nhận role từ client metadata.
- [ ] User mới không tự có quyền truy cập kho.
- [ ] Chỉ ADMIN đổi role/is_active.
- [ ] Không có service-role key trong frontend.

### Nghiệp vụ

- [ ] Confirm/cancel/payment/return/stocktake dùng RPC.
- [ ] Client không sửa stock/paid/debt/ledger/movement trực tiếp.
- [ ] RPC dùng `auth.uid()` và kiểm tra active/role.
- [ ] Có idempotency cho confirm và payment.
- [ ] Có row lock và update tồn có điều kiện.
- [ ] Mọi lỗi giữa luồng đều rollback.
- [ ] Hủy tạo bút toán đảo, không xóa lịch sử.

### Kiểm thử

- [ ] Test concurrent sales không làm tồn âm.
- [ ] Test user tự nâng role bị từ chối.
- [ ] Test inactive user không gọi được RPC.
- [ ] Test RLS giữa anonymous/authenticated.
- [ ] Test không sửa item của chứng từ confirmed.
- [ ] Test rollback khi confirm thất bại.
- [ ] Test payment không vượt công nợ.
- [ ] Test return không vượt số lượng gốc.
- [ ] Test cancellation và reversal.
- [ ] Test đối soát tồn và công nợ.

### TypeScript

- [ ] Generate lại `database.types.ts`.
- [ ] Không sửa file generated thủ công.
- [ ] Parse/validate NUMERIC và BIGINT.
- [ ] TanStack Query invalidates đúng query sau RPC.
- [ ] UI không coi optimistic update là xác nhận nghiệp vụ.
