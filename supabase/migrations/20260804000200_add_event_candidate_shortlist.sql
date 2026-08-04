-- Tighten the controlled scanner around credible private civic-event candidates.
-- Scheduling and every public, notification and publication side effect remain disabled.

update public.processing_purposes
set retention_details = '{"timeWindowHours":72,"maximumSources":2,"maximumRequestsPerSource":2,"maximumRawItems":60,"maximumStoredItems":30,"maximumCandidates":15,"candidateDefinition":"event_types_at_or_above_0.50_confidence","maximumRuntimeSeconds":240,"publicUse":"none","scope":"private_editorial_review_only"}'::jsonb
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
    '{"timeWindowHours":72,"maximumSources":2,"maximumRawItems":60,"maximumStoredItems":30,"maximumCandidates":15,"maximumRuntimeSeconds":240}'::jsonb
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
  'Claims one private two-source, 60-raw, 30-stored and 15-event-candidate readiness run.';
