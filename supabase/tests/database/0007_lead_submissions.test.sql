begin;

select plan(23);

select has_table('public', 'lead_submissions', 'lead submissions table exists');
select is((select relrowsecurity from pg_class where oid = 'public.lead_submissions'::regclass), true, 'RLS is enabled');
select is(has_table_privilege('anon', 'public.lead_submissions', 'select'), false, 'anonymous SELECT is denied');
select is(has_table_privilege('anon', 'public.lead_submissions', 'insert'), false, 'anonymous INSERT is denied');
select is(has_table_privilege('anon', 'public.lead_submissions', 'update'), false, 'anonymous UPDATE is denied');
select is(has_table_privilege('anon', 'public.lead_submissions', 'delete'), false, 'anonymous DELETE is denied');
select is(has_table_privilege('authenticated', 'public.lead_submissions', 'insert'), false, 'authenticated direct INSERT is denied');
select is(has_table_privilege('authenticated', 'public.lead_submissions', 'delete'), false, 'authenticated DELETE is denied');
select is(has_function_privilege('anon', 'public.submit_lead(text,text,text,date,text,text[],text,text,text,text,text,text,text)', 'execute'), false, 'anonymous RPC execution is denied');
select is(has_function_privilege('authenticated', 'public.submit_lead(text,text,text,date,text,text[],text,text,text,text,text,text,text)', 'execute'), false, 'authenticated RPC execution is denied');
select is(has_function_privilege('service_role', 'public.submit_lead(text,text,text,date,text,text[],text,text,text,text,text,text,text)', 'execute'), true, 'service role can execute insertion boundary');

set local role service_role;
select lives_ok(
  $$select public.submit_lead('Public meeting announced', repeat('Factual description. ', 4), 'New Delhi', date '2026-07-31', 'exact', array['https://example.org/report'], null, 'editor@example.org', '+44 20 7946 0958', 'existing-record', 'public-source', 'photo', repeat('a', 64))$$,
  'validated lead can be stored'
);
reset role;

select is((select status from public.lead_submissions where submission_fingerprint = repeat('a', 64)), 'pending_review', 'initial status is pending review');
select isnt((select id::text from public.lead_submissions limit 1), '1', 'identifier is non-sequential');
select is((select contact_email from public.lead_submissions where submission_fingerprint = repeat('a', 64)), 'editor@example.org', 'private email is stored for review');
select is((select contact_phone from public.lead_submissions where submission_fingerprint = repeat('a', 64)), '+44 20 7946 0958', 'optional private phone is stored');
select is((select related_event_slug from public.lead_submissions where submission_fingerprint = repeat('a', 64)), 'existing-record', 'related event is stored');
select is((select contribution_type from public.lead_submissions where submission_fingerprint = repeat('a', 64)), 'public-source', 'contribution type is stored');
select is((select media_type from public.lead_submissions where submission_fingerprint = repeat('a', 64)), 'photo', 'media type is stored');
select is((select count(*)::integer from public.events), 22, 'submission does not create another public event');

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'reader@example.invalid', now(), now());
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
set local role authenticated;
select is((select count(*)::integer from public.lead_submissions), 0, 'ordinary authenticated readers cannot select leads');
select is_empty(
  $$update public.lead_submissions set status = 'under_review' returning id$$,
  'ordinary authenticated readers cannot update leads'
);
reset role;

select throws_ok(
  $$select public.submit_lead('Public meeting announced', repeat('Factual description. ', 4), 'New Delhi', date '2026-07-31', 'exact', '{}', null, 'editor@example.org', null, null, 'new-lead', 'none', repeat('a', 64))$$,
  '23505',
  null,
  'duplicate fingerprint is rejected'
);

select * from finish();
rollback;
