-- Two-source, metadata-only daily discovery. Scheduling remains disabled until an
-- authorised editor records a successful controlled Production run.

alter table public.scan_runs drop constraint if exists scan_runs_trigger_type_check;
alter table public.scan_runs add constraint scan_runs_trigger_type_check check (
  trigger_type in (
    'scheduled', 'manual', 'manual_gdelt_dry_run', 'manual_fallback_dry_run',
    'manual_pib_rss_dry_run', 'manual_daily_scanner_dry_run', 'retry'
  )
);

alter table public.editorial_candidates
  add column if not exists target_event_internal_id text null,
  add column if not exists matching_signals jsonb not null default '[]'::jsonb
    check (jsonb_typeof(matching_signals) = 'array'),
  add column if not exists conflicting_signals jsonb not null default '[]'::jsonb
    check (jsonb_typeof(conflicting_signals) = 'array'),
  add column if not exists source_is_newer_than_event boolean null;

alter table public.discovery_schedule_settings
  drop constraint if exists discovery_schedule_settings_scan_cron_utc_check;
alter table public.discovery_schedule_settings
  alter column scan_cron_utc set default '30 1 * * *';
update public.discovery_schedule_settings set scan_cron_utc = '30 1 * * *' where singleton;
alter table public.discovery_schedule_settings
  add constraint discovery_schedule_settings_scan_cron_utc_check
  check (scan_cron_utc = '30 1 * * *');

insert into public.processing_purposes (
  purpose_key, purpose_description, lawful_basis_or_assessment, data_categories,
  prohibited_data_categories, retention_days, approved, approved_by, approved_at,
  approval_status, retention_details
) values (
  'daily_metadata_editorial_discovery',
  'Discover possible Indian civic events and updates to the 50 internally reviewed records for private human editorial review.',
  'Owner-approved metadata-only daily discovery from two reviewed public sources; no publication or public-record write is permitted.',
  array[
    'title', 'canonical URL', 'publisher', 'publication timestamp',
    'feed-provided summary up to 500 characters', 'language', 'state or National',
    'source and connector identifiers', 'duplicate fingerprint', 'collection timestamp',
    'private candidate classification and existing-event match diagnostics'
  ],
  array[
    'full article body', 'PDF', 'image', 'video', 'contact information', 'author profile',
    'participant directory', 'live tactical location', 'unrelated personal data'
  ],
  30,
  true,
  (select user_id from public.media_admins order by created_at limit 1),
  now(),
  'approved_for_controlled_metadata_dry_run',
  '{"timeWindowHours":48,"maximumSources":5,"maximumRequestsPerSource":2,"maximumRawItems":100,"maximumStoredItems":50,"maximumCandidates":25,"maximumRuntimeSeconds":240,"publicUse":"none","scope":"private_editorial_review_only"}'::jsonb
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

insert into public.compliance_registry (
  subject_type, subject_key, platform_or_source_name, source_url_or_api, access_method,
  jurisdiction, terms_url, terms_version, terms_last_checked_at, robots_policy,
  copyright_or_licensing, permitted_data_use, permitted_retention,
  permitted_redistribution, permitted_media_display, attribution_requirement, rate_limits,
  authentication_requirement, personal_data_risk, sensitive_data_risk, children_data_risk,
  paywall_status, legal_review_status, reviewer, reviewed_at, review_expires_at,
  production_enabled, decision_reason
) values
(
  'source', 'northeast-now-rss', 'NorthEast Now RSS', 'https://www.nenow.in/feed',
  'Publisher-provided public RSS feed; metadata request only.',
  'India; North East regional coverage', 'https://www.nenow.in/disclaimer',
  'Checked 2026-08-03', now(), 'allowed',
  'Public-consumption feed. No article body or public redistribution is approved; commercial reuse remains prohibited.',
  'Private editorial discovery using feed titles, canonical links, timestamps and short feed summaries only.',
  'Metadata 30 days; rejected candidates 14 days; duplicate fingerprints 90 days.',
  'No', 'No', 'Retain NorthEast Now as publisher and the canonical source link.',
  'One daily request; one conditional retry only for a temporary failure.',
  'None; no login, cookie, API key, CAPTCHA or bypass.',
  'Low; unnecessary personal information is not collected.',
  'Headlines may contain sensitive context and remain private pending human review.',
  'No profile enrichment or collection of unnecessary information about children.',
  'none', 'approved_internal_review_only',
  (select user_id from public.media_admins order by created_at limit 1), now(),
  now() + interval '1 year', exists (select 1 from public.media_admins),
  'Robots explicitly allows all paths; the current public RSS feed is relevant and accessible. Metadata remains private and links resolve to the publisher.'
),
(
  'source', 'press-information-bureau-rss', 'Press Information Bureau RSS',
  'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=6',
  'Official publisher-provided RSS endpoint; metadata request only.',
  'India; national official government responses',
  'https://www.pib.gov.in/ContentPage.aspx?lang=2&menuid=19&reg=48',
  'Checked 2026-08-03', now(), 'not_applicable',
  'PIB copyright policy permits accurate attributed reproduction without prior approval; third-party material remains excluded.',
  'Private editorial discovery using feed titles, canonical links, timestamps and short feed summaries only.',
  'Metadata 30 days; rejected candidates 14 days; duplicate fingerprints 90 days.',
  'No automatic public display', 'No',
  'Retain Press Information Bureau as issuer and the canonical source link.',
  'One daily request; one conditional retry only for a temporary failure.',
  'None; no login, cookie, API key, CAPTCHA or bypass.',
  'Low; unnecessary personal information is not collected.',
  'Official titles may contain sensitive context and remain private pending human review.',
  'No profile enrichment or collection of unnecessary information about children.',
  'none', 'approved_metadata_only',
  (select user_id from public.media_admins order by created_at limit 1), now(),
  now() + interval '1 year', exists (select 1 from public.media_admins),
  'Official RSS endpoint and reuse policy support attributed metadata collection without fetching releases, PDFs or media.'
)
on conflict (subject_type, subject_key) do update set
  platform_or_source_name = excluded.platform_or_source_name,
  source_url_or_api = excluded.source_url_or_api,
  access_method = excluded.access_method,
  jurisdiction = excluded.jurisdiction,
  terms_url = excluded.terms_url,
  terms_version = excluded.terms_version,
  terms_last_checked_at = excluded.terms_last_checked_at,
  robots_policy = excluded.robots_policy,
  copyright_or_licensing = excluded.copyright_or_licensing,
  permitted_data_use = excluded.permitted_data_use,
  permitted_retention = excluded.permitted_retention,
  permitted_redistribution = excluded.permitted_redistribution,
  permitted_media_display = excluded.permitted_media_display,
  attribution_requirement = excluded.attribution_requirement,
  rate_limits = excluded.rate_limits,
  authentication_requirement = excluded.authentication_requirement,
  personal_data_risk = excluded.personal_data_risk,
  sensitive_data_risk = excluded.sensitive_data_risk,
  children_data_risk = excluded.children_data_risk,
  paywall_status = excluded.paywall_status,
  legal_review_status = excluded.legal_review_status,
  reviewer = excluded.reviewer,
  reviewed_at = excluded.reviewed_at,
  review_expires_at = excluded.review_expires_at,
  production_enabled = excluded.production_enabled,
  decision_reason = excluded.decision_reason;

insert into public.scan_sources (
  name, base_url, scan_url, source_type, coverage_scope, state, language,
  reliability_tier, enabled, scan_method, connector_config, daily_request_limit,
  minimum_request_interval_seconds, scan_frequency, automated_access_notes,
  compliance_registry_id, manual_dry_run_only
)
select
  configured.name, configured.base_url, configured.scan_url, configured.source_type,
  configured.coverage_scope, configured.state, configured.language, configured.reliability_tier,
  review.production_enabled, 'rss', configured.connector_config, 2, 43200, 'daily',
  'One metadata-only feed request around 07:00 IST. One bounded temporary-failure retry; no item-page or media fetch.',
  review.id, false
from (values
  (
    'NorthEast Now RSS', 'https://www.nenow.in/', 'https://www.nenow.in/feed',
    'rss_feed', 'North East India civic events and updates', 'National', 'English', 'high',
    'northeast-now-rss',
    '{"status":"approved_metadata_only","collectionBoundary":"feed_metadata_and_canonical_links_only","timeWindowHours":48,"maximumItems":50,"fullArticleFetching":false,"pdfFetching":false,"mediaFetching":false,"scheduledScanning":true,"temporaryRetryLimit":1}'::jsonb
  ),
  (
    'Press Information Bureau RSS', 'https://pib.gov.in/',
    'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=6', 'rss_feed',
    'India national official responses and outcomes', 'National', 'English', 'primary',
    'press-information-bureau-rss',
    '{"status":"approved_metadata_only","collectionBoundary":"feed_metadata_and_canonical_links_only","timeWindowHours":48,"maximumItems":50,"fullArticleFetching":false,"pdfFetching":false,"mediaFetching":false,"scheduledScanning":true,"temporaryRetryLimit":1}'::jsonb
  )
) as configured(
  name, base_url, scan_url, source_type, coverage_scope, state, language,
  reliability_tier, subject_key, connector_config
)
join public.compliance_registry review
  on review.subject_type = 'source' and review.subject_key = configured.subject_key
on conflict (scan_url) do update set
  name = excluded.name,
  base_url = excluded.base_url,
  source_type = excluded.source_type,
  coverage_scope = excluded.coverage_scope,
  state = excluded.state,
  language = excluded.language,
  reliability_tier = excluded.reliability_tier,
  enabled = excluded.enabled,
  scan_method = 'rss',
  connector_config = excluded.connector_config,
  daily_request_limit = excluded.daily_request_limit,
  minimum_request_interval_seconds = excluded.minimum_request_interval_seconds,
  scan_frequency = excluded.scan_frequency,
  automated_access_notes = excluded.automated_access_notes,
  compliance_registry_id = excluded.compliance_registry_id,
  manual_dry_run_only = false,
  manual_run_consumed_at = null;

create or replace function public.enforce_minimum_daily_scanner_source_count()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.enabled and new.scan_frequency = 'daily' and (
    select count(*) from public.scan_sources
    where enabled and scan_frequency = 'daily' and id <> new.id
  ) >= 5 then
    raise exception using errcode = '23514', message = 'Daily scanner source limit exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists scan_sources_daily_limit on public.scan_sources;
create trigger scan_sources_daily_limit
before insert or update of enabled, scan_frequency on public.scan_sources
for each row execute function public.enforce_minimum_daily_scanner_source_count();

create or replace function public.claim_manual_daily_scanner_dry_run(p_idempotency_key text)
returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_id uuid;
  eligible_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and not coalesce(public.is_authorised_editor(), false) then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('manual_daily_scanner_dry_run', 0));
  if exists (
    select 1 from public.scan_runs
    where trigger_type in ('manual_daily_scanner_dry_run', 'scheduled')
      and status in ('queued', 'running')
  ) then
    raise exception using errcode = '55000', message = 'dry_scan_already_running';
  end if;
  if exists (select 1 from public.scan_runs where idempotency_key = p_idempotency_key) then
    raise exception using errcode = '55000', message = 'dry_scan_already_used';
  end if;
  if not exists (
    select 1 from public.processing_purposes
    where purpose_key = 'daily_metadata_editorial_discovery' and approved
      and approval_status = 'approved_for_controlled_metadata_dry_run'
  ) then
    raise exception using errcode = '42501', message = 'daily_scanner_purpose_not_approved';
  end if;
  select count(*) into eligible_count
  from public.scan_sources source
  join public.compliance_registry review on review.id = source.compliance_registry_id
  where source.enabled and source.scan_frequency = 'daily'
    and source.scan_method in ('rss', 'atom', 'sitemap', 'html_list')
    and not source.manual_dry_run_only and source.daily_request_limit <= 2
    and review.production_enabled and review.review_expires_at > now()
    and review.robots_policy in ('allowed', 'not_applicable')
    and review.paywall_status = 'none';
  if eligible_count < 2 or eligible_count > 5 then
    raise exception using errcode = '42501', message = 'daily_scanner_source_count_invalid';
  end if;
  insert into public.scan_runs (
    idempotency_key, trigger_type, dry_run, requested_by, quota_usage
  ) values (
    p_idempotency_key, 'manual_daily_scanner_dry_run', true, auth.uid(),
    '{"timeWindowHours":48,"maximumSources":5,"maximumRawItems":100,"maximumStoredItems":50,"maximumCandidates":25,"maximumRuntimeSeconds":240}'::jsonb
  ) returning id into run_id;
  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, id, state from public.scan_sources
  where enabled and scan_frequency = 'daily'
  order by name limit 5;
  update public.scan_runs set source_count = eligible_count where id = run_id;
  return run_id;
end;
$$;

revoke all on function public.claim_manual_daily_scanner_dry_run(text) from public, anon;
grant execute on function public.claim_manual_daily_scanner_dry_run(text) to authenticated, service_role;

create or replace function public.enforce_daily_scanner_rollout_gate()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.scheduler_enabled and not old.scheduler_enabled and not exists (
    select 1 from public.scan_runs run
    where run.trigger_type = 'manual_daily_scanner_dry_run'
      and run.status in ('completed', 'incomplete')
      and run.success_count >= 2
      and exists (
        select 1 from public.discovered_items item
        join public.editorial_candidates candidate on candidate.discovered_item_id = item.id
        where item.first_scan_run_id = run.id
      )
  ) then
    raise exception using errcode = '23514',
      message = 'A successful two-source controlled daily-scanner run is required';
  end if;
  return new;
end;
$$;

drop trigger if exists discovery_daily_scanner_rollout_gate on public.discovery_schedule_settings;
create trigger discovery_daily_scanner_rollout_gate
before update of scheduler_enabled on public.discovery_schedule_settings
for each row execute function public.enforce_daily_scanner_rollout_gate();

comment on function public.claim_manual_daily_scanner_dry_run(text) is
  'Claims one private readiness run for the two-source metadata-only daily scanner.';
