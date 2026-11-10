# AGENTS.md — TailAdmin React Pro

> React 19 admin dashboard template · Vite · Tailwind CSS v4 · react-i18next · ApexCharts · FullCalendar · Swiper
## Required Context

Trước khi thực hiện task, đọc tài liệu theo mức độ cần thiết:

PROJECT.md
docs/PROCESS.md — luôn đọc để biết dự án đang ở đâu
BUSINESS_RULES.md nếu task liên quan nghiệp vụ
DATABASE.md nếu task liên quan dữ liệu, Supabase hoặc migration
ARCHITECTURE.md nếu task ảnh hưởng structure, dependency hoặc data flow
CODING_RULES.md trước khi viết hoặc sửa code
File/module liên quan trực tiếp đến task

Không cần đọc toàn bộ repository nếu task chỉ ảnh hưởng một phạm vi nhỏ.

**Bắt buộc:** mỗi khi xong một tính năng/task có thay đổi repository, phải cập nhật `docs/PROCESS.md` và `docs/process/` theo [docs/process/04-update-rules.md](docs/process/04-update-rules.md) trước khi báo hoàn thành. Task chưa cập nhật process là chưa hoàn thành.

## Repo Map

```
src/
├── App.tsx                    # root router — all routes registered here
├── main.tsx                   # entry point: providers + CSS imports
├── index.css                  # Tailwind v4 @theme tokens, @utility classes, third-party overrides
├── pages/                     # route-level components (one file or folder per page)
│   ├── Dashboard/             # dashboard variants: Ecommerce, Analytics, CRM, Sales, Finance…
│   ├── AuthPages/             # SignIn + AuthPageLayout (no sign-up: accounts are created by an ADMIN)
│   ├── Ecommerce/             # ProductList, AddProduct, Billing, Invoices, Transactions…
│   ├── Forms/                 # FormElements, FormLayout
│   ├── Tables/                # BasicTables, DataTables
│   ├── Charts/                # LineChart, BarChart, PieChart, RadarChart, RadialChart
│   ├── UiElements/            # Alerts, Badges, Buttons, Modals, Tabs, Tooltips…
│   ├── Task/                  # TaskKanban, TaskList
│   ├── Email/                 # EmailInbox, EmailDetails
│   ├── Maps/                  # Maps, VectorMap
│   ├── Ai/                    # AI generator pages (Text, Image, Code, Video) + AiSettings
│   ├── Layouts/               # LayoutOne … LayoutSix (alternative sidebar demos)
│   └── OtherPage/             # NotFound, ComingSoon, Maintenance, Success, 500, 503…
├── components/
│   ├── ui/                    # primitives: alert/, avatar/, badge/, button/, card/,
│   │                          #   carousel/, dropdown/, modal/, pagination/, table/, tabs/,
│   │                          #   tooltip/, popover/, progressbar/, spinner/, ribbons/…
│   ├── form/                  # Form, Label, Select, MultiSelect, date-picker + input/, switch/
│   ├── common/                # shared widgets: PageBreadCrumb, ComponentCard,
│   │                          #   ThemeToggleButton, ScrollToTop, TableDropdown, ChartTab…
│   ├── header/                # AppHeader dropdowns (notifications, user menu, language…)
│   └── <feature>/             # one folder per domain: ecommerce/, crm/, analytics/,
│                              #   charts/, chats/, task/, invoice/, ai/, maps/…
├── layout/                    # AppLayout (sidebar+header shell), AlternativeLayout,
│                              #   AppSidebar, AppHeader, Backdrop, SidebarWidget
├── context/                   # ThemeContext, SidebarContext, LanguageContext
├── hooks/                     # useModal, useAsyncData, usePagination, useDebouncedValue, useGoBack, useClickOutside, useOnlineStatus, usePwa
├── i18n/                      # index.ts — i18next bootstrap (resources, defaultNS, fallbackLng)
├── locales/                   # translation files: en/common.json, ar/common.json,
│                              #   es/common.json, de/common.json, vi/common.json
├── icons/                     # .svg files + index.ts barrel (SVGR named exports)
└── utils/                     # utility helpers
```

## Stack

- **React 19** with strict **TypeScript** (~5.7), bundled by **Vite 8**.
- **React Router v8** (`react-router`) for client-side routing via `BrowserRouter`.
- **react-i18next v17** + **i18next v26** for internationalization and RTL support.
- **Tailwind CSS v4** — configured entirely through `src/index.css`; **no `tailwind.config` file exists**.
- **react-apexcharts** for charts, **@fullcalendar/react** for the calendar, **Swiper** for carousels.
- Path alias: `@/*` → `src/*` (configured in `tsconfig.app.json` + `vite.config.ts`).
- Scripts: `npm run dev` (Vite dev server), `npm run build` (tsc + Vite), `npm run lint`.
- Node >= 20.19.0 || >= 22.12.0 required (Vite 8 requirement).

## Routing Conventions

- All routes are registered in `src/App.tsx` using `<Routes>` / `<Route>`.
- Three layout groups:
  - **`<AppLayout>`** — standard dashboard shell (sidebar + header). Most pages live here.
  - **`<AlternativeLayout>`** — full-width shell for AI generator pages and AI settings.
  - **No layout** — standalone pages: the auth route (`/signin`), error pages, layout demos.
- **New page** → create a file or folder under `src/pages/<Category>/MyPage.tsx`, then add a `<Route>` in `App.tsx` under the appropriate layout group.
- Page files are **PascalCase** (`MyPage.tsx`) with a **default export**.
- Colocate route-only sub-components inside the page folder. Reusable UI goes in `src/components/<feature>/`.

## Conventions

- **Component files**: PascalCase (`EcommerceMetrics.tsx`) with a **default export**.
- **Hook files**: camelCase (`useModal.ts`).
- **New reusable component** → `src/components/<feature>/` if domain-specific, else `src/components/common/` or `src/components/ui/`.
- **New icon** → drop the `.svg` into `src/icons/`, add a named export to `src/icons/index.ts` using a PascalCase name (e.g., `export { ReactComponent as MyIcon } from "./my-icon.svg"`). Never inline SVG markup in components.
- **App page layout** (all warehouse screens): `common/PageHeader` (the page `<h1>`, one-line `description`, `meta` = `DataSourceBadge`, `actions` = the primary action) → optional summary `StatCard` row → a `<section>` with `FilterToolbar` + `AsyncContent` + table + `ListPagination`. No `ComponentCard` around lists and no breadcrumb: the page title is the only heading above the content.
- **Template demo pages** (UI Elements, Forms, Tables demos) keep `<PageBreadCrumb>` and `<ComponentCard>`; do not use them on app pages.
- Modals use the `useModal` hook (`isOpen`, `openModal`, `closeModal`, `toggleModal`).
- Global state goes through the existing contexts (`useSidebar`, `useTheme`, `useLanguage`) — do not add new providers without a clear need.
- Prefer primitives from `src/components/ui/` and `src/components/form/` over raw HTML or new third-party equivalents.

## Internationalization (react-i18next) Rules

- **Setup**: i18next is bootstrapped in `src/i18n/index.ts` and imported once in `src/main.tsx`. Do not re-initialize it.
- **Supported locales**: `en`, `ar`, `es`, `de`, `vi`. All share the single `"common"` namespace.
- **Translation dictionaries**: `src/locales/<locale>/common.json`. When adding any user-facing string, add the key to **all five** locale files.
- **Using translations**:
  - In any component (all are client-side in Vite/React): use the `useTranslation` hook.
    ```tsx
    import { useTranslation } from "react-i18next";
    const { t } = useTranslation(); // uses default "common" namespace
    return <p>{t("myKey")}</p>;
    ```
  - Organize keys by feature namespace inside `common.json` (e.g., `"ecommerce": { "metrics": { "customers": "Customers" } }`), then access with `t("ecommerce.metrics.customers")`.
- **Language switching**: Use `useLanguage()` from `src/context/LanguageContext.tsx`. Call `setLanguage(code)` — it updates i18next, `localStorage`, and `document.documentElement.lang`/`dir` automatically.
- **RTL**: Arabic (`ar`) sets `dir="rtl"` on `<html>`. `LanguageContext` exposes `dir: "ltr" | "rtl"` for conditional logic. Use CSS logical properties everywhere (see Styling Rules) — the RTL flip is CSS-driven and requires no JS conditionals for layout.

## Styling Rules

- Tailwind CSS **v4** — the entire theme lives in `src/index.css` under `@theme`. **Never create a `tailwind.config.js/ts`**.
- Always use theme tokens instead of hardcoded values:
  - **Colors**: `brand`, `gray`, `blue-light`, `orange`, `success`, `error`, `warning` scales (`25`–`950`), plus `theme-pink-500` / `theme-purple-500`.
  - **Typography**: `font-sans` = Be Vietnam Pro (loaded in `index.html`, chosen for Vietnamese diacritics; system fallback). App UI uses Tailwind's `text-xs/sm/base/lg/xl/2xl`; page title `text-xl sm:text-2xl`, dialog title `text-lg`, stat value `text-2xl`. `text-title-*` (30–72px) is for template/marketing pages only. Amounts use `tabular-nums` (on by default in tables and stat cards).
  - **Shadows**: `shadow-theme-xs/sm/md/lg/xl`, `shadow-focus-ring`, `shadow-slider-navigation`, `shadow-tooltip`, `shadow-datepicker`.
  - **Breakpoints**: custom `2xsm` (375px), `xsm` (425px), `3xl` (2000px) alongside defaults.
  - **Z-index**: `z-1`, `z-9`, `z-99`, `z-999`, `z-9999`, `z-99999`, `z-999999` tokens.
- **Dark mode is class-based** (`@custom-variant dark (&:is(.dark *))`, toggled by `ThemeContext` adding/removing `.dark` on `<html>`). Every styled element must include its `dark:` variant — **except** when it uses a semantic token below, whose dark value is already built in.
- **Semantic tokens** (defined in `index.css` under `:root` / `.dark` + `@theme inline`) are the single source of truth for recurring surface, border and text decisions. Prefer them over raw light/dark pairs:

  | Token | Replaces | Use for |
  | --- | --- | --- |
  | `bg-surface` | `bg-white dark:bg-white/3` | cards, table frames, stat cards |
  | `bg-canvas` | `bg-gray-50 dark:bg-gray-900` | page background (set on `body`) |
  | `bg-surface-subtle` | `bg-gray-50 dark:bg-white/2` | table header band, row hover, totals panels |
  | `bg-surface-muted` | `bg-gray-100 dark:bg-gray-800` | skeleton bars, hover fills on icon buttons |
  | `border-line` | `border-gray-200 dark:border-gray-800` | outer borders |
  | `border-line-subtle` / `divide-line-subtle` | `border-gray-100 dark:border-gray-800` | dividers, table rows |
  | `text-fg` | `text-gray-800 dark:text-white/90` | headings, primary values |
  | `text-fg-muted` | `text-gray-500 dark:text-gray-400` | secondary text, table body |
  | `text-fg-subtle` | `text-gray-400 dark:text-gray-500` | group labels, tertiary text |

  To restyle every card/table/modal at once, change the token value in `index.css`, not the components. Add a token only for a decision that recurs across features.
- **Form control look** (border, focus ring, error/success, disabled) lives in `src/components/form/controlStyles.ts` and is shared by `InputField`, `Select` and `TextArea`.
- **`cn()`** (`@/utils`) knows the custom `text-theme-*` / `text-title-*` / `shadow-theme-*` scales; always merge classes with it (never string concatenation) so a `className` override wins.
- **CSS Logical Properties for RTL & Internationalization**:
  - Never use physical directional utilities when logical equivalents exist; physical `left`/`right` properties break the Arabic (`ar`) RTL layout:
    - **Margins**: use `ms-*` / `me-*` instead of `ml-*` / `mr-*`.
    - **Padding**: use `ps-*` / `pe-*` instead of `pl-*` / `pr-*`.
    - **Positioning / Insets**: use `start-*` / `end-*` instead of `left-*` / `right-*`.
    - **Borders**: use `border-s-*` / `border-e-*` instead of `border-l-*` / `border-r-*`.
    - **Border Radius**: use `rounded-s-*` / `rounded-e-*` / `rounded-ss-*` / `rounded-se-*` / `rounded-es-*` / `rounded-ee-*` instead of `rounded-l-*` / `rounded-r-*`.
    - **Text Alignment**: use `text-start` / `text-end` instead of `text-left` / `text-right`.
  - **Directional Icons & Transforms**:
    - Directional glyphs (back/forward arrows, breadcrumb chevrons, next/prev buttons) must flip in RTL: use `rtl:rotate-180` or `rtl:-scale-x-100`.
    - Off-canvas drawers and sliding elements must mirror their translation (e.g., `-translate-x-full rtl:translate-x-full`).
    - Use `ltr:*` / `rtl:*` modifiers only when a logical property does not exist or for third-party integration overrides.
- Reusable `@utility` classes already defined in `index.css` (`menu-item`, `menu-item-active`, `menu-item-inactive`, `menu-item-icon`, `menu-dropdown-item`, `menu-dropdown-badge`, `custom-scrollbar`, `no-scrollbar`, …) — reuse them before creating new ones.
- All third-party CSS overrides (ApexCharts, FullCalendar, Swiper, flatpickr, simplebar-react) live at the bottom of `index.css`. Add overrides there, matching the existing `@apply` style.
- Never hardcode hex colors in `className`. Chart option objects (`ApexOptions.colors`) are the established exception — copy hex values from the `@theme` palette (e.g., `#465fff` = `brand-500`, `#12b76a` = `success-500`).

## Component Rules

- **One feature, one folder**: page UI goes in `src/components/<feature>/`, split into focused, single-responsibility sub-components (e.g., `EcommerceMetrics.tsx`, `RecentOrders.tsx`). Avoid one monolithic file per page.
- **Composition over prop drilling**: pass `children`, separate container/state logic from presentational components, extract large JSX sections into their own files, and define explicit typed prop interfaces per sub-component.
- **Charts** (`react-apexcharts`): import lazily with `React.lazy` + `Suspense`, or guard with `if (typeof window === "undefined") return null`. Follow the pattern used in existing chart components before choosing an approach.
- **FullCalendar** and **Swiper**: these are also browser-only — follow the existing pattern in `src/pages/Calendar.tsx` and carousel components respectively before importing directly.
- **Icons**: always import from `@/icons` using the named export (e.g., `import { CalendarIcon } from "@/icons"`). SVGs are compiled to React components via `vite-plugin-svgr`. Never inline raw SVG markup in components.
- **Modals**: use `useModal` hook from `src/hooks/useModal.ts` and the `<Modal>` primitive from `src/components/ui/modal/`.
- **Global state**: consume only via existing hooks — `useSidebar()`, `useTheme()`, `useLanguage()`.

### Primitive map — use these, never raw HTML

Before writing any raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<label>` or a hand-styled box, pick the primitive below. **Always reuse the template component:** if it lacks a feature or is buggy, fix or extend that component (backward compatible) — never replace it with raw HTML, a native fallback or a parallel component, and never copy its markup. Create a new primitive only when the template has nothing for the need, and build it on template primitives. Say in the report which component was fixed and why.

| Need | Use | Notes |
| --- | --- | --- |
| Text / search input | `form/input/InputField` | Pass `maxLength` from `utils/validation` `fieldLimits`; show a field error with `error` + `hint` |
| Date input | `form/date-picker` (flatpickr) | **Must be fixed before app use** (uncontrolled: no `value`, no `disabled`/`error`, `#id` selector breaks with `useId()`). The app's current `InputField type="date"` fields are legacy, to be migrated (see `docs/process/03-patterns-and-next-steps.md`); a new date field fixes `form/date-picker` first |
| Money / quantity input | `form/input/NumberInput` | `kind="money"` (whole VND) or `"quantity"` (≤ 3 decimals). Never `<Input type="number">`: it shows "0001", lets "e"/"-" through and changes on scroll |
| Search box with magnifier | `common/SearchInput` | |
| Dropdown value picker | `form/Select` | Pass `value` (controlled); never remount with `key`. Per-option `disabled`, `error`, `placeholder` supported |
| Multi-line text | `form/input/TextArea` | |
| Checkbox | `form/input/Checkbox` | |
| Field label | `form/Label` | Pair with `htmlFor` / `id` |
| Text button | `ui/button/Button` | Variants: `primary`, `outline`, `danger`, `successOutline`, `errorOutline`; `loading` for busy state |
| Icon-only button (table row actions) | `ui/button/IconButton` | `label` is required (aria-label + tooltip); `tone`: `brand` / `success` / `error` |
| View-mode switch (e.g. day/week/month) | `common/SegmentedControl` | |
| Popover menu ("⋯", user menu) | `ui/dropdown/Dropdown` + `DropdownItem` | Not for picking a form value — use `Select` |
| Error / warning / success message | `common/InlineAlert` | `ui/alert/Alert` only when a title + icon + link is needed |
| Validation text under a field / filter group | `common/FieldError` | |
| Loading → load error (retry) → content | `common/AsyncContent` | Wraps a data section; `placeholder="table"` (skeleton) or `"box"`. Empty results stay the child's `EmptyState` |
| Loading placeholder (standalone) | `common/LoadingState` (box) or `common/TableSkeleton` (table) | Prefer `AsyncContent` |
| No data | `common/EmptyState` | `compact` for empty sections inside forms |
| Headline number card | `common/StatCard` | Only for numbers that matter for the page's task. `tone="warning"/"error"` for values needing attention; `onClick` + `isActive` turns it into a filter toggle for the list below |
| Page title + primary action | `common/PageHeader` | One per app page; primary action goes in `actions` |
| List toolbar (search + filters) | `common/FilterToolbar` | `search` slot (wide), filters as children (fixed width each), optional `actions` for secondary controls. The primary "create" action belongs in `PageHeader`, not here |
| "Supabase data" / "Demo data" indicator | `common/DataSourceBadge` | |
| Data table | `ui/table`: `TableContainer` > `Table` > `TableHeader`/`TableBody` > `TableRow` > `TableCell` | Styled by default (header band, sentence-case headers, compact rows, row hover, cells `nowrap` so the container scrolls on mobile). `align="end"` for every amount/quantity/action column; `font-medium text-fg` for the key value; `min-w-64 whitespace-normal` for long free text |
| Dialog | `ui/modal`: `Modal` (`size` `sm`/`md`/`lg`/`xl`) + `ModalHeader` + `ModalFooter`, with `useModal` | `ModalHeader` names the dialog; a custom heading uses `useModalTitleId()` |
| Yes/no confirmation | `common/ConfirmDialog` | Feature wrapper passes the copy; `tone="danger"` for destructive actions |
| Badge / Pagination | `ui/badge/Badge`, `common/ListPagination` | Badges never wrap |

Shared logic for screens:

| Need | Use |
| --- | --- |
| Load data with loading / error / retry | `hooks/useAsyncData(load, { initialData, errorMessage, onSuccess?, offlineKey? })` — `load` memoized; `null` skips (invalid filters); `setData` for local updates after a mutation; `offlineKey` (must include every request parameter) shows the last saved copy when offline (ADMIN only) and returns `cachedAt` for `DataSourceBadge` |
| Online / offline state, PWA install & update | `hooks/useOnlineStatus`, `hooks/usePwa` (state lives in `lib/pwa/pwaStore.ts`; service worker is `public/sw.js`) |
| Client-side paging that resets when filters change | `hooks/usePagination`: `usePagedItems(items, resetKey)` → `pageItems` + `pagination` (spread on `ListPagination`); `useResettablePage(resetKey)` for server paging |
| Error message from a thrown value | `utils/getErrorMessage(error, t("…"))` |
| Quantity / money display | `utils/formatQuantity`, `utils/formatCurrency` |
| Form field checks (required, length, email/phone/tax code/code) | `utils/validation` (`validateText`, `fieldLimits`, `collectErrors`); one `<feature>Validation.ts` per form returning errors per field |
| Document line rules (same as the `parse_draft_items` RPC) | `utils/documentLines` (`getLineAmountIssue`, `isDocumentDiscountTooHigh`) |

Exception: libraries that only accept HTML strings (flatpickr `prevArrow`/`nextArrow`) may keep inline SVG strings.

## Don'ts

- Don't install new packages without asking the user.
- Don't bypass a template component (raw HTML, native fallback, parallel component) — fix or extend the template component instead.
- Don't create a `tailwind.config.js` or `tailwind.config.ts` — Tailwind v4 is fully configured through `src/index.css`.
- Don't hardcode hex colors or pixel values in `className` — always use `@theme` tokens.
- Don't hardcode user-facing text — add keys to all five `src/locales/<locale>/common.json` files and use `t()`.
- Don't use physical directional utilities (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `border-l-*`, `border-r-*`, `rounded-l-*`, `rounded-r-*`, `text-left`, `text-right`) — always prefer CSS logical equivalents (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `border-s-*`, `border-e-*`, `rounded-s-*`, `rounded-e-*`, `text-start`, `text-end`).
- Don't import `react-apexcharts`, `FullCalendar`, or `Swiper` at the module level without verifying they are safe to do so in that component's context — always check the existing pattern in that feature folder first.
- Don't add new pages outside `src/pages/` or new routes outside `src/App.tsx`.
- Don't add new context providers without a clear, broad need — prefer local state or composition.
- Don't inline SVG markup in components — always add the `.svg` to `src/icons/` and export it from the barrel `index.ts`.
- Don't use `styled-components`, CSS Modules, or any CSS-in-JS — Tailwind utility classes with `@utility` extensions in `index.css` are the only styling mechanism.
