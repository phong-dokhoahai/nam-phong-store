# 8. Nhật ký làm việc hằng ngày

[Quay lại Process](README.md)

Nhật ký ngắn theo ngày, dùng để báo cáo tiến độ. Mỗi ngày một block, **ngày mới nhất ở trên cùng**. Nội dung viết bằng tiếng Anh, đúng theo mẫu bên dưới để có thể copy-paste nguyên block.

## Mẫu

```text
DD/MM/YYYY
Today I worked on:
[Nam Phong Storage]:
<Động từ ở đầu câu> <việc đã làm>, <mục đích hoặc kết quả>
<Một dòng cho mỗi việc>
```

Quy tắc viết:

- Dòng đầu là ngày theo dạng `DD/MM/YYYY`; dòng hai luôn là `Today I worked on:`; dòng ba là tên dự án trong ngoặc vuông.
- Mỗi việc một dòng, không gạch đầu dòng, không đánh số.
- Bắt đầu bằng động từ (`Build`, `Add`, `Fix`, `Test`, `Refactor`, `Update`…), nói việc gì và để làm gì, theo góc nhìn người dùng/nghiệp vụ, không liệt kê tên file.
- Ghi đúng sự thật: việc chưa xong hoặc chưa test thì nói rõ (ví dụ `…, not yet tested in the browser`).
- Nếu cùng ngày đã có block thì thêm dòng vào block đó, không tạo block mới.

## Nhật ký

```text
19/10/2026
Today I worked on:
[Nam Phong Storage]:
Write the CLAUDE.md project guide so AI agents know the commands, required docs, architecture rules, and definition of done for this project
Fix outdated project docs (router version, generated database types path) so they match the code
Refactor the UI architecture so look-and-feel changes are made in one place: shared color tokens, styled tables, dialogs, list toolbars, and one loading/error/retry pattern used by every inventory, document, payment and report screen, not yet tested interactively in the browser
Fix pagination and report PDF texts that showed raw "{{from}}" placeholders instead of numbers, and the hardcoded "Home" breadcrumb
Fix the production build, which was failing on unused sidebar imports
Redesign the app UI for warehouse staff: Vietnamese-friendly font, Nam Phong branding, navigation grouped by task, page titles with the main action beside them, clickable stock summaries that filter the list, denser readable tables, and a line-item style document editor, checked in screenshots with demo data but not yet with real database data
Remove fake template parts that confused users: demo sales dashboard on the home page, fake search and notifications in the header, and dead Google/X/forgot-password/sign-up buttons on the sign-in page
```

```text
16/10/2026
Today I worked on:
[Nam Phong Storage]:
Build the reports section: inventory by period, low stock, purchases, sales, revenue, and customer/supplier debt, with PDF export
Restrict the revenue and debt reports to admins only
Fix a security hole where a newly signed-up user could promote themselves to admin (pushed to the database)
Standardize the shared UI pieces (buttons, selects, alerts, empty/loading states, stat cards, search) and switch the main screens over to them, not yet tested in the browser
Write project progress docs so the AI always knows what is done, in progress, and next, and make updating them mandatory after every task
Fix draft saving for stock receipts and stock issues so a draft is saved in one step, keeps its document number and cannot be left half-saved (tested against the real database inside a rolled-back transaction, 15/15 checks pass; pushed and re-tested)
Fix document numbering, which was failing on every new stock receipt, stock issue and payment, so documents can be created again (pushed, not yet tried in the app)
```
