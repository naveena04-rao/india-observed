begin;

select plan(58);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  (
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'media-admin@example.invalid',
    now(),
    now()
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'ordinary-reader@example.invalid',
    now(),
    now()
  );

select has_type('public', 'approved_media_type', 'approved media type enum exists');
select has_type('public', 'media_rights_basis', 'media rights enum exists');
select has_type('public', 'media_review_status', 'media review status enum exists');
select has_table('public', 'media_event_registry', 'media event registry exists');
select has_table('public', 'media_event_sources', 'media event source registry exists');
select has_table('public', 'media_admins', 'media administrator allow-list exists');
select has_table('public', 'event_media', 'event media table exists');
select has_table(
  'public',
  'event_media_private_review',
  'private media review table exists'
);
select is(
  (select count(*)::integer from public.media_event_registry),
  50,
  'media registry contains exactly 50 published events'
);
select is(
  (select count(*)::integer from public.media_event_sources),
  167,
  'media registry contains 165 factual sources and two media-only source relationships'
);
select is(
  (select count(*)::integer from public.event_media where status = 'draft'),
  0,
  'reviewed import leaves no incomplete draft media'
);
select is(
  (select count(*)::integer from public.event_media where status = 'approved'),
  11,
  'reviewed imports approve three prior items and nine homepage items with one overlap'
);
select is(
  (
    select count(*)::integer
    from pg_class
    where oid in (
      'public.media_event_registry'::regclass,
      'public.media_event_sources'::regclass,
      'public.media_admins'::regclass,
      'public.event_media'::regclass,
      'public.event_media_private_review'::regclass
    )
      and relrowsecurity
  ),
  5,
  'RLS is enabled on every media table'
);
select is(
  has_table_privilege('anon', 'public.event_media', 'select'),
  false,
  'anonymous users cannot select raw media rows'
);
select is(
  has_table_privilege('anon', 'public.event_media', 'insert'),
  false,
  'anonymous users cannot insert media'
);
select is(
  has_table_privilege('authenticated', 'public.event_media', 'delete'),
  false,
  'authenticated users cannot delete media records'
);
select is(
  has_table_privilege('authenticated', 'public.event_media', 'update'),
  false,
  'authenticated clients cannot bypass protected media review and approval functions'
);
select is(
  has_table_privilege('anon', 'public.event_media_private_review', 'select'),
  false,
  'anonymous users cannot read private review notes'
);
select is(
  has_function_privilege('anon', 'public.get_public_event_media(text)', 'execute'),
  true,
  'anonymous users can call only the public-safe media RPC'
);
select is(
  has_function_privilege('anon', 'public.approve_event_media(uuid,text)', 'execute'),
  false,
  'anonymous users cannot approve media'
);
select is(
  has_function_privilege('authenticated', 'public.approve_event_media(uuid,text)', 'execute'),
  true,
  'authenticated users can reach the approval RPC subject to the admin allow-list'
);
select is(
  (
    select array_agg(column_name::text order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'event_media_private_review'
  ),
  array[
    'media_id',
    'permission_evidence',
    'review_notes',
    'same_event_reasoning',
    'privacy_notes',
    'safety_notes',
    'integrity_notes',
    'rejection_reason',
    'original_filename',
    'original_sha256',
    'original_media_url',
    'staging_path',
    'previous_public_storage_path',
    'created_at',
    'updated_at',
    'crop_resize_disclosure'
  ]::text[],
  'permission evidence and reviewer notes remain in a separate private table'
);
select is(
  (
    select array_agg(column_name::text order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'get_public_event_media'
  ),
  null::text[],
  'public media is exposed through a fixed-return function, not a table or permissive view'
);
select is(
  (select count(*)::integer from public.get_public_event_media(null)),
  11,
  'only the eleven reviewed approved media rows are publicly returned'
);

select throws_ok(
  $$
    insert into public.event_media (
      id, event_slug, media_type, storage_path, source_url, creator, rights_holder, credit_line,
      rights_basis, alt_text
    ) values (
      '14000000-0000-4000-8000-000000000099', 'not-a-published-event',
      'uploaded_event_image',
      'not-a-published-event/14000000-0000-4000-8000-000000000099/upload.webp',
      'https://example.com/source', 'Creator',
      'Rights holder', 'Photo: Creator · Source: Example', 'owned_original',
      'Exact event image with descriptive alternative text'
    )
  $$,
  '23503',
  null,
  'unknown event slugs are rejected'
);
select throws_ok(
  $$
    insert into public.event_media (
      event_slug, media_type, source_url, creator, rights_holder, credit_line, rights_basis,
      alt_text
    ) values (
      'karapur-sarvan-luxury-township-protest', 'uploaded_event_image',
      'https://example.com/source', 'Creator', 'Rights holder',
      'Photo: Creator · Source: Example', 'owned_original',
      'Exact event image with descriptive alternative text'
    )
  $$,
  '23514',
  null,
  'uploaded images require a controlled storage path'
);
select throws_ok(
  $$
    insert into public.event_media (
      event_slug, media_type, storage_path, source_url, creator, rights_holder, credit_line,
      rights_basis, alt_text
    ) values (
      'karapur-sarvan-luxury-township-protest', 'uploaded_event_image',
      'karapur-sarvan-luxury-township-protest/00000000-0000-4000-8000-000000000100/upload.webp',
      'https://example.com/source', 'Creator', 'Rights holder',
      'Photo: Creator · Source: Example', 'official_embed',
      'Exact event image with descriptive alternative text'
    )
  $$,
  '23514',
  null,
  'uploaded files cannot use the official-embed rights basis'
);
select throws_ok(
  $$
    insert into public.event_media (
      event_slug, media_type, source_url, media_url, publisher, credit_line, rights_basis,
      alt_text
    ) values (
      'karapur-sarvan-luxury-township-protest', 'publisher_video_embed',
      'https://example.com/source', 'https://arbitrary.example/embed', 'Example',
      'Video/Post: Example · View original', 'official_embed',
      'Exact event video with descriptive alternative text'
    )
  $$,
  '23514',
  null,
  'arbitrary iframe hosts are rejected'
);
select throws_ok(
  $$
    insert into public.event_media (
      event_slug, media_type, storage_path, source_url, creator, rights_holder, credit_line,
      rights_basis, alt_text
    ) values (
      'karapur-sarvan-luxury-township-protest', 'uploaded_event_image',
      'karapur-sarvan-luxury-township-protest/00000000-0000-4000-8000-000000000101/upload.webp',
      'https://example.com/source', 'Creator', 'Rights holder',
      'Photo: Creator · Source: Example', 'official_embed',
      'Exact event image with descriptive alternative text'
    )
  $$,
  '23514',
  null,
  'a source link and credit cannot make an uploaded image redistributable'
);
select throws_ok(
  $$
    insert into public.event_media (
      event_slug, media_type, status, storage_path, source_url, publisher, creator,
      rights_holder, credit_line, rights_basis, alt_text, same_event_verified,
      privacy_reviewed, safety_reviewed, integrity_reviewed, approved_source_verified,
      reviewed_by, approved_at
    ) values (
      'karapur-sarvan-luxury-township-protest', 'uploaded_event_image', 'approved',
      'karapur-sarvan-luxury-township-protest/00000000-0000-4000-8000-000000000102/primary.webp',
      'https://m.economictimes.com/news/politics-and-nation/karnataka-cm-responds-to-farmer-protests-review-of-controversial-ai-township-project-announced/articleshow/132412974.cms',
      'Economic Times', 'Creator', 'Rights holder',
      'Photo: Creator · Source: Economic Times', 'explicit_permission',
      'Exact event image with descriptive alternative text', true, true, true, true, true,
      '33333333-3333-4333-8333-333333333333', now()
    )
  $$,
  '23514',
  null,
  'explicit permission cannot approve an image without a permission reference'
);
select throws_ok(
  $$
    insert into public.event_media (
      event_slug, media_type, status, source_url, media_url, credit_line, rights_basis,
      alt_text, same_event_verified, privacy_reviewed, safety_reviewed, integrity_reviewed,
      approved_source_verified, reviewed_by, approved_at
    ) values (
      'karapur-sarvan-luxury-township-protest', 'publisher_video_embed', 'approved',
      'https://m.economictimes.com/news/politics-and-nation/karnataka-cm-responds-to-farmer-protests-review-of-controversial-ai-township-project-announced/articleshow/132412974.cms',
      'https://www.ndtv.com/videos/embed-player/?id=998',
      'Video/Post: NDTV · View original', 'official_embed',
      'Exact event video with descriptive alternative text', true, true, true, true, true,
      '33333333-3333-4333-8333-333333333333', now()
    )
  $$,
  '23514',
  null,
  'approved embeds require public publisher attribution'
);
select ok(
  not public.is_allowed_media_embed('https://example.com/embed'),
  'unknown embed hosts fail closed'
);
select ok(
  public.is_allowed_media_embed(
    'https://www.ndtv.com/videos/embed-player/?id=999'
  ),
  'reviewed NDTV embed host is allowed'
);
select is(
  (select public from storage.buckets where id = 'event-media-staging'),
  false,
  'staging bucket is private'
);
select is(
  (select public from storage.buckets where id = 'event-media-public'),
  true,
  'approved derivative bucket is publicly readable'
);
select is(
  (
    select file_size_limit
    from storage.buckets
    where id = 'event-media-staging'
  ),
  10485760::bigint,
  'staging uploads are limited to 10 MB'
);
select is(
  (
    select allowed_mime_types
    from storage.buckets
    where id = 'event-media-staging'
  ),
  array['image/webp']::text[],
  'storage accepts only processed WebP files'
);
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'event_media_staging%'
  ),
  4,
  'staging has admin-only select, insert, update and delete policies'
);
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'event_media_public_read'
  ),
  1,
  'public storage has one explicit read policy'
);

insert into public.media_admins (user_id)
values ('33333333-3333-4333-8333-333333333333');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select is(public.is_media_admin(), false, 'ordinary authenticated user is not a media admin');
select throws_ok(
  $$select * from public.approve_event_media(
    '14000000-0000-4000-8000-000000000001',
    null
  )$$,
  '42501',
  'Media administrator access required',
  'ordinary authenticated users cannot approve media'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select is(public.is_media_admin(), true, 'UUID allow-listed user is a media admin');
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
  approved_source_verified
)
values (
  '14000000-0000-4000-8000-000000000020',
  'karapur-sarvan-luxury-township-protest',
  'publisher_video_embed',
  'draft',
  'https://m.economictimes.com/news/politics-and-nation/karnataka-cm-responds-to-farmer-protests-review-of-controversial-ai-township-project-announced/articleshow/132412974.cms',
  'https://www.ndtv.com/videos/embed-player/?id=990',
  'NDTV',
  'Video/Post: NDTV · View original',
  'official_embed',
  'Test exact-event video awaiting a privacy gate',
  true,
  false,
  true,
  true,
  true
);
select throws_ok(
  $$select * from public.approve_event_media(
    '14000000-0000-4000-8000-000000000020',
    null
  )$$,
  '23514',
  'All media review gates must pass',
  'approval fails unless every review gate passes'
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
  approved_source_verified
)
values (
  '14000000-0000-4000-8000-000000000010',
  'karapur-sarvan-luxury-township-protest',
  'publisher_video_embed',
  'draft',
  'https://example.com/not-an-approved-source',
  'https://www.ndtv.com/videos/embed-player/?id=991',
  'NDTV',
  'Video/Post: NDTV · View original',
  'official_embed',
  'Exact event video with descriptive alternative text',
  true,
  true,
  true,
  true,
  true
);
insert into public.event_media_private_review (
  media_id,
  same_event_reasoning,
  privacy_notes,
  safety_notes,
  integrity_notes,
  original_media_url
)
values (
  '14000000-0000-4000-8000-000000000010',
  'Test reasoning that is sufficiently complete.',
  'Privacy review complete.',
  'Safety review complete.',
  'Integrity review complete.',
  'https://www.ndtv.com/videos/embed-player/?id=991'
);
select throws_ok(
  $$select * from public.approve_event_media(
    '14000000-0000-4000-8000-000000000010',
    null
  )$$,
  '23503',
  'Source does not belong to event',
  'approval revalidates event-source membership'
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
  approved_source_verified
)
values (
  '14000000-0000-4000-8000-000000000011',
  'karapur-sarvan-luxury-township-protest',
  'publisher_video_embed',
  'draft',
  'https://www.thegoan.net/goa-news/%C3%A2%E2%82%AC%CB%9Csave-karapur%C3%A2%E2%82%AC%E2%84%A2-protest-reaches-panaji-agitators-threaten-indefinite-sitin/149594.html',
  'https://www.ndtv.com/videos/embed-player/?id=992',
  'NDTV',
  'Video/Post: NDTV · View original',
  'official_embed',
  'Exact event video with descriptive alternative text',
  true,
  true,
  true,
  true,
  true
);
insert into public.event_media_private_review (
  media_id,
  same_event_reasoning,
  privacy_notes,
  safety_notes,
  integrity_notes,
  original_media_url
)
values (
  '14000000-0000-4000-8000-000000000011',
  'Test reasoning that is sufficiently complete.',
  'Privacy review complete.',
  'Safety review complete.',
  'Integrity review complete.',
  'https://www.ndtv.com/videos/embed-player/?id=992'
);
select lives_ok(
  $$select * from public.approve_event_media(
    '14000000-0000-4000-8000-000000000011',
    null
  )$$,
  'media admin can approve a fully reviewed exact-source embed'
);
select is(
  (
    select status::text
    from public.event_media
    where id = '14000000-0000-4000-8000-000000000011'
  ),
  'approved',
  'approved media receives approved status'
);
select is(
  (
    select reviewed_by
    from public.event_media
    where id = '14000000-0000-4000-8000-000000000011'
  ),
  '33333333-3333-4333-8333-333333333333'::uuid,
  'approval records the human reviewer'
);
select is(
  (
    select count(*)::integer
    from public.get_public_event_media('karapur-sarvan-luxury-township-protest')
  ),
  1,
  'only approved media is publicly returned'
);
select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'event_media'
      and column_name in ('permission_evidence', 'review_notes', 'original_sha256')
  ),
  0,
  'sensitive review fields never enter public media metadata'
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
  replaces_media_id,
  replacement_reason
)
values (
  '14000000-0000-4000-8000-000000000012',
  'karapur-sarvan-luxury-township-protest',
  'publisher_video_embed',
  'draft',
  'https://timesofindia.indiatimes.com/city/goa/karapur-sarvan-villagers-detained-while-marching-to-azad-maidan-over-hsg-project/articleshow/131861422.cms',
  'https://www.ndtv.com/videos/embed-player/?id=993',
  'NDTV',
  'Video/Post: NDTV · View original',
  'official_embed',
  'Replacement exact-event video with descriptive alternative text',
  true,
  true,
  true,
  true,
  true,
  '14000000-0000-4000-8000-000000000011',
  'A clearer exact-event source became available.'
);
insert into public.event_media_private_review (
  media_id,
  same_event_reasoning,
  privacy_notes,
  safety_notes,
  integrity_notes,
  original_media_url
)
values (
  '14000000-0000-4000-8000-000000000012',
  'Replacement test reasoning is sufficiently complete.',
  'Privacy review complete.',
  'Safety review complete.',
  'Integrity review complete.',
  'https://www.ndtv.com/videos/embed-player/?id=993'
);
select lives_ok(
  $$select * from public.approve_event_media(
    '14000000-0000-4000-8000-000000000012',
    null
  )$$,
  'replacement succeeds only after the new item passes approval'
);
select is(
  (
    select status::text
    from public.event_media
    where id = '14000000-0000-4000-8000-000000000011'
  ),
  'withdrawn',
  'superseded media remains as withdrawn editorial history'
);
select is(
  (
    select count(*)::integer
    from public.event_media
    where event_slug = 'karapur-sarvan-luxury-township-protest'
      and status = 'approved'
  ),
  1,
  'at most one approved primary media item exists per event'
);
select lives_ok(
  $$select public.withdraw_event_media(
    '14000000-0000-4000-8000-000000000012',
    'Withdrawn during the media-library regression test.'
  )$$,
  'administrator can withdraw approved media with a recorded reason'
);
select is(
  (
    select count(*)::integer
    from public.get_public_event_media('karapur-sarvan-luxury-township-protest')
  ),
  0,
  'withdrawn media immediately falls back by disappearing from the public RPC'
);

insert into public.event_media (
  id,
  event_slug,
  media_type,
  status,
  storage_path,
  source_url,
  creator,
  rights_holder,
  credit_line,
  rights_basis,
  alt_text
)
values (
  '14000000-0000-4000-8000-000000000013',
  'karapur-sarvan-luxury-township-protest',
  'uploaded_event_image',
  'draft',
  'karapur-sarvan-luxury-township-protest/14000000-0000-4000-8000-000000000013/upload.webp',
  'https://m.economictimes.com/news/politics-and-nation/karnataka-cm-responds-to-farmer-protests-review-of-controversial-ai-township-project-announced/articleshow/132412974.cms',
  'Creator',
  'Rights holder',
  'Photo: Creator · Source: Economic Times',
  'explicit_permission',
  'Exact event image with descriptive alternative text'
);
insert into public.event_media_private_review (
  media_id,
  same_event_reasoning,
  privacy_notes,
  safety_notes,
  integrity_notes,
  original_sha256
)
values (
  '14000000-0000-4000-8000-000000000013',
  'Uploaded-image test reasoning is sufficiently complete.',
  'Privacy review complete.',
  'Safety review complete.',
  'Integrity review complete.',
  repeat('a', 64)
);
select throws_ok(
  $$
    insert into public.event_media_private_review (
      media_id, same_event_reasoning, privacy_notes, safety_notes, integrity_notes, original_sha256
    ) values (
      '14000000-0000-4000-8000-000000000010',
      'Duplicate-file test reasoning is complete.',
      'Privacy review complete.',
      'Safety review complete.',
      'Integrity review complete.',
      repeat('a', 64)
    )
  $$,
  '23505',
  null,
  'duplicate uploaded-file hashes are rejected'
);
select throws_ok(
  $$select * from public.approve_event_media(
    '14000000-0000-4000-8000-000000000013',
    '../escape/primary.webp'
  )$$,
  '23514',
  'All media review gates must pass',
  'unreviewed uploaded files cannot reach path approval'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'approve_event_media',
        'get_public_event_media',
        'is_media_admin',
        'reject_event_media',
        'update_event_media_review',
        'withdraw_event_media'
      )
      and p.prosecdef
  ),
  6,
  'all authorization and public-return functions are SECURITY DEFINER'
);
select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'approve_event_media',
        'get_public_event_media',
        'is_media_admin',
        'reject_event_media',
        'update_event_media_review',
        'withdraw_event_media'
      )
      and p.proconfig is not null
  ),
  6,
  'all authorization and public-return functions use fixed search paths'
);

select * from finish();
rollback;
