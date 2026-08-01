begin;

-- A reviewed import reference is private provenance for one-time, source-audited migrations.
-- Interactive approvals continue to require reviewed_by and the media-admin approval RPC.
alter table public.event_media
add column review_import_reference text null;

alter table public.event_media
drop constraint event_media_approval_complete;

alter table public.event_media
add constraint event_media_approval_complete check (
  status <> 'approved'
  or (
    same_event_verified
    and privacy_reviewed
    and safety_reviewed
    and integrity_reviewed
    and approved_source_verified
    and (
      reviewed_by is not null
      or length(trim(coalesce(review_import_reference, ''))) >= 12
    )
    and approved_at is not null
  )
);

-- Rejected after the complete approved-source audit. These rows remain private.
update public.event_media
set
  status = 'rejected',
  same_event_verified = false,
  review_import_reference = 'IO media source audit 2026-07-28',
  updated_at = '2026-07-28T12:00:00Z'
where id = '14000000-0000-4000-8000-000000000003';

update public.event_media_private_review
set
  rejection_reason =
    'The post is a publisher graphic using a contextual PTI image, not exact-event visual evidence.',
  review_notes =
    'Rejected after visual inspection. The source remains approved for reporting, but its graphic is not event media.',
  updated_at = '2026-07-28T12:00:00Z'
where media_id = '14000000-0000-4000-8000-000000000003';

update public.event_media
set
  status = 'rejected',
  review_import_reference = 'IO media source audit 2026-07-28',
  updated_at = '2026-07-28T12:00:00Z'
where id = '14000000-0000-4000-8000-000000000002';

update public.event_media_private_review
set
  rejection_reason =
    'The exact-event post visibly includes minors and ordinary participants without documented privacy clearance.',
  review_notes =
    'Withheld after privacy review. An official source embed does not override the privacy and safety gate.',
  updated_at = '2026-07-28T12:00:00Z'
where media_id = '14000000-0000-4000-8000-000000000002';

-- Exact-event official embeds approved by the reviewed import.
update public.event_media
set
  status = 'approved',
  review_import_reference = 'IO media source audit 2026-07-28',
  approved_at = '2026-07-28T12:00:00Z',
  updated_at = '2026-07-28T12:00:00Z'
where id in (
  '14000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000004'
);

update public.event_media_private_review
set
  review_notes =
    'Approved in the 28 July 2026 source audit after exact-event, provenance, integrity, privacy and safety review.',
  updated_at = '2026-07-28T12:00:00Z'
where media_id in (
  '14000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000004'
);

insert into public.event_media (
  id,
  event_slug,
  media_type,
  status,
  source_url,
  media_url,
  publisher,
  credit_line,
  rights_basis,
  alt_text,
  same_event_verified,
  privacy_reviewed,
  safety_reviewed,
  integrity_reviewed,
  approved_source_verified,
  review_import_reference,
  approved_at,
  created_at,
  updated_at
)
values (
  '14000000-0000-4000-8000-000000000005',
  'indore-dewas-ring-road-compensation',
  'publisher_video_embed',
  'approved',
  'https://mpcg.ndtv.in/madhya-pradesh-news/indore-farmers-protest-mp-farmers-west-ring-road-project-land-acquisition-compensation-tractor-rally-mohan-yadav-11795930',
  'https://www.ndtv.com/videos/embed-player/?id=1130365&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100',
  'NDTV MPCG',
  'Video: NDTV MPCG · View original',
  'official_embed',
  'NDTV MPCG video report showing the Indore–Dewas ring-road compensation tractor protest.',
  true,
  true,
  true,
  true,
  true,
  'IO media source audit 2026-07-28',
  '2026-07-28T12:00:00Z',
  '2026-07-28T12:00:00Z',
  '2026-07-28T12:00:00Z'
);

insert into public.event_media_private_review (
  media_id,
  same_event_reasoning,
  privacy_notes,
  safety_notes,
  integrity_notes,
  original_media_url,
  review_notes,
  created_at,
  updated_at
)
values (
  '14000000-0000-4000-8000-000000000005',
  'The publisher report, tractor rally, Indore–Dewas ring-road issue and compensation demands match the reviewed event.',
  'Wide public-action reporting is retained in the publisher context; India Observed identifies no ordinary participant.',
  'The action is historical and the embed adds no live tactical or precise sensitive location.',
  'The official NDTV MPCG story and NDTV player were inspected; no stream was extracted, downloaded or rehosted.',
  'https://mpcg.ndtv.in/madhya-pradesh-news/indore-farmers-protest-mp-farmers-west-ring-road-project-land-acquisition-compensation-tractor-rally-mohan-yadav-11795930',
  'Approved in the 28 July 2026 source audit. Display is limited to the official click-to-load publisher embed.',
  '2026-07-28T12:00:00Z',
  '2026-07-28T12:00:00Z'
);

create function public.get_public_event_media_coverage()
returns table (
  approved_media bigint,
  rejected_media bigint,
  draft_media bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    count(*) filter (where status = 'approved'),
    count(*) filter (where status = 'rejected'),
    count(*) filter (where status = 'draft')
  from public.event_media;
$$;

revoke all on function public.get_public_event_media_coverage() from public, anon, authenticated;
grant execute on function public.get_public_event_media_coverage() to anon, authenticated;

comment on column public.event_media.review_import_reference is
  'Private provenance for a one-time reviewed migration; interactive approval uses reviewed_by.';

commit;
