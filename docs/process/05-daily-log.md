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
06/11/2026
Today I worked on:
[Nam Phong Storage]:
Fix number fields that showed "0001" or "05" while saving 1 or 5, and that silently turned negative numbers into 0, with a new number box that only accepts valid amounts and quantities and shows thousand separators, checked in headless Chrome on a test page
Add input checks to the material, category, unit, supplier, customer, payment, stock receipt and stock issue forms (length limits matching the database, email/phone/tax code/code formats, decimals allowed by each unit, whole-amount line totals, document discount not above the total) with the error shown under each field, not yet tried on the app screens with the real database
Add the counter sale flow to the project scope: pick items by typing, quantity 1 and walk-in customer by default, take full or partial payment and finish in one step, aiming for 3–4 actions per simple sale instead of about 12 today
Review four open-source project-manager agent kits against this project's needs, nothing installed
Update the project rules so AI agents always reuse and fix the template's own components instead of replacing them, after finding the template date picker had been dropped without telling the user; fixing the date picker itself is the next task
```

```text
04/11/2026
Today I worked on:
[Nam Phong Storage]:
Add the open-source Founder skill pack (board review, competitor scan, simulated buyer panel, pricing, unit economics, marketing, operations, launch and business plan) to the project's Claude tools so the store's business can be pressure-tested before spending money, copied unchanged from the published version after reading every file, not yet run
Review the app as a product to sell to other building-materials shops with the Founder board and competitor scan: the board voted 2 "fund if" and 1 "pass" (3.7/10), asking for 30–60 days of real daily use at Nam Phong, a one-step counter sale and a closed debt loop first; the scan found Sapo, KiotViet and MISA eShop already selling to these shops at 0–330,000 VND a month with the features Nam Phong still lacks, leaving only a possible hands-on setup and support gap
```

```text
02/11/2026
Today I worked on:
[Nam Phong Storage]:
Add sample data to the live database (10 categories, units, suppliers, customers and materials, 20 confirmed and 4 draft stock receipts/issues, 20 payments, plus draft returns and stocktakes) through the app's own database functions so stock and debt add up, checked by matching stock to stock movements and debt to the debt ledger, not yet viewed in the app
Test every business screen in the browser as admin with the real database (desktop and mobile, light and dark): all 16 screens load without errors and the totals match the data; fix the invisible "view" button on confirmed receipts/issues, pages that scrolled sideways and hid the main button, quantities shown as 17,000 instead of 17.000, and receipt/issue lists that could repeat or skip documents between pages
```

```text
22/10/2026
Today I worked on:
[Nam Phong Storage]:
Turn the app into an installable PWA for admins: install button, faster start from cached files, a "new version, reload" prompt, an offline banner, and list screens that show the last saved data with its time when the network is down, checked in headless Chrome without signing in but not yet on a phone or with the real database
Rename the customer and supplier status to "active partner / partnership ended" and show in the confirmation dialog exactly what stops working and what is kept
Stop inactive categories and units from being picked for materials, while keeping the current choice of existing materials
Fix draft stock receipts and issues that got stuck when their customer, supplier or material was deactivated: the editor now shows the deactivated item and explains how to fix the draft instead of a raw database error (checked with demo data and screenshots, not yet with the real database)
```

```text
20/10/2026
Today I worked on:
[Nam Phong Storage]:
Review the sign-in and permission system and list the remaining weak points by priority
Turn off public sign-up on Supabase so only an admin can create accounts, and remove the unused sign-up page (checked: the sign-up API now refuses new accounts)
Fix a security gap where any signed-in account, even one not yet activated, could use up document numbers; also make the admin check always answer yes/no so the earlier self-promotion bug cannot come back (pushed to the database, 13/13 permission checks and 15/15 draft checks pass inside a rolled-back transaction)
Fix the sign-in session handling: signing out while the app is still loading no longer brings the user back, a network error shows a "Try again" screen instead of logging the user out, a locked account or changed role takes effect when the user returns to the tab, and sign-in errors now say whether the password is wrong, the network is down or there were too many attempts (checked in 14 browser scenarios with a simulated server, not yet with the real database)
```

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
