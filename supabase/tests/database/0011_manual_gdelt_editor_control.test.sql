begin;
select plan(8);

select has_function(
  'public',
  'claim_manual_gdelt_dry_run',
  array['text'],
  'manual GDELT claim function exists'
);
select is(
  has_function_privilege('anon', 'public.claim_manual_gdelt_dry_run(text)', 'execute'),
  false,
  'anonymous users cannot invoke the dry run'
);
select is(
  has_function_privilege('authenticated', 'public.claim_manual_gdelt_dry_run(text)', 'execute'),
  true,
  'authenticated sessions can reach the editor-gated function'
);

set local role authenticated;
select throws_ok(
  $$select public.claim_manual_gdelt_dry_run('manual_gdelt_dry_run:test-unauthorised')$$,
  '42501',
  'Authorised editor access required',
  'ordinary authenticated users are rejected server-side'
);
reset role;

select ok(
  strpos(
    pg_get_functiondef('public.claim_manual_gdelt_dry_run(text)'::regprocedure),
    'pg_advisory_xact_lock'
  ) > 0,
  'manual claims are serialised against duplicate clicks'
);
select ok(
  strpos(pg_get_functiondef('public.claim_manual_gdelt_dry_run(text)'::regprocedure), '"maximumQueries":60') > 0
    and strpos(pg_get_functiondef('public.claim_manual_gdelt_dry_run(text)'::regprocedure), '"maximumDiscoveredItems":300') > 0
    and strpos(pg_get_functiondef('public.claim_manual_gdelt_dry_run(text)'::regprocedure), '"maximumCandidates":100') > 0
    and strpos(pg_get_functiondef('public.claim_manual_gdelt_dry_run(text)'::regprocedure), '"timeWindowHours":48') > 0,
  'the exact approved GDELT limits are required'
);
select is(
  (select scheduler_enabled from public.discovery_schedule_settings where singleton),
  false,
  'scanner cron remains disabled'
);
select is(
  (select count(*)::integer from public.scan_sources where enabled),
  0,
  'no source is enabled for scheduled production scanning'
);

select * from finish();
rollback;
