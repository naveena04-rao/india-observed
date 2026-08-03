-- Atomically claim the approved one-time GDELT metadata run. This does not enable scheduling.

create or replace function public.claim_manual_gdelt_dry_run(
  p_idempotency_key text
) returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_id uuid;
  source_ids uuid[];
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and not coalesce(public.is_authorised_editor(), false) then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;

  -- Serialise claims so two browser submissions cannot start parallel runs.
  perform pg_advisory_xact_lock(hashtextextended('manual_gdelt_dry_run', 0));

  if exists (
    select 1 from public.scan_runs
    where trigger_type = 'manual_gdelt_dry_run'
      and status in ('queued', 'running')
  ) then
    raise exception using errcode = '55000', message = 'dry_scan_already_running';
  end if;

  if exists (
    select 1 from public.scan_runs where idempotency_key = p_idempotency_key
  ) then
    raise exception using errcode = '55000', message = 'dry_scan_already_used';
  end if;

  if not exists (
    select 1 from public.processing_purposes
    where purpose_key = 'gdelt_metadata_editorial_discovery_dry_run'
      and approved
      and approval_status = 'approved_for_controlled_metadata_dry_run'
  ) then
    raise exception using errcode = '42501', message = 'controlled_gdelt_purpose_not_approved';
  end if;

  select array_agg(source.id order by source.id)
  into source_ids
  from public.scan_sources source
  join public.compliance_registry review on review.id = source.compliance_registry_id
  where source.name = 'GDELT DOC API'
    and source.scan_url = 'https://api.gdeltproject.org/api/v2/doc/doc'
    and source.scan_method = 'gdelt'
    and source.enabled = false
    and source.manual_dry_run_only
    and source.manual_run_consumed_at is null
    and source.daily_request_limit = 60
    and source.scan_frequency = 'manual'
    and source.connector_config @> '{
      "status":"approved_for_manual_dry_run_only",
      "collectionBoundary":"metadata_and_canonical_links_only",
      "fullArticleFetching":false,
      "mediaFetching":false,
      "maximumQueries":60,
      "maximumDiscoveredItems":300,
      "maximumCandidates":100,
      "timeWindowHours":48
    }'::jsonb
    and review.production_enabled
    and review.legal_review_status = 'approved_for_controlled_metadata_dry_run'
    and review.review_expires_at > now()
    and review.paywall_status not in ('paywalled', 'access_controlled')
    and review.robots_policy not in ('not_assessed', 'restricted', 'forbidden');

  if coalesce(cardinality(source_ids), 0) = 0 and exists (
    select 1 from public.scan_sources
    where name = 'GDELT DOC API' and manual_run_consumed_at is not null
  ) then
    raise exception using errcode = '55000', message = 'dry_scan_already_used';
  end if;

  if coalesce(cardinality(source_ids), 0) <> 1 then
    raise exception using errcode = '42501', message = 'controlled_gdelt_configuration_invalid';
  end if;

  insert into public.scan_runs (
    idempotency_key, trigger_type, scheduled_for, dry_run, requested_by
  ) values (
    p_idempotency_key, 'manual_gdelt_dry_run', null, true, auth.uid()
  ) returning id into run_id;

  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, source_ids[1], source.state
  from public.scan_sources source
  where source.id = source_ids[1];

  update public.scan_runs set source_count = 1 where id = run_id;
  return run_id;
end;
$$;

revoke all on function public.claim_manual_gdelt_dry_run(text) from public, anon;
grant execute on function public.claim_manual_gdelt_dry_run(text) to authenticated, service_role;

comment on function public.claim_manual_gdelt_dry_run(text) is
  'Authorised-editor-only, one-time claim for the bounded GDELT metadata dry run.';
