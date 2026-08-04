begin;

select plan(8);

select has_table('public', 'editorial_verification_decisions', 'private decisions exist');
select has_column('public', 'editorial_verification_decisions', 'lead_ref', 'lead ref exists');
select has_function(
  'public',
  'review_twelve_month_verification_lead',
  array['text', 'text', 'text'],
  'authorised review function exists'
);
select is(
  (select count(*)::integer from public.editorial_verification_decisions),
  0,
  'migration creates no owner decisions'
);
select is(
  (select scheduler_enabled from public.discovery_schedule_settings where singleton),
  false,
  'scanner cron remains disabled'
);
select is(
  (select count(*)::integer from public.event_notifications),
  0,
  'migration creates no notifications'
);

set local role anon;
select throws_ok(
  'select count(*) from public.editorial_verification_decisions',
  '42501',
  'permission denied for table editorial_verification_decisions',
  'anonymous users cannot read private decisions'
);
reset role;

set local role authenticated;
select throws_ok(
  'select public.review_twelve_month_verification_lead(''YR-01'', ''approve_private_draft'', null)',
  '42501',
  'Authorised editor access required',
  'ordinary authenticated users cannot save decisions'
);
reset role;

select * from finish();
rollback;
