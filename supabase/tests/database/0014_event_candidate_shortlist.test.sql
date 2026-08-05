begin;

select plan(12);

select is((select (retention_details ->> 'maximumRawItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 800, 'raw metadata uses the full-scale cap');
select is((select (retention_details ->> 'maximumIndiaGatedItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 300, 'India-gated metadata is bounded');
select is((select (retention_details ->> 'maximumTargetedEnrichments')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 40, 'targeted enrichment is bounded');
select is((select (retention_details ->> 'maximumStoredItems')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 150, 'private rows use the current cap');
select is((select (retention_details ->> 'maximumCandidates')::integer from public.processing_purposes where purpose_key = 'daily_metadata_editorial_discovery'), 60, 'event candidates use the current cap');
select is((select scheduler_enabled from public.discovery_schedule_settings where singleton), false, 'scanner cron remains disabled');
select is((select outbound_email_enabled from public.discovery_schedule_settings where singleton), false, 'outbound email remains disabled');
select is((select real_notifications_enabled from public.discovery_schedule_settings where singleton), false, 'notifications remain disabled');
select is((select github_write_enabled from public.discovery_schedule_settings where singleton), false, 'GitHub publication remains disabled');
select has_function('public', 'claim_manual_daily_scanner_dry_run', array['text'], 'protected claim RPC remains available');
select function_privs_are('public', 'claim_manual_daily_scanner_dry_run', array['text'], 'anon', array[]::text[], 'anonymous cannot claim a scan');
select ok('possible_planned_event' = any (array['new_event', 'possible_planned_event', 'event_update']), 'planned event is part of the private shortlist vocabulary');

select * from finish();
rollback;
