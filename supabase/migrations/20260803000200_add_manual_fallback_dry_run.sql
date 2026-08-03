-- One-time metadata-only fallback discovery, with GDELT explicitly excluded.

alter table public.scan_sources
add column if not exists cooldown_until timestamptz null;

alter table public.scan_runs drop constraint if exists scan_runs_trigger_type_check;
alter table public.scan_runs add constraint scan_runs_trigger_type_check check (
  trigger_type in ('scheduled', 'manual', 'manual_gdelt_dry_run', 'manual_fallback_dry_run', 'retry')
);

create or replace function public.claim_manual_fallback_dry_run(
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

  perform pg_advisory_xact_lock(hashtextextended('manual_fallback_dry_run', 0));

  if exists (
    select 1 from public.scan_runs
    where trigger_type = 'manual_fallback_dry_run' and status in ('queued', 'running')
  ) then
    raise exception using errcode = '55000', message = 'dry_scan_already_running';
  end if;
  if exists (select 1 from public.scan_runs where idempotency_key = p_idempotency_key) then
    raise exception using errcode = '55000', message = 'dry_scan_already_used';
  end if;
  if not exists (
    select 1 from public.processing_purposes
    where purpose_key = 'private_editorial_discovery' and approved
  ) then
    raise exception using errcode = '42501', message = 'fallback_processing_purpose_not_approved';
  end if;

  select array_agg(id order by priority, name)
  into source_ids
  from (
    select source.id, source.name,
      case source.scan_method
        when 'rss' then 1 when 'atom' then 1 when 'sitemap' then 2
        when 'html_list' then 3 when 'youtube_api' then 4 when 'bluesky_api' then 5
        else 99
      end as priority
    from public.scan_sources source
    join public.compliance_registry review on review.id = source.compliance_registry_id
    where source.enabled
      and source.scan_method in ('rss', 'atom', 'sitemap', 'html_list', 'youtube_api', 'bluesky_api')
      and (source.cooldown_until is null or source.cooldown_until <= now())
      and review.production_enabled
      and review.legal_review_status in (
        'approved_metadata_only', 'approved_link_and_excerpt', 'approved_official_api',
        'approved_internal_review_only'
      )
      and review.review_expires_at > now()
      and review.paywall_status not in ('paywalled', 'access_controlled')
      and review.robots_policy not in ('not_assessed', 'restricted', 'forbidden')
    order by priority, source.name
    limit 20
  ) eligible;

  if coalesce(cardinality(source_ids), 0) = 0 then
    raise exception using errcode = '42501', message = 'fallback_sources_unavailable';
  end if;

  insert into public.scan_runs (
    idempotency_key, trigger_type, scheduled_for, dry_run, requested_by
  ) values (
    p_idempotency_key, 'manual_fallback_dry_run', null, true, auth.uid()
  ) returning id into run_id;

  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, source.id, source.state
  from public.scan_sources source
  where source.id = any(source_ids);

  update public.scan_runs set source_count = cardinality(source_ids) where id = run_id;
  return run_id;
end;
$$;

revoke all on function public.claim_manual_fallback_dry_run(text) from public, anon;
grant execute on function public.claim_manual_fallback_dry_run(text) to authenticated, service_role;

comment on function public.claim_manual_fallback_dry_run(text) is
  'Claims one bounded, metadata-only fallback run from already-enabled compliant non-GDELT sources.';
