-- Schema-aligned, private event proposals. Legacy lead rows and submit_lead remain readable.

alter table public.lead_submissions
  add column submission_mode text not null default 'legacy',
  add column related_event_id text references public.events(id) on delete restrict,
  add column editorial_notes text,
  add constraint lead_submissions_submission_mode check (
    submission_mode in ('legacy', 'new-event', 'existing-event')
  ),
  add constraint lead_submissions_editorial_notes_length check (
    editorial_notes is null or char_length(editorial_notes) <= 3000
  );

alter table public.lead_submissions drop constraint lead_submissions_contribution_type;
alter table public.lead_submissions add constraint lead_submissions_contribution_type check (
  contribution_type in ('new-lead', 'new-event', 'public-source', 'correction', 'official-response')
);

create table public.lead_event_field_proposals (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.lead_submissions(id) on delete cascade,
  field_key text not null,
  existing_value_snapshot text,
  proposed_value text not null,
  contributor_explanation text,
  review_status text not null default 'pending_review',
  reviewer_decision text,
  accepted_value text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint lead_proposal_field_key check (field_key in (
    'title', 'event_type', 'main_issue', 'primary_topic', 'state_name', 'general_location',
    'start_date', 'end_date', 'lifecycle_status', 'neutral_summary', 'directed_at',
    'latest_official_response'
  )),
  constraint lead_proposal_value_length check (char_length(proposed_value) between 1 and 5000),
  constraint lead_proposal_explanation_length check (
    contributor_explanation is null or char_length(contributor_explanation) <= 2000
  ),
  constraint lead_proposal_review_status check (
    review_status in ('pending_review', 'under_review', 'accepted', 'rejected', 'superseded')
  )
);

create table public.lead_submission_sources (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.lead_submissions(id) on delete cascade,
  supported_field_key text,
  source_url text not null check (source_url ~ '^https?://'),
  headline text not null,
  publisher text not null,
  source_type text not null,
  source_role text not null,
  publication_date date,
  language text,
  source_summary text,
  review_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  constraint lead_source_field_key check (supported_field_key is null or supported_field_key in (
    'title', 'event_type', 'main_issue', 'primary_topic', 'state_name', 'general_location',
    'start_date', 'end_date', 'lifecycle_status', 'neutral_summary', 'directed_at',
    'latest_official_response'
  )),
  constraint lead_source_role check (source_role in (
    'Lead', 'Corroboration', 'Follow-up', 'Official context', 'Official response',
    'Historical context', 'Alternate access'
  )),
  constraint lead_source_review_status check (
    review_status in ('pending_review', 'under_review', 'accepted', 'rejected')
  )
);

create table public.lead_submission_media (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.lead_submissions(id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  media_url text not null check (media_url ~ '^https?://'),
  caption text not null,
  source_or_creator text not null,
  publication_date date,
  depicts text not null,
  privacy_safety_note text,
  review_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  constraint lead_media_review_status check (
    review_status in ('pending_review', 'under_review', 'accepted', 'rejected')
  )
);

alter table public.lead_event_field_proposals enable row level security;
alter table public.lead_submission_sources enable row level security;
alter table public.lead_submission_media enable row level security;
revoke all on table public.lead_event_field_proposals, public.lead_submission_sources,
  public.lead_submission_media from public, anon, authenticated;
grant select, update on table public.lead_event_field_proposals, public.lead_submission_sources,
  public.lead_submission_media to authenticated;

create policy lead_proposals_editor_access on public.lead_event_field_proposals
  for all to authenticated using (public.is_media_admin()) with check (public.is_media_admin());
create policy lead_sources_editor_access on public.lead_submission_sources
  for all to authenticated using (public.is_media_admin()) with check (public.is_media_admin());
create policy lead_media_editor_access on public.lead_submission_media
  for all to authenticated using (public.is_media_admin()) with check (public.is_media_admin());

create function public.submit_structured_lead(
  p_submission_mode text, p_contribution_type text, p_related_event_slug text,
  p_related_event_id text, p_proposals jsonb, p_sources jsonb, p_media jsonb,
  p_editorial_notes text, p_contact_email text, p_contact_phone text,
  p_submission_fingerprint text
) returns uuid
language plpgsql volatile security definer set search_path = pg_catalog, public
as $$
declare
  new_id uuid;
  item jsonb;
  media_summary text;
begin
  if p_submission_mode not in ('new-event', 'existing-event') then
    raise exception 'invalid submission mode' using errcode = '22023';
  end if;
  if (p_submission_mode = 'existing-event') <> (p_related_event_id is not null and p_related_event_slug is not null) then
    raise exception 'invalid target event' using errcode = '22023';
  end if;
  if p_related_event_id is not null and not exists (select 1 from public.events where id = p_related_event_id) then
    raise exception 'target event not found' using errcode = '23503';
  end if;
  if jsonb_typeof(coalesce(p_proposals, '[]')) <> 'array'
    or jsonb_typeof(coalesce(p_sources, '[]')) <> 'array'
    or jsonb_typeof(coalesce(p_media, '[]')) <> 'array' then
    raise exception 'invalid structured contribution' using errcode = '22023';
  end if;

  select case when count(*) = 0 then 'none' when bool_and(value->>'mediaType' = 'photo') then 'photo'
    when bool_and(value->>'mediaType' = 'video') then 'video' else 'photo-and-video' end
  into media_summary from jsonb_array_elements(coalesce(p_media, '[]'));

  insert into public.lead_submissions (
    title, description, location, date_precision, source_links, additional_context,
    contact_email, contact_phone, related_event_slug, related_event_id, contribution_type,
    media_type, submission_mode, editorial_notes, status, submission_fingerprint
  ) values (
    'Structured ' || replace(p_contribution_type, '-', ' ') || ' contribution',
    'Schema-aligned event contribution; review the linked proposal, source and media rows.',
    case when p_related_event_slug is null then 'Location proposed in structured fields' else p_related_event_slug end,
    'ongoing', '{}', nullif(btrim(p_editorial_notes), ''), lower(btrim(p_contact_email)),
    nullif(btrim(p_contact_phone), ''), p_related_event_slug, p_related_event_id,
    p_contribution_type, media_summary, p_submission_mode, nullif(btrim(p_editorial_notes), ''),
    'pending_review', p_submission_fingerprint
  ) returning id into new_id;

  for item in select value from jsonb_array_elements(coalesce(p_proposals, '[]')) loop
    insert into public.lead_event_field_proposals (
      submission_id, field_key, existing_value_snapshot, proposed_value, contributor_explanation
    ) values (new_id, item->>'fieldKey', nullif(item->>'existingValueSnapshot', ''),
      item->>'proposedValue', nullif(item->>'explanation', ''));
  end loop;
  for item in select value from jsonb_array_elements(coalesce(p_sources, '[]')) loop
    insert into public.lead_submission_sources (
      submission_id, supported_field_key, source_url, headline, publisher, source_type,
      source_role, publication_date, language, source_summary
    ) values (new_id, nullif(item->>'supportedFieldKey', ''), item->>'url', item->>'headline',
      item->>'publisher', item->>'sourceType', item->>'sourceRole',
      nullif(item->>'publicationDate', '')::date, nullif(item->>'language', ''),
      nullif(item->>'summary', ''));
  end loop;
  for item in select value from jsonb_array_elements(coalesce(p_media, '[]')) loop
    insert into public.lead_submission_media (
      submission_id, media_type, media_url, caption, source_or_creator, publication_date,
      depicts, privacy_safety_note
    ) values (new_id, item->>'mediaType', item->>'url', item->>'caption',
      item->>'sourceOrCreator', nullif(item->>'publicationDate', '')::date,
      item->>'depicts', nullif(item->>'privacySafetyNote', ''));
  end loop;
  return new_id;
end;
$$;

revoke all on function public.submit_structured_lead(text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.submit_structured_lead(text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text)
  to service_role;

comment on function public.submit_structured_lead(text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text) is
  'Stores private pending proposals and evidence. Never creates or mutates a public event.';
