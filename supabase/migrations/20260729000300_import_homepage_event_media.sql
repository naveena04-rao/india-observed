begin;

-- Phase 1 is intentionally limited to the nine records used on the homepage.
-- These relationships are media provenance only; they do not alter the reviewed factual
-- source register exposed on event pages.
insert into public.media_event_sources (event_slug, source_url)
values
  (
    'bidadi-farmers-land-acquisition',
    'https://www.ndtv.com/video/protests-in-karnataka-s-bidadi-after-government-proposes-to-cut-trees-for-ai-city-project-1120270'
  ),
  (
    'manipur-government-employees-strike',
    'https://www.imphaltimes.com/news/state-suffers-estimated-rs-13-28-crore-loss-as-government-employees-cease-work-strike-enters-ninth-day/'
  )
on conflict do nothing;

insert into public.event_media (
  id,
  event_slug,
  media_type,
  status,
  storage_path,
  source_url,
  media_url,
  publisher,
  creator,
  rights_holder,
  credit_line,
  rights_basis,
  alt_text,
  focal_position,
  same_event_verified,
  privacy_reviewed,
  safety_reviewed,
  integrity_reviewed,
  approved_source_verified,
  source_page_verified,
  reporting_purpose_confirmed,
  reduced_resolution_confirmed,
  no_gallery_reuse_confirmed,
  no_unrelated_commercial_reuse_confirmed,
  takedown_process_confirmed,
  owner_acceptance,
  rights_reviewed_at,
  review_import_reference,
  approved_at,
  created_at,
  updated_at
)
values
  (
    '15000000-0000-4000-8000-000000000001',
    'bidadi-farmers-land-acquisition',
    'publisher_video_embed',
    'approved',
    null,
    'https://www.ndtv.com/video/protests-in-karnataka-s-bidadi-after-government-proposes-to-cut-trees-for-ai-city-project-1120270',
    'https://www.ndtv.com/videos/embed-player/?id=1120270&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100',
    'NDTV',
    null,
    'NDTV',
    'Video: NDTV · View original',
    'official_embed',
    'NDTV video report showing the Bidadi protest against township land acquisition.',
    '50% 50%',
    true, true, true, true, true,
    false, false, false, false, false, false, false, null,
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000002',
    'manipur-government-employees-strike',
    'uploaded_event_image',
    'approved',
    'manipur-government-employees-strike/15000000-0000-4000-8000-000000000002/primary.webp',
    'https://www.imphaltimes.com/news/state-suffers-estimated-rs-13-28-crore-loss-as-government-employees-cease-work-strike-enters-ninth-day/',
    null,
    'Imphal Times',
    null,
    'Imphal Times',
    'Photo: Imphal Times · View original',
    'editorial_fair_dealing_current_events',
    'Manipur government employees gathered beneath an Indefinite Cease Work Strike banner.',
    '50% 50%',
    true, true, true, true, true,
    true, true, true, true, true, true, true, '2026-07-29',
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000003',
    'dharmasala-teacher-vacancy-protest',
    'uploaded_event_image',
    'approved',
    'dharmasala-teacher-vacancy-protest/15000000-0000-4000-8000-000000000003/primary.webp',
    'https://timesofindia.indiatimes.com/city/bhubaneswar/school-students-lock-gate-stage-dharna-over-teacher-shortage/articleshow/132310990.cms',
    null,
    'The Times of India',
    null,
    'The Times of India',
    'Photo: The Times of India · View original',
    'editorial_fair_dealing_current_events',
    'A wide view of Dharmasala school students seated outside the school gate during the teacher-vacancy protest.',
    '50% 50%',
    true, true, true, true, true,
    true, true, true, true, true, true, true, '2026-07-29',
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000004',
    'bundelkhand-rehabilitation-compensation-protest',
    'uploaded_event_image',
    'approved',
    'bundelkhand-rehabilitation-compensation-protest/15000000-0000-4000-8000-000000000004/primary.webp',
    'https://www.downtoearth.org.in/environment/ken-betwa-link-leaves-tribal-families-fighting-for-fair-compensation',
    null,
    'Down To Earth',
    null,
    'Down To Earth',
    'Photo: Down To Earth · View original',
    'editorial_fair_dealing_current_events',
    'An overhead wide view of project-affected women staging the symbolic pyre protest in Bundelkhand.',
    '50% 50%',
    true, true, true, true, true,
    true, true, true, true, true, true, true, '2026-07-29',
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000005',
    'education-accountability-jantar-mantar',
    'uploaded_event_image',
    'approved',
    'education-accountability-jantar-mantar/15000000-0000-4000-8000-000000000005/primary.webp',
    'https://www.hindustantimes.com/india-news/cjp-protest-delhi-live-updates-cockroach-janta-party-jantar-mantar-today-abhijeet-dipke-dharmendra-pradhan-re-neet-ug-101782010668315.html',
    null,
    'Hindustan Times',
    null,
    'Hindustan Times',
    'Photo: Hindustan Times · View original',
    'editorial_fair_dealing_current_events',
    'A wide scene of participants and placards at the education-accountability protest at Jantar Mantar.',
    '50% 50%',
    true, true, true, true, true,
    true, true, true, true, true, true, true, '2026-07-29',
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000006',
    'save-sgnp-human-chain-thane',
    'uploaded_event_image',
    'approved',
    'save-sgnp-human-chain-thane/15000000-0000-4000-8000-000000000006/primary.webp',
    'https://timesofindia.indiatimes.com/city/thane/hundreds-join-save-sgnp-protest-in-thane-oppose-projects-near-forest/articleshow/132199148.cms',
    null,
    'The Times of India',
    null,
    'The Times of India',
    'Photo: The Times of India · View original',
    'editorial_fair_dealing_current_events',
    'Adults hold a Save SGNP banner during the public campaign action in Thane.',
    '50% 50%',
    true, true, true, true, true,
    true, true, true, true, true, true, true, '2026-07-29',
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000007',
    'morbi-transmission-compensation-satyagraha',
    'uploaded_event_image',
    'approved',
    'morbi-transmission-compensation-satyagraha/15000000-0000-4000-8000-000000000007/primary.webp',
    'https://indianexpress.com/article/cities/ahmedabad/gujarat-farmers-protest-adani-transmission-line-compensation-morbi-10775737/',
    null,
    'The Indian Express',
    null,
    'The Indian Express',
    'Photo: The Indian Express · View original',
    'editorial_fair_dealing_current_events',
    'The Morbi compensation satyagraha stage with placards and seated participants at Jetpar.',
    '50% 50%',
    true, true, true, true, true,
    true, true, true, true, true, true, true, '2026-07-29',
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000008',
    'kokrajhar-apdcl-land-allotment-protest',
    'uploaded_event_image',
    'approved',
    'kokrajhar-apdcl-land-allotment-protest/15000000-0000-4000-8000-000000000008/primary.webp',
    'https://www.indiatodayne.in/assam/video/bodo-community-protests-land-allotment-to-apdcl-opposes-rehabilitation-of-evicted-families-in-assams-kokrajhar-1423007-2026-07-12',
    null,
    'India Today North East',
    null,
    'India Today North East',
    'Video thumbnail: India Today North East · View original',
    'editorial_fair_dealing_current_events',
    'A banner at the 12 July 2026 Malgaon demonstration opposing the APDCL land allotment.',
    '50% 50%',
    true, true, true, true, true,
    true, true, true, true, true, true, true, '2026-07-29',
    'Homepage media review 2026-07-29',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  );

insert into public.event_media_private_review (
  media_id,
  same_event_reasoning,
  privacy_notes,
  safety_notes,
  integrity_notes,
  original_filename,
  original_sha256,
  original_media_url,
  staging_path,
  crop_resize_disclosure,
  review_notes,
  created_at,
  updated_at
)
values
  (
    '15000000-0000-4000-8000-000000000001',
    'The NDTV report names Bidadi and shows the land-acquisition protest recorded by this event.',
    'Publisher footage is kept click-to-load; India Observed extracts no participant identities.',
    'No live tactical location or sensitive operational detail is added.',
    'The official NDTV page and player were checked; no stream was extracted or rehosted.',
    null, null,
    'https://www.ndtv.com/video/protests-in-karnataka-s-bidadi-after-government-proposes-to-cut-trees-for-ai-city-project-1120270',
    null, null,
    'Approved exact-event publisher embed after same-event, privacy, safety and integrity review.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000002',
    'The banner, employee associations and cease-work action match the reviewed statewide strike.',
    'A wide public group scene is used; no person is singled out or identified.',
    'The image shows no injury, detention, medical distress or precise live tactical detail.',
    'The image was taken from the exact Imphal Times report and re-encoded without metadata.',
    'manipur-imphaltimes.source',
    'b35b293dd384b6a620608d5df1dc7f80197a6a1b5ab9b78c5b587ee2427b39c1',
    'https://imphaltimes.b-cdn.net/wp-content/uploads/2026/07/State-suffers-estimated-Rs.-13.28-crore-loss-as-government-employees-cease-work-strike-enters-ninth-day-optimized.jpeg',
    'manipur-government-employees-strike/15000000-0000-4000-8000-000000000002/original-upload',
    'Cropped 19px from the top of 1024×615 to a truthful 1024×576 frame; metadata stripped and re-encoded as WebP.',
    'Editorial current-events display only; no ownership or permission is implied.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000003',
    'The school gate, students and sit-in match the exact Dharmasala teacher-vacancy action.',
    'A wide scene is retained; no child is named and no close portrait is used.',
    'No injury, distress or sensitive location beyond the already published institution is shown.',
    'The exact Times of India event image was re-encoded without metadata.',
    'dharmasala-teacher-vacancy-protest.source',
    '640bd876a4e917d8c9ec14902ad808ab0fd4ae2eaf461eb41df3ac3b5f935c62',
    'https://static.toiimg.com/thumb/msid-132310987,width-1280,height-720,resizemode-6,overlay-toi_sw,pt-32,y_pad-600/photo.jpg',
    'dharmasala-teacher-vacancy-protest/15000000-0000-4000-8000-000000000003/original-upload',
    'Aspect ratio preserved at 1280×720; metadata stripped and re-encoded as WebP.',
    'Minors review passed because the selected frame is a wide public-event scene, not an identifying portrait.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000004',
    'The Down To Earth report and caption identify this as the same Bundelkhand pyre-protest phase.',
    'The overhead wide frame avoids centring or identifying one participant.',
    'The symbolic protest is described without suggesting injury or medical distress.',
    'The exact source image was centre-cropped minimally and re-encoded without metadata.',
    'bundelkhand-rehabilitation-compensation-protest.source',
    '9b8027966407c45674edd1dcd3d1ec231681de84a896ca3e2eac16aded26f7e7',
    'https://cf-images.assettype.com/downtoearth%2F2026-07-08%2Fotu4utct%2F6-pyre-protest.png?w=1200&ar=40%3A21&auto=format%2Ccompress&ogImage=true&mode=crop&enlarge=true&overlay=false&overlay_position=bottom&overlay_width=100',
    'bundelkhand-rehabilitation-compensation-protest/15000000-0000-4000-8000-000000000004/original-upload',
    'Cropped 37px from the top of 1200×749 to 1200×675; central protest action preserved, metadata stripped and WebP encoded.',
    'Caption language identifies a symbolic protest and avoids sensational treatment.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000005',
    'The publisher caption and visible peaceful-protest stage match the reviewed Jantar Mantar action.',
    'A wide crowd scene is used without naming or isolating ordinary participants.',
    'No medical-distress or hunger-strike close-up is used.',
    'The exact Hindustan Times event image was re-encoded without metadata.',
    'jantar-ht-large.source',
    'bf8a9bade230eb15fdb8ec86f945c0ffe0696552e96c817e5c54b61f792f2e7a',
    'https://www.hindustantimes.com/ht-img/img/2026/06/21/1600x900/CJP-founder-Abhishek-Dipke-during-the-protest-at-J_1782028422744_1782028428246_43f4f474-33ab-4919-aade-f821c98a6099.jpg',
    'education-accountability-jantar-mantar/15000000-0000-4000-8000-000000000005/original-upload',
    'Aspect ratio preserved at 1600×900; metadata stripped and re-encoded as WebP.',
    'Selected instead of medical-distress imagery from a later phase.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000006',
    'The Save SGNP banner and campaign participants match the 5 July Thane action.',
    'A left-weighted wide crop removes the minor at the far-right edge and avoids singling out participants.',
    'The frame shows a peaceful public campaign with no injury, detention or tactical detail.',
    'The exact Times of India image was cropped for privacy and re-encoded without metadata.',
    'save-sgnp-human-chain-thane.source',
    '7b01acbd39cda91cc4c3d89539373fae9ef122f7671ca02821de3f4502d169fb',
    'https://static.toiimg.com/thumb/msid-132199210,width-1280,height-720,resizemode-6,overlay-toi_sw,pt-32,y_pad-600/photo.jpg',
    'save-sgnp-human-chain-thane/15000000-0000-4000-8000-000000000006/original-upload',
    'Cropped to the left 960×540 region starting 90px from the top; minor at far right excluded, metadata stripped and WebP encoded.',
    'Static event image selected instead of activating the privacy-withheld Instagram candidate.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000007',
    'The Jetpar stage, compensation placards and satyagraha camp match the reviewed Morbi movement phase.',
    'The wide stage view does not identify or centre an ordinary participant.',
    'No injury, detention, medical distress or live tactical information is shown.',
    'The exact Indian Express event image replaces the rejected contextual publisher graphic.',
    'morbi-transmission-compensation-satyagraha.source',
    '5f967a963c19ff119a541d69ca5242ecf5485b626d1b1065ae6c85bace8e8d68',
    'https://images.indianexpress.com/2026/07/07MorbiProtest.jpg',
    'morbi-transmission-compensation-satyagraha/15000000-0000-4000-8000-000000000007/original-upload',
    'Aspect ratio preserved at 1600×900; metadata stripped and re-encoded as WebP.',
    'Exact-event photograph approved; the earlier contextual PTI graphic remains rejected.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  ),
  (
    '15000000-0000-4000-8000-000000000008',
    'The banner states Malgaon and 12 July 2026 and identifies the APDCL land-allotment protest.',
    'The selected publisher thumbnail shows the banner while faces remain outside the frame.',
    'No injury, detention, medical distress or tactical detail is shown.',
    'The exact India Today North East video thumbnail was re-encoded without metadata.',
    'kokrajhar-apdcl-land-allotment-protest.source',
    '69e6ceda56c4e1e70d9907ee47d1391d59b7bc477fea866aed8eccc137cedcab',
    'https://cf-img-a-in.tosshub.com/lingo/itne/images/video/202607/6a5384879374f-cfcf-121146287-16x9.png',
    'kokrajhar-apdcl-land-allotment-protest/15000000-0000-4000-8000-000000000008/original-upload',
    'Aspect ratio preserved at 880×495; metadata stripped and re-encoded as WebP.',
    'Thumbnail date was checked against the reviewed 12 July action; 5 July footage was not used.',
    '2026-07-29T12:00:00Z',
    '2026-07-29T12:00:00Z'
  );

update public.event_media_private_review
set
  review_notes =
    'Revalidated for homepage Phase 1. Official Live Times exact-event video remains click-to-load; no asset was downloaded or rehosted.',
  updated_at = '2026-07-29T12:00:00Z'
where media_id = '14000000-0000-4000-8000-000000000004';

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
  approved_source_verified boolean
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
    em.approved_source_verified
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

comment on function public.get_public_event_media(text) is
  'Returns only fully reviewed exact-event media whose source is recorded in the private media-source registry.';

commit;
