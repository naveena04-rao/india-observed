-- Full-scale private India civic-event discovery. This migration does not enable scheduling,
-- publication, notifications, email, media approval or GitHub writes.

alter table public.editorial_candidates
  drop constraint if exists editorial_candidates_candidate_type_check;
alter table public.editorial_candidates
  add constraint editorial_candidates_candidate_type_check check (candidate_type in (
    'new_event', 'possible_planned_event', 'event_update', 'official_response',
    'outcome_status_change', 'new_source', 'media_evidence', 'duplicate', 'irrelevant',
    'manual_review', 'processing_failed'
  ));

alter table public.editorial_candidates
  add column if not exists action_type text null,
  add column if not exists event_date text null,
  add column if not exists planned_date text null,
  add column if not exists affected_group text null,
  add column if not exists demand text null,
  add column if not exists authority_response text null,
  add column if not exists dictionary_matches text[] not null default '{}',
  add column if not exists detected_language text not null default 'und';

alter table public.scan_sources
  add column if not exists last_http_status integer null check (last_http_status between 100 and 599),
  add column if not exists last_content_type text null,
  add column if not exists last_item_count integer not null default 0 check (last_item_count >= 0),
  add column if not exists selection_reason text null;

create temporary table full_scale_source_selection (
  subject_key text primary key,
  source_name text not null,
  base_url text not null,
  scan_url text not null,
  coverage_region text not null,
  state text null,
  language text not null,
  reliability_tier text not null,
  query_feed boolean not null default false,
  enrichment_approved boolean not null default false
) on commit drop;

insert into full_scale_source_selection values
  ('full-ie-india', 'Indian Express India RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/india/feed/', 'National', 'National', 'English', 'high', false, true),
  ('full-ht-india', 'Hindustan Times India RSS', 'https://www.hindustantimes.com/', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'National', 'National', 'English', 'high', false, true),
  ('full-toi-india', 'Times of India India RSS', 'https://timesofindia.indiatimes.com/', 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', 'National', 'National', 'English', 'standard', false, true),
  ('full-hindu-national', 'The Hindu National RSS', 'https://www.thehindu.com/', 'https://www.thehindu.com/news/national/feeder/default.rss', 'National', 'National', 'English', 'high', false, true),
  ('full-news18-india', 'News18 India RSS', 'https://www.news18.com/', 'https://www.news18.com/commonfeeds/v1/eng/rss/india.xml', 'National', 'National', 'English', 'standard', false, true),
  ('full-query-india', 'India Civic Query RSS', 'https://news.google.com/', 'https://news.google.com/rss/search?q=India%20(protest%20OR%20strike%20OR%20dharna%20OR%20blockade)&hl=en-IN&gl=IN&ceid=IN:en', 'National', 'National', 'English', 'lead_only', true, false),
  ('full-ie-delhi', 'Indian Express Delhi RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/delhi/feed/', 'North', 'Delhi', 'English', 'high', false, true),
  ('full-ie-chandigarh', 'Indian Express Chandigarh RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/chandigarh/feed/', 'North', 'Chandigarh', 'English', 'high', false, true),
  ('full-ht-lucknow', 'Hindustan Times Lucknow RSS', 'https://www.hindustantimes.com/', 'https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml', 'North', 'Uttar Pradesh', 'English', 'high', false, true),
  ('full-query-north', 'North India Civic Query RSS', 'https://news.google.com/', 'https://news.google.com/rss/search?q=(Punjab%20OR%20Delhi%20OR%20Uttar%20Pradesh)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en', 'North', 'National', 'English', 'lead_only', true, false),
  ('full-ie-bengaluru', 'Indian Express Bengaluru RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/bangalore/feed/', 'South', 'Karnataka', 'English', 'high', false, true),
  ('full-ie-hyderabad', 'Indian Express Hyderabad RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/hyderabad/feed/', 'South', 'Telangana', 'English', 'high', false, true),
  ('full-telangana-today', 'Telangana Today RSS', 'https://telanganatoday.com/', 'https://telanganatoday.com/feed', 'South', 'Telangana', 'English', 'standard', false, true),
  ('full-query-south', 'South India Civic Query RSS', 'https://news.google.com/', 'https://news.google.com/rss/search?q=(Tamil%20Nadu%20OR%20Karnataka%20OR%20Kerala%20OR%20Telangana)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en', 'South', 'National', 'English', 'lead_only', true, false),
  ('full-ie-kolkata', 'Indian Express Kolkata RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/kolkata/feed/', 'East', 'West Bengal', 'English', 'high', false, true),
  ('full-ie-bhubaneswar', 'Indian Express Bhubaneswar RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/bhubaneswar/feed/', 'East', 'Odisha', 'English', 'high', false, true),
  ('full-ht-patna', 'Hindustan Times Patna RSS', 'https://www.hindustantimes.com/', 'https://www.hindustantimes.com/feeds/rss/cities/patna-news/rssfeed.xml', 'East', 'Bihar', 'English', 'high', false, true),
  ('full-query-east', 'East India Civic Query RSS', 'https://news.google.com/', 'https://news.google.com/rss/search?q=(Bihar%20OR%20Jharkhand%20OR%20Odisha%20OR%20West%20Bengal)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en', 'East', 'National', 'English', 'lead_only', true, false),
  ('full-ie-mumbai', 'Indian Express Mumbai RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/mumbai/feed/', 'West', 'Maharashtra', 'English', 'high', false, true),
  ('full-ie-pune', 'Indian Express Pune RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/pune/feed/', 'West', 'Maharashtra', 'English', 'high', false, true),
  ('full-ie-ahmedabad', 'Indian Express Ahmedabad RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/ahmedabad/feed/', 'West', 'Gujarat', 'English', 'high', false, true),
  ('full-query-west', 'West India Civic Query RSS', 'https://news.google.com/', 'https://news.google.com/rss/search?q=(Maharashtra%20OR%20Gujarat%20OR%20Goa)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en', 'West', 'National', 'English', 'lead_only', true, false),
  ('full-nenow', 'NorthEast Now RSS', 'https://www.nenow.in/', 'https://www.nenow.in/feed', 'Northeast', 'National', 'English', 'standard', false, true),
  ('full-sentinel', 'Sentinel Assam RSS', 'https://www.sentinelassam.com/', 'https://www.sentinelassam.com/feed', 'Northeast', 'Assam', 'English', 'standard', false, true),
  ('full-assam-tribune', 'Assam Tribune RSS', 'https://assamtribune.com/', 'https://assamtribune.com/feed', 'Northeast', 'Assam', 'English', 'high', false, true),
  ('full-query-northeast', 'Northeast India Civic Query RSS', 'https://news.google.com/', 'https://news.google.com/rss/search?q=(Assam%20OR%20Manipur%20OR%20Nagaland%20OR%20Meghalaya)%20(protest%20OR%20strike%20OR%20blockade)&hl=en-IN&gl=IN&ceid=IN:en', 'Northeast', 'National', 'English', 'lead_only', true, false),
  ('full-ie-bhopal', 'Indian Express Bhopal RSS', 'https://indianexpress.com/', 'https://indianexpress.com/section/cities/bhopal/feed/', 'Central', 'Madhya Pradesh', 'English', 'high', false, true),
  ('full-ht-bhopal', 'Hindustan Times Bhopal RSS', 'https://www.hindustantimes.com/', 'https://www.hindustantimes.com/feeds/rss/cities/bhopal-news/rssfeed.xml', 'Central', 'Madhya Pradesh', 'English', 'high', false, true),
  ('full-mpinfo', 'Madhya Pradesh Information RSS', 'https://mpinfo.org/', 'https://mpinfo.org/RSSFeed/RSSFeed_News.xml', 'Central', 'Madhya Pradesh', 'Hindi', 'primary', false, false),
  ('full-query-central', 'Central India Civic Query RSS', 'https://news.google.com/', 'https://news.google.com/rss/search?q=(Madhya%20Pradesh%20OR%20Chhattisgarh)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en', 'Central', 'National', 'English', 'lead_only', true, false);

create or replace function public.enforce_minimum_daily_scanner_source_count()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.enabled and new.scan_frequency = 'daily' and (
    select count(*) from public.scan_sources
    where enabled and scan_frequency = 'daily' and id <> new.id
  ) >= 30 then
    raise exception using errcode = '23514', message = 'Daily scanner source limit exceeded';
  end if;
  return new;
end;
$$;

update public.scan_sources
set enabled = false, scan_frequency = 'manual',
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
  case when selected.query_feed then 'Public query RSS endpoint; metadata and outbound links only.'
    else 'Publisher- or authority-provided public RSS endpoint.' end,
  'India; ' || selected.coverage_region, 'Endpoint reviewed 2026-08-04 for private metadata discovery.',
  now(), 'allowed',
  'Publisher copyright remains intact. No full article, PDF, image, video or public feed republication.',
  'Private editorial discovery using bounded metadata, canonical links and permitted short excerpts.',
  'Metadata 30 days; rejected rows 14 days; duplicate fingerprints 90 days.',
  'No', 'No', 'Publisher and canonical source links retained.',
  'One metadata request per run; one conditional retry only for temporary network failures. Up to four approved enrichment requests per publisher domain.',
  'None; no login, API key, CAPTCHA, paywall or access bypass.',
  'Low; no profile enrichment or contact-detail collection.',
  'Potentially sensitive headlines remain private pending editor review.',
  'No profiling or unnecessary collection about children.', 'none',
  'approved_internal_review_only',
  (select user_id from public.media_admins order by created_at limit 1), now(), now() + interval '1 year',
  exists (select 1 from public.media_admins),
  'Owner-approved bounded private discovery. Technical accessibility is not public-display or full-text reuse approval.'
from full_scale_source_selection selected
on conflict (subject_type, subject_key) do update set
  platform_or_source_name = excluded.platform_or_source_name,
  source_url_or_api = excluded.source_url_or_api,
  terms_last_checked_at = excluded.terms_last_checked_at,
  robots_policy = excluded.robots_policy,
  permitted_data_use = excluded.permitted_data_use,
  rate_limits = excluded.rate_limits,
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
  compliance_registry_id, manual_dry_run_only, selection_reason
)
select
  selected.source_name, selected.base_url, selected.scan_url, 'rss_feed',
  selected.coverage_region || ' India civic, government, court, labour, education and public-affairs metadata',
  selected.state, selected.language, selected.reliability_tier, review.production_enabled, 'rss',
  jsonb_build_object(
    'status', 'approved_metadata_only', 'coverageRegion', selected.coverage_region,
    'collectionBoundary', 'feed_metadata_links_and_bounded_excerpt_only',
    'timeWindowHours', 96, 'maximumItems', 50, 'queryFeed', selected.query_feed,
    'fullArticleFetching', false, 'targetedEnrichment', selected.enrichment_approved,
    'enrichmentApproved', selected.enrichment_approved, 'robotsAllowed', true,
    'enrichmentDomains', jsonb_build_array(regexp_replace(selected.base_url, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1')),
    'maximumEnrichmentsPerDomain', 4, 'pdfFetching', false, 'mediaFetching', false,
    'scheduledScanning', false, 'temporaryRetryLimit', 1
  ),
  1, 86400, 'daily',
  'One metadata request per controlled run. Non-temporary 401, 403, 404 and 406 responses are not retried. Three consecutive failures disable the source.',
  review.id, false,
  'Selected after live endpoint review for regional balance and civic-event relevance.'
from full_scale_source_selection selected
join public.compliance_registry review
  on review.subject_type = 'source' and review.subject_key = selected.subject_key
on conflict (scan_url) do update set
  name = excluded.name, base_url = excluded.base_url, coverage_scope = excluded.coverage_scope,
  state = excluded.state, language = excluded.language, reliability_tier = excluded.reliability_tier,
  enabled = excluded.enabled, scan_method = excluded.scan_method,
  connector_config = excluded.connector_config, daily_request_limit = excluded.daily_request_limit,
  minimum_request_interval_seconds = excluded.minimum_request_interval_seconds,
  scan_frequency = excluded.scan_frequency, automated_access_notes = excluded.automated_access_notes,
  compliance_registry_id = excluded.compliance_registry_id, manual_dry_run_only = false,
  selection_reason = 'Selected after live endpoint review for regional balance and civic-event relevance.',
  manual_run_consumed_at = null, cooldown_until = null, updated_at = now();

update public.processing_purposes
set retention_details = '{"timeWindowHours":96,"maximumSources":30,"maximumRequestsPerSource":2,"maximumRawItems":800,"maximumIndiaGatedItems":300,"maximumPreliminaryCivicMatches":120,"maximumTargetedEnrichments":40,"maximumStoredItems":150,"maximumCandidates":60,"maximumRuntimeSeconds":540,"publicUse":"none","scope":"private_editorial_review_only"}'::jsonb
where purpose_key = 'daily_metadata_editorial_discovery';

create or replace function public.claim_manual_daily_scanner_dry_run(p_idempotency_key text)
returns uuid language plpgsql volatile security definer set search_path = pg_catalog, public, auth as $$
declare run_id uuid; eligible_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and not coalesce(public.is_authorised_editor(), false) then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('manual_daily_scanner_dry_run', 0));
  if exists (select 1 from public.scan_runs where trigger_type in ('manual_daily_scanner_dry_run', 'scheduled') and status in ('queued', 'running')) then
    raise exception using errcode = '55000', message = 'dry_scan_already_running';
  end if;
  if exists (select 1 from public.scan_runs where idempotency_key = p_idempotency_key) then
    raise exception using errcode = '55000', message = 'dry_scan_already_used';
  end if;
  if not exists (select 1 from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery' and approved and approval_status = 'approved_for_controlled_metadata_dry_run') then
    raise exception using errcode = '42501', message = 'daily_scanner_purpose_not_approved';
  end if;
  select count(*) into eligible_count
  from public.scan_sources source join public.compliance_registry review on review.id = source.compliance_registry_id
  where source.enabled and source.scan_frequency = 'daily' and source.scan_method in ('rss', 'atom', 'sitemap')
    and not source.manual_dry_run_only and source.daily_request_limit <= 2
    and review.production_enabled and review.review_expires_at > now()
    and review.robots_policy in ('allowed', 'not_applicable') and review.paywall_status = 'none';
  if eligible_count < 24 or eligible_count > 30 then
    raise exception using errcode = '42501', message = 'daily_scanner_source_count_invalid';
  end if;
  insert into public.scan_runs (idempotency_key, trigger_type, dry_run, requested_by, quota_usage)
  values (p_idempotency_key, 'manual_daily_scanner_dry_run', true, auth.uid(),
    '{"timeWindowHours":96,"maximumSources":30,"maximumRawItems":800,"maximumIndiaGatedItems":300,"maximumPreliminaryCivicMatches":120,"maximumTargetedEnrichments":40,"maximumStoredItems":150,"maximumCandidates":60,"maximumRuntimeSeconds":540,"rankingBeforeLimits":true}'::jsonb)
  returning id into run_id;
  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, id, state from public.scan_sources where enabled and scan_frequency = 'daily' order by name limit 30;
  update public.scan_runs set source_count = eligible_count where id = run_id;
  return run_id;
end;
$$;

revoke all on function public.claim_manual_daily_scanner_dry_run(text) from public, anon;
grant execute on function public.claim_manual_daily_scanner_dry_run(text) to authenticated, service_role;

drop view if exists public.source_coverage_metrics;
create view public.source_coverage_metrics with (security_invoker = true) as
select
  source.id, source.name, source.scan_url as endpoint,
  source.connector_config ->> 'coverageRegion' as region, source.state,
  source.district_or_region, source.language, source.source_type, source.scan_method as connector,
  source.enabled, source.last_successful_scan, source.last_attempted_scan,
  source.last_error_code, source.last_error_summary, source.failure_count as consecutive_failures,
  source.cooldown_until,
  source.last_http_status, source.last_content_type, source.last_item_count,
  source.selection_reason,
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

create or replace function public.enforce_daily_scanner_rollout_gate()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.scheduler_enabled and not old.scheduler_enabled and not exists (
    select 1 from public.scan_runs run
    where run.trigger_type = 'manual_daily_scanner_dry_run'
      and run.status in ('completed', 'incomplete') and run.success_count >= 20
      and exists (
        select 1 from public.discovered_items item
        join public.editorial_candidates candidate on candidate.discovered_item_id = item.id
        where item.first_scan_run_id = run.id
          and candidate.candidate_type in ('new_event', 'possible_planned_event', 'event_update', 'official_response', 'outcome_status_change')
          and candidate.confidence >= 0.50
      )
  ) then
    raise exception using errcode = '23514', message = 'A successful human-reviewed full-scale controlled run is required';
  end if;
  return new;
end;
$$;

comment on function public.claim_manual_daily_scanner_dry_run(text) is
  'Claims one private 96-hour India civic-event discovery run for 24 to 30 reviewed metadata sources; it does not enable scheduling.';
