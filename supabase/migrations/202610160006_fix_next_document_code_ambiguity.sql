-- Fix: next_document_code always failed with
--   42702 column reference "document_type" is ambiguous
-- because the parameter `document_type` has the same name as the column in
-- document_sequences (INSERT column list / ON CONFLICT target). Every caller
-- was affected: creating stock receipts, stock issues, customer and supplier
-- payments. Same signature and body; only the conflict resolution is added,
-- so named-argument callers keep working.
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
  if normalized_type = '' then
    raise exception 'Document type is required';
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
