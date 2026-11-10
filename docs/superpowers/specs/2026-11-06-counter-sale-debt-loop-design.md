# Bán tại quầy một bước, thu nợ gộp, hủy / trả hàng / kiểm kê

Ngày: 2026-11-06. Nguồn: đánh giá nghiệp vụ ngày 2026-11-03 (mục 1, 2, 6) và hội đồng Founder ngày 2026-11-04 (`founder/board.md`).

## Vì sao

Cửa hàng Nam Phong sẽ dùng app làm hệ thống duy nhất cho bán hàng và công nợ. Hiện có 3 chỗ khiến nhân viên quay lại dùng sổ:
1. Bán tiền mặt phải làm 2 bước (xác nhận phiếu, rồi mới thu tiền).
2. Thầu trả một cục cho nhiều phiếu, nhân viên phải tự chia tiền ra từng phiếu.
3. Phiếu đã xác nhận thì không sửa được: không hủy được, không nhận được hàng trả, không điều chỉnh được tồn khi kiểm kê.

**Thành công nghĩa là:** một lần bán ở quầy, kể cả tiền mặt, xong trong một hộp thoại; số nợ trên app luôn đối chiếu được với sổ cái; mọi sai sót đều sửa được bằng bút toán đảo, không phải sửa số ngoài app.

## Mục tiêu

1. **Thu ngay khi xác nhận phiếu xuất.** Nhập số tiền khách trả ngay (từ 0 đến tổng phiếu) cùng phương thức trả. Tất cả chạy trong cùng RPC xác nhận.
2. **Thu theo khách.** Nhập một số tiền cho một khách. Hệ thống tự trừ vào phiếu đã xác nhận còn nợ, phiếu cũ nhất trước (theo ngày bán, rồi theo mã phiếu). Mỗi phiếu được trừ tạo một phiếu thu, và các phiếu thu của cùng một lần thu có chung một mã nhóm.
3. **Hủy phiếu nhập / phiếu xuất**, cả nháp lẫn đã xác nhận, bắt buộc có lý do.
   - Phiếu đã xác nhận: đảo tồn kho bằng movement `REVERSAL_*`, đảo công nợ bằng ledger `REVERSAL`.
   - Mọi lần thu/chi của phiếu đó được tự đảo, coi như đã hoàn tiền.
   - Hủy phiếu nhập không được làm tồn âm.
4. **Trả hàng khách** và **trả hàng nhà cung cấp**: lưu nháp, rồi xác nhận.
   - Mỗi phiếu trả tham chiếu một phiếu gốc đã xác nhận.
   - Số lượng trả không vượt (đã bán hoặc đã nhập) trừ (đã trả trước đó).
   - Đơn giá lấy từ dòng của phiếu gốc.
   - Hàng khách trả **luôn nhập lại kho**.
   - Giá trị trả được trừ vào nợ còn lại của phiếu gốc. Phần vượt quá nợ là tiền hoàn, ghi ở `refund_amount` của phiếu trả.
5. **Kiểm kê**: nhân viên lưu nháp, ghi số thực tế và lý do khi có chênh lệch. ADMIN xác nhận. Khi xác nhận, tồn được đặt bằng số thực tế qua `ADJUSTMENT_IN` hoặc `ADJUSTMENT_OUT`.

## Quyết định của người dùng (2026-11-06)

- Khách lẻ (`WALK_IN_CUSTOMER`) **được ghi nợ** như mọi khách khác.
- **Chỉ ADMIN** được hủy phiếu nhập/xuất và xác nhận kiểm kê. Nhân viên kho tạo nháp kiểm kê, tạo và xác nhận phiếu trả hàng.
- Hàng khách trả luôn nhập lại kho.
- Hủy phiếu đã thu/chi tiền: người dùng để Claude chọn. **Claude chọn tự đảo các lần thu/chi** (coi như đã hoàn tiền). Lý do: phiếu bán ở quầy giờ thường đã thu tiền; nếu chặn thì gần như không hủy được phiếu nào.

## Quyết định của Claude (người dùng có thể đổi)

- Phiếu đã có phiếu trả hàng được xác nhận thì **không hủy được**, vì chưa có chức năng hủy phiếu trả.
- Tổng tiền trả hàng không được vượt `total_amount` của phiếu gốc trừ đi các lần trả đã xác nhận. Chặn này cần thiết vì đơn giá trả lấy từ dòng phiếu gốc, chưa tính chiết khấu dòng và chiết khấu phiếu.
- Tiền hoàn khi trả hàng chỉ ghi ở `refund_amount`. Không tạo phiếu chi và không tạo dòng ledger.
- Thu theo khách áp dụng cho cả khách đã ngừng hợp tác (vẫn phải thu nợ của họ). Chiều chi gộp cho nhà cung cấp chưa làm.
- Mã chứng từ mới: `THB` (trả hàng bán), `THM` (trả hàng mua), `KK` (kiểm kê).
- Không có hủy phiếu trả hàng, không có hủy kiểm kê đã xác nhận (`cancel_stocktake`), không có chức năng đảo từng phiếu thu riêng lẻ. Để sau.

## Không làm

Quy đổi đơn vị, hạn mức nợ, in phiếu, giá vốn, chi gộp cho nhà cung cấp, đồng bộ offline cho các thao tác ghi.

## Phản mục tiêu (dù chạy được vẫn là thất bại)

- Ledger công nợ không khớp với `debt_amount` của các phiếu đã xác nhận (`SUM(ledger.amount_delta)` theo khách/NCC phải bằng `SUM(debt_amount)` của phiếu `CONFIRMED`).
- `current_stock` khác `SUM(inventory_movements.quantity_delta)`.
- Sửa hoặc xóa movement, ledger, payment hay audit đã có.
- Nghiệp vụ ghép từ nhiều request ở trình duyệt.

## Ràng buộc

Tuân theo CLAUDE.md và AGENTS.md:
- RPC cho mọi nghiệp vụ;
- primitive UI;
- đủ 5 file locale;
- thuộc tính logical cho RTL;
- `formatCurrency` / `formatQuantity`;
- migration mới, không sửa migration cũ.

Push migration lên DB remote (production) phải hỏi người dùng. Test rollback trên DB remote cũng phải hỏi trước lần chạy đầu tiên.
