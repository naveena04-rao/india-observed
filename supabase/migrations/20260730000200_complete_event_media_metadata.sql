begin;

alter table public.event_media
  add column public_display_kind text not null default 'photograph';

update public.event_media
set public_display_kind = case media_type
  when 'publisher_video_embed' then 'video'
  when 'official_social_embed' then 'post'
  else 'photograph'
end;

alter table public.event_media
  add constraint event_media_public_display_kind_allowed check (
    public_display_kind in ('photograph', 'video', 'post', 'source_document_preview')
  ),
  add constraint event_media_public_display_kind_matches_type check (
    (
      media_type = 'uploaded_event_image'
      and public_display_kind in ('photograph', 'source_document_preview')
    )
    or (
      media_type = 'publisher_video_embed'
      and public_display_kind = 'video'
    )
    or (
      media_type = 'official_social_embed'
      and public_display_kind = 'post'
    )
  );

create function public.normalise_event_media_public_display_kind()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.media_type = 'publisher_video_embed' then
    new.public_display_kind := 'video';
  elsif new.media_type = 'official_social_embed' then
    new.public_display_kind := 'post';
  elsif new.public_display_kind not in ('photograph', 'source_document_preview') then
    new.public_display_kind := 'photograph';
  end if;
  return new;
end;
$$;

create trigger event_media_normalise_public_display_kind
before insert or update of media_type, public_display_kind on public.event_media
for each row execute function public.normalise_event_media_public_display_kind();

alter table public.event_media_private_review
  add column derivative_sha256 text null,
  add column original_width integer null,
  add column original_height integer null,
  add column derivative_width integer null,
  add column derivative_height integer null;

alter table public.event_media_private_review
  add constraint event_media_derivative_sha256_format check (
    derivative_sha256 is null or derivative_sha256 ~ '^[a-f0-9]{64}$'
  ),
  add constraint event_media_original_dimensions_valid check (
    (original_width is null and original_height is null)
    or (original_width > 0 and original_height > 0)
  ),
  add constraint event_media_derivative_dimensions_valid check (
    (derivative_width is null and derivative_height is null)
    or (derivative_width > 0 and derivative_height > 0)
  );

insert into public.media_event_sources (event_slug, source_url)
values
  (
    'manesar-industrial-workers-protest',
    'https://www.reutersconnect.com/item/factory-workers-hold-a-protest-demanding-wage-hike-outside-their-company/dGFnOnJldXRlcnMuY29tLDIwMjY6bmV3c21sX1JDMkNLS0FJNUIzQg'
  ),
  (
    'guwahati-tribal-township-hydropower-protest',
    'https://www.sentinelassam.com/breakingnews/tribal-bodies-stage-massive-protest-in-guwahati-to-protect-indigenous-rights'
  ),
  (
    'khanna-mgnrega-workers-regularisation-salaries',
    'https://www.hindustantimes.com/cities/chandigarh-news/khanna-protesting-mgnrega-workers-staff-face-tear-gas-water-cannons-101784145012987-amp.html'
  ),
  (
    'pune-neet-paper-leak-protest',
    'https://maharashtratimes.com/career/career-news/neet-paper-leak-pune-modern-college-protest-nsui-shivsena-principal-nivedita-ekbote-bjp-connection-neet-scam-allegations/articleshow/131172242.cms'
  ),
  (
    'mohali-aerotropolis-land-acquisition-hunger-strike',
    'https://www.hindustantimes.com/cities/chandigarh-news/mohali-farmers-end-hunger-strike-over-aerotropolis-project-after-govt-assurances-101776192818489.html'
  ),
  (
    'akola-fuel-price-protest',
    'https://www.loksatta.com/nagpur/vanchit-bahujan-aghadi-protest-akola-fuel-price-hike-inflation-collector-office-sap-05-5919218/'
  )
on conflict do nothing;

drop function public.get_public_event_media(text);

create function public.get_public_event_media(p_event_slug text default null)
returns table (
  event_slug text,
  media_type public.approved_media_type,
  public_display_kind text,
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
    em.public_display_kind,
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

comment on column public.event_media.public_display_kind is
  'Natural public presentation category. Source-document preview is permitted only after an explicit exact-source review.';
comment on column public.event_media_private_review.derivative_sha256 is
  'SHA-256 of the reduced public WebP derivative; publisher originals remain private and uncommitted.';

commit;
