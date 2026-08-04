create table if not exists public.editorial_verification_decisions (
  lead_ref text primary key check (lead_ref ~ '^YR-(0[1-9]|[12][0-9]|3[0-2])$'),
  decision text not null check (decision in ('approve_private_draft', 'hold_for_evidence', 'reject')),
  note text,
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.editorial_verification_decisions is
  'Private owner decisions for the bounded 2025-08-04 to 2026-08-04 verification packet. Decisions never publish records.';

alter table public.editorial_verification_decisions enable row level security;

revoke all on table public.editorial_verification_decisions from public, anon, authenticated;
grant select on table public.editorial_verification_decisions to authenticated;

create policy editorial_verification_decisions_editor_select
on public.editorial_verification_decisions
for select
to authenticated
using (coalesce(public.is_authorised_editor(), false));

create or replace function public.review_twelve_month_verification_lead(
  p_lead_ref text,
  p_decision text,
  p_note text default null
) returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not coalesce(public.is_authorised_editor(), false) then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  if p_lead_ref !~ '^YR-(0[1-9]|[12][0-9]|3[0-2])$' then
    raise exception using errcode = '22023', message = 'Invalid verification lead';
  end if;
  if p_decision not in ('approve_private_draft', 'hold_for_evidence', 'reject') then
    raise exception using errcode = '22023', message = 'Invalid verification decision';
  end if;
  if p_decision in ('hold_for_evidence', 'reject')
    and char_length(trim(coalesce(p_note, ''))) < 4 then
    raise exception using errcode = '22023', message = 'A decision note is required';
  end if;

  insert into public.editorial_verification_decisions (
    lead_ref,
    decision,
    note,
    decided_by,
    decided_at,
    updated_at
  ) values (
    p_lead_ref,
    p_decision,
    nullif(trim(p_note), ''),
    auth.uid(),
    now(),
    now()
  )
  on conflict (lead_ref) do update
  set decision = excluded.decision,
      note = excluded.note,
      decided_by = excluded.decided_by,
      decided_at = excluded.decided_at,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.review_twelve_month_verification_lead(text, text, text)
from public, anon, authenticated;
grant execute on function public.review_twelve_month_verification_lead(text, text, text)
to authenticated;
