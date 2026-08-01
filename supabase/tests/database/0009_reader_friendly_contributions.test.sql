begin;
select plan(10);

create temporary table event_count_before as select count(*)::integer as count from public.events;

set local role service_role;
select lives_ok(
  $$select public.submit_structured_lead(
    'existing-event', 'correction', 'kisan-ghat-india-us-trade-deal', 'IO-CM-DL-0007',
    '[{"fieldKey":"correction_request","existingValueSnapshot":"The record says an incorrect date.","proposedValue":"The event took place on 2026-07-30.","explanation":"The linked notice gives the date."}]',
    '[{"url":"https://example.org/public-notice","headline":"Submitted public source","publisher":"example.org","sourceType":"Original media reporting","sourceRole":"Corroboration","publicationDate":"","language":"","summary":"The notice supports this correction.","supportedFieldKey":""}]',
    '[{"mediaType":"photo","url":"https://example.org/notice.jpg","caption":"Reader-submitted public photo reference","sourceOrCreator":"example.org","publicationDate":"","depicts":"Public notice supporting the correction.","privacySafetyNote":"Public URL submitted for review."}]',
    'Reader-friendly correction submission.', 'reader@example.org', null, repeat('f', 64)
  )$$,
  'reader-friendly correction maps into structured storage'
);
reset role;

select is((select status from public.lead_submissions where submission_fingerprint = repeat('f', 64)), 'pending_review', 'submission stays pending review');
select is((select related_event_id from public.lead_submissions where submission_fingerprint = repeat('f', 64)), 'IO-CM-DL-0007', 'snapshot-backed target event is preserved');
select is((select field_key from public.lead_event_field_proposals where submission_id = (select id from public.lead_submissions where submission_fingerprint = repeat('f', 64))), 'correction_request', 'safe correction category is stored');
select is((select existing_value_snapshot from public.lead_event_field_proposals where submission_id = (select id from public.lead_submissions where submission_fingerprint = repeat('f', 64))), 'The record says an incorrect date.', 'incorrect wording is retained for comparison');
select is((select proposed_value from public.lead_event_field_proposals where submission_id = (select id from public.lead_submissions where submission_fingerprint = repeat('f', 64))), 'The event took place on 2026-07-30.', 'replacement wording is structured');
select is((select count(*)::integer from public.lead_submission_sources where submission_id = (select id from public.lead_submissions where submission_fingerprint = repeat('f', 64))), 1, 'simple link becomes a structured source');
select is((select count(*)::integer from public.lead_submission_media where submission_id = (select id from public.lead_submissions where submission_fingerprint = repeat('f', 64))), 1, 'simple media URL becomes a structured media record');
select is((select count(*)::integer from public.events), (select count from event_count_before), 'public events are unchanged');

set local role anon;
select throws_ok(
  'select count(*) from public.lead_event_field_proposals',
  '42501',
  'permission denied for table lead_event_field_proposals',
  'reader submissions remain private'
);
reset role;

select * from finish();
rollback;
