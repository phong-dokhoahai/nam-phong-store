-- Auth hardening after the 2026-10-20 authentication review.
--
-- 1. is_admin() / is_warehouse_staff() returned NULL (not false) for a caller
--    without an active profile, because current_user_role() is NULL then.
--    That NULL was the root cause of the 202610160005 self-promotion hole:
--    `not is_admin()` is NULL and skips the guard. The call sites were patched
--    with coalesce(); fixing the helpers themselves keeps new code safe.
--    Existing call sites are unaffected: in RLS `or` / `where` NULL and false
--    behave the same, and the coalesce() wrappers become no-ops.
--
-- 2. next_document_code() is security definer, granted to `authenticated` and
--    had no caller check, so any signed-in account, including an inactive
--    self-signed-up one, could burn document numbers or insert arbitrary rows
--    into document_sequences. It cannot be revoked from `authenticated`
--    because the security-invoker save_*_draft RPCs call it as the user, so it
--    now checks for an active profile and only accepts the document types the
--    RPCs use. Add a type here when a new document RPC needs one.
--    `anon` already has no EXECUTE on it (checked on the remote DB).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'ADMIN'::public.app_role, false)
$$;

create or replace function public.is_warehouse_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'WAREHOUSE_STAFF'::public.app_role, false)
$$;

create or replace function public.next_document_code(
  document_type text,
  document_date date default current_date
)
returns text
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  next_value bigint;
  normalized_type text := upper(trim(document_type));
begin
  if not public.is_active_user() then
    raise exception 'Only active users can create document codes'
      using errcode = '42501';
  end if;

  -- PN purchase receipt, BH sales order, PT customer payment, PC supplier payment.
  if normalized_type is null or normalized_type not in ('PN', 'BH', 'PT', 'PC') then
    raise exception 'Unknown document type: %', document_type
      using errcode = '22023';
  end if;

  if document_date is null then
    raise exception 'Document date is required'
      using errcode = '22023';
  end if;

  insert into public.document_sequences (
    document_type,
    sequence_date,
    current_value
  )
  values (
    normalized_type,
    document_date,
    1
  )
  on conflict (document_type, sequence_date)
  do update set
    current_value = public.document_sequences.current_value + 1,
    updated_at = now()
  returning current_value into next_value;

  return format(
    '%s-%s-%s',
    normalized_type,
    to_char(document_date, 'YYYYMMDD'),
    lpad(next_value::text, 4, '0')
  );
end;
$$;
