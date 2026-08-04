-- Replace the Production-blocked PIB feed with one reviewed regional RSS source.
-- Scheduling and every public or notification side effect remain disabled.

update public.scan_sources
set enabled = false,
    scan_frequency = 'manual',
    connector_config = connector_config || '{"scheduledScanning":false}'::jsonb,
    last_error_code = 'source_http_403',
    last_error_summary = 'The Production request was refused with HTTP 403.',
    updated_at = now()
where name = 'Press Information Bureau RSS';

update public.compliance_registry
set production_enabled = false,
    decision_reason = 'Disabled after the controlled Production scanner received HTTP 403.',
    updated_at = now()
where subject_type = 'source' and subject_key = 'press-information-bureau-rss';

insert into public.compliance_registry (
  subject_type, subject_key, platform_or_source_name, source_url_or_api, access_method,
  jurisdiction, terms_version, terms_last_checked_at, robots_policy,
  copyright_or_licensing, permitted_data_use, permitted_retention,
  permitted_redistribution, permitted_media_display, attribution_requirement, rate_limits,
  authentication_requirement, personal_data_risk, sensitive_data_risk, children_data_risk,
  paywall_status, legal_review_status, reviewer, reviewed_at, review_expires_at,
  production_enabled, decision_reason
) values (
  'source', 'telangana-today-rss', 'Telangana Today RSS', 'https://telanganatoday.com/feed',
  'Publisher-provided public RSS feed; metadata request only.',
  'India; Telangana regional coverage', 'Checked 2026-08-04', now(), 'allowed',
  'Publisher copyright remains intact. No article body, PDF, image, video or public redistribution is approved.',
  'Private editorial discovery using feed titles, canonical links, timestamps and short feed summaries only.',
  'Metadata 30 days; rejected candidates 14 days; duplicate fingerprints 90 days.',
  'No', 'No', 'Retain Telangana Today as publisher and the canonical source link.',
  'One request per controlled run; one conditional retry only for a temporary network failure.',
  'None; no login, cookie, API key, CAPTCHA or bypass.',
  'Low; unnecessary personal information is not collected.',
  'Headlines may contain sensitive context and remain private pending human review.',
  'No profile enrichment or collection of unnecessary information about children.',
  'none', 'approved_internal_review_only',
  (select user_id from public.media_admins order by created_at limit 1), now(),
  now() + interval '1 year', exists (select 1 from public.media_admins),
  'The public RSS endpoint returned valid current metadata without authentication. Robots allows the feed path. Collection remains private and metadata-only.'
)
on conflict (subject_type, subject_key) do update set
  platform_or_source_name = excluded.platform_or_source_name,
  source_url_or_api = excluded.source_url_or_api,
  access_method = excluded.access_method,
  jurisdiction = excluded.jurisdiction,
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
  decision_reason = excluded.decision_reason,
  updated_at = now();

insert into public.scan_sources (
  name, base_url, scan_url, source_type, coverage_scope, state, language,
  reliability_tier, enabled, scan_method, connector_config, daily_request_limit,
  minimum_request_interval_seconds, scan_frequency, automated_access_notes,
  compliance_registry_id, manual_dry_run_only
)
select
  'Telangana Today RSS', 'https://telanganatoday.com/', 'https://telanganatoday.com/feed',
  'rss_feed', 'Telangana and India civic events and updates', 'Telangana', 'English',
  'standard', review.production_enabled, 'rss',
  '{"status":"approved_metadata_only","collectionBoundary":"feed_metadata_and_canonical_links_only","timeWindowHours":72,"maximumItems":50,"fullArticleFetching":false,"pdfFetching":false,"mediaFetching":false,"scheduledScanning":true,"temporaryRetryLimit":1}'::jsonb,
  1, 86400, 'daily',
  'One metadata-only feed request per controlled run. One bounded temporary-failure retry; no item-page or media fetch.',
  review.id, false
from public.compliance_registry review
where review.subject_type = 'source' and review.subject_key = 'telangana-today-rss'
on conflict (scan_url) do update set
  name = excluded.name,
  base_url = excluded.base_url,
  source_type = excluded.source_type,
  coverage_scope = excluded.coverage_scope,
  state = excluded.state,
  language = excluded.language,
  reliability_tier = excluded.reliability_tier,
  enabled = excluded.enabled,
  scan_method = excluded.scan_method,
  connector_config = excluded.connector_config,
  daily_request_limit = excluded.daily_request_limit,
  minimum_request_interval_seconds = excluded.minimum_request_interval_seconds,
  scan_frequency = excluded.scan_frequency,
  automated_access_notes = excluded.automated_access_notes,
  compliance_registry_id = excluded.compliance_registry_id,
  manual_dry_run_only = false,
  manual_run_consumed_at = null,
  updated_at = now();

update public.scan_sources
set daily_request_limit = 1,
    minimum_request_interval_seconds = 86400,
    connector_config = connector_config || '{"timeWindowHours":72,"maximumItems":50,"temporaryRetryLimit":1}'::jsonb,
    updated_at = now()
where name = 'NorthEast Now RSS';

update public.processing_purposes
set retention_details = '{"timeWindowHours":72,"maximumSources":2,"maximumRequestsPerSource":2,"maximumRawItems":100,"maximumStoredItems":50,"maximumCandidates":25,"maximumRuntimeSeconds":240,"publicUse":"none","scope":"private_editorial_review_only"}'::jsonb
where purpose_key = 'daily_metadata_editorial_discovery';

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
  if eligible_count <> 2 then
    raise exception using errcode = '42501', message = 'daily_scanner_source_count_invalid';
  end if;
  insert into public.scan_runs (
    idempotency_key, trigger_type, dry_run, requested_by, quota_usage
  ) values (
    p_idempotency_key, 'manual_daily_scanner_dry_run', true, auth.uid(),
    '{"timeWindowHours":72,"maximumSources":2,"maximumRawItems":100,"maximumStoredItems":50,"maximumCandidates":25,"maximumRuntimeSeconds":240}'::jsonb
  ) returning id into run_id;
  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, id, state from public.scan_sources
  where enabled and scan_frequency = 'daily'
  order by name limit 2;
  update public.scan_runs set source_count = eligible_count where id = run_id;
  return run_id;
end;
$$;

revoke all on function public.claim_manual_daily_scanner_dry_run(text) from public, anon;
grant execute on function public.claim_manual_daily_scanner_dry_run(text) to authenticated, service_role;

comment on function public.claim_manual_daily_scanner_dry_run(text) is
  'Claims one private 72-hour readiness run for exactly two reviewed metadata-only RSS sources.';
