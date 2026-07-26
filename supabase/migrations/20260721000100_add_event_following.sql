-- Authenticated event following with public aggregate counts.
--
-- This registry intentionally stores only reviewed public slugs and publication dates. It is
-- separate from the historical editorial import and must be extended through reviewed migrations.

create table public.followable_events (
  event_slug text primary key,
  published_at date not null,
  created_at timestamptz not null default now(),
  constraint followable_events_slug_length check (char_length(event_slug) between 1 and 160),
  constraint followable_events_slug_format check (
    event_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

create table public.event_follows (
  event_slug text not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (event_slug, user_id),
  constraint event_follows_event_slug_fkey
    foreign key (event_slug)
    references public.followable_events(event_slug)
    on update cascade
    on delete cascade,
  constraint event_follows_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade
);

-- Supports account-deletion cascades and future private per-user maintenance without changing the
-- event-first index provided by the composite primary key.
create index event_follows_user_id_idx on public.event_follows(user_id);

alter table public.followable_events enable row level security;
alter table public.event_follows enable row level security;

revoke all on table public.followable_events from public, anon, authenticated;
revoke all on table public.event_follows from public, anon, authenticated;

insert into public.followable_events (event_slug, published_at)
values
  ('bundelkhand-rehabilitation-compensation-protest', date '2026-07-21'),
  ('education-accountability-jantar-mantar', date '2026-07-21'),
  ('mandya-farmers-krs-irrigation-water', date '2026-07-21'),
  ('bku-rajewal-chandigarh-trade-rally', date '2026-07-21'),
  ('save-sgnp-human-chain-thane', date '2026-07-21'),
  ('bidadi-farmers-land-acquisition', date '2026-07-21'),
  ('morbi-transmission-compensation-satyagraha', date '2026-07-21'),
  ('dasiya-villagers-ethanol-plant', date '2026-07-21'),
  ('kokrajhar-apdcl-land-allotment-protest', date '2026-07-21'),
  ('manipur-government-employees-strike', date '2026-07-21'),
  ('dharmasala-teacher-vacancy-protest', date '2026-07-21'),
  ('bhaniyawala-rishikesh-tree-felling-protest', date '2026-07-21'),
  ('haryana-rabi-procurement-protests', date '2026-07-21'),
  ('manesar-industrial-workers-protest', date '2026-07-21'),
  ('noida-factory-workers-protest', date '2026-07-21'),
  ('jamia-yuva-kumbh-campus-protest', date '2026-07-21'),
  ('kerala-hospitality-lpg-shutdown', date '2026-07-21'),
  ('punjab-transport-workers-gate-rallies', date '2026-07-21'),
  ('delhi-neet-paper-leak-protests', date '2026-07-21'),
  ('hyderabad-neet-paper-leak-protests', date '2026-07-21'),
  ('jaipur-neet-irregularities-march', date '2026-07-21'),
  ('delhi-ncr-transport-strike', date '2026-07-21'),
  ('bharat-tiwari-justice-rights-assembly', date '2026-07-21'),
  ('punjab-farmers-lok-bhavan-msp-water', date '2026-07-21'),
  ('hanumangarh-wheat-procurement-pilibanga', date '2026-07-21'),
  ('maharashtra-scheme-workers-azad-maidan', date '2026-07-21'),
  ('gadchiroli-land-acquisition-airport-industrial', date '2026-07-21'),
  ('moran-motok-shutdown-representation-st-status', date '2026-07-21'),
  ('guwahati-tribal-township-hydropower-protest', date '2026-07-21'),
  ('kohima-women-justice-sexual-violence', date '2026-07-21'),
  ('best-workers-pension-pay-strike', date '2026-07-21'),
  ('maharashtra-rto-clerical-pen-down-strike', date '2026-07-21'),
  ('punjab-farmers-tubewell-power-protest', date '2026-07-21'),
  ('maharashtra-teachers-school-shutdown', date '2026-07-21'),
  ('khanna-mgnrega-workers-regularisation-salaries', date '2026-07-21'),
  ('hidkal-displaced-farmers-belagavi-compensation', date '2026-07-21'),
  ('mumbai-police-action-education-protest', date '2026-07-21'),
  ('jammu-kashmir-statehood-jantar-mantar', date '2026-07-21'),
  ('kisan-ghat-india-us-trade-deal', date '2026-07-21'),
  ('indore-dewas-ring-road-compensation', date '2026-07-21'),
  ('thanjavur-mekedatu-dam-protest', date '2026-07-21'),
  ('pune-neet-paper-leak-protest', date '2026-07-21'),
  ('mohali-aerotropolis-land-acquisition-hunger-strike', date '2026-07-21'),
  ('akola-fuel-price-protest', date '2026-07-21'),
  ('karapur-sarvan-luxury-township-protest', date '2026-07-21'),
  ('shamshabad-high-speed-rail-land-protest', date '2026-07-21'),
  ('kolli-hills-land-patta-protest', date '2026-07-21'),
  ('pandharpur-farm-loan-waiver-hunger-strike', date '2026-07-21'),
  ('jharkhand-statehood-activists-pension-jobs', date '2026-07-21'),
  ('channot-drinking-water-pipeline-protest', date '2026-07-21');

create function public.get_event_follow_summary(p_event_slug text)
returns table (follower_count bigint, following boolean)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select
    count(ef.user_id)::bigint as follower_count,
    coalesce(bool_or(ef.user_id = auth.uid()), false) as following
  from public.followable_events fe
  left join public.event_follows ef on ef.event_slug = fe.event_slug
  where p_event_slug is not null
    and char_length(p_event_slug) between 1 and 160
    and p_event_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and fe.event_slug = p_event_slug
  group by fe.event_slug;
$$;

create function public.follow_event(p_event_slug text)
returns table (follower_count bigint, following boolean)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_event_slug is null
    or char_length(p_event_slug) not between 1 and 160
    or p_event_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or not exists (
      select 1 from public.followable_events fe where fe.event_slug = p_event_slug
    )
  then
    raise exception using errcode = '22023', message = 'Event unavailable';
  end if;

  insert into public.event_follows (event_slug, user_id)
  values (p_event_slug, current_user_id)
  on conflict do nothing;

  return query
  select count(*)::bigint, true
  from public.event_follows ef
  where ef.event_slug = p_event_slug;
end;
$$;

create function public.unfollow_event(p_event_slug text)
returns table (follower_count bigint, following boolean)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_event_slug is null
    or char_length(p_event_slug) not between 1 and 160
    or p_event_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or not exists (
      select 1 from public.followable_events fe where fe.event_slug = p_event_slug
    )
  then
    raise exception using errcode = '22023', message = 'Event unavailable';
  end if;

  delete from public.event_follows ef
  where ef.event_slug = p_event_slug and ef.user_id = current_user_id;

  return query
  select count(*)::bigint, false
  from public.event_follows ef
  where ef.event_slug = p_event_slug;
end;
$$;

revoke all on function public.get_event_follow_summary(text) from public, anon, authenticated;
revoke all on function public.follow_event(text) from public, anon, authenticated;
revoke all on function public.unfollow_event(text) from public, anon, authenticated;

grant execute on function public.get_event_follow_summary(text) to anon, authenticated;
grant execute on function public.follow_event(text) to authenticated;
grant execute on function public.unfollow_event(text) to authenticated;

comment on table public.followable_events is
  'Reviewed public event slugs eligible for aggregate following.';
comment on table public.event_follows is
  'Private account-to-event follow preferences; never exposed as raw public rows.';
comment on function public.get_event_follow_summary(text) is
  'Returns only an aggregate count and the current caller own follow state.';
