begin;

alter table public.event_media
add column source_page_verified boolean not null default false,
add column reporting_purpose_confirmed boolean not null default false,
add column reduced_resolution_confirmed boolean not null default false,
add column no_gallery_reuse_confirmed boolean not null default false,
add column no_unrelated_commercial_reuse_confirmed boolean not null default false,
add column takedown_process_confirmed boolean not null default false,
add column owner_acceptance boolean not null default false,
add column rights_reviewed_at date null;

alter table public.event_media_private_review
add column crop_resize_disclosure text null;

alter table public.event_media
drop constraint event_media_uploaded_rights_redistributable,
drop constraint event_media_approved_attribution_complete;

alter table public.event_media
add constraint event_media_uploaded_rights_displayable check (
  media_type <> 'uploaded_event_image'
  or rights_basis in (
    'owned_original',
    'explicit_permission',
    'official_reuse_terms',
    'cc0',
    'public_domain',
    'cc_by',
    'cc_by_sa',
    'editorial_fair_dealing_current_events'
  )
),
add constraint event_media_approved_attribution_complete check (
  status <> 'approved'
  or length(trim(coalesce(publisher, ''))) > 0
),
add constraint event_media_editorial_fair_dealing_complete check (
  rights_basis <> 'editorial_fair_dealing_current_events'
  or (
    media_type = 'uploaded_event_image'
    and source_page_verified
    and reporting_purpose_confirmed
    and reduced_resolution_confirmed
    and no_gallery_reuse_confirmed
    and no_unrelated_commercial_reuse_confirmed
    and takedown_process_confirmed
    and owner_acceptance
    and rights_reviewed_at is not null
  )
);

create function public.enforce_editorial_media_processing_review()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.status = 'approved'
    and new.rights_basis = 'editorial_fair_dealing_current_events'
    and not exists (
      select 1
      from public.event_media_private_review review
      where review.media_id = new.id
        and length(trim(coalesce(review.crop_resize_disclosure, ''))) >= 12
        and review.original_media_url is not null
        and review.original_sha256 is not null
    )
  then
    raise exception using
      errcode = '23514',
      message = 'Editorial source-image provenance and processing disclosure are incomplete';
  end if;
  return new;
end;
$$;

create trigger event_media_editorial_processing_review
before update of status on public.event_media
for each row execute function public.enforce_editorial_media_processing_review();

revoke all on function public.enforce_editorial_media_processing_review()
from public, anon, authenticated;

comment on column public.event_media.owner_acceptance is
  'Per-item owner acceptance of an editorial display assessment; this is not permission or ownership.';
comment on column public.event_media.rights_reviewed_at is
  'Date on which the selected display basis was reviewed for this specific visual.';
comment on column public.event_media_private_review.crop_resize_disclosure is
  'Private disclosure of the derivative resize or crop used for the public thumbnail.';

commit;
