-- Store contributions for every server-verified reviewed record, including records that are
-- published from the reviewed snapshot but have not been mirrored into public.events.

alter table public.lead_submissions
  drop constraint lead_submissions_related_event_id_fkey;

create or replace function public.submit_structured_lead(
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

comment on column public.lead_submissions.related_event_id is
  'Stable ID of the server-verified reviewed record; some reviewed records are snapshot-backed rather than public.events rows.';

comment on function public.submit_structured_lead(text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text) is
  'Stores private pending proposals for server-verified reviewed targets. Never creates or mutates a public event.';
