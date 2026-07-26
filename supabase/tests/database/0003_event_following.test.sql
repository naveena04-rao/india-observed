begin;

select plan(34);

select has_table('public', 'followable_events', 'followable_events exists');
select has_table('public', 'event_follows', 'event_follows exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.followable_events'::regclass),
  true,
  'followable_events RLS is enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.event_follows'::regclass),
  true,
  'event_follows RLS is enabled'
);
select is((select count(*)::integer from public.followable_events), 50, 'registers 50 slugs');
select is(
  (select array_agg(event_slug order by event_slug) from public.followable_events),
  array[
    'akola-fuel-price-protest',
    'best-workers-pension-pay-strike',
    'bhaniyawala-rishikesh-tree-felling-protest',
    'bharat-tiwari-justice-rights-assembly',
    'bidadi-farmers-land-acquisition',
    'bku-rajewal-chandigarh-trade-rally',
    'bundelkhand-rehabilitation-compensation-protest',
    'channot-drinking-water-pipeline-protest',
    'dasiya-villagers-ethanol-plant',
    'delhi-ncr-transport-strike',
    'delhi-neet-paper-leak-protests',
    'dharmasala-teacher-vacancy-protest',
    'education-accountability-jantar-mantar',
    'gadchiroli-land-acquisition-airport-industrial',
    'guwahati-tribal-township-hydropower-protest',
    'hanumangarh-wheat-procurement-pilibanga',
    'haryana-rabi-procurement-protests',
    'hidkal-displaced-farmers-belagavi-compensation',
    'hyderabad-neet-paper-leak-protests',
    'indore-dewas-ring-road-compensation',
    'jaipur-neet-irregularities-march',
    'jamia-yuva-kumbh-campus-protest',
    'jammu-kashmir-statehood-jantar-mantar',
    'jharkhand-statehood-activists-pension-jobs',
    'karapur-sarvan-luxury-township-protest',
    'kerala-hospitality-lpg-shutdown',
    'khanna-mgnrega-workers-regularisation-salaries',
    'kisan-ghat-india-us-trade-deal',
    'kohima-women-justice-sexual-violence',
    'kokrajhar-apdcl-land-allotment-protest',
    'kolli-hills-land-patta-protest',
    'maharashtra-rto-clerical-pen-down-strike',
    'maharashtra-scheme-workers-azad-maidan',
    'maharashtra-teachers-school-shutdown',
    'mandya-farmers-krs-irrigation-water',
    'manesar-industrial-workers-protest',
    'manipur-government-employees-strike',
    'mohali-aerotropolis-land-acquisition-hunger-strike',
    'moran-motok-shutdown-representation-st-status',
    'morbi-transmission-compensation-satyagraha',
    'mumbai-police-action-education-protest',
    'noida-factory-workers-protest',
    'pandharpur-farm-loan-waiver-hunger-strike',
    'pune-neet-paper-leak-protest',
    'punjab-farmers-lok-bhavan-msp-water',
    'punjab-farmers-tubewell-power-protest',
    'punjab-transport-workers-gate-rallies',
    'save-sgnp-human-chain-thane',
    'shamshabad-high-speed-rail-land-protest',
    'thanjavur-mekedatu-dam-protest'
  ]::text[],
  'registers the exact reviewed public slug set'
);
select ok(
  not exists (select 1 from public.followable_events where event_slug = 'candidate-record'),
  'does not register a candidate fixture'
);
select throws_ok(
  $$insert into public.followable_events(event_slug, published_at) values ('Bad--slug', current_date)$$,
  '23514',
  null,
  'malformed slugs are rejected'
);
select is_empty(
  $$select * from public.get_event_follow_summary('unknown-event')$$,
  'unknown summaries return no data'
);
select is(
  has_table_privilege('anon', 'public.followable_events', 'select'),
  false,
  'anonymous registry SELECT is denied'
);
select is(
  has_table_privilege('authenticated', 'public.event_follows', 'select'),
  false,
  'authenticated raw follow SELECT is denied'
);
select is(
  has_table_privilege('anon', 'public.event_follows', 'insert'),
  false,
  'anonymous INSERT is denied'
);
select is(
  has_table_privilege('anon', 'public.event_follows', 'delete'),
  false,
  'anonymous DELETE is denied'
);
select is(
  has_table_privilege('authenticated', 'public.event_follows', 'insert'),
  false,
  'authenticated direct INSERT is denied'
);
select is(
  has_table_privilege('authenticated', 'public.event_follows', 'delete'),
  false,
  'authenticated direct DELETE is denied'
);
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename in ('followable_events', 'event_follows')), 0, 'no table policies expose rows');
select is(has_function_privilege('anon', 'public.get_event_follow_summary(text)', 'execute'), true, 'anon can call summary');
select is(has_function_privilege('anon', 'public.follow_event(text)', 'execute'), false, 'anon cannot follow');
select is(has_function_privilege('anon', 'public.unfollow_event(text)', 'execute'), false, 'anon cannot unfollow');
select is(has_function_privilege('authenticated', 'public.follow_event(text)', 'execute'), true, 'authenticated can follow');
select is(has_function_privilege('authenticated', 'public.unfollow_event(text)', 'execute'), true, 'authenticated can unfollow');
select is(
  (select following from public.get_event_follow_summary('bidadi-farmers-land-acquisition')),
  false,
  'signed-out summary is never following'
);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'one@example.invalid', now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'two@example.invalid', now(), now());

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is(
  (select follower_count from public.follow_event('bidadi-farmers-land-acquisition')),
  1::bigint,
  'authenticated user can follow an allowed event'
);
select is(
  (select follower_count from public.follow_event('bidadi-farmers-land-acquisition')),
  1::bigint,
  'duplicate follow does not increase the count'
);
select is(
  (select count(*)::integer from public.event_follows where event_slug = 'bidadi-farmers-land-acquisition'),
  1,
  'duplicate follow remains one row'
);
select throws_ok(
  $$select * from public.follow_event('unknown-event')$$,
  '22023',
  'Event unavailable',
  'unknown slug cannot be followed'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select is(
  (select follower_count from public.unfollow_event('bidadi-farmers-land-acquisition')),
  1::bigint,
  'one user cannot remove another user follow'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is(
  (select follower_count from public.unfollow_event('bidadi-farmers-land-acquisition')),
  0::bigint,
  'unfollow removes only the current user row'
);
select is(
  (select follower_count from public.unfollow_event('bidadi-farmers-land-acquisition')),
  0::bigint,
  'unfollow is idempotent'
);
select * from public.follow_event('bidadi-farmers-land-acquisition');
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
select is((select count(*)::integer from public.event_follows), 0, 'account deletion cascades follows');
select is(
  (
    select array_agg(column_name::text order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'event_follows'
  ),
  array['event_slug', 'user_id', 'created_at']::text[],
  'event_follows has no email, name, IP or profile fields'
);
select is(
  (
    select array_agg(pg_get_function_result(p.oid) order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('follow_event', 'get_event_follow_summary', 'unfollow_event')
  ),
  array[
    'TABLE(follower_count bigint, following boolean)',
    'TABLE(follower_count bigint, following boolean)',
    'TABLE(follower_count bigint, following boolean)'
  ]::text[],
  'RPCs return only an integer count and boolean state'
);
select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('follow_event', 'get_event_follow_summary', 'unfollow_event')
      and p.prosecdef
  ),
  3,
  'all RPCs are SECURITY DEFINER'
);
select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('follow_event', 'get_event_follow_summary', 'unfollow_event')
      and 'search_path=pg_catalog, public, auth' = any(p.proconfig)
  ),
  3,
  'all RPCs use the controlled search path'
);

select * from finish();
rollback;
