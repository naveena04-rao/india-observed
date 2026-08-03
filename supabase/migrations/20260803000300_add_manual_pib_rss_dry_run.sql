-- One owner-approved, metadata-only PIB RSS dry run for private editorial review.
-- This does not constitute final legal clearance and does not enable scheduling.

alter table public.scan_runs drop constraint if exists scan_runs_trigger_type_check;
alter table public.scan_runs add constraint scan_runs_trigger_type_check check (
  trigger_type in (
    'scheduled', 'manual', 'manual_gdelt_dry_run', 'manual_fallback_dry_run',
    'manual_pib_rss_dry_run', 'retry'
  )
);

alter table public.editorial_candidates
  drop constraint if exists editorial_candidates_candidate_type_check;
alter table public.editorial_candidates
  add constraint editorial_candidates_candidate_type_check check (candidate_type in (
    'new_event', 'event_update', 'official_response', 'outcome_status_change', 'new_source',
    'media_evidence', 'duplicate', 'irrelevant', 'manual_review', 'processing_failed'
  ));

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
  if new.manual_dry_run_only and not (
    (
      new.scan_method = 'gdelt'
      and review.legal_review_status = 'approved_for_controlled_metadata_dry_run'
    )
    or (
      new.name = 'Press Information Bureau RSS'
      and new.scan_method = 'rss'
      and review.legal_review_status = 'approved_for_controlled_metadata_dry_run'
      and new.connector_config @> '{"status":"approved_for_one_manual_metadata_dry_run_only"}'::jsonb
    )
  ) then
    raise exception using errcode = '23514', message = 'Manual metadata approval is limited to an approved controlled source';
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

insert into public.processing_purposes (
  purpose_key, purpose_description, lawful_basis_or_assessment, data_categories,
  prohibited_data_categories, retention_days, approved, approved_by, approved_at,
  approval_status, retention_details
) values (
  'pib_rss_metadata_editorial_dry_run',
  'Discover possible official government responses, announcements, decisions, negotiations, settlements, administrative actions, and other updates relevant to civic events.',
  'Owner-approved controlled technical and editorial metadata test; this is not final legal clearance.',
  array[
    'feed-item title', 'canonical link', 'issuer', 'publication time',
    'short RSS-provided summary when necessary', 'detected language',
    'possible event match', 'candidate classification', 'duplicate fingerprint'
  ],
  array[
    'full press-release body', 'attached PDFs', 'images or videos', 'contact details',
    'personal profiles', 'unrelated personal information'
  ],
  30,
  true,
  (select user_id from public.media_admins order by created_at limit 1),
  now(),
  'approved_for_controlled_metadata_dry_run',
  '{"status":"approved_for_one_manual_metadata_dry_run_only","timeWindowHours":72,"maximumFeedItems":20,"maximumDiscoveredItems":20,"maximumCandidates":15,"publicUse":"none","scope":"private_editorial_review_only"}'::jsonb
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
  jurisdiction, robots_policy, copyright_or_licensing, permitted_data_use,
  permitted_retention, permitted_redistribution, permitted_media_display,
  attribution_requirement, rate_limits, authentication_requirement, personal_data_risk,
  sensitive_data_risk, children_data_risk, paywall_status, legal_review_status,
  reviewer, reviewed_at, review_expires_at, production_enabled, decision_reason
) values (
  'source',
  'press-information-bureau-rss',
  'Press Information Bureau RSS',
  'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=6',
  'Official publisher-provided RSS endpoint; one bounded metadata request only.',
  'India; private editorial review only',
  'not_applicable',
  'Titles, feed metadata and canonical links only; no press-release body, PDF, image, or video is collected.',
  'One owner-approved manual metadata dry run for private editorial review.',
  'Metadata 30 days; rejected candidates 14 days; duplicate fingerprints 90 days.',
  'No',
  'No',
  'Retain Press Information Bureau as issuer and the canonical item link.',
  'One request; at most one conditional retry for a temporary network failure; 20 items maximum.',
  'None; no authentication or access bypass permitted.',
  'Low; title metadata is reviewed privately and unnecessary personal information is prohibited.',
  'Official titles may contain sensitive event context and require human review.',
  'No profile enrichment or collection of unnecessary information about children.',
  'none',
  'approved_for_controlled_metadata_dry_run',
  (select user_id from public.media_admins order by created_at limit 1),
  now(),
  now() + interval '24 hours',
  exists (select 1 from public.media_admins),
  'Owner-approved for one controlled technical and editorial metadata test only; technical accessibility is not final legal clearance.'
)
on conflict (subject_type, subject_key) do update set
  platform_or_source_name = excluded.platform_or_source_name,
  source_url_or_api = excluded.source_url_or_api,
  access_method = excluded.access_method,
  jurisdiction = excluded.jurisdiction,
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
) select
  'Press Information Bureau RSS',
  'https://pib.gov.in/',
  'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=6',
  'rss_feed',
  'India national official government responses and civic-event updates from the previous 72 hours',
  'National',
  'English',
  'primary',
  false,
  'rss',
  '{"status":"approved_for_one_manual_metadata_dry_run_only","collectionBoundary":"feed_metadata_and_canonical_links_only","timeWindowHours":72,"maximumFeedItems":20,"maximumDiscoveredItems":20,"maximumCandidates":15,"fullArticleFetching":false,"pdfFetching":false,"mediaFetching":false,"scheduledScanning":false}'::jsonb,
  1,
  21600,
  'manual',
  'One request to the official PIB RSS endpoint with conditional ETag and Last-Modified support. No item-page, PDF, or media fetch.',
  id,
  true
from public.compliance_registry
where subject_type = 'source' and subject_key = 'press-information-bureau-rss'
  and exists (select 1 from public.media_admins)
on conflict (scan_url) do update set
  enabled = false,
  scan_method = excluded.scan_method,
  connector_config = excluded.connector_config,
  daily_request_limit = excluded.daily_request_limit,
  minimum_request_interval_seconds = excluded.minimum_request_interval_seconds,
  scan_frequency = excluded.scan_frequency,
  automated_access_notes = excluded.automated_access_notes,
  compliance_registry_id = excluded.compliance_registry_id,
  manual_dry_run_only = true,
  manual_run_consumed_at = null;

create or replace function public.claim_manual_pib_rss_dry_run(
  p_idempotency_key text
) returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_id uuid;
  source_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and not coalesce(public.is_authorised_editor(), false) then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('manual_pib_rss_dry_run', 0));

  if exists (
    select 1 from public.scan_runs
    where trigger_type = 'manual_pib_rss_dry_run' and status in ('queued', 'running')
  ) then
    raise exception using errcode = '55000', message = 'dry_scan_already_running';
  end if;
  if exists (select 1 from public.scan_runs where idempotency_key = p_idempotency_key) then
    raise exception using errcode = '55000', message = 'dry_scan_already_used';
  end if;
  if not exists (
    select 1 from public.processing_purposes
    where purpose_key = 'pib_rss_metadata_editorial_dry_run'
      and approved
      and approval_status = 'approved_for_controlled_metadata_dry_run'
      and retention_details @> '{"status":"approved_for_one_manual_metadata_dry_run_only"}'::jsonb
  ) then
    raise exception using errcode = '42501', message = 'pib_processing_purpose_not_approved';
  end if;

  select source.id into source_id
  from public.scan_sources source
  join public.compliance_registry review on review.id = source.compliance_registry_id
  where source.name = 'Press Information Bureau RSS'
    and source.scan_url = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=6'
    and not source.enabled
    and source.manual_dry_run_only
    and source.manual_run_consumed_at is null
    and source.scan_method = 'rss'
    and source.daily_request_limit = 1
    and source.connector_config @> '{"status":"approved_for_one_manual_metadata_dry_run_only","timeWindowHours":72,"maximumFeedItems":20,"maximumDiscoveredItems":20,"maximumCandidates":15,"fullArticleFetching":false,"pdfFetching":false,"mediaFetching":false,"scheduledScanning":false}'::jsonb
    and review.production_enabled
    and review.legal_review_status = 'approved_for_controlled_metadata_dry_run'
    and review.review_expires_at > now()
    and review.paywall_status = 'none'
    and review.robots_policy = 'not_applicable'
  limit 1;

  if source_id is null then
    raise exception using errcode = '42501', message = 'pib_source_unavailable';
  end if;

  insert into public.scan_runs (
    idempotency_key, trigger_type, scheduled_for, dry_run, requested_by, quota_usage
  ) values (
    p_idempotency_key,
    'manual_pib_rss_dry_run',
    null,
    true,
    auth.uid(),
    '{"timeWindowHours":72,"maximumSources":1,"maximumRequests":1,"maximumFetchedItems":20,"maximumCandidates":15}'::jsonb
  ) returning id into run_id;

  insert into public.scan_jobs (scan_run_id, source_id, state)
  values (run_id, source_id, 'National');

  update public.scan_runs set source_count = 1 where id = run_id;
  return run_id;
end;
$$;

revoke all on function public.claim_manual_pib_rss_dry_run(text) from public, anon;
grant execute on function public.claim_manual_pib_rss_dry_run(text) to authenticated, service_role;

comment on function public.claim_manual_pib_rss_dry_run(text) is
  'Claims the one owner-approved PIB RSS metadata dry run; never enables scheduled discovery.';
