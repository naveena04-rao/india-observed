-- Private reader-submitted civic-event leads for human editorial review.

create table public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  location text not null,
  event_date date,
  date_precision text not null,
  source_links text[] not null default '{}',
  additional_context text,
  contact_email text not null,
  contact_phone text,
  status text not null default 'pending_review',
  submission_fingerprint text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_submissions_title_length check (char_length(title) between 5 and 160),
  constraint lead_submissions_description_length check (char_length(description) between 40 and 5000),
  constraint lead_submissions_location_length check (char_length(location) between 2 and 200),
  constraint lead_submissions_date_precision check (date_precision in ('exact', 'approximate', 'ongoing')),
  constraint lead_submissions_event_date check (date_precision = 'ongoing' or event_date is not null),
  constraint lead_submissions_source_count check (cardinality(source_links) <= 10),
  constraint lead_submissions_additional_context_length check (additional_context is null or char_length(additional_context) <= 3000),
  constraint lead_submissions_email_length check (char_length(contact_email) between 3 and 254),
  constraint lead_submissions_phone_length check (contact_phone is null or char_length(contact_phone) <= 30),
  constraint lead_submissions_status check (status in ('pending_review', 'under_review', 'closed', 'rejected', 'converted_to_record')),
  constraint lead_submissions_fingerprint_format check (submission_fingerprint ~ '^[a-f0-9]{64}$')
);

alter table public.lead_submissions enable row level security;
revoke all on table public.lead_submissions from public, anon, authenticated;

grant select on table public.lead_submissions to authenticated;
grant update (status, updated_at) on table public.lead_submissions to authenticated;

create policy lead_submissions_editor_select
on public.lead_submissions
for select
to authenticated
using (public.is_media_admin());

create policy lead_submissions_editor_update
on public.lead_submissions
for update
to authenticated
using (public.is_media_admin())
with check (public.is_media_admin());

create function public.submit_lead(
  p_title text,
  p_description text,
  p_location text,
  p_event_date date,
  p_date_precision text,
  p_source_links text[],
  p_additional_context text,
  p_contact_email text,
  p_contact_phone text,
  p_submission_fingerprint text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  new_id uuid;
begin
  insert into public.lead_submissions (
    title,
    description,
    location,
    event_date,
    date_precision,
    source_links,
    additional_context,
    contact_email,
    contact_phone,
    status,
    submission_fingerprint
  ) values (
    btrim(p_title),
    btrim(p_description),
    btrim(p_location),
    p_event_date,
    p_date_precision,
    coalesce(p_source_links, '{}'),
    nullif(btrim(p_additional_context), ''),
    lower(btrim(p_contact_email)),
    nullif(btrim(p_contact_phone), ''),
    'pending_review',
    p_submission_fingerprint
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_lead(text, text, text, date, text, text[], text, text, text, text)
from public, anon, authenticated;
grant execute on function public.submit_lead(text, text, text, date, text, text[], text, text, text, text)
to service_role;

comment on table public.lead_submissions is
  'Private reader-submitted leads. Contact information and review state are never public.';
comment on function public.submit_lead(text, text, text, date, text, text[], text, text, text, text) is
  'Server-only insertion boundary for validated leads; never creates or publishes an event record.';
