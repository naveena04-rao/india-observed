begin;

select plan(16);

select has_column(
  'public',
  'event_media',
  'public_display_kind',
  'public media display kind is recorded'
);
select has_column(
  'public',
  'event_media_private_review',
  'derivative_sha256',
  'static derivative SHA-256 is recorded privately'
);
select has_column(
  'public',
  'event_media_private_review',
  'original_width',
  'original width is recorded privately'
);
select has_column(
  'public',
  'event_media_private_review',
  'original_height',
  'original height is recorded privately'
);
select has_column(
  'public',
  'event_media_private_review',
  'derivative_width',
  'derivative width is recorded privately'
);
select has_column(
  'public',
  'event_media_private_review',
  'derivative_height',
  'derivative height is recorded privately'
);

select is(
  has_function_privilege('authenticated', 'public.is_allowed_media_embed(text)', 'execute'),
  true,
  'authenticated media administrators can evaluate the immutable embed-host constraint'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where media_type = 'uploaded_event_image'
      and public_display_kind <> 'photograph'
  ),
  0,
  'existing uploaded media remains classified as photographs'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where media_type = 'publisher_video_embed'
      and public_display_kind <> 'video'
  ),
  0,
  'publisher embeds are classified as video'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where media_type = 'official_social_embed'
      and public_display_kind <> 'post'
  ),
  0,
  'official social embeds are classified as posts'
);

select lives_ok(
  $$update public.event_media
    set public_display_kind = 'source_document_preview'
    where media_type = 'publisher_video_embed'$$,
  'embed public display kind is normalised automatically'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where media_type = 'publisher_video_embed'
      and public_display_kind <> 'video'
  ),
  0,
  'an embed cannot remain misclassified as a source-document preview'
);

select throws_ok(
  $$update public.event_media_private_review
    set derivative_sha256 = 'not-a-sha'
    where media_id = '15000000-0000-4000-8000-000000000002'$$,
  '23514',
  null,
  'invalid derivative hashes are rejected'
);

set local role anon;

select lives_ok(
  $$select event_slug, public_display_kind
    from public.get_public_event_media(null)$$,
  'anonymous readers receive the natural public display kind'
);

select is(
  (
    select count(*)::integer
    from public.get_public_event_media(null)
    where public_display_kind not in ('photograph', 'video', 'post', 'source_document_preview')
  ),
  0,
  'the public-safe RPC returns only controlled display categories'
);

select throws_ok(
  $$select derivative_sha256 from public.event_media_private_review$$,
  '42501',
  null,
  'anonymous readers cannot access private derivative metadata'
);

select * from finish();
rollback;
