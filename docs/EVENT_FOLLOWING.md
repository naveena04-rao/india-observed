# Event following

## Product boundary

Event following records a private reader preference for a published event and exposes only the
aggregate follower count. Following is not endorsement. This version has no notifications, public
profiles, follower list, reactions, ranking, trending label, archive filter or follower-based
editorial behavior.

Follower counts do not influence archive ordering, search, verification, publication, homepage
selection or editorial priority.

## Authentication

Reader accounts use Supabase Auth passwordless email links and `@supabase/ssr` cookie sessions.
There are no passwords or social providers. `/auth/confirm` verifies a `token_hash` server-side,
and follow mutations verify the authenticated user again inside the route. Return paths must be
internal paths beginning with one `/`; external and protocol-relative targets fall back to
`/events`.

The feature needs only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It never uses
a service-role key. `EVENT_FOLLOWING_ENABLED=true` enables development or Preview after the
database and Auth configuration are ready.

Production additionally requires `EVENT_FOLLOWING_PRODUCTION_READY=true` and a Supabase project
other than `india-observed-dev`. This second server-side gate represents the reviewed launch
checklist. Production therefore fails closed if either flag, public credential, or dedicated
project is absent.

## Database and privacy model

`followable_events` stores only a published slug, publication date and creation time. The initial
registry contains the 50 owner-approved public event slugs. A reviewed migration must register each
future published event.

`event_follows` stores only the event slug, Supabase Auth account identifier and creation time. Raw
table access is revoked from `anon` and `authenticated`, both tables have RLS enabled and there are
no public policies. Three fixed-search-path `SECURITY DEFINER` functions expose the minimum needed
surface:

- `get_event_follow_summary(text)` — `anon`, `authenticated`; aggregate count and caller boolean.
- `follow_event(text)` — `authenticated`; idempotently inserts only `auth.uid()`.
- `unfollow_event(text)` — `authenticated`; idempotently removes only `auth.uid()`.

The composite primary key prevents double counting. Account deletion cascades to private follows.
No email, name, phone number, IP address, user agent, fingerprint, affiliation, notification
preference, event content or interaction history is stored in `event_follows`.

## Supabase Auth dashboard settings

These settings must be reviewed in **Authentication → URL Configuration** for the project used by
the environment:

- Site URL: `https://india-observed.vercel.app`
- Local redirect: `http://localhost:3000/**`
- Production redirect: `https://india-observed.vercel.app/auth/confirm`
- Git Preview alias: `https://india-observed-git-*-india-observed.vercel.app/auth/confirm**`
- Immutable Preview deployment: `https://india-observed-*-india-observed.vercel.app/auth/confirm**`

The verified Vercel account/team slug is `india-observed`, project name `india-observed`, and
Production branch `main`.

The **Magic Link** email template must send the token hash to the application route. Because the
application always supplies a `returnTo` query parameter in `RedirectTo`, the link target is:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in to India Observed</a>
```

Do not use a template that places a session token in browser-visible application code.

## Request safety

`GET /api/events/[slug]/follow` returns only `count` and `following`. `POST` and `DELETE` reject
missing or cross-origin `Origin` values, unexpected request bodies, malformed slugs, unknown events
and hidden candidates. Every response containing personal follow state is `Cache-Control: no-store`.
The browser never supplies a user ID.

## Launch blockers

Production following remains disabled until all of the following are complete:

1. A dedicated Production Supabase project is explicitly approved and provisioned.
2. The migration and restricted grants are verified in that Production project.
3. Production and Preview redirect allow-lists and the token-hash email template are configured.
4. Magic-link delivery, confirmation, cookie persistence, follow, unfollow and sign-out are tested.
5. An approved public account-deletion contact and handling process is published.
6. `EVENT_FOLLOWING_ENABLED=true` and `EVENT_FOLLOWING_PRODUCTION_READY=true` are set only after the
   preceding checks pass.

No chargeable Production project is created by this change.

## Validation status for this change

- Local configuration includes the localhost redirect and token-hash magic-link template.
- Two complete local database reset cycles passed all 60 pgTAP checks per cycle.
- A local synthetic reader completed magic-link confirmation, follow, repeat follow, sign out,
  sign in again, unfollow and repeat unfollow. The count remained authoritative and idempotent.
- Cross-origin and missing-origin mutations returned 400; signed-out mutations returned 401;
  unknown slugs returned 404.
- `india-observed-dev` has migration `20260721000100`, 50 registry rows, zero follow rows, RLS on
  both tables, no policies and no raw `anon` or `authenticated` table grants.
- The Vercel Preview environment has `EVENT_FOLLOWING_ENABLED=true`. Production does not.
- Hosted redirect allow-lists and the hosted email template remain unconfigured because the
  Supabase dashboard session was unavailable. Hosted magic-link testing therefore remains blocked.

## Rollback

Disable `EVENT_FOLLOWING_ENABLED` first. If schema rollback is required, revoke function execution,
drop the three functions, then drop `event_follows` before `followable_events`. Preserve a logical
backup before any hosted migration. Disabling the feature leaves all public event pages usable.
