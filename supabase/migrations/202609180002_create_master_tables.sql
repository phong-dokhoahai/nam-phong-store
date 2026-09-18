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
