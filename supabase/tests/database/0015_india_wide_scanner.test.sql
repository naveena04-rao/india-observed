begin;

select plan(17);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('99999999-9999-4999-8999-999999999999', 'authenticated', 'authenticated', 'india-wide-editor@example.invalid', now(), now());
insert into public.media_admins (user_id) values ('99999999-9999-4999-8999-999999999999');

update public.scan_sources set enabled = false, scan_frequency = 'manual';
update public.compliance_registry
set production_enabled = true, reviewer = '99999999-9999-4999-8999-999999999999',
    reviewed_at = now(), review_expires_at = now() + interval '1 year'
where subject_key like 'full-%';
update public.scan_sources source
set enabled = true, scan_frequency = 'daily'
from public.compliance_registry review
where review.id = source.compliance_registry_id and review.subject_key like 'full-%';

select is((select count(*)::integer from public.scan_sources where enabled and scan_frequency = 'daily'), 30, 'thirty reviewed feeds are enabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_method = 'rss'), 30, 'all selected sources use RSS');
select is((select count(*)::integer from public.scan_sources where enabled and daily_request_limit = 1), 30, 'each source has one normal request');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'National'), 6, 'national coverage has six sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'North'), 4, 'north coverage has four sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'South'), 4, 'south coverage has four sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'East'), 4, 'east coverage has four sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'West'), 4, 'west coverage has four sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'Northeast'), 4, 'northeast coverage has four sources');
select is((select count(*)::integer from public.scan_sources where enabled and connector_config ->> 'coverageRegion' = 'Central'), 4, 'central coverage has four sources');
select is((select count(*)::integer from public.scan_sources where enabled and language = 'Hindi'), 1, 'one official Hindi source is configured');
select is((select (retention_details ->> 'maximumRawItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 800, 'raw metadata is capped at 800');
select is((select (retention_details ->> 'maximumStoredItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 150, 'stored rows are capped at 150');
select is((select (retention_details ->> 'maximumCandidates')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 60, 'credible candidates are capped at 60');
select is((select scheduler_enabled from public.discovery_schedule_settings where singleton), false, 'scanner cron remains disabled');
select is((select real_notifications_enabled from public.discovery_schedule_settings where singleton), false, 'notifications remain disabled');
select is((select count(*)::integer from public.scan_sources where enabled and scan_method in ('gdelt', 'bluesky_api', 'youtube_api')), 0, 'prohibited discovery connectors remain disabled');

select * from finish();
rollback;
