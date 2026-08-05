begin;

select plan(17);

select has_column('public', 'editorial_candidates', 'planned_date', 'planned date is retained privately');
select has_column('public', 'editorial_candidates', 'action_type', 'action type is retained privately');
select has_column('public', 'editorial_candidates', 'affected_group', 'affected group is retained privately');
select has_column('public', 'editorial_candidates', 'demand', 'demand is retained privately');
select has_column('public', 'editorial_candidates', 'authority_response', 'authority response is retained privately');
select has_column('public', 'editorial_candidates', 'dictionary_matches', 'dictionary matches are private diagnostics');
select has_column('public', 'editorial_candidates', 'detected_language', 'detected language is private diagnostics');
select has_column('public', 'scan_sources', 'last_http_status', 'source HTTP status is retained');
select has_column('public', 'scan_sources', 'last_content_type', 'source content type is retained');
select has_column('public', 'scan_sources', 'last_item_count', 'source item count is retained');
select has_column('public', 'scan_sources', 'selection_reason', 'source selection reason is retained');
select is((select count(*)::integer from public.scan_sources source join public.compliance_registry review on review.id = source.compliance_registry_id where review.subject_key like 'full-%'), 30, 'thirty reviewed source records exist');
select is((select count(*)::integer from public.scan_sources source join public.compliance_registry review on review.id = source.compliance_registry_id where review.subject_key like 'full-query-%' and source.connector_config ->> 'enrichmentApproved' = 'false'), 7, 'query feeds cannot enrich article pages');
select is((select count(*)::integer from public.scan_sources source join public.compliance_registry review on review.id = source.compliance_registry_id where review.subject_key like 'full-%' and source.daily_request_limit = 1), 30, 'one metadata request is configured per endpoint');
select is((select count(*)::integer from public.scan_sources source join public.compliance_registry review on review.id = source.compliance_registry_id where review.subject_key like 'full-%' and source.connector_config ->> 'targetedEnrichment' = 'true' and source.connector_config -> 'enrichmentDomains' ->> 0 ~ '^[a-z0-9.-]+$'), 22, 'every enrichment-enabled source has a valid reviewed hostname');
select is((select scheduler_enabled from public.discovery_schedule_settings where singleton), false, 'cron remains disabled');
select is((select count(*)::integer from public.event_notifications), 0, 'migration creates no notifications');

select * from finish();
rollback;
