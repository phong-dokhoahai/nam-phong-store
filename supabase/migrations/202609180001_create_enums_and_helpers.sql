create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum (
  'ADMIN',
  'WAREHOUSE_STAFF'
);

create type public.document_status as enum (
  'DRAFT',
  'CONFIRMED',
  'CANCELLED'
);

create type public.payment_status as enum (
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'OVERPAID'
);

create type public.payment_method as enum (
  'CASH',
  'BANK_TRANSFER',
  'OTHER'
);

create type public.inventory_movement_type as enum (
  'PURCHASE_IN',
  'SALE_OUT',
  'SALE_RETURN_IN',
  'PURCHASE_RETURN_OUT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'REVERSAL_IN',
  'REVERSAL_OUT'
);

create type public.debt_direction as enum (
  'RECEIVABLE',
  'PAYABLE'
);

create type public.debt_entry_type as enum (
  'CHARGE',
  'PAYMENT',
  'RETURN',
  'REVERSAL',
  'ADJUSTMENT'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(150) not null,
  role public.app_role not null default 'WAREHOUSE_STAFF',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'ADMIN'::public.app_role
$$;

create or replace function public.is_warehouse_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'WAREHOUSE_STAFF'::public.app_role
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_name text;
begin
  safe_name = nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');

  insert into public.profiles (
    id,
    full_name,
    role,
    is_active
  )
  values (
    new.id,
    coalesce(safe_name, nullif(new.email, ''), 'New user'),
    'WAREHOUSE_STAFF',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.protect_append_only_rows()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

create or replace function public.protect_confirmed_document()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.allow_document_state_update', true), '') = 'on' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' and old.status <> 'DRAFT'::public.document_status then
    raise exception 'Cannot delete non-draft document from %', tg_table_name;
  end if;

  if tg_op = 'UPDATE' and old.status <> 'DRAFT'::public.document_status then
    raise exception 'Cannot update non-draft document from %', tg_table_name;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.validate_document_lifecycle()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'DRAFT'::public.document_status then
    if new.confirmed_by is not null
       or new.confirmed_at is not null
       or new.cancelled_by is not null
       or new.cancelled_at is not null
       or new.cancellation_reason is not null then
      raise exception 'Draft documents cannot have confirmation or cancellation metadata';
    end if;
  elsif new.status = 'CONFIRMED'::public.document_status then
    if new.confirmed_by is null or new.confirmed_at is null then
      raise exception 'Confirmed documents require confirmed_by and confirmed_at';
    end if;

    if new.cancelled_by is not null
       or new.cancelled_at is not null
       or new.cancellation_reason is not null then
      raise exception 'Confirmed documents cannot have cancellation metadata';
    end if;
  elsif new.status = 'CANCELLED'::public.document_status then
    if new.cancelled_by is null
       or new.cancelled_at is null
       or nullif(trim(new.cancellation_reason), '') is null then
      raise exception 'Cancelled documents require cancellation actor, time, and reason';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.protect_draft_child_rows()
returns trigger
language plpgsql
as $$
declare
  parent_status public.document_status;
  parent_table_name text := tg_argv[0];
  parent_key_name text := tg_argv[1];
  parent_id uuid;
begin
  execute format('select ($1).%I', parent_key_name) into parent_id using old;

  execute format('select status from public.%I where id = $1', parent_table_name)
    into parent_status
    using parent_id;

  if parent_status is distinct from 'DRAFT'::public.document_status then
    raise exception 'Cannot mutate item rows for non-draft document %', parent_table_name;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.validate_document_actor()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by = auth.uid();
  end if;

  if tg_op = 'INSERT' and new.created_by is distinct from auth.uid() then
    raise exception 'created_by must match the current user';
  end if;

  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_active_user() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_warehouse_staff() from public;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_warehouse_staff() to authenticated;
