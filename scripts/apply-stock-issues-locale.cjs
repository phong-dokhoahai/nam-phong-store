const fs = require("node:fs");
const path = require("node:path");

const locales = ["en", "ar", "es", "de", "vi"];

const en = {
  title: "Stock Issues",
  listTitle: "Stock Issue / Sales Order",
  loading: "Loading stock issues...",
  toolbar: {
    searchLabel: "Search stock issues",
    statusLabel: "Filter stock issues by status",
    searchPlaceholder: "Search by code, customer, or delivery address...",
    allStatuses: "All statuses",
    liveSource: "Supabase data",
    demoSource: "Demo data",
  },
  table: {
    issue: "Issue",
    customer: "Customer",
    lines: "Lines",
    total: "Total",
    status: "Status",
    actions: "Actions",
    lineSummary: "{count} lines · {quantity} total",
  },
  status: {
    DRAFT: "Draft",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
  },
  actions: {
    create: "Create Issue",
    saveDraft: "Save Draft",
    saving: "Saving...",
    confirm: "Confirm Issue",
    edit: "Edit issue",
    view: "View issue",
  },
  empty: {
    title: "No stock issues found",
    description: "Create a draft issue to export stock or record a sale.",
  },
  editor: {
    createTitle: "Create stock issue",
    editTitle: "Issue {code}",
    subtitle:
      "Draft first, then confirm. Confirmation checks stock and exports all lines together.",
  },
  form: {
    customer: "Customer",
    customerPlaceholder: "Select customer",
    issueDate: "Issue date",
    deliveryAddress: "Delivery address",
    deliveryAddressPlaceholder: "Delivery or jobsite address...",
    note: "Note",
    notePlaceholder: "Delivery, sales, or warehouse notes...",
  },
  lines: {
    title: "Issue lines",
    add: "Add line",
    empty: "No materials selected.",
    material: "Material",
    unit: "Unit",
    quantity: "Quantity",
    unitPrice: "Sale price",
    discount: "Discount",
    remove: "Remove line",
    available: "Available: {quantity} {unit}",
  },
  summary: {
    subtotal: "Subtotal",
    issueDiscount: "Order discount",
    shippingFee: "Shipping fee",
    taxAmount: "Tax amount",
    total: "Total",
  },
  confirm: {
    title: "Confirm stock issue",
    description:
      "Confirm {code} for {total}? Stock will be reduced only if every line has enough available stock.",
    confirming: "Confirming...",
  },
  errors: {
    load: "Unable to load stock issues.",
    save: "Unable to save stock issue.",
    confirm: "Unable to confirm stock issue.",
    retry: "Retry",
    requiredHeader: "Customer and issue date are required.",
    requiredLines: "Add at least one material line.",
    invalidLine: "Fix invalid material lines before saving.",
    lineMaterial: "Material is required.",
    lineQuantity: "Quantity must be greater than 0.",
    lineUnitPrice: "Sale price cannot be negative.",
    lineDiscount: "Discount cannot be negative.",
    lineDiscountTooHigh: "Discount cannot exceed line subtotal.",
    duplicateMaterial: "Each material can only appear once.",
    insufficientStock: "Not enough stock. Available: {available}.",
  },
};

const vi = {
  title: "Xuất kho",
  listTitle: "Phiếu xuất / đơn bán hàng",
  loading: "Đang tải phiếu xuất...",
  toolbar: {
    searchLabel: "Tìm phiếu xuất",
    statusLabel: "Lọc phiếu xuất theo trạng thái",
    searchPlaceholder: "Tìm theo mã, khách hàng hoặc địa chỉ giao...",
    allStatuses: "Tất cả trạng thái",
    liveSource: "Dữ liệu Supabase",
    demoSource: "Dữ liệu mẫu",
  },
  table: {
    issue: "Phiếu xuất",
    customer: "Khách hàng",
    lines: "Dòng",
    total: "Tổng tiền",
    status: "Trạng thái",
    actions: "Thao tác",
    lineSummary: "{count} dòng · tổng {quantity}",
  },
  status: {
    DRAFT: "Nháp",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã hủy",
  },
  actions: {
    create: "Tạo phiếu xuất",
    saveDraft: "Lưu nháp",
    saving: "Đang lưu...",
    confirm: "Xác nhận xuất",
    edit: "Sửa phiếu xuất",
    view: "Xem phiếu xuất",
  },
  empty: {
    title: "Chưa có phiếu xuất",
    description: "Tạo phiếu nháp để xuất kho hoặc ghi nhận đơn bán.",
  },
  editor: {
    createTitle: "Tạo phiếu xuất",
    editTitle: "Phiếu {code}",
    subtitle:
      "Lưu nháp trước, sau đó xác nhận. Khi xác nhận hệ thống kiểm tra tồn và xuất toàn bộ dòng cùng lúc.",
  },
  form: {
    customer: "Khách hàng",
    customerPlaceholder: "Chọn khách hàng",
    issueDate: "Ngày xuất",
    deliveryAddress: "Địa chỉ giao hàng",
    deliveryAddressPlaceholder: "Địa chỉ giao hàng hoặc công trình...",
    note: "Ghi chú",
    notePlaceholder: "Ghi chú giao hàng, bán hàng hoặc kho...",
  },
  lines: {
    title: "Dòng xuất kho",
    add: "Thêm dòng",
    empty: "Chưa chọn vật liệu.",
    material: "Vật liệu",
    unit: "Đơn vị",
    quantity: "Số lượng",
    unitPrice: "Giá bán",
    discount: "Giảm giá",
    remove: "Xóa dòng",
    available: "Có thể xuất: {quantity} {unit}",
  },
  summary: {
    subtotal: "Tạm tính",
    issueDiscount: "Giảm giá đơn",
    shippingFee: "Phí giao hàng",
    taxAmount: "Thuế",
    total: "Tổng cộng",
  },
  confirm: {
    title: "Xác nhận xuất kho",
    description:
      "Xác nhận {code} với tổng {total}? Tồn kho chỉ bị trừ nếu tất cả dòng đều đủ tồn.",
    confirming: "Đang xác nhận...",
  },
  errors: {
    load: "Không thể tải phiếu xuất.",
    save: "Không thể lưu phiếu xuất.",
    confirm: "Không thể xác nhận phiếu xuất.",
    retry: "Thử lại",
    requiredHeader: "Khách hàng và ngày xuất là bắt buộc.",
    requiredLines: "Thêm ít nhất một dòng vật liệu.",
    invalidLine: "Sửa các dòng vật liệu chưa hợp lệ trước khi lưu.",
    lineMaterial: "Vật liệu là bắt buộc.",
    lineQuantity: "Số lượng phải lớn hơn 0.",
    lineUnitPrice: "Giá bán không được âm.",
    lineDiscount: "Giảm giá không được âm.",
    lineDiscountTooHigh: "Giảm giá không được vượt tạm tính dòng.",
    duplicateMaterial: "Mỗi vật liệu chỉ được xuất hiện một lần.",
    insufficientStock: "Không đủ tồn. Có thể xuất: {available}.",
  },
};

for (const locale of locales) {
  const filePath = path.join("src", "locales", locale, "common.json");
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  json.sidebar.items.stockIssues =
    locale === "vi" ? "Phiếu xuất kho" : "Stock Issues";
  json.stockIssues = locale === "vi" ? vi : en;
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}
