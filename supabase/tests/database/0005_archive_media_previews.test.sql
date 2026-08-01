begin;

select plan(19);

select has_column('public', 'event_media', 'preview_storage_path', 'preview path is recorded');
select has_column('public', 'event_media', 'preview_alt_text', 'preview alternative text is recorded');
select has_column(
  'public',
  'event_media',
  'preview_same_event_verified',
  'preview same-event review is recorded'
);
select has_column(
  'public',
  'event_media',
  'preview_privacy_reviewed',
  'preview privacy review is recorded'
);
select has_column(
  'public',
  'event_media',
  'preview_safety_reviewed',
  'preview safety review is recorded'
);
select has_column(
  'public',
  'event_media',
  'preview_integrity_reviewed',
  'preview integrity review is recorded'
);
select has_column(
  'public',
  'event_media',
  'preview_approved_source_verified',
  'preview source review is recorded'
);
select has_column(
  'public',
  'event_media',
  'preview_review_import_reference',
  'one-time reviewed preview imports retain a review reference'
);
select has_column(
  'public',
  'event_media_private_review',
  'preview_original_media_url',
  'private preview provenance URL is recorded'
);
select has_column(
  'public',
  'event_media_private_review',
  'preview_original_sha256',
  'private original preview hash is recorded'
);
select has_column(
  'public',
  'event_media_private_review',
  'preview_derivative_sha256',
  'private derivative preview hash is recorded'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where status = 'approved'
      and media_type in ('publisher_video_embed', 'official_social_embed')
      and preview_storage_path is not null
  ),
  4,
  'all four approved embeds have archive preview derivatives'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where status = 'approved'
      and media_type in ('publisher_video_embed', 'official_social_embed')
      and preview_same_event_verified
      and preview_privacy_reviewed
      and preview_safety_reviewed
      and preview_integrity_reviewed
      and preview_approved_source_verified
  ),
  4,
  'all four approved embed previews pass the five independent review gates'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where preview_storage_path is not null
      and preview_storage_path <> event_slug || '/' || id || '/preview.webp'
  ),
  0,
  'preview derivatives use the controlled event and media path'
);

select is(
  (
    select count(*)::integer
    from public.event_media_private_review
    where preview_original_media_url is not null
      and (
        preview_original_sha256 is null
        or preview_derivative_sha256 is null
        or preview_review_notes is null
      )
  ),
  0,
  'every preview derivative retains private provenance and review evidence'
);

set local role anon;

select is(
  (select count(*)::integer from public.get_public_event_media(null) where preview_storage_path is not null),
  4,
  'the public-safe RPC exposes four approved archive preview paths'
);

select is(
  (
    select count(*)::integer
    from public.get_public_event_media(null)
    where preview_storage_path is not null
      and not (
        preview_same_event_verified
        and preview_privacy_reviewed
        and preview_safety_reviewed
        and preview_integrity_reviewed
        and preview_approved_source_verified
      )
  ),
  0,
  'the public-safe RPC never exposes a preview that failed a review gate'
);

select lives_ok(
  $$select event_slug, preview_storage_path, preview_alt_text
    from public.get_public_event_media(null)$$,
  'anonymous readers can access only the public-safe preview projection'
);

select throws_ok(
  $$select preview_original_media_url from public.event_media_private_review$$,
  '42501',
  null,
  'anonymous readers cannot access private preview provenance'
);

select * from finish();
rollback;
