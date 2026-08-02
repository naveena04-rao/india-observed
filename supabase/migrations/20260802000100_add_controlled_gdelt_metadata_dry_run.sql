-- One manual, metadata-only GDELT run. Scheduled discovery remains disabled.

alter table public.processing_purposes
  add column approval_status text not null default 'not_reviewed'
  check (approval_status in ('not_reviewed', 'approved_for_controlled_metadata_dry_run')),
  add column retention_details jsonb not null default '{}'::jsonb
  check (jsonb_typeof(retention_details) = 'object');

alter table public.scan_sources
  add column manual_dry_run_only boolean not null default false,
  add column manual_run_consumed_at timestamptz null;

alter table public.scan_runs drop constraint scan_runs_trigger_type_check;
alter table public.scan_runs add constraint scan_runs_trigger_type_check check (
  trigger_type in ('scheduled', 'manual', 'manual_gdelt_dry_run', 'retry')
);

alter table public.compliance_registry
  drop constraint compliance_registry_legal_review_status_check,
  drop constraint compliance_enablement_gate;
alter table public.compliance_registry add constraint compliance_registry_legal_review_status_check
check (legal_review_status in (
  'not_reviewed', 'approved_metadata_only', 'approved_link_and_excerpt',
  'approved_official_api', 'approved_internal_review_only', 'approved_public_display',
  'approved_for_controlled_metadata_dry_run', 'restricted', 'rejected',
  'requires_legal_counsel'
));
alter table public.compliance_registry add constraint compliance_enablement_gate check (
  not production_enabled or (
    legal_review_status in (
      'approved_metadata_only', 'approved_link_and_excerpt', 'approved_official_api',
      'approved_internal_review_only', 'approved_public_display',
      'approved_for_controlled_metadata_dry_run'
    )
    and reviewer is not null and reviewed_at is not null
    and coalesce(review_expires_at > now(), false)
    and paywall_status not in ('paywalled', 'access_controlled')
    and robots_policy not in ('not_assessed', 'restricted', 'forbidden')
  )
);

create or replace function public.enforce_scan_source_compliance()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare review public.compliance_registry%rowtype;
begin
  if not new.enabled and not new.manual_dry_run_only then return new; end if;
  if new.enabled and new.manual_dry_run_only then
    raise exception using errcode = '23514', message = 'A manual-only source cannot be scheduled';
  end if;
  if new.compliance_registry_id is null then
    raise exception using errcode = '23514', message = 'A compliance review is required before enabling a source';
  end if;
  select * into review from public.compliance_registry where id = new.compliance_registry_id;
  if not found or not review.production_enabled
    or review.review_expires_at is null or review.review_expires_at <= now()
    or review.paywall_status in ('paywalled', 'access_controlled')
    or review.robots_policy in ('not_assessed', 'restricted', 'forbidden') then
    raise exception using errcode = '23514', message = 'Source compliance approval is missing, restricted, or expired';
  end if;
  if new.manual_dry_run_only and (
    new.scan_method <> 'gdelt'
    or review.legal_review_status <> 'approved_for_controlled_metadata_dry_run'
  ) then
    raise exception using errcode = '23514', message = 'Manual metadata approval is limited to GDELT';
  end if;
  if new.enabled and review.legal_review_status not in (
    'approved_metadata_only', 'approved_link_and_excerpt', 'approved_official_api',
    'approved_internal_review_only', 'approved_public_display'
  ) then
    raise exception using errcode = '23514', message = 'Manual-only approval cannot enable scheduled scanning';
  end if;
  return new;
end;
$$;

drop trigger scan_sources_compliance_gate on public.scan_sources;
create trigger scan_sources_compliance_gate
before insert or update of enabled, manual_dry_run_only, compliance_registry_id on public.scan_sources
for each row execute function public.enforce_scan_source_compliance();

create or replace function public.start_scan_run(
  p_trigger_type text,
  p_idempotency_key text,
  p_dry_run boolean default true,
  p_scheduled_for date default null
) returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare run_id uuid;
begin
  if auth.role() <> 'service_role' and not public.is_authorised_editor() then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  if p_trigger_type not in ('scheduled', 'manual', 'manual_gdelt_dry_run', 'retry') then
    raise exception using errcode = '22023', message = 'Invalid scan trigger';
  end if;
  if p_trigger_type = 'manual_gdelt_dry_run' and not p_dry_run then
    raise exception using errcode = '42501', message = 'The controlled GDELT run must be a dry run';
  end if;
  if not p_dry_run and not (select scheduler_enabled and not dry_run_only from public.discovery_schedule_settings where singleton) then
    raise exception using errcode = '42501', message = 'Non-dry-run discovery is disabled';
  end if;

  insert into public.scan_runs (idempotency_key, trigger_type, scheduled_for, dry_run, requested_by)
  values (p_idempotency_key, p_trigger_type, p_scheduled_for, p_dry_run, auth.uid())
  on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
  returning id into run_id;

  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, id, state
  from public.scan_sources
  where (p_trigger_type = 'manual_gdelt_dry_run'
      and not enabled and manual_dry_run_only and scan_method = 'gdelt'
      and manual_run_consumed_at is null)
    or (p_trigger_type <> 'manual_gdelt_dry_run' and enabled)
  on conflict (scan_run_id, source_id) do nothing;

  update public.scan_runs
  set source_count = (select count(*) from public.scan_jobs where scan_run_id = run_id)
  where id = run_id;
  return run_id;
end;
$$;

insert into public.processing_purposes (
  purpose_key, purpose_description, lawful_basis_or_assessment, data_categories,
  prohibited_data_categories, retention_days, approved, approved_by, approved_at,
  approval_status, retention_details
) values (
  'gdelt_metadata_editorial_discovery_dry_run',
  'Identify possible civic-event articles for private editorial review using only public article metadata and canonical links.',
  'Owner-approved, one-time, controlled metadata-only dry run; no public use.',
  array[
    'article title', 'publisher/source name', 'canonical article URL',
    'publication timestamp', 'language', 'country/state/location metadata',
    'GDELT query metadata', 'candidate classification', 'possible existing-event match'
  ],
  array[
    'full article text', 'personal contact information', 'user profiles',
    'private social content', 'full social posts', 'downloaded images or videos',
    'biometric information', 'participant directories', 'live tactical locations'
  ],
  30,
  true,
  (select user_id from public.media_admins order by created_at limit 1),
  now(),
  'approved_for_controlled_metadata_dry_run',
  '{"discovered_metadata_days":30,"rejected_candidate_metadata_days":14,"url_fingerprint_days":90,"public_use":"none"}'::jsonb
)
on conflict (purpose_key) do update set
  purpose_description = excluded.purpose_description,
  lawful_basis_or_assessment = excluded.lawful_basis_or_assessment,
  data_categories = excluded.data_categories,
  prohibited_data_categories = excluded.prohibited_data_categories,
  retention_days = excluded.retention_days,
  approved = excluded.approved,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  approval_status = excluded.approval_status,
  retention_details = excluded.retention_details;

update public.compliance_registry
set source_url_or_api = 'https://api.gdeltproject.org/api/v2/doc/doc',
    access_method = 'Official public GDELT DOC API',
    jurisdiction = 'Metadata-only private editorial review',
    robots_policy = 'not_applicable',
    copyright_or_licensing = 'Article text and media are not collected; publisher rights remain with publishers.',
    permitted_data_use = 'One controlled metadata-only dry run for private editorial review.',
    permitted_retention = 'Metadata 30 days; rejected metadata 14 days; URL fingerprint 90 days.',
    permitted_redistribution = 'No',
    permitted_media_display = 'No',
    attribution_requirement = 'Retain publisher name and canonical article URL.',
    rate_limits = 'Maximum 60 queries, 300 discovered items, and 100 private candidates.',
    authentication_requirement = 'None; no bypass permitted.',
    personal_data_risk = 'Low metadata risk; no enrichment or article-page fetch.',
    sensitive_data_risk = 'Metadata titles require private human review.',
    children_data_risk = 'No enrichment; safety flags require manual review.',
    paywall_status = 'none',
    legal_review_status = 'approved_for_controlled_metadata_dry_run',
    reviewer = (select user_id from public.media_admins order by created_at limit 1),
    reviewed_at = now(),
    review_expires_at = now() + interval '24 hours',
    production_enabled = exists (select 1 from public.media_admins),
    decision_reason = 'Owner-approved for one controlled metadata-only manual dry run; technical accessibility is not broader legal approval.'
where subject_type = 'connector' and subject_key = 'gdelt';

insert into public.scan_sources (
  name, base_url, scan_url, source_type, coverage_scope, language,
  reliability_tier, enabled, scan_method, connector_config, daily_request_limit,
  minimum_request_interval_seconds, scan_frequency, automated_access_notes,
  compliance_registry_id, manual_dry_run_only
) select
  'GDELT DOC API',
  'https://www.gdeltproject.org/',
  'https://api.gdeltproject.org/api/v2/doc/doc',
  'permitted_api',
  'India national, state and union-territory civic-event metadata from the previous 48 hours',
  'Multilingual',
  'lead_only',
  false,
  'gdelt',
  '{"queryMode":"manual_civic_metadata","collectionBoundary":"metadata_and_canonical_links_only","fullArticleFetching":false,"mediaFetching":false,"maximumQueries":60,"maximumDiscoveredItems":300,"maximumCandidates":100,"timeWindowHours":48,"status":"approved_for_manual_dry_run_only"}'::jsonb,
  60,
  1,
  'manual',
  'Official GDELT DOC API only. No article-page crawling, media fetching, access bypass, or scheduled run.',
  id,
  true
from public.compliance_registry
where subject_type = 'connector' and subject_key = 'gdelt'
  and exists (select 1 from public.media_admins)
on conflict (scan_url) do update set
  enabled = false,
  scan_method = excluded.scan_method,
  connector_config = excluded.connector_config,
  daily_request_limit = excluded.daily_request_limit,
  scan_frequency = excluded.scan_frequency,
  automated_access_notes = excluded.automated_access_notes,
  compliance_registry_id = excluded.compliance_registry_id,
  manual_dry_run_only = true,
  manual_run_consumed_at = null;

comment on column public.scan_sources.manual_dry_run_only is
  'Eligible only for an explicit manual dry-run trigger; never selected by scheduled discovery.';
