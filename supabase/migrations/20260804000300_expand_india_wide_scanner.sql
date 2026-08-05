-- Expand the controlled metadata-only scanner across India. Scheduling, publication,
-- notifications, email, media approval and GitHub writes remain disabled.

create temporary table india_wide_source_selection (
  subject_key text primary key,
  source_name text not null,
  base_url text not null,
  scan_url text not null,
  coverage_region text not null,
  coverage_scope text not null,
  state text null,
  language text not null,
  reliability_tier text not null
) on commit drop;

insert into india_wide_source_selection values
  ('indian-express-india-rss', 'Indian Express India RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/india/feed/', 'National', 'India national news with emphasis on public affairs, government, courts, education, labour and civic action', 'National', 'English', 'high'),
  ('hindustan-times-india-rss', 'Hindustan Times India RSS', 'https://www.hindustantimes.com/', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'National', 'India national news and public-affairs metadata', 'National', 'English', 'high'),
  ('times-of-india-india-rss', 'Times of India India RSS', 'https://timesofindia.indiatimes.com/', 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', 'National', 'India national news and public-affairs metadata', 'National', 'English', 'standard'),
  ('indian-express-delhi-rss', 'Indian Express Delhi RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/delhi/feed/', 'North', 'Delhi and northern India city, court, government and civic-action metadata', 'Delhi', 'English', 'high'),
  ('hindustan-times-lucknow-rss', 'Hindustan Times Lucknow RSS', 'https://www.hindustantimes.com/', 'https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml', 'North', 'Lucknow and Uttar Pradesh civic and public-affairs metadata', 'Uttar Pradesh', 'English', 'high'),
  ('indian-express-bengaluru-rss', 'Indian Express Bengaluru RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/bangalore/feed/', 'South', 'Bengaluru and Karnataka city, court, government and civic-action metadata', 'Karnataka', 'English', 'high'),
  ('telangana-today-rss', 'Telangana Today RSS', 'https://telanganatoday.com/', 'https://telanganatoday.com/feed', 'South', 'Telangana and southern India civic-event metadata', 'Telangana', 'English', 'standard'),
  ('indian-express-kolkata-rss', 'Indian Express Kolkata RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/kolkata/feed/', 'East', 'Kolkata and West Bengal city, court, government and civic-action metadata', 'West Bengal', 'English', 'high'),
  ('hindustan-times-patna-rss', 'Hindustan Times Patna RSS', 'https://www.hindustantimes.com/', 'https://www.hindustantimes.com/feeds/rss/cities/patna-news/rssfeed.xml', 'East', 'Patna and Bihar civic and public-affairs metadata', 'Bihar', 'English', 'high'),
  ('indian-express-mumbai-rss', 'Indian Express Mumbai RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/mumbai/feed/', 'West', 'Mumbai and Maharashtra city, court, labour and civic-action metadata', 'Maharashtra', 'English', 'high'),
  ('indian-express-ahmedabad-rss', 'Indian Express Ahmedabad RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/ahmedabad/feed/', 'West', 'Ahmedabad and Gujarat city, court, government and civic-action metadata', 'Gujarat', 'English', 'high'),
  ('northeast-now-rss', 'NorthEast Now RSS', 'https://www.nenow.in/', 'https://www.nenow.in/feed', 'Northeast', 'Northeast India civic events and updates', 'National', 'English', 'standard'),
  ('eastmojo-rss', 'EastMojo RSS', 'https://eastmojo.com/', 'https://eastmojo.com/feed/', 'Northeast', 'Northeast India state, community, environment and civic-action metadata', 'National', 'English', 'standard'),
  ('madhya-pradesh-information-rss', 'Madhya Pradesh Information RSS', 'https://mpinfo.org/', 'https://mpinfo.org/RSSFeed/RSSFeed_News.xml', 'Central', 'Official Madhya Pradesh government announcement and response metadata', 'Madhya Pradesh', 'Hindi', 'primary');

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
  ) >= 15 then
    raise exception using errcode = '23514', message = 'Daily scanner source limit exceeded';
  end if;
  return new;
end;
$$;

update public.scan_sources
set enabled = false,
    scan_frequency = 'manual',
    connector_config = connector_config || '{"scheduledScanning":false}'::jsonb,
    updated_at = now()
where enabled or scan_frequency = 'daily';

insert into public.compliance_registry (
  subject_type, subject_key, platform_or_source_name, source_url_or_api, access_method,
  jurisdiction, terms_version, terms_last_checked_at, robots_policy,
  copyright_or_licensing, permitted_data_use, permitted_retention,
  permitted_redistribution, permitted_media_display, attribution_requirement, rate_limits,
  authentication_requirement, personal_data_risk, sensitive_data_risk, children_data_risk,
  paywall_status, legal_review_status, reviewer, reviewed_at, review_expires_at,
  production_enabled, decision_reason
)
select
  'source', selected.subject_key, selected.source_name, selected.scan_url,
  'Publisher- or authority-provided public RSS endpoint; one metadata request per controlled run.',
  'India; ' || selected.coverage_region || ' coverage',
  'Endpoint and access reviewed 2026-08-04 for one controlled private metadata run.', now(), 'allowed',
  'Publisher copyright remains intact. No article body, PDF, image, video, feed republication or public redistribution is approved.',
  'Private editorial discovery using titles, canonical links, timestamps and short feed-provided summaries only.',
  'Metadata 30 days; rejected candidates 14 days; duplicate fingerprints 90 days.',
  'No', 'No', 'Retain the publisher name and canonical source link.',
  'One request per controlled run; one conditional retry only for a temporary network failure.',
  'None; no login, cookie, API key, CAPTCHA, paywall or access bypass.',
  'Low; unnecessary personal information is not collected.',
  'Headlines may contain sensitive context and remain private pending human review.',
  'No profile enrichment or collection of unnecessary information about children.',
  'none', 'approved_internal_review_only',
  (select user_id from public.media_admins order by created_at limit 1), now(), now() + interval '1 year',
  exists (select 1 from public.media_admins),
  'Owner-approved controlled technical and editorial metadata test. Technical accessibility is not a public-display or article-reuse approval.'
from india_wide_source_selection selected
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
  selected.source_name, selected.base_url, selected.scan_url, 'rss_feed',
  selected.coverage_scope, selected.state, selected.language, selected.reliability_tier,
  review.production_enabled, 'rss',
  jsonb_build_object(
    'status', 'approved_metadata_only',
    'coverageRegion', selected.coverage_region,
    'collectionBoundary', 'feed_metadata_and_canonical_links_only',
    'timeWindowHours', 72,
    'maximumItems', 50,
    'fullArticleFetching', false,
    'pdfFetching', false,
    'mediaFetching', false,
    'scheduledScanning', true,
    'temporaryRetryLimit', 1
  ),
  1, 86400, 'daily',
  'One metadata-only feed request per controlled run. One bounded temporary-failure retry; no item-page, PDF or media fetch.',
  review.id, false
from india_wide_source_selection selected
join public.compliance_registry review
  on review.subject_type = 'source' and review.subject_key = selected.subject_key
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
  cooldown_until = null,
  updated_at = now();

update public.processing_purposes
set retention_details = '{"timeWindowHours":72,"maximumSources":15,"maximumRequestsPerSource":2,"maximumRawItems":300,"maximumStoredItems":100,"maximumCandidates":40,"candidateDefinition":"India-gated civic-event types at or above 0.50 confidence, ranked before storage limits","maximumRuntimeSeconds":360,"publicUse":"none","scope":"private_editorial_review_only"}'::jsonb
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
    and source.scan_method in ('rss', 'atom', 'sitemap')
    and not source.manual_dry_run_only and source.daily_request_limit <= 2
    and review.production_enabled and review.review_expires_at > now()
    and review.robots_policy in ('allowed', 'not_applicable')
    and review.paywall_status = 'none';
  if eligible_count < 8 or eligible_count > 15 then
    raise exception using errcode = '42501', message = 'daily_scanner_source_count_invalid';
  end if;
  insert into public.scan_runs (
    idempotency_key, trigger_type, dry_run, requested_by, quota_usage
  ) values (
    p_idempotency_key, 'manual_daily_scanner_dry_run', true, auth.uid(),
    '{"timeWindowHours":72,"maximumSources":15,"maximumRawItems":300,"maximumStoredItems":100,"maximumCandidates":40,"maximumRuntimeSeconds":360,"rankingBeforeLimits":true}'::jsonb
  ) returning id into run_id;
  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, id, state from public.scan_sources
  where enabled and scan_frequency = 'daily'
  order by name limit 15;
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
      and run.success_count >= 8
      and exists (
        select 1 from public.discovered_items item
        join public.editorial_candidates candidate on candidate.discovered_item_id = item.id
        where item.first_scan_run_id = run.id
          and candidate.candidate_type in ('new_event', 'event_update', 'official_response', 'outcome_status_change')
          and candidate.confidence >= 0.50
      )
  ) then
    raise exception using errcode = '23514',
      message = 'A successful India-wide controlled scanner run is required';
  end if;
  return new;
end;
$$;

comment on function public.claim_manual_daily_scanner_dry_run(text) is
  'Claims one private India-wide, rank-before-cap, metadata-only readiness run for 8 to 15 reviewed sources.';
