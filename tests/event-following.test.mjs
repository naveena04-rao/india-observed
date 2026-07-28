import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const migration = read("supabase/migrations/20260721000100_add_event_following.sql");
const databaseTest = read("supabase/tests/database/0003_event_following.test.sql");
const detailPage = read("src/app/events/[slug]/page.tsx");
const control = read("src/app/events/components/EventFollowControl.tsx");
const route = read("src/app/api/events/[slug]/follow/route.ts");
const signIn = read("src/app/auth/sign-in/page.tsx");
const confirm = read("src/app/auth/confirm/route.ts");
const signOut = read("src/app/auth/sign-out/route.ts");
const privacy = read("src/app/privacy/page.tsx");
const featureGate = read("src/lib/events/following.ts");
const returnPath = read("src/lib/auth/returnPath.ts");
const sameOrigin = read("src/lib/http/sameOrigin.ts");
const proxy = read("src/proxy.ts");
const proxyClient = read("src/lib/supabase/proxy.ts");
const envExample = read(".env.example");
const supabaseConfig = read("supabase/config.toml");
const magicLinkTemplate = read("supabase/templates/magic_link.html");
const css = read("src/app/globals.css");
const archivePage = read("src/app/events/page.tsx");
const filters = read("src/app/events/components/EventFilters.tsx");
const homepage = read("src/app/page.tsx");
const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const headerAuth = read("src/app/components/HeaderAuthControl.tsx");
const archiveShell = read("src/app/events/components/ArchiveShell.tsx");
const documentation = read("docs/EVENT_FOLLOWING.md");

test("migration registry exactly matches all 50 published application slugs", () => {
  const applicationSlugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
  const migrationSlugs = [...migration.matchAll(/\('([^']+)', date '2026-07-21'\)/g)].map(
    (match) => match[1],
  );

  assert.equal(applicationSlugs.length, 50);
  assert.equal(new Set(applicationSlugs).size, 50);
  assert.deepEqual(migrationSlugs.toSorted(), applicationSlugs.toSorted());
  assert.match(dataset, /publicationStatus: "published"/);
  assert.doesNotMatch(migration, /candidate-record/);
});

test("private tables expose no follower identity or direct table access", () => {
  assert.match(migration, /create table public\.event_follows/);
  assert.match(migration, /primary key \(event_slug, user_id\)/);
  assert.match(migration, /references auth\.users\(id\)[\s\S]*?on delete cascade/);
  assert.match(migration, /alter table public\.followable_events enable row level security/);
  assert.match(migration, /alter table public\.event_follows enable row level security/);
  assert.match(
    migration,
    /revoke all on table public\.event_follows from public, anon, authenticated/,
  );
  assert.doesNotMatch(
    migration.match(/create table public\.event_follows[\s\S]*?\);/)?.[0] ?? "",
    /email|name|phone|ip_address|user_agent|fingerprint|affiliation|notification|event_title/i,
  );
  assert.match(databaseTest, /no table policies expose rows/);
});

test("RPC surface is aggregate-only, idempotent and role-restricted", () => {
  assert.match(migration, /create function public\.get_event_follow_summary/);
  assert.match(migration, /returns table \(follower_count bigint, following boolean\)/g);
  assert.match(migration, /insert into public\.event_follows[\s\S]*?on conflict do nothing/);
  assert.match(
    migration,
    /delete from public\.event_follows ef[\s\S]*?ef\.user_id = current_user_id/,
  );
  assert.match(migration, /set search_path = pg_catalog, public, auth/g);
  assert.match(
    migration,
    /grant execute on function public\.get_event_follow_summary\(text\) to anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.follow_event\(text\) to authenticated/,
  );
  assert.doesNotMatch(migration, /grant execute on function public\.follow_event\(text\) to anon/);
  assert.doesNotMatch(migration, /dynamic sql|execute format/i);
});

test("follow API validates published events and verifies every mutation", () => {
  assert.match(route, /eventSlugSchema\.safeParse/);
  assert.match(route, /findPublishedEvent/);
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /hasUnexpectedBody\(request\)/);
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /status: 404|, 404/);
  assert.match(route, /, 401/);
  assert.match(route, /, 503/);
  assert.match(route, /"Cache-Control": "no-store"/);
  assert.doesNotMatch(route, /user_id|email|access_token|refresh_token/i);
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function DELETE/);
});

test("same-origin helper rejects missing origins and derives the forwarded host", () => {
  assert.match(sameOrigin, /request\.headers\.get\("origin"\)/);
  assert.match(sameOrigin, /if \(!suppliedOrigin \|\| !expectedOrigin\) return false/);
  assert.match(sameOrigin, /x-forwarded-host/);
  assert.match(sameOrigin, /x-forwarded-proto/);
  assert.match(sameOrigin, /new URL\(suppliedOrigin\)\.origin === expectedOrigin/);
});

test("event pages show one compact accessible Follow control without visible clutter", () => {
  const eventHeader = detailPage.match(
    /<header className="event-record-header">([\s\S]*?)<\/header>/,
  )?.[1];
  assert.ok(eventHeader, "event detail page must have an event-record-header");
  assert.match(detailPage, /event\.publicationStatus === "published"/);
  assert.match(eventHeader, /<p className="event-record-topic">\{event\.topic\}<\/p>/);
  assert.match(eventHeader, /<EventFollowControl/);
  assert.match(eventHeader, /className="event-page-follow-control"/);
  assert.match(eventHeader, /enabled=\{followingEnabled\}/);
  assert.match(eventHeader, /slug=\{event\.slug\}/);
  assert.ok(
    eventHeader.indexOf("event-record-topic") < eventHeader.indexOf("EventFollowControl"),
    "Follow control must render below the event topic",
  );
  assert.equal((detailPage.match(/<EventFollowControl/g) ?? []).length, 1);
  assert.ok(
    detailPage.indexOf("EventFollowControl") < detailPage.indexOf('className="event-record-facts"'),
    "Follow control must not remain after the facts table",
  );
  assert.match(control, /count === 1 \? "follower" : "followers"/);
  assert.match(control, /<FollowIcon following=\{following\}/);
  assert.match(control, /following \? "Following" : "Follow"/);
  assert.match(control, /aria-label="Sign in to follow this event"/);
  assert.match(control, /aria-pressed/);
  assert.match(control, /aria-busy/);
  assert.match(control, /aria-live="polite"/);
  assert.match(control, /disabled=\{!summary \|\| pending\}/);
  assert.match(control, /Loading follower count/);
  assert.match(control, /if \(!enabled\) return null/);
  assert.doesNotMatch(control, /<aside|<h2|event-follow-control|event-follow-heading/);
  assert.doesNotMatch(control, /Follow this record|Follow this event|Sign out/);
  assert.doesNotMatch(
    control,
    /Following records reader interest|Follower identities are not displayed publicly|Preview follow data may be reset|href="\/privacy"/,
  );
  assert.doesNotMatch(control, /follower name|follower list|email address|user id/i);
});

test("required explanatory copy remains on sign-in, Privacy and documentation only", () => {
  assert.match(
    signIn,
    /Sign in to follow event records\. Your identity will not be displayed publicly\./,
  );
  assert.match(signIn, /Following does not indicate endorsement\./);
  assert.match(privacy, /Following does not indicate endorsement of an event or its claims\./);
  assert.match(documentation, /Preview follow[\s\S]*?may be reset before public launch/);
  assert.doesNotMatch(
    control + signIn,
    /We will notify you|Receive updates|Join this movement|Support this protest|Stand with them/i,
  );
});

test("passwordless token-hash flow preserves only safe internal return paths", () => {
  assert.match(signIn, /signInWithOtp/);
  assert.match(signIn, /shouldCreateUser: true/);
  assert.doesNotMatch(signIn, /password|google|github/i);
  assert.match(confirm, /verifyOtp\(\{ token_hash: tokenHash, type: "email" \}\)/);
  assert.match(returnPath, /!value\.startsWith\("\/"\)/);
  assert.match(returnPath, /value\.startsWith\("\/\/"\)/);
  assert.match(returnPath, /return fallbackReturnPath/);
  assert.match(signOut, /auth\.signOut\(\{ scope: "local" \}\)/);
  assert.doesNotMatch(signOut, /unfollow_event|event_follows/);
});

test("Production gate rejects the known development project and fails closed", () => {
  assert.match(featureGate, /EVENT_FOLLOWING_ENABLED === "true"/);
  assert.match(featureGate, /EVENT_FOLLOWING_PRODUCTION_READY === "true"/);
  assert.match(featureGate, /projectRef !== developmentProjectRef/);
  assert.match(featureGate, /czdsfqykhpwiijhxwbps/);
  assert.match(featureGate, /!isProduction \|\| productionReady/);
  assert.match(envExample, /^EVENT_FOLLOWING_ENABLED=$/m);
  assert.match(envExample, /^EVENT_FOLLOWING_PRODUCTION_READY=$/m);
});

test("local Auth uses the token-hash confirmation route and reviewed redirects", () => {
  assert.match(supabaseConfig, /site_url = "http:\/\/localhost:3000"/);
  assert.match(supabaseConfig, /additional_redirect_urls = \["http:\/\/localhost:3000\/\*\*"\]/);
  assert.match(supabaseConfig, /\[auth\.email\.template\.magic_link\]/);
  assert.match(magicLinkTemplate, /\{\{ \.RedirectTo \}\}/);
  assert.match(magicLinkTemplate, /token_hash=\{\{ \.TokenHash \}\}/);
  assert.match(magicLinkTemplate, /type=email/);
});

test("proxy refreshes cookies but routes remain the authorization boundary", () => {
  assert.match(proxy, /export async function proxy/);
  assert.match(proxy, /_next\/static\|_next\/image/);
  assert.match(proxyClient, /supabase\.auth\.getClaims\(\)/);
  assert.match(proxyClient, /response\.cookies\.set/);
  assert.match(route, /supabase\.auth\.getUser\(\)/);
});

test("privacy page reflects implemented collection and public display", () => {
  for (const text of [
    "Email address held in Supabase Auth.",
    "Supabase account identifier.",
    "The published event slug.",
    "Only the aggregate follower count",
    "not displayed publicly",
    "Following does not indicate endorsement",
    "not sold to advertisers",
    "Unfollowing removes",
    "database cascade",
    "no email or push\\s+notifications",
  ]) {
    assert.match(privacy, new RegExp(text, "i"));
  }
  assert.match(privacy, /has not yet approved a public account-deletion contact channel/);
  assert.match(signIn, /href="\/privacy"/);
  assert.match(homepage, /<Link href="\/privacy">Privacy<\/Link>/);
  assert.match(archiveShell, /<Link href="\/privacy">Privacy<\/Link>/);
});

test("following does not alter archive or homepage editorial behavior", () => {
  assert.doesNotMatch(archivePage + filters, /follower|most-followed|trending/i);
  assert.doesNotMatch(homepage + carousel, /most-followed|follower-count sort|trending/i);
  assert.match(archivePage, /EVENTS_PER_PAGE/);
  assert.match(archivePage, /filteredEvents\.slice\(startIndex, startIndex \+ EVENTS_PER_PAGE\)/);
  assert.match(filters, /Search reviewed records/);
  assert.doesNotMatch(archivePage, /EventFollowControl|event-follow/);
});

test("all nine homepage definitions resolve to published slugs and render compact controls", () => {
  const homepageIds = [...homepage.matchAll(/\bid: "(IO-CM-[A-Z0-9-]+)"/g)].map(
    (match) => match[1],
  );
  const reviewedSlugs = new Map(
    [...dataset.matchAll(/internalId: "([^"]+)",\s+slug: "([^"]+)"/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );

  assert.equal(homepageIds.length, 9);
  assert.equal(new Set(homepageIds).size, 9);
  for (const id of homepageIds)
    assert.ok(reviewedSlugs.has(id), `missing published slug for ${id}`);
  assert.match(homepage, /\{ approvedMedia, eventHref: `\/events\/\$\{slug\}`, slug, visual \}/);
  assert.match(homepage, /getHomepageVisual\([\s\S]*?record\.id[\s\S]*?slug=\{slug\}/);
  assert.equal((carousel.match(/<EventFollowControl/g) ?? []).length, 2);
  assert.equal((homepage.match(/<EventFollowControl/g) ?? []).length, 1);
  assert.match(carousel, /key=\{activeRecord\.slug\}[\s\S]*?slug=\{activeRecord\.slug\}/);
  assert.match(carousel, /latestRecords\.map[\s\S]*?slug=\{record\.slug\}/);
  assert.match(homepage, /onRecords\.map[\s\S]*?className="on-record-footer"/);
});

test("shared header authentication uses safe return paths and secure sign-out", () => {
  assert.match(headerAuth, /export function HeaderAuthControl/);
  assert.match(headerAuth, /safeReturnPath\(returnTo\)/);
  assert.match(headerAuth, /encodeURIComponent/);
  assert.match(headerAuth, /href=\{`\/auth\/sign-in\?returnTo=\$\{encodedReturnTo\}`\}/);
  assert.match(headerAuth, /action=\{`\/auth\/sign-out\?returnTo=\$\{encodedReturnTo\}`\}/);
  assert.match(headerAuth, /method="post"/);
  assert.match(headerAuth, />\s*Login\s*<\/Link>/);
  assert.match(headerAuth, />\s*Logout\s*<\/button>/);
  assert.doesNotMatch(headerAuth, /email|username|user ID|avatar|account identity/i);
});

test("homepage and archive navigation share gated Login or Logout controls", () => {
  assert.match(homepage, /import \{ HeaderAuthControl \} from "\.\/components\/HeaderAuthControl"/);
  assert.doesNotMatch(homepage, /function HeaderAuthControl/);
  assert.equal((homepage.match(/<HeaderAuthControl/g) ?? []).length, 2);
  assert.equal((homepage.match(/returnTo="\/"/g) ?? []).length, 2);
  assert.match(
    homepage,
    /href="\/methodology">Methodology<\/Link>[\s\S]*?<HeaderAuthControl[\s\S]*?className="nav-action"/,
  );
  assert.equal((homepage.match(/following\.enabled \? \(/g) ?? []).length, 2);

  assert.match(archiveShell, /export async function ArchiveShell/);
  assert.match(archiveShell, /authReturnTo: string/);
  assert.match(archiveShell, /getEventFollowingAvailability\(\)/);
  assert.match(archiveShell, /following\.enabled \? await createSessionSupabaseClient\(\) : null/);
  assert.match(archiveShell, /supabase\.auth\.getUser\(\)/);
  assert.match(archiveShell, /const signedIn = Boolean\(user\)/);
  assert.equal((archiveShell.match(/<HeaderAuthControl/g) ?? []).length, 2);
  assert.equal((archiveShell.match(/following\.enabled \? \(/g) ?? []).length, 2);
  assert.equal((archiveShell.match(/returnTo=\{authReturnTo\}/g) ?? []).length, 2);
  assert.match(
    archiveShell,
    /href="\/methodology">Methodology<\/Link>[\s\S]*?<HeaderAuthControl[\s\S]*?className="nav-action"/,
  );
  assert.doesNotMatch(
    homepage + archiveShell,
    /user\.email|user\.name|username|avatar|account ID/i,
  );
});

test("archive and detail authentication preserve normalised internal return paths", () => {
  assert.match(archivePage, /const normalisedAuthFilters = \{/);
  assert.match(archivePage, /const authReturnParams = new URLSearchParams\(\)/);
  assert.match(archivePage, /authReturnParams\.set\("page", String\(currentPage\)\)/);
  assert.match(archivePage, /<ArchiveShell authReturnTo=\{authReturnTo\}>/);
  assert.match(detailPage, /<ArchiveShell authReturnTo=\{`\/events\/\$\{event\.slug\}`\}>/);
  assert.match(control, /const returnTo = `\/events\/\$\{slug\}`/);
});

test("compact controls preserve icon, selected state, touch target and visible focus", () => {
  assert.match(css, /\.event-follow-compact\s*\{[\s\S]*?display: inline-flex/);
  assert.match(css, /\.event-follow-button\s*\{[\s\S]*?min-height: 44px/);
  assert.match(css, /\.event-follow-icon\s*\{[\s\S]*?height: 1\.05rem/);
  assert.match(css, /\.event-follow-button\[aria-pressed="true"\][\s\S]*?color: #ffffff/);
  assert.match(css, /\.event-follow-button:focus-visible[\s\S]*?outline: 3px solid var\(--teal\)/);
  assert.match(css, /\.homepage-follow-control\s*\{[\s\S]*?margin-top: 0\.25rem/);
  assert.match(css, /\.event-page-follow-control\s*\{[\s\S]*?margin-top: 0\.85rem/);
  assert.doesNotMatch(css, /\.event-record-header\s*\{\s*grid-row: [23];\s*\}/);
  assert.doesNotMatch(css, /\.event-record-visual\s*\{\s*grid-row: [23];\s*\}/);
  assert.doesNotMatch(css, /\.event-record-layout > \.preview-notice\s*\{\s*grid-row: 1;\s*\}/);
  assert.doesNotMatch(css, /\.event-follow-control|\.event-follow-heading-row/);
});
