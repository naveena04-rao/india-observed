# India Observed production launch

This runbook deliberately separates repository readiness from account-level deployment. Never use
the `india-observed-dev` Supabase project (`czdsfqykhpwiijhxwbps`) as the Production backend.

## Preconditions

1. Purchase or confirm the selected domain with the owner. Use `<DOMAIN>` until that decision is
   explicit; do not purchase or transfer a domain automatically.
2. Provision a dedicated Production Supabase project without incurring an unapproved charge.
3. Record the Production project name, reference and region without recording credentials.
4. Create the first administrator in Supabase Auth, then add that exact user UUID to
   `public.media_admins` in a separately reviewed step. Email-domain matching is not authorization.
5. Confirm a public contact address and takedown workflow.

## Domain and Vercel

1. Add `<DOMAIN>` and `www.<DOMAIN>` to the existing India Observed Vercel project.
2. Inspect the exact DNS records Vercel provides for both hostnames.
3. Add those records at the registrar or delegate nameservers, after owner approval.
4. Choose one canonical hostname, for example `https://<DOMAIN>`.
5. Configure a permanent redirect from the other hostname to the canonical hostname.
6. Verify HTTPS and certificate issuance for both hostnames.
7. Set `NEXT_PUBLIC_SITE_URL=https://<DOMAIN>` in Vercel Production.
8. Set `PUBLIC_CONTACT_EMAIL=<OWNER-APPROVED-ADDRESS>`.
9. Set `MEDIA_LIBRARY_ENABLED=true`.
10. Set `MEDIA_REQUIRED_FOR_LAUNCH=true` only when the media gate is intended to block Production.
11. Do not set `EVENT_FOLLOWING_ENABLED=true` until its separate Production readiness gate passes.

HSTS is intentionally absent until the custom domain, redirect and HTTPS behavior have been
verified. Add it in a separate reviewed change after that verification.

## Supabase database and storage

1. Create logical schema and data backups before applying migrations.
2. Inspect local and remote migration history and stop on unexpected divergence.
3. Apply existing migrations in order, followed by
   `20260728000100_add_event_media_library.sql`.
4. Run all pgTAP tests in a Docker-enabled environment.
5. Confirm RLS on `media_event_registry`, `media_event_sources`, `media_admins`, `event_media` and
   `event_media_private_review`.
6. Confirm anonymous raw-table access is denied and the public RPC returns approved safe fields
   only.
7. Confirm `event-media-staging` is private and has administrator-only access.
8. Confirm `event-media-public` allows public reads but administrator-only writes.
9. Confirm ordinary authenticated users cannot upload, approve, reject or withdraw media.
10. Confirm the administrator can upload only `<event-slug>/<media-id>/upload.webp` to staging.
11. Configure Supabase Auth Site URL as `https://<DOMAIN>`.
12. Add only reviewed local, Preview and Production authentication redirect URLs.

## Media launch gate

1. Review each media item against its event and approved source list.
2. Record creator, rights holder, credit line and a permitted rights basis.
3. Complete same-event, privacy, safety, integrity and source checks.
4. Approve through `/admin/media`; never edit status directly.
5. Run `npm run media:coverage`.
6. Run `npm run media:verify-launch`.
7. If an event has no approved media, add an owner-approved, dated and expiring entry to
   `data/media-launch-exceptions.json`. Never treat a fallback as approved media.
8. Confirm no draft, staging path, permission evidence or reviewer notes are publicly accessible.

## Production verification

1. Run `npm ci`, the full application validation suite and both Supabase reset/test cycles.
2. Run `npm audit` and `npm audit --omit=dev`; review runtime reachability before accepting any
   exception.
3. Deploy Production only after required environment gates pass.
4. Test the homepage, all five archive pages and representative event detail pages.
5. Verify all 50 event routes appear in `/sitemap.xml`.
6. Verify `/robots.txt` points to the canonical sitemap and excludes `/admin/`.
7. Verify canonical, Open Graph and Twitter metadata use `NEXT_PUBLIC_SITE_URL`.
8. Verify embeds remain click-to-load and no third-party frame loads automatically.
9. Verify no Preview notice or Vercel Authentication remains on Production.
10. Verify Contact, Privacy, Terms, Media policy and copyright/takedown pages.
11. Verify no staging object or private review field is public.

## Rollback

1. Withdraw the affected media through the protected workflow so public pages immediately fall
   back.
2. Revalidate the homepage, archive and affected event route.
3. Preserve withdrawn metadata and the reason; do not delete editorial history.
4. Restore the previous database from the recorded recovery point only if a migration-level
   rollback is required and reviewed.
5. Roll back the Vercel deployment to the last verified Production deployment.
6. Record the incident, affected URLs, decision maker, timestamps and corrective action.
