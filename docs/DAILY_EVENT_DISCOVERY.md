# Daily event discovery and editorial review

## Outcome and safety boundary

This change adds a private, human-gated discovery workflow. It never edits the reviewed event
snapshot, publishes a record, opens a pull request, sends real email, or notifies followers by
itself. Public events remain sourced from `src/data/reviewed-events-preview.ts` and the existing
evidence/media registries. The existing `media_admins` UUID allow-list is reused through
`is_authorised_editor()`; there is no second administrator identity system.

The intended daily scan is 05:00 IST (`30 23 * * *` UTC on the previous day) and the intended
digest is 08:00 IST (`30 2 * * *` UTC). The database scheduler flag, every source, every connector,
outbound email, GitHub writes, publication and follower notification are disabled. The Edge
Function is an unscheduled authenticated bridge only.

## Architecture

1. An authenticated scheduler request passes both environment and database production gates.
2. Only enabled sources with current production compliance approval can be selected.
3. Each source becomes an isolated job. Fetches allow public HTTP(S), resolve DNS before each
   request, reject private/link-local/loopback addresses, follow at most three redirects, accept a
   narrow content-type list, time out after 12 seconds, and read at most 2 MiB.
   RSS/Atom requests support ETag and Last-Modified. Sitemap indexes recurse one bounded level,
   remain on-domain and filter by last modification. Source-specific recent-page adapters have no
   unrestricted crawler fallback. GDELT, YouTube and Bluesky builders return links/metadata only.
4. The staged pipeline normalises text, identifies language, canonicalises URLs, fingerprints,
   deduplicates, classifies, matches records, extracts fields, assesses ownership-aware
   corroboration, flags media and safety risks, scores confidence, and creates a private candidate.
5. Stored text is redacted, bounded to 32 KiB, short-lived, and inaccessible to public roles.
   Supporting passages are limited to 600 characters and linked to their source.
6. Editors review individual proposed fields, exact evidence, original-language text and any
   translation, then approve/edit/reject/defer. Child, victim/witness, live-location and
   reputational-risk material is forced to human review.
7. An approved candidate can produce a deterministic, exportable change-set manifest. Creating a
   branch, PR and merge remains a separate human action using existing repository review rules.
8. Follower notifications can only be derived from a `published_event_changes` record tied to a
   reviewed change set and commit/PR reference. The global real-notification gate remains off.

## Private routes

- `/admin/review/today`
- `/admin/review/new-events`
- `/admin/review/event-updates`
- `/admin/review/media`
- `/admin/review/sources`
- `/admin/review/scan-runs`
- `/admin/review/settings`
- `/admin/review/coverage`
- `/admin/review/compliance`
- `/admin/review/candidates/[id]`
- `/api/admin/review/change-sets/[id]` (authenticated export, `no-store`)
- `/api/internal/discovery` (shared-secret scheduler endpoint, fail-closed)

## Database and rollback

Migrations `20260801000400` and `20260801000500` are forward-only. RLS denies public access to
scanner, evidence, review, compliance, vendor, request and delivery records. A rollback should
first leave all production gates off, stop any separately configured scheduler, export required
audit records, then use a reviewed forward migration. Do not drop private tables from production
without retention, legal-hold and grievance review.

No production migration, credential, schedule, source enablement or deployment is part of this PR.
