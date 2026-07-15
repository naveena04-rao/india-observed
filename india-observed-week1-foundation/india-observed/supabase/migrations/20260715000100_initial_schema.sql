begin;

create extension if not exists pgcrypto;

create type public.event_lifecycle_status as enum (
  'announced', 'ongoing', 'paused', 'concluded', 'unresolved', 'outcome_pending', 'unknown'
);
create type public.verification_status as enum (
  'reported', 'corroborated', 'occurrence_verified_disputed_details', 'attributed', 'disputed',
  'unconfirmed', 'corrected', 'outcome_documented'
);
create type public.publication_status as enum ('candidate', 'draft', 'published', 'unpublished', 'archived');
create type public.activity_pattern as enum ('one_day', 'continuous', 'recurring_intermittent', 'multiple_phases', 'unknown');
create type public.claim_status as enum (
  'corroborated', 'attributed_allegation', 'attributed_official_statement',
  'unconfirmed_allegation', 'media_reported_official_document_required',
  'official_source_context', 'disputed', 'corrected'
);
create type public.source_independence as enum (
  'original_independent', 'same_publisher_follow_up', 'cross_post_same_underlying_source',
  'syndicated', 'official_primary_source', 'unknown'
);
create type public.organisation_role as enum (
  'organiser', 'supporter', 'authority', 'project_authority', 'source_publisher', 'other'
);
create type public.correction_stage as enum ('pre_publication', 'public_correction');

create table public.events (
  id text primary key check (id ~ '^IO-CM-[A-Z]{2,3}-[0-9]{4}$'),
  title text not null check (length(title) between 10 and 300),
  event_type text not null,
  main_issue text not null,
  state_name text not null,
  district text,
  general_location text not null,
  start_date date,
  end_date date,
  lifecycle_status public.event_lifecycle_status not null,
  neutral_summary text not null,
  verification_status public.verification_status not null,
  date_added date not null default current_date,
  last_reviewed date not null default current_date,
  publication_status public.publication_status not null default 'candidate',
  scope_status text not null default 'in_national_pilot',
  last_confirmed_active date,
  internal_notes text,
  activity_pattern public.activity_pattern not null default 'unknown',
  primary_topic text not null,
  demand_category text,
  related_policy_project_law text,
  official_response_date date,
  outcome_follow_up_date date,
  lead_discovery_channel text not null,
  coverage_profile text not null,
  latest_official_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_dates_valid check (
    (end_date is null or start_date is null or end_date >= start_date)
    and (last_confirmed_active is null or start_date is null or last_confirmed_active >= start_date)
  )
);

create table public.claims (
  id text primary key check (id ~ '^IO-CLM-[A-Z]{2,3}-[0-9]{4}$'),
  event_id text not null references public.events(id) on delete cascade,
  claim_text text not null,
  claim_category text not null,
  claimant text,
  status public.claim_status not null,
  verification_notes text not null,
  disputed_by text,
  public_wording text not null,
  publication_readiness text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id text primary key check (id ~ '^IO-SRC-[A-Z]{2,3}-[0-9]{4}$'),
  event_id text not null references public.events(id) on delete cascade,
  publisher text not null,
  headline text not null,
  reporter text,
  source_url text not null check (source_url ~ '^https?://'),
  publication_date date,
  source_type text not null,
  independence public.source_independence not null,
  reliability_notes text not null,
  date_accessed date not null,
  corrected_or_updated text not null,
  archived_reference text,
  source_role text not null,
  content_hash text,
  source_family_key text,
  created_at timestamptz not null default now(),
  unique (event_id, source_url)
);

create table public.claim_sources (
  claim_id text not null references public.claims(id) on delete cascade,
  source_id text not null references public.sources(id) on delete cascade,
  support_type text not null default 'supports' check (
    support_type in ('supports', 'disputes', 'context', 'unclear')
  ),
  evidence_note text,
  primary key (claim_id, source_id)
);

create table public.organisations (
  id text primary key check (id ~ '^IO-ORG-[0-9]{4}$'),
  official_name text not null,
  organisation_type text not null,
  state_name text,
  website text check (website is null or website ~ '^https?://'),
  public_spokesperson text,
  notes text,
  created_at timestamptz not null default now(),
  unique (official_name, state_name)
);

create table public.event_organisations (
  event_id text not null references public.events(id) on delete cascade,
  organisation_id text not null references public.organisations(id) on delete restrict,
  role public.organisation_role not null,
  public_note text,
  primary key (event_id, organisation_id, role)
);

create table public.corrections (
  id text primary key check (id ~ '^IO-COR-[A-Z]{2,3}-[0-9]{4}$'),
  event_id text not null references public.events(id) on delete cascade,
  corrected_at date not null,
  previous_wording text not null,
  corrected_wording text not null,
  reason text not null,
  supporting_source text not null,
  stage public.correction_stage not null,
  review_status text not null,
  created_at timestamptz not null default now()
);

create index events_state_idx on public.events (state_name);
create index events_district_idx on public.events (district);
create index events_start_date_idx on public.events (start_date desc);
create index events_lifecycle_idx on public.events (lifecycle_status);
create index events_verification_idx on public.events (verification_status);
create index events_topic_idx on public.events (primary_topic);
create index events_publication_idx on public.events (publication_status);
create index events_follow_up_idx on public.events (outcome_follow_up_date)
where outcome_follow_up_date is not null;
create index claims_event_idx on public.claims (event_id);
create index claims_status_idx on public.claims (status);
create index sources_event_idx on public.sources (event_id);
create index sources_family_idx on public.sources (source_family_key)
where source_family_key is not null;
create index corrections_event_idx on public.corrections (event_id, corrected_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();
create trigger claims_set_updated_at before update on public.claims
for each row execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.claims enable row level security;
alter table public.sources enable row level security;
alter table public.claim_sources enable row level security;
alter table public.organisations enable row level security;
alter table public.event_organisations enable row level security;
alter table public.corrections enable row level security;

-- No anonymous policies are created in Week 1. Public reads must go through reviewed
-- server-side queries until a dedicated published-record view and policy are approved.

commit;
