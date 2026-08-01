begin;
select plan(24);

select has_table('public', 'lead_event_field_proposals', 'proposal table exists');
select has_table('public', 'lead_submission_sources', 'source table exists');
select has_table('public', 'lead_submission_media', 'media table exists');
select is((select relrowsecurity from pg_class where oid = 'public.lead_event_field_proposals'::regclass), true, 'proposal RLS is enabled');
select is(has_table_privilege('anon', 'public.lead_event_field_proposals', 'select'), false, 'anonymous proposal SELECT is denied');
select is(has_table_privilege('authenticated', 'public.lead_submission_sources', 'insert'), false, 'authenticated source INSERT is denied');
select is(has_table_privilege('anon', 'public.lead_submission_media', 'insert'), false, 'anonymous media INSERT is denied');
select is(has_function_privilege('anon', 'public.submit_structured_lead(text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text)', 'execute'), false, 'anonymous RPC is denied');
select is(has_function_privilege('service_role', 'public.submit_structured_lead(text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text)', 'execute'), true, 'service role can submit');

create temporary table event_count_before as select count(*)::integer as count from public.events;
set local role service_role;
select lives_ok(
  $$select public.submit_structured_lead(
    'existing-event', 'official-response', 'student-protest-record', 'IO-CM-DL-0001',
    '[{"fieldKey":"latest_official_response","existingValueSnapshot":"","proposedValue":"The authority issued a public response.","explanation":"Public statement"}]',
    '[{"url":"https://example.org/statement","headline":"Official statement","publisher":"Example authority","sourceType":"Official government source","sourceRole":"Official response","publicationDate":"2026-08-01","language":"English","summary":"Response text","supportedFieldKey":"latest_official_response"}]',
    '[{"mediaType":"video","url":"https://example.org/video","caption":"Official briefing","sourceOrCreator":"Example authority","publicationDate":"2026-08-01","depicts":"An official public briefing","privacySafetyNote":""}]',
    'Review against the public statement.', 'reader@example.org', '+91 98765 43210', repeat('b', 64)
  )$$,
  'official response can be stored'
);
reset role;

select is((select submission_mode from public.lead_submissions where submission_fingerprint = repeat('b', 64)), 'existing-event', 'mode is stored');
select is((select contribution_type from public.lead_submissions where submission_fingerprint = repeat('b', 64)), 'official-response', 'contribution type is stored');
select is((select related_event_id from public.lead_submissions where submission_fingerprint = repeat('b', 64)), 'IO-CM-DL-0001', 'exact target event is stored');
select is((select status from public.lead_submissions where submission_fingerprint = repeat('b', 64)), 'pending_review', 'submission is pending review');
select is((select field_key from public.lead_event_field_proposals limit 1), 'latest_official_response', 'field proposal is stored');
select is((select proposed_value from public.lead_event_field_proposals limit 1), 'The authority issued a public response.', 'proposed value is stored');
select is((select review_status from public.lead_event_field_proposals limit 1), 'pending_review', 'proposal is pending review');
select is((select source_role from public.lead_submission_sources limit 1), 'Official response', 'structured source is stored');
select is((select media_type from public.lead_submission_media limit 1), 'video', 'structured video is stored');
select is((select count(*)::integer from public.events), (select count from event_count_before), 'submission does not mutate public events');

set local role service_role;
select throws_ok(
  $$select public.submit_structured_lead('new-event','new-event',null,null,'[{"fieldKey":"verification_status","proposedValue":"verified","existingValueSnapshot":"","explanation":""}]','[]','[]',null,'reader@example.org',null,repeat('c',64))$$,
  '23514', null, 'internal-only field key is rejected'
);
reset role;

set local role service_role;
select lives_ok(
  $$select public.submit_lead('Legacy public meeting', repeat('Factual legacy description. ', 3), 'New Delhi', date '2026-08-01', 'exact', '{}', null, 'legacy@example.org', null, null, 'new-lead', 'none', repeat('d', 64))$$,
  'legacy RPC remains usable'
);
reset role;
select isnt((select title from public.lead_submissions where submission_fingerprint = repeat('d', 64)), null, 'legacy submission remains readable');
select is((select submission_mode from public.lead_submissions where submission_fingerprint = repeat('d', 64)), 'legacy', 'legacy rows receive backward-compatible mode');

select * from finish();
rollback;
