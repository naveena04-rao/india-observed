begin;

select plan(12);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '88888888-8888-4888-8888-888888888888', 'authenticated', 'authenticated',
  'shortlist-editor@example.invalid', now(), now()
);
insert into public.media_admins (user_id)
values ('88888888-8888-4888-8888-888888888888');
update public.compliance_registry
set production_enabled = true,
    reviewer = '88888888-8888-4888-8888-888888888888',
    reviewed_at = now(),
    review_expires_at = now() + interval '1 year'
where subject_key in ('northeast-now-rss', 'telangana-today-rss');
update public.scan_sources source
set enabled = true
from public.compliance_registry review
where review.id = source.compliance_registry_id
  and review.subject_key in ('northeast-now-rss', 'telangana-today-rss');

select is(
  (select (retention_details ->> 'maximumRawItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'),
  60,
  'raw metadata is capped at 60 items'
);
select is(
  (select (retention_details ->> 'maximumStoredItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'),
  30,
  'stored diagnostic and candidate rows are capped at 30'
);
select is(
  (select (retention_details ->> 'maximumCandidates')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'),
  15,
  'credible event candidates are capped at 15'
);
select is((select scheduler_enabled from public.discovery_schedule_settings where singleton), false, 'scanner cron remains disabled');
select is((select outbound_email_enabled from public.discovery_schedule_settings where singleton), false, 'outbound email remains disabled');
select is((select real_notifications_enabled from public.discovery_schedule_settings where singleton), false, 'notifications remain disabled');
select is((select github_write_enabled from public.discovery_schedule_settings where singleton), false, 'GitHub publication remains disabled');
select has_function('public', 'claim_manual_daily_scanner_dry_run', array['text'], 'protected claim RPC remains available');
select function_privs_are('public', 'claim_manual_daily_scanner_dry_run', array['text'], 'anon', array[]::text[], 'anonymous cannot claim a scan');
select throws_ok(
  $$ select public.claim_manual_daily_scanner_dry_run('anonymous:event-shortlist:test') $$,
  '42501',
  'Authorised editor access required',
  'unauthenticated claim fails closed'
);
select is((select count(*)::integer from public.scan_sources where enabled and scan_frequency = 'daily'), 2, 'exactly two daily sources remain enabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_method = 'rss'), 2, 'both enabled sources remain RSS');

select * from finish();
rollback;
