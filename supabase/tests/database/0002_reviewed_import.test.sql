begin;

select plan(12);

select is((select count(*)::integer from public.events), 22, 'imports 22 reviewed events');
select is((select count(*)::integer from public.claims), 136, 'imports 136 reviewed claims');
select is((select count(*)::integer from public.sources), 77, 'imports 77 reviewed sources');
select is(
  (select count(*)::integer from public.claim_sources),
  314,
  'imports 314 explicit claim-source links'
);
select is(
  (select count(*)::integer from public.organisations),
  90,
  'imports 90 reviewed organisations'
);
select is(
  (select count(*)::integer from public.event_organisations),
  0,
  'does not infer event-organisation links from free text'
);
select is((select count(*)::integer from public.corrections), 2, 'imports 2 reviewed corrections');
select is(
  (select count(*)::integer from public.events where publication_status = 'candidate'),
  22,
  'keeps every imported event at candidate status'
);
select ok(
  not exists (
    select 1 from public.claims c left join public.events e on e.id = c.event_id where e.id is null
  ),
  'has no orphan claims'
);
select ok(
  not exists (
    select 1 from public.sources s left join public.events e on e.id = s.event_id where e.id is null
  ),
  'has no orphan sources'
);
select ok(
  not exists (
    select 1
    from public.claim_sources cs
    left join public.claims c on c.id = cs.claim_id
    left join public.sources s on s.id = cs.source_id
    where c.id is null or s.id is null or c.event_id <> s.event_id
  ),
  'links claims only to sources for the same event'
);
select is(
  (select count(*)::integer from public.corrections where stage = 'pre_publication'),
  2,
  'keeps reviewed corrections in the pre-publication stage'
);

select * from finish();

rollback;
