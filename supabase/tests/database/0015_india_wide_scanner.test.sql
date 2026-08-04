begin;

select plan(17);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '99999999-9999-4999-8999-999999999999', 'authenticated', 'authenticated',
  'india-wide-editor@example.invalid', now(), now()
);
insert into public.media_admins (user_id)
values ('99999999-9999-4999-8999-999999999999');

update public.compliance_registry
set production_enabled = true,
    reviewer = '99999999-9999-4999-8999-999999999999',
    reviewed_at = now(),
    review_expires_at = now() + interval '1 year'
where subject_key in (
  'indian-express-india-rss', 'hindustan-times-india-rss', 'times-of-india-india-rss',
  'indian-express-delhi-rss', 'hindustan-times-lucknow-rss',
  'indian-express-bengaluru-rss', 'telangana-today-rss',
  'indian-express-kolkata-rss', 'hindustan-times-patna-rss',
  'indian-express-mumbai-rss', 'indian-express-ahmedabad-rss',
  'northeast-now-rss', 'eastmojo-rss', 'madhya-pradesh-information-rss'
);
update public.scan_sources source
set enabled = true, scan_frequency = 'daily'
from public.compliance_registry review
where review.id = source.compliance_registry_id
  and review.subject_key in (
    'indian-express-india-rss', 'hindustan-times-india-rss', 'times-of-india-india-rss',
    'indian-express-delhi-rss', 'hindustan-times-lucknow-rss',
    'indian-express-bengaluru-rss', 'telangana-today-rss',
    'indian-express-kolkata-rss', 'hindustan-times-patna-rss',
    'indian-express-mumbai-rss', 'indian-express-ahmedabad-rss',
    'northeast-now-rss', 'eastmojo-rss', 'madhya-pradesh-information-rss'
  );

select is((select count(*)::integer from public.scan_sources where enabled and scan_frequency = 'daily'), 14, 'fourteen reviewed feeds are enabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_method = 'rss'), 14, 'all selected sources use RSS');
select is((select count(*)::integer from public.scan_sources where enabled and daily_request_limit = 1), 14, 'each source has one normal request');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'National'), 3, 'national coverage has three sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'North'), 2, 'north coverage has two sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'South'), 2, 'south coverage has two sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'East'), 2, 'east coverage has two sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'West'), 2, 'west coverage has two sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'Northeast'), 2, 'northeast coverage has two sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'Central'), 1, 'central coverage has one source');
select is((select (retention_details ->> 'maximumRawItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 300, 'raw metadata is capped at 300');
select is((select (retention_details ->> 'maximumStoredItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 100, 'stored rows are capped at 100');
select is((select (retention_details ->> 'maximumCandidates')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 40, 'credible candidates are capped at 40');
select is((select scheduler_enabled from public.discovery_schedule_settings where singleton), false, 'scanner cron remains disabled');
select is((select outbound_email_enabled from public.discovery_schedule_settings where singleton), false, 'outbound email remains disabled');
select is((select real_notifications_enabled from public.discovery_schedule_settings where singleton), false, 'notifications remain disabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_method in ('gdelt', 'bluesky_api', 'youtube_api')), 0, 'prohibited discovery connectors remain disabled');

select * from finish();
rollback;
