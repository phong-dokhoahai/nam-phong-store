create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  name varchar(150) not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(30) not null unique,
  name varchar(100) not null,
  precision smallint not null default 0 check (precision between 0 and 3),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default extensions.gen_random_uuid(),
  sku varchar(80) not null unique,
  name varchar(200) not null,
  category_id uuid not null references public.categories(id),
  unit_id uuid not null references public.units(id),
  description text,
  default_purchase_price bigint not null default 0 check (default_purchase_price >= 0),
  default_sale_price bigint not null default 0 check (default_sale_price >= 0),
  minimum_stock numeric(18,3) not null default 0 check (minimum_stock >= 0),
  current_stock numeric(18,3) not null default 0 check (current_stock >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  name varchar(200) not null,
  phone varchar(30),
  email varchar(255),
  address text,
  tax_code varchar(50),
  note text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_walk_in_active check (code <> 'WALK_IN_CUSTOMER' or is_active = true)
);

create table public.suppliers (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  name varchar(200) not null,
  contact_name varchar(150),
  phone varchar(30),
  email varchar(255),
  address text,
  tax_code varchar(50),
  note text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  supplier_id uuid not null references public.suppliers(id),
  receipt_date date not null,
  status public.document_status not null default 'DRAFT',
  subtotal bigint not null default 0 check (subtotal >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  shipping_fee bigint not null default 0 check (shipping_fee >= 0),
  tax_amount bigint not null default 0 check (tax_amount >= 0),
  total_amount bigint not null default 0 check (total_amount >= 0),
  paid_amount bigint not null default 0 check (paid_amount >= 0),
  debt_amount bigint not null default 0 check (debt_amount >= 0),
  payment_status public.payment_status not null default 'UNPAID',
  supplier_invoice_number varchar(100),
  note text,
  created_by uuid not null references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_receipts_total_amount_check
    check (total_amount = subtotal - discount_amount + shipping_fee + tax_amount),
  constraint purchase_receipts_paid_debt_sum_check
    check (paid_amount + debt_amount <= total_amount),
  constraint purchase_receipts_debt_amount_check
    check (debt_amount <= total_amount),
  constraint purchase_receipts_paid_amount_check
    check (paid_amount <= total_amount),
  constraint purchase_receipts_no_overpaid_mvp_check
    check (payment_status <> 'OVERPAID'),
  unique (id, supplier_id)
);

create table public.purchase_receipt_items (
  id uuid primary key default extensions.gen_random_uuid(),
  purchase_receipt_id uuid not null references public.purchase_receipts(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  material_sku_snapshot varchar(80),
  material_name_snapshot varchar(200),
  unit_name_snapshot varchar(100),
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  line_total bigint not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_receipt_items_line_total_check
    check (line_total = (quantity * unit_price) - discount_amount),
  unique (purchase_receipt_id, material_id),
  unique (id, material_id)
);

create table public.sales_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  customer_id uuid not null references public.customers(id),
  sale_date date not null,
  status public.document_status not null default 'DRAFT',
  subtotal bigint not null default 0 check (subtotal >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  shipping_fee bigint not null default 0 check (shipping_fee >= 0),
  tax_amount bigint not null default 0 check (tax_amount >= 0),
  total_amount bigint not null default 0 check (total_amount >= 0),
  paid_amount bigint not null default 0 check (paid_amount >= 0),
  debt_amount bigint not null default 0 check (debt_amount >= 0),
  payment_status public.payment_status not null default 'UNPAID',
  delivery_address text,
  note text,
  created_by uuid not null references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_orders_total_amount_check
    check (total_amount = subtotal - discount_amount + shipping_fee + tax_amount),
  constraint sales_orders_paid_debt_sum_check
    check (paid_amount + debt_amount <= total_amount),
  constraint sales_orders_debt_amount_check
    check (debt_amount <= total_amount),
  constraint sales_orders_paid_amount_check
    check (paid_amount <= total_amount),
  constraint sales_orders_no_overpaid_mvp_check
    check (payment_status <> 'OVERPAID'),
  unique (id, customer_id)
);

create table public.sales_order_items (
  id uuid primary key default extensions.gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  material_sku_snapshot varchar(80),
  material_name_snapshot varchar(200),
  unit_name_snapshot varchar(100),
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  line_total bigint not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_order_items_line_total_check
    check (line_total = (quantity * unit_price) - discount_amount),
  unique (sales_order_id, material_id),
  unique (id, material_id)
);

create table public.customer_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  customer_id uuid not null references public.customers(id),
  sales_order_id uuid not null references public.sales_orders(id),
  payment_date date not null,
  amount bigint not null check (amount > 0),
  method public.payment_method not null,
  reference_number varchar(150),
  note text,
  reversal_of_id uuid unique references public.customer_payments(id),
  reversal_reason text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint customer_payments_order_customer_fk
    foreign key (sales_order_id, customer_id) references public.sales_orders(id, customer_id),
  constraint customer_payments_no_self_reversal
    check (reversal_of_id is null or reversal_of_id <> id)
);

create table public.supplier_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  supplier_id uuid not null references public.suppliers(id),
  purchase_receipt_id uuid not null references public.purchase_receipts(id),
  payment_date date not null,
  amount bigint not null check (amount > 0),
  method public.payment_method not null,
  reference_number varchar(150),
  note text,
  reversal_of_id uuid unique references public.supplier_payments(id),
  reversal_reason text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint supplier_payments_receipt_supplier_fk
    foreign key (purchase_receipt_id, supplier_id) references public.purchase_receipts(id, supplier_id),
  constraint supplier_payments_no_self_reversal
    check (reversal_of_id is null or reversal_of_id <> id)
);

create table public.debt_ledger_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  direction public.debt_direction not null,
  customer_id uuid references public.customers(id),
  supplier_id uuid references public.suppliers(id),
  entry_type public.debt_entry_type not null,
  entry_date date not null,
  amount_delta bigint not null check (amount_delta <> 0),
  source_type varchar(50) not null,
  source_id uuid not null,
  description text,
  reversal_of_id uuid references public.debt_ledger_entries(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (reversal_of_id),
  constraint debt_ledger_entries_no_self_reversal
    check (reversal_of_id is null or reversal_of_id <> id),
  constraint debt_ledger_party_check check (
    (direction = 'RECEIVABLE' and customer_id is not null and supplier_id is null)
    or (direction = 'PAYABLE' and supplier_id is not null and customer_id is null)
  )
);

create table public.inventory_movements (
  id uuid primary key default extensions.gen_random_uuid(),
  material_id uuid not null references public.materials(id),
  movement_type public.inventory_movement_type not null,
  movement_date date not null,
  quantity_delta numeric(18,3) not null check (quantity_delta <> 0),
  unit_cost bigint check (unit_cost is null or unit_cost >= 0),
  source_type varchar(50) not null,
  source_id uuid not null,
  source_item_id uuid not null,
  reversal_of_id uuid references public.inventory_movements(id),
  note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (reversal_of_id),
  constraint inventory_movements_no_self_reversal
    check (reversal_of_id is null or reversal_of_id <> id),
  constraint inventory_movements_direction_check check (
    (
      movement_type in ('PURCHASE_IN', 'SALE_RETURN_IN', 'ADJUSTMENT_IN', 'REVERSAL_IN')
      and quantity_delta > 0
    )
    or (
      movement_type in ('SALE_OUT', 'PURCHASE_RETURN_OUT', 'ADJUSTMENT_OUT', 'REVERSAL_OUT')
      and quantity_delta < 0
    )
  )
);

create table public.sales_returns (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  sales_order_id uuid not null references public.sales_orders(id),
  customer_id uuid not null references public.customers(id),
  return_date date not null,
  status public.document_status not null default 'DRAFT',
  total_amount bigint not null default 0 check (total_amount >= 0),
  refund_amount bigint not null default 0 check (refund_amount >= 0),
  reason text not null,
  created_by uuid not null references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_returns_refund_amount_check check (refund_amount <= total_amount),
  constraint sales_returns_order_customer_fk
    foreign key (sales_order_id, customer_id) references public.sales_orders(id, customer_id)
);

create table public.sales_return_items (
  id uuid primary key default extensions.gen_random_uuid(),
  sales_return_id uuid not null references public.sales_returns(id) on delete cascade,
  sales_order_item_id uuid not null references public.sales_order_items(id),
  material_id uuid not null references public.materials(id),
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  line_total bigint not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_return_items_line_total_check
    check (line_total = quantity * unit_price),
  constraint sales_return_items_order_item_material_fk
    foreign key (sales_order_item_id, material_id) references public.sales_order_items(id, material_id),
  unique (sales_return_id, sales_order_item_id)
);

create table public.purchase_returns (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  purchase_receipt_id uuid not null references public.purchase_receipts(id),
  supplier_id uuid not null references public.suppliers(id),
  return_date date not null,
  status public.document_status not null default 'DRAFT',
  total_amount bigint not null default 0 check (total_amount >= 0),
  refund_amount bigint not null default 0 check (refund_amount >= 0),
  reason text not null,
  created_by uuid not null references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_returns_refund_amount_check check (refund_amount <= total_amount),
  constraint purchase_returns_receipt_supplier_fk
    foreign key (purchase_receipt_id, supplier_id) references public.purchase_receipts(id, supplier_id)
);

create table public.purchase_return_items (
  id uuid primary key default extensions.gen_random_uuid(),
  purchase_return_id uuid not null references public.purchase_returns(id) on delete cascade,
  purchase_receipt_item_id uuid not null references public.purchase_receipt_items(id),
  material_id uuid not null references public.materials(id),
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  line_total bigint not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_return_items_line_total_check
    check (line_total = quantity * unit_price),
  constraint purchase_return_items_receipt_item_material_fk
    foreign key (purchase_receipt_item_id, material_id) references public.purchase_receipt_items(id, material_id),
  unique (purchase_return_id, purchase_receipt_item_id)
);

create table public.stocktakes (
  id uuid primary key default extensions.gen_random_uuid(),
  code varchar(50) not null unique,
  stocktake_date date not null,
  status public.document_status not null default 'DRAFT',
  note text,
  created_by uuid not null references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stocktake_items (
  id uuid primary key default extensions.gen_random_uuid(),
  stocktake_id uuid not null references public.stocktakes(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  system_quantity numeric(18,3) not null check (system_quantity >= 0),
  actual_quantity numeric(18,3) not null check (actual_quantity >= 0),
  difference_quantity numeric(18,3) generated always as (actual_quantity - system_quantity) stored,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stocktake_id, material_id),
  constraint stocktake_items_reason_check
    check (actual_quantity = system_quantity or nullif(trim(reason), '') is not null)
);

create table public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action varchar(100) not null,
  entity_type varchar(100) not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  request_id varchar(100),
  created_at timestamptz not null default now()
);

create table public.document_sequences (
  document_type varchar(50) not null,
  sequence_date date not null,
  current_value bigint not null default 0 check (current_value >= 0),
  updated_at timestamptz not null default now(),
  primary key (document_type, sequence_date)
);

create table public.idempotency_keys (
  id uuid primary key default extensions.gen_random_uuid(),
  key varchar(150) not null unique,
  user_id uuid not null references public.profiles(id),
  operation varchar(100) not null,
  request_hash varchar(128) not null,
  resource_type varchar(100),
  resource_id uuid,
  response_body jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (key, user_id, operation, request_hash)
);
