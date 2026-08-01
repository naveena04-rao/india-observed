-- Mandatory legal, privacy, copyright and platform gates for the private scanner.
-- All connectors and schedules remain production-disabled after this migration.

create table public.discovery_term_overrides (
  id uuid primary key default gen_random_uuid(),
  language text not null,
  term text not null check (char_length(trim(term)) between 2 and 120),
  action text not null check (action in ('add', 'disable')),
  reason text not null check (char_length(trim(reason)) between 8 and 1000),
  reviewed boolean not null default false,
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (language, term),
  constraint discovery_term_review_gate check (
    not reviewed or (reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.discovery_duplicate_observations (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references public.scan_runs(id) on delete cascade,
  source_id uuid not null references public.scan_sources(id) on delete restrict,
  existing_item_id uuid not null references public.discovered_items(id) on delete restrict,
  observed_url text not null check (observed_url ~ '^https://'),
  grouping_reason text not null check (grouping_reason in ('canonical_url', 'content_hash', 'normalized_title', 'source_family', 'syndicated_copy', 'event_date_location', 'perceptual_media')),
  observed_at timestamptz not null default now(),
  unique (scan_run_id, observed_url)
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'compliance_registry', 'processing_purposes', 'vendor_compliance',
    'retention_schedules', 'compliance_requests', 'compliance_audit_log',
    'discovery_term_overrides', 'discovery_duplicate_observations'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_authorised_editor()) with check (public.is_authorised_editor())',
      table_name || '_editor_access', table_name
    );
  end loop;
end $$;

create view public.source_coverage_metrics
with (security_invoker = true)
as
select
  source.id, source.name, source.state, source.district_or_region, source.language,
  source.source_type, source.enabled, source.last_successful_scan,
  count(distinct job.id)::integer as scan_job_count,
  coalesce(round(100.0 * count(distinct job.id) filter (where job.status = 'failed') / nullif(count(distinct job.id), 0), 2), 0) as failure_rate_percent,
  count(distinct candidate.id)::integer as candidate_yield,
  coalesce(round(100.0 * count(distinct candidate.id) filter (where candidate.review_status = 'approved') / nullif(count(distinct candidate.id), 0), 2), 0) as editorial_acceptance_rate_percent,
  coalesce(round(100.0 * count(distinct duplicate.id) / nullif(count(distinct candidate.id) + count(distinct duplicate.id), 0), 2), 0) as duplicate_rate_percent
from public.scan_sources source
left join public.scan_jobs job on job.source_id = source.id
left join public.discovered_items item on item.source_id = source.id
left join public.editorial_candidates candidate on candidate.discovered_item_id = item.id
left join public.discovery_duplicate_observations duplicate on duplicate.source_id = source.id
group by source.id;

revoke all on table public.source_coverage_metrics from public, anon, authenticated;
grant select on table public.source_coverage_metrics to authenticated;

grant usage, select on sequence public.compliance_audit_log_id_seq to authenticated;

create trigger compliance_registry_set_updated_at before update on public.compliance_registry
for each row execute function public.set_updated_at();
create trigger retention_schedules_set_updated_at before update on public.retention_schedules
for each row execute function public.set_updated_at();
create trigger compliance_requests_set_updated_at before update on public.compliance_requests
for each row execute function public.set_updated_at();

create or replace function public.enforce_scan_source_compliance()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare review public.compliance_registry%rowtype;
begin
  if not new.enabled then return new; end if;
  if new.compliance_registry_id is null then
    raise exception using errcode = '23514', message = 'A compliance review is required before enabling a source';
  end if;
  select * into review from public.compliance_registry where id = new.compliance_registry_id;
  if not found or not review.production_enabled
    or review.legal_review_status not in ('approved_metadata_only', 'approved_link_and_excerpt', 'approved_official_api', 'approved_internal_review_only', 'approved_public_display')
    or review.review_expires_at is null or review.review_expires_at <= now()
    or review.paywall_status in ('paywalled', 'access_controlled')
    or review.robots_policy in ('not_assessed', 'restricted', 'forbidden') then
    raise exception using errcode = '23514', message = 'Source compliance approval is missing, restricted, or expired';
  end if;
  return new;
end;
$$;

create trigger scan_sources_compliance_gate
before insert or update of enabled, compliance_registry_id on public.scan_sources
for each row execute function public.enforce_scan_source_compliance();

create or replace function public.enforce_discovery_schedule_compliance()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.scheduler_enabled and exists (
    select 1 from public.scan_sources source
    left join public.compliance_registry review on review.id = source.compliance_registry_id
    where source.enabled and (
      review.id is null or not review.production_enabled
      or review.review_expires_at is null or review.review_expires_at <= now()
    )
  ) then
    raise exception using errcode = '23514', message = 'Every enabled source requires a current production compliance approval';
  end if;
  return new;
end;
$$;

create trigger discovery_schedule_compliance_gate
before update of scheduler_enabled on public.discovery_schedule_settings
for each row execute function public.enforce_discovery_schedule_compliance();

create or replace function public.run_discovery_retention(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare deleted_items integer := 0;
begin
  if not public.is_authorised_editor() and auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Authorised editor required';
  end if;
  update public.discovered_items item
  set original_text = null, translated_text = null,
      source_metadata = item.source_metadata - 'rawPayload', updated_at = p_now
  where item.created_at < p_now - interval '7 days'
    and not exists (
      select 1 from public.compliance_audit_log audit
      where audit.subject_type = 'discovered_item' and audit.subject_id = item.id::text and audit.legal_hold
    )
    and (item.original_text is not null or item.translated_text is not null);
  get diagnostics deleted_items = row_count;
  insert into public.compliance_audit_log (actor_id, action, subject_type, subject_id, safe_details)
  values (auth.uid(), 'retention_job_completed', 'retention_job', p_now::text, jsonb_build_object('deleted_items', deleted_items));
  return jsonb_build_object('redacted_items', deleted_items);
end;
$$;

revoke update on table public.event_notifications from authenticated;
grant select on table public.event_notifications to authenticated;
grant update (read_at) on table public.event_notifications to authenticated;
create policy event_notifications_owner_select on public.event_notifications
for select to authenticated using (user_id = auth.uid());
create policy event_notifications_owner_update on public.event_notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on table public.notification_preferences to authenticated;
create policy notification_preferences_owner_select on public.notification_preferences
for select to authenticated using (user_id = auth.uid());

revoke all on function public.run_discovery_retention(timestamptz) from public, anon, authenticated;
grant execute on function public.run_discovery_retention(timestamptz) to authenticated, service_role;

insert into public.retention_schedules (record_type, retention_days, deletion_action) values
  ('raw_fetched_pages', 7, 'delete'),
  ('extracted_article_text', 14, 'delete'),
  ('source_excerpts', 90, 'manual_review'),
  ('rejected_candidates', 30, 'redact_personal_data'),
  ('duplicate_items', 90, 'retain_hash_and_url'),
  ('media_candidates', 30, 'manual_review'),
  ('personal_data', 30, 'redact_personal_data'),
  ('editor_logs', 730, 'manual_review'),
  ('notification_logs', 90, 'delete'),
  ('failed_fetch_responses', 7, 'delete'),
  ('api_payloads', 7, 'delete');

insert into public.processing_purposes (
  purpose_key, purpose_description, data_categories, prohibited_data_categories, retention_days
) values (
  'private_editorial_discovery',
  'Find public civic-event leads for human editorial review; no autonomous publication.',
  array['source metadata', 'brief attributed evidence excerpt', 'extracted factual fields'],
  array['private contact details', 'participant directories', 'biometrics', 'children data', 'live tactical locations'],
  14
);

insert into public.compliance_registry (
  subject_type, subject_key, platform_or_source_name, access_method, decision_reason
) values
  ('connector', 'rss-atom', 'RSS and Atom', 'Official or publisher-provided feed', 'Not reviewed; production disabled'),
  ('connector', 'sitemap', 'Public sitemaps', 'Approved HTTPS sitemap', 'Not reviewed; production disabled'),
  ('connector', 'approved-website', 'Approved public websites', 'Bounded HTTP fetch', 'Not reviewed; production disabled'),
  ('connector', 'government-notice', 'Government and district notices', 'Official portal or feed', 'Not reviewed; production disabled'),
  ('connector', 'gdelt', 'GDELT', 'Official public API', 'Terms and coverage review required'),
  ('connector', 'youtube', 'YouTube', 'Official Data API', 'Credentials, quota and platform review required'),
  ('connector', 'telegram', 'Telegram', 'TDLib for approved public channels', 'No session implementation; legal review required'),
  ('connector', 'bluesky', 'Bluesky', 'Official public API', 'Terms, rate and content review required'),
  ('connector', 'commercial-news', 'Commercial news API', 'Licensed API', 'Provider not selected or licensed'),
  ('connector', 'x', 'X', 'Official API', 'Commercial access and platform review required'),
  ('connector', 'meta', 'Meta official accounts', 'Official Graph API', 'No general discovery claim; platform review required'),
  ('connector', 'google-fact-check', 'Google Fact Check Tools', 'Official API', 'API review required; fact-check search only');

comment on table public.compliance_registry is
  'Private legal/platform review registry. Technical accessibility never implies permission or legality.';
comment on function public.run_discovery_retention(timestamptz) is
  'Deletes expired raw discovery records unless editorial state or an authorised legal hold requires retention.';
