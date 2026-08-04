begin;

select plan(12);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated',
  'focused-scanner-editor@example.invalid', now(), now()
);
insert into public.media_admins (user_id)
values ('77777777-7777-4777-8777-777777777777');

update public.compliance_registry
set production_enabled = true,
    reviewer = '77777777-7777-4777-8777-777777777777',
    reviewed_at = now(),
    review_expires_at = now() + interval '1 year'
where subject_key in ('northeast-now-rss', 'telangana-today-rss');

update public.scan_sources source
set enabled = review.subject_key in ('northeast-now-rss', 'telangana-today-rss')
from public.compliance_registry review
where review.id = source.compliance_registry_id
  and review.subject_key in (
    'northeast-now-rss', 'press-information-bureau-rss', 'telangana-today-rss'
  );

select is((select enabled from public.scan_sources where name = 'Press Information Bureau RSS'), false, 'PIB remains disabled');
select is((select enabled from public.scan_sources where name = 'NorthEast Now RSS'), true, 'NorthEast Now remains enabled');
select is((select enabled from public.scan_sources where name = 'Telangana Today RSS'), true, 'Telangana Today is enabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_frequency = 'daily'), 2, 'exactly two daily sources are enabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_method = 'rss'), 2, 'both focused sources use RSS');
select is((select count(*)::integer from public.scan_sources where enabled and daily_request_limit = 1), 2, 'each source has one normal request');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'timeWindowHours' = '72'), 2, 'both sources use a 72-hour window');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'fullArticleFetching' = 'false'), 2, 'full article fetching remains disabled');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'mediaFetching' = 'false'), 2, 'media fetching remains disabled');
select is((select scheduler_enabled from public.discovery_schedule_settings where singleton), false, 'scanner cron remains disabled');
select is((select outbound_email_enabled from public.discovery_schedule_settings where singleton), false, 'email remains disabled');
select is((select real_notifications_enabled from public.discovery_schedule_settings where singleton), false, 'notifications remain disabled');

select * from finish();
rollback;
