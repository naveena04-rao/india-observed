begin;
select plan(10);

select has_function(
  'public',
  'claim_manual_pib_rss_dry_run',
  array['text'],
  'manual PIB RSS claim function exists'
);
select is(
  has_function_privilege('anon', 'public.claim_manual_pib_rss_dry_run(text)', 'execute'),
  false,
  'anonymous users cannot invoke the PIB RSS dry run'
);
select is(
  has_function_privilege('authenticated', 'public.claim_manual_pib_rss_dry_run(text)', 'execute'),
  true,
  'authenticated sessions can reach the editor-gated function'
);

set local role authenticated;
select throws_ok(
  $$select public.claim_manual_pib_rss_dry_run('manual_pib_rss_dry_run:test-unauthorised')$$,
  '42501',
  'Authorised editor access required',
  'ordinary authenticated users are rejected server-side'
);
reset role;

select ok(
  strpos(
    pg_get_functiondef('public.claim_manual_pib_rss_dry_run(text)'::regprocedure),
    'pg_advisory_xact_lock'
  ) > 0,
  'PIB RSS claims are serialised'
);
select ok(
  strpos(pg_get_functiondef('public.claim_manual_pib_rss_dry_run(text)'::regprocedure), '"timeWindowHours":72') > 0
    and strpos(pg_get_functiondef('public.claim_manual_pib_rss_dry_run(text)'::regprocedure), '"maximumFetchedItems":20') > 0
    and strpos(pg_get_functiondef('public.claim_manual_pib_rss_dry_run(text)'::regprocedure), '"maximumCandidates":15') > 0,
  'the exact PIB RSS limits are required'
);
select is(
  (select scheduler_enabled from public.discovery_schedule_settings where singleton),
  false,
  'scanner cron remains disabled'
);
select ok(
  strpos(pg_get_functiondef('public.claim_manual_pib_rss_dry_run(text)'::regprocedure), 'not source.enabled') > 0,
  'the claim requires PIB RSS to remain disabled for scheduled scanning'
);
select ok(
  strpos(pg_get_functiondef('public.claim_manual_pib_rss_dry_run(text)'::regprocedure), 'source.manual_dry_run_only') > 0
    and strpos(pg_get_functiondef('public.claim_manual_pib_rss_dry_run(text)'::regprocedure), 'source.manual_run_consumed_at is null') > 0,
  'the claim requires an unused manual-only PIB RSS source'
);
select is(
  (select count(*)::integer from public.scan_sources where enabled),
  0,
  'no source is enabled for scheduled production scanning'
);

select * from finish();
rollback;
