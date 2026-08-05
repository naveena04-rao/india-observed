begin;

select plan(15);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated',
  'daily-scanner-editor@example.invalid', now(), now()
);
insert into public.media_admins (user_id)
values ('66666666-6666-4666-8666-666666666666');
update public.compliance_registry
set production_enabled = true,
    reviewer = '66666666-6666-4666-8666-666666666666',
    reviewed_at = now(),
    review_expires_at = now() + interval '1 year'
where subject_key like 'full-%';
update public.scan_sources set enabled = false, scan_frequency = 'manual';
update public.scan_sources source
set enabled = true, scan_frequency = 'daily'
from public.compliance_registry review
where review.id = source.compliance_registry_id
  and review.subject_key like 'full-%';

select is((select scan_cron_utc from public.discovery_schedule_settings where singleton), '30 1 * * *', 'daily scan is 07:00 IST');
select is((select scheduler_enabled from public.discovery_schedule_settings where singleton), false, 'scanner remains disabled before rollout');
select is((select dry_run_only from public.discovery_schedule_settings where singleton), true, 'dry-run safety defaults on');
select is((select outbound_email_enabled from public.discovery_schedule_settings where singleton), false, 'outbound email remains disabled');
select is((select real_notifications_enabled from public.discovery_schedule_settings where singleton), false, 'notifications remain disabled');
select is((select github_write_enabled from public.discovery_schedule_settings where singleton), false, 'GitHub writes remain disabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_frequency = 'daily'), 30, 'thirty daily sources are enabled for a controlled run');
select is((select count(*)::integer from public.scan_sources where enabled and scan_method = 'rss'), 30, 'all daily sources use RSS');
select is((select count(*)::integer from public.scan_sources where enabled and daily_request_limit <= 2), 30, 'all sources have bounded retry-aware request limits');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'fullArticleFetching' = 'false'), 30, 'unbounded full article fetching is disabled');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'mediaFetching' = 'false'), 30, 'media fetching is disabled');
select has_function('public', 'claim_manual_daily_scanner_dry_run', array['text'], 'readiness claim RPC exists');
select function_privs_are('public', 'claim_manual_daily_scanner_dry_run', array['text'], 'anon', array[]::text[], 'anonymous users cannot claim a run');
select throws_ok($$ select public.claim_manual_daily_scanner_dry_run('anonymous:daily:scanner:test') $$, '42501', 'Authorised editor access required', 'unauthenticated claim fails closed');
select is((select count(*)::integer from public.scan_runs where trigger_type = 'manual_daily_scanner_dry_run'), 0, 'no readiness scan is created by migration');

select * from finish();
rollback;
