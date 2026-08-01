begin;

alter table public.event_media
  add column preview_storage_path text null,
  add column preview_alt_text text null,
  add column preview_focal_position text null default '50% 50%',
  add column preview_same_event_verified boolean not null default false,
  add column preview_privacy_reviewed boolean not null default false,
  add column preview_safety_reviewed boolean not null default false,
  add column preview_integrity_reviewed boolean not null default false,
  add column preview_approved_source_verified boolean not null default false,
  add column preview_reviewed_by uuid null references auth.users(id) on delete set null,
  add column preview_review_import_reference text null,
  add column preview_approved_at timestamptz null;

alter table public.event_media_private_review
  add column preview_original_media_url text null,
  add column preview_original_sha256 text null,
  add column preview_derivative_sha256 text null,
  add column preview_frame_timestamp_seconds integer null,
  add column preview_review_notes text null;

alter table public.event_media
  add constraint event_media_preview_path_format check (
    preview_storage_path is null
    or preview_storage_path = event_slug || '/' || id || '/preview.webp'
  ),
  add constraint event_media_preview_alt_required check (
    preview_storage_path is null
    or length(trim(coalesce(preview_alt_text, ''))) between 8 and 500
  ),
  add constraint event_media_preview_focal_position_format check (
    preview_focal_position is null
    or preview_focal_position
      ~ '^(left|center|right|top|bottom|[0-9]{1,3}%)([ ]+(top|center|bottom|[0-9]{1,3}%))?$'
  );

alter table public.event_media_private_review
  add constraint event_media_preview_original_url_format check (
    preview_original_media_url is null or preview_original_media_url ~ '^https://'
  ),
  add constraint event_media_preview_original_sha256_format check (
    preview_original_sha256 is null or preview_original_sha256 ~ '^[a-f0-9]{64}$'
  ),
  add constraint event_media_preview_derivative_sha256_format check (
    preview_derivative_sha256 is null or preview_derivative_sha256 ~ '^[a-f0-9]{64}$'
  ),
  add constraint event_media_preview_frame_time_nonnegative check (
    preview_frame_timestamp_seconds is null or preview_frame_timestamp_seconds >= 0
  );

update public.event_media
set
  preview_storage_path = event_slug || '/' || id || '/preview.webp',
  preview_alt_text = case id
    when '14000000-0000-4000-8000-000000000001' then
      'Students gathered at Jamia Millia Islamia during the protest over the Yuva Kumbh event.'
    when '14000000-0000-4000-8000-000000000004' then
      'Villagers gathered during the movement opposing the proposed ethanol plant in Dasiya.'
    when '14000000-0000-4000-8000-000000000005' then
      'Farmers and tractors assembled during the Indore–Dewas ring-road compensation protest.'
    when '15000000-0000-4000-8000-000000000001' then
      'Farmers gathered in Bidadi during opposition to land acquisition for the township project.'
  end,
  preview_focal_position = '50% 50%',
  preview_same_event_verified = true,
  preview_privacy_reviewed = true,
  preview_safety_reviewed = true,
  preview_integrity_reviewed = true,
  preview_approved_source_verified = true,
  preview_reviewed_by = reviewed_by,
  preview_review_import_reference = 'Archive preview review 2026-07-30',
  preview_approved_at = '2026-07-30T07:30:00Z',
  updated_at = '2026-07-30T07:30:00Z'
where status = 'approved'
  and id in (
    '14000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000004',
    '14000000-0000-4000-8000-000000000005',
    '15000000-0000-4000-8000-000000000001'
  );

update public.event_media_private_review
set
  preview_original_media_url = case media_id
    when '14000000-0000-4000-8000-000000000001' then
      'https://drop.ndtv.com/video/images/vod/medium/2026-04/1091649_maxresdefault.jpg'
    when '14000000-0000-4000-8000-000000000004' then
      'https://www.facebook.com/LiveTimesNewsChannel/videos/2065530604339052/'
    when '14000000-0000-4000-8000-000000000005' then
      'https://c.ndtvimg.com/2026-07/iap7in28_indore-farmers-protest-mp-farmers-west-ring-road-project-land-_625x300_20_July_26.jpg?im=FitAndFill,algorithm=dnn,width=773,height=435'
    when '15000000-0000-4000-8000-000000000001' then
      'https://c.ndtvimg.com/2026-06/t9gf8cms_bidadi_160x120_30_June_26.png?downsize=1600:900'
  end,
  preview_original_sha256 = case media_id
    when '14000000-0000-4000-8000-000000000001' then
      'f4fca230ef456e03543ccbe822d34a362b0e9e890ea77c87209d9ea4baa33866'
    when '14000000-0000-4000-8000-000000000004' then
      'cf10369d639efc3781393dc37f1c12fe396660672598fd8faa541b9adf37bba8'
    when '14000000-0000-4000-8000-000000000005' then
      '1a7c38b21811179864e108685a686bd0564937302fc25cba9a279dc5dd5daf9e'
    when '15000000-0000-4000-8000-000000000001' then
      '77ac451288b4740d9ad34dae7085f4949520679bcd312633b3d3ddae31e89e8c'
  end,
  preview_derivative_sha256 = case media_id
    when '14000000-0000-4000-8000-000000000001' then
      '1860659e6f2a6a162099cb0f21f125003b98835c03dadfc923afdccf37e609e5'
    when '14000000-0000-4000-8000-000000000004' then
      'af4f3eae85295c5ab1c89d4b20095f3ac098cffff97cc47d9dcee56cce196d36'
    when '14000000-0000-4000-8000-000000000005' then
      '90cf1b95a536e1484727d0174a7b4d8d62a3a02f24656c94b922cd84d3eed707'
    when '15000000-0000-4000-8000-000000000001' then
      '448f200ee372324b25f31c609bd270743043d3527913ea3ae85495dc09845b09'
  end,
  preview_review_notes = case media_id
    when '14000000-0000-4000-8000-000000000001' then
      'Official NDTV video frame for the exact Jamia protest. The unrelated article-level file photograph was rejected. Processed to a 960×540 WebP; metadata removed.'
    when '14000000-0000-4000-8000-000000000004' then
      'Official Live Times social-video thumbnail for the exact Dasiya movement. Processed to a 960×540 WebP; metadata removed.'
    when '14000000-0000-4000-8000-000000000005' then
      'Official NDTV MPCG exact-event thumbnail for the Indore protest. Processed to a 960×540 WebP; metadata removed.'
    when '15000000-0000-4000-8000-000000000001' then
      'Official NDTV exact-event thumbnail for the Bidadi protest. Processed to a 960×540 WebP; metadata removed.'
  end,
  updated_at = '2026-07-30T07:30:00Z'
where media_id in (
  '14000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000004',
  '14000000-0000-4000-8000-000000000005',
  '15000000-0000-4000-8000-000000000001'
);

create function public.configure_event_media_preview(
  p_media_id uuid,
  p_preview_storage_path text,
  p_preview_alt_text text,
  p_preview_original_media_url text,
  p_preview_original_sha256 text,
  p_preview_derivative_sha256 text,
  p_preview_review_notes text,
  p_same_event_verified boolean,
  p_privacy_reviewed boolean,
  p_safety_reviewed boolean,
  p_integrity_reviewed boolean,
  p_approved_source_verified boolean,
  p_frame_timestamp_seconds integer default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  candidate public.event_media%rowtype;
begin
  if not public.is_media_admin() then
    raise exception using errcode = '42501', message = 'Media administrator access required';
  end if;

  select *
  into candidate
  from public.event_media
  where id = p_media_id
    and status = 'draft'
    and media_type in ('publisher_video_embed', 'official_social_embed')
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Draft embed unavailable';
  end if;
  if p_preview_storage_path <> candidate.event_slug || '/' || candidate.id || '/preview.webp' then
    raise exception using errcode = '22023', message = 'Preview storage path is invalid';
  end if;
  if length(trim(coalesce(p_preview_alt_text, ''))) < 8 then
    raise exception using errcode = '22023', message = 'Preview alternative text is required';
  end if;
  if p_preview_original_media_url !~ '^https://' then
    raise exception using errcode = '22023', message = 'Preview provenance URL is invalid';
  end if;
  if p_preview_original_sha256 !~ '^[a-f0-9]{64}$'
    or p_preview_derivative_sha256 !~ '^[a-f0-9]{64}$'
  then
    raise exception using errcode = '22023', message = 'Preview hashes are invalid';
  end if;
  if length(trim(coalesce(p_preview_review_notes, ''))) < 12 then
    raise exception using errcode = '22023', message = 'Preview review notes are required';
  end if;

  update public.event_media
  set
    preview_storage_path = p_preview_storage_path,
    preview_alt_text = p_preview_alt_text,
    preview_focal_position = '50% 50%',
    preview_same_event_verified = p_same_event_verified,
    preview_privacy_reviewed = p_privacy_reviewed,
    preview_safety_reviewed = p_safety_reviewed,
    preview_integrity_reviewed = p_integrity_reviewed,
    preview_approved_source_verified = p_approved_source_verified,
    preview_reviewed_by = auth.uid(),
    preview_review_import_reference = null,
    preview_approved_at = case
      when p_same_event_verified
        and p_privacy_reviewed
        and p_safety_reviewed
        and p_integrity_reviewed
        and p_approved_source_verified
      then now()
      else null
    end
  where id = p_media_id;

  update public.event_media_private_review
  set
    preview_original_media_url = p_preview_original_media_url,
    preview_original_sha256 = p_preview_original_sha256,
    preview_derivative_sha256 = p_preview_derivative_sha256,
    preview_frame_timestamp_seconds = p_frame_timestamp_seconds,
    preview_review_notes = p_preview_review_notes
  where media_id = p_media_id;

  if not found then
    raise exception using errcode = '23514', message = 'Private media review is required';
  end if;
end;
$$;

alter table public.event_media
  add constraint event_media_approved_embed_preview_complete check (
    status <> 'approved'
    or media_type = 'uploaded_event_image'
    or (
      preview_storage_path is not null
      and preview_same_event_verified
      and preview_privacy_reviewed
      and preview_safety_reviewed
      and preview_integrity_reviewed
      and preview_approved_source_verified
      and (
        preview_reviewed_by is not null
        or length(trim(coalesce(preview_review_import_reference, ''))) >= 12
      )
      and preview_approved_at is not null
    )
  );

alter table public.event_media_private_review
  add constraint event_media_embed_preview_provenance_complete check (
    preview_original_media_url is null
    or (
      preview_original_sha256 is not null
      and preview_derivative_sha256 is not null
      and length(trim(coalesce(preview_review_notes, ''))) >= 12
    )
  );

drop function public.get_public_event_media(text);

create function public.get_public_event_media(p_event_slug text default null)
returns table (
  event_slug text,
  media_type public.approved_media_type,
  storage_path text,
  media_url text,
  source_url text,
  publisher text,
  creator text,
  rights_holder text,
  credit_line text,
  rights_basis public.media_rights_basis,
  licence_name text,
  licence_url text,
  alt_text text,
  focal_position text,
  approved_at timestamptz,
  same_event_verified boolean,
  privacy_reviewed boolean,
  safety_reviewed boolean,
  integrity_reviewed boolean,
  approved_source_verified boolean,
  preview_storage_path text,
  preview_alt_text text,
  preview_focal_position text,
  preview_same_event_verified boolean,
  preview_privacy_reviewed boolean,
  preview_safety_reviewed boolean,
  preview_integrity_reviewed boolean,
  preview_approved_source_verified boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    em.event_slug,
    em.media_type,
    case when em.media_type = 'uploaded_event_image' then em.storage_path else null end,
    case when em.media_type <> 'uploaded_event_image' then em.media_url else null end,
    em.source_url,
    em.publisher,
    em.creator,
    em.rights_holder,
    em.credit_line,
    em.rights_basis,
    em.licence_name,
    em.licence_url,
    em.alt_text,
    em.focal_position,
    em.approved_at,
    em.same_event_verified,
    em.privacy_reviewed,
    em.safety_reviewed,
    em.integrity_reviewed,
    em.approved_source_verified,
    case
      when em.media_type <> 'uploaded_event_image'
        and em.preview_same_event_verified
        and em.preview_privacy_reviewed
        and em.preview_safety_reviewed
        and em.preview_integrity_reviewed
        and em.preview_approved_source_verified
      then em.preview_storage_path
      else null
    end,
    em.preview_alt_text,
    em.preview_focal_position,
    em.preview_same_event_verified,
    em.preview_privacy_reviewed,
    em.preview_safety_reviewed,
    em.preview_integrity_reviewed,
    em.preview_approved_source_verified
  from public.event_media em
  where em.status = 'approved'
    and em.same_event_verified
    and em.privacy_reviewed
    and em.safety_reviewed
    and em.integrity_reviewed
    and em.approved_source_verified
    and exists (
      select 1
      from public.media_event_sources mes
      where mes.event_slug = em.event_slug
        and mes.source_url = em.source_url
    )
    and (p_event_slug is null or em.event_slug = p_event_slug);
$$;

revoke all on function public.get_public_event_media(text) from public, anon, authenticated;
grant execute on function public.get_public_event_media(text) to anon, authenticated;
revoke all on function public.configure_event_media_preview(
  uuid, text, text, text, text, text, text, boolean, boolean, boolean, boolean, boolean, integer
) from public, anon, authenticated;
grant execute on function public.configure_event_media_preview(
  uuid, text, text, text, text, text, text, boolean, boolean, boolean, boolean, boolean, integer
) to authenticated;

drop policy event_media_public_admin_insert on storage.objects;

create policy event_media_public_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-media-public'
  and public.is_media_admin()
  and exists (
    select 1
    from public.event_media em
    where (
      em.media_type = 'uploaded_event_image'
      and em.storage_path = name
      and name = em.event_slug || '/' || em.id || '/primary.webp'
    ) or (
      em.media_type in ('publisher_video_embed', 'official_social_embed')
      and em.preview_storage_path = name
      and name = em.event_slug || '/' || em.id || '/preview.webp'
    )
  )
);

comment on column public.event_media.preview_storage_path is
  'Public WebP derivative for archive display of an approved official embed; never a third-party iframe.';
comment on column public.event_media.preview_same_event_verified is
  'Independent same-event decision for the static embed preview derivative.';
comment on column public.event_media_private_review.preview_original_media_url is
  'Private provenance for the exact official thumbnail or source frame used to create the preview.';
comment on function public.configure_event_media_preview(
  uuid, text, text, text, text, text, text, boolean, boolean, boolean, boolean, boolean, integer
) is
  'Configures an exact-event WebP preview and its independent review gates for a draft official embed.';

commit;
