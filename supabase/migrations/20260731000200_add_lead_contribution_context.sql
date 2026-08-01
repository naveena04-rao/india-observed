-- Preserve event contribution context and reader-declared public media types.

alter table public.lead_submissions
  add column related_event_slug text,
  add column contribution_type text not null default 'new-lead',
  add column media_type text not null default 'none',
  add constraint lead_submissions_related_event_slug_format check (
    related_event_slug is null
    or (
      char_length(related_event_slug) <= 120
      and related_event_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
  ),
  add constraint lead_submissions_contribution_type check (
    contribution_type in ('new-lead', 'public-source', 'correction', 'official-response')
  ),
  add constraint lead_submissions_media_type check (
    media_type in ('none', 'photo', 'video', 'photo-and-video')
  );

drop function public.submit_lead(text, text, text, date, text, text[], text, text, text, text);

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
  p_related_event_slug text,
  p_contribution_type text,
  p_media_type text,
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
    related_event_slug,
    contribution_type,
    media_type,
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
    nullif(btrim(p_related_event_slug), ''),
    p_contribution_type,
    p_media_type,
    'pending_review',
    p_submission_fingerprint
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_lead(
  text, text, text, date, text, text[], text, text, text, text, text, text, text
)
from public, anon, authenticated;
grant execute on function public.submit_lead(
  text, text, text, date, text, text[], text, text, text, text, text, text, text
)
to service_role;

comment on function public.submit_lead(
  text, text, text, date, text, text[], text, text, text, text, text, text, text
) is
  'Server-only insertion boundary for validated leads and record contributions; never publishes an event record.';
