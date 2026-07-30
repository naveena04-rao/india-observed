import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260728000100_add_event_media_library.sql");
const reviewedImport = read("supabase/migrations/20260728000200_import_reviewed_event_media.sql");
const archivePreviewMigration = read(
  "supabase/migrations/20260730000100_add_archive_embed_previews.sql",
);
const dbTest = read("supabase/tests/database/0004_event_media.test.sql");
const validation = read("src/lib/media/validation.ts");
const adminApi = read("src/app/api/admin/media/route.ts");
const adminPage = read("src/app/admin/media/page.tsx");
const adminForm = read("src/app/admin/media/AdminMediaForm.tsx");
const adminActions = read("src/app/admin/media/actions.ts");
const adminHelpers = read("src/lib/media/admin.ts");
const publicLoader = read("src/lib/media/public.ts");
const mediaConfig = read("src/lib/media/config.ts");
const siteConfig = read("src/lib/site.ts");
const layout = read("src/app/layout.tsx");
const sitemap = read("src/app/sitemap.ts");
const robots = read("src/app/robots.ts");
const nextConfig = read("next.config.ts");
const packageJson = JSON.parse(read("package.json"));
const launchExceptions = JSON.parse(read("data/media-launch-exceptions.json"));
const visibilityGate = read("src/lib/events/getReviewedEvents.ts");
const contactSheet = read("docs/MEDIA_READY_CONTACT_SHEET.md");
const unresolvedSheet = read("docs/MEDIA_UNRESOLVED_EVENTS.md");

test("migration registers exactly 50 published events and 165 approved sources", () => {
  const eventSeed = migration.match(
    /insert into public\.media_event_registry[\s\S]*?insert into public\.media_event_sources/,
  )?.[0];
  const sourceSeed = migration.match(
    /insert into public\.media_event_sources[\s\S]*?create table public\.media_admins/,
  )?.[0];
  assert.ok(eventSeed);
  assert.ok(sourceSeed);
  assert.equal((eventSeed.match(/\('[a-z0-9-]+'\)/g) ?? []).length, 50);
  assert.equal((sourceSeed.match(/\('[a-z0-9-]+', 'https:\/\//g) ?? []).length, 165);
});

test("reviewed import approves only three exact-event official embeds", () => {
  for (const [slug, publisher] of [
    ["jamia-yuva-kumbh-campus-protest", "NDTV"],
    ["dasiya-villagers-ethanol-plant", "Live Times"],
    ["indore-dewas-ring-road-compensation", "NDTV MPCG"],
  ]) {
    assert.match(reviewedImport + contactSheet, new RegExp(slug));
    assert.match(contactSheet, new RegExp(publisher));
  }
  assert.match(reviewedImport, /1130365&mute=1&autostart=0/);
  assert.match(reviewedImport, /status = 'rejected'[\s\S]*?000000000003/);
  assert.match(reviewedImport, /status = 'rejected'[\s\S]*?000000000002/);
  assert.doesNotMatch(reviewedImport, /direct image|\.m3u8|\.mp4/i);
  assert.equal([...unresolvedSheet.matchAll(/\| `[^`]+`\s+\|/g)].length, 47);
});

test("Production visibility and sitemap are gated by approved media", () => {
  assert.match(
    visibilityGate,
    /includeCandidates[\s\S]*?publicationVisibleEvents\.filter\(\(event\) => approvedMedia\.has\(event\.slug\)\)/,
  );
  assert.match(sitemap, /const events = await getReviewedEvents\(\)/);
  assert.doesNotMatch(sitemap, /reviewedEventsPreview/);
});

test("media administrator authorization is a UUID allow-list with fixed search path", () => {
  assert.match(migration, /create table public\.media_admins/);
  assert.match(migration, /user_id uuid primary key references auth\.users/);
  assert.match(migration, /create function public\.is_media_admin\(\)/);
  assert.match(migration, /security definer[\s\S]*?set search_path = pg_catalog, public/);
  assert.match(migration, /where ma\.user_id = auth\.uid\(\)/);
  assert.doesNotMatch(migration, /email_domain|@india-observed|like '%@/i);
});

test("rights enum excludes credit-only, source-only and assumed permission", () => {
  for (const allowed of [
    "owned_original",
    "explicit_permission",
    "official_embed",
    "official_reuse_terms",
    "cc0",
    "public_domain",
    "cc_by",
    "cc_by_sa",
  ]) {
    assert.match(migration, new RegExp(`'${allowed}'`));
  }
  for (const forbidden of [
    "source_link_only",
    "credit_only",
    "fair_use",
    "fair_dealing",
    "unknown",
    "assumed_permission",
  ]) {
    assert.doesNotMatch(migration, new RegExp(`'${forbidden}'`));
  }
});

test("uploaded media requires a redistributable rights basis", () => {
  assert.match(migration, /event_media_uploaded_rights_redistributable/);
  assert.doesNotMatch(
    migration.match(/event_media_uploaded_rights_redistributable[\s\S]*?\n  \),/)?.[0] ?? "",
    /official_embed/,
  );
  assert.match(validation, /Uploaded files require a redistributable rights basis/);
});

test("approval requires all review gates and a human reviewer", () => {
  assert.match(
    migration,
    /same_event_verified[\s\S]*?privacy_reviewed[\s\S]*?safety_reviewed[\s\S]*?integrity_reviewed[\s\S]*?approved_source_verified[\s\S]*?reviewed_by is not null[\s\S]*?approved_at is not null/,
  );
  assert.match(migration, /All media review gates must pass/);
  assert.match(dbTest, /approval fails unless every review gate passes/);
});

test("one approved primary item per event is enforced and replacement is explicit", () => {
  assert.match(
    migration,
    /create unique index event_media_one_approved_primary_per_event_idx[\s\S]*?where status = 'approved'/,
  );
  assert.match(migration, /replaces_media_id/);
  assert.match(migration, /replacement_reason/);
  assert.match(migration, /Replacement reason and target required/);
  assert.match(adminForm, /Replace approved media/);
});

test("private permission evidence and review notes never enter the public RPC", () => {
  assert.match(migration, /create table public\.event_media_private_review/);
  const publicFunction = migration.match(
    /create function public\.get_public_event_media[\s\S]*?\$\$;/,
  )?.[0];
  assert.ok(publicFunction);
  assert.doesNotMatch(
    publicFunction,
    /permission_evidence|review_notes|same_event_reasoning|privacy_notes|safety_notes/,
  );
  assert.doesNotMatch(publicLoader, /permission_evidence|review_notes/);
});

test("anonymous and ordinary authenticated writes are denied by RLS", () => {
  assert.match(migration, /alter table public\.event_media enable row level security/);
  assert.match(
    migration,
    /revoke all on table public\.event_media from public, anon, authenticated/,
  );
  assert.match(migration, /with check \(\s*public\.is_media_admin\(\)/);
  assert.match(migration, /grant select, insert on table public\.event_media to authenticated/);
  assert.doesNotMatch(
    migration,
    /grant select, insert, update on table public\.event_media\s+to authenticated/,
  );
  assert.match(migration, /create function public\.update_event_media_review/);
  assert.match(adminActions, /supabase\.rpc\("update_event_media_review"/);
  assert.match(dbTest, /anonymous users cannot insert media/);
  assert.match(dbTest, /ordinary authenticated users cannot approve media/);
  assert.match(dbTest, /cannot bypass protected media review and approval functions/);
});

test("staging is private and public storage accepts only reviewed WebP derivatives", () => {
  assert.match(migration, /'event-media-staging',[\s\S]*?false,[\s\S]*?10485760/);
  assert.match(migration, /'event-media-public',[\s\S]*?true,[\s\S]*?10485760/);
  assert.match(migration, /array\['image\/webp'\]/);
  assert.match(migration, /name = em\.event_slug \|\| '\/' \|\| em\.id \|\| '\/upload\.webp'/);
  assert.match(migration, /name = em\.event_slug \|\| '\/' \|\| em\.id \|\| '\/primary\.webp'/);
  assert.match(
    archivePreviewMigration,
    /name = em\.event_slug \|\| '\/' \|\| em\.id \|\| '\/preview\.webp'/,
  );
});

test("archive embed previews require separate provenance and review approval", () => {
  assert.match(archivePreviewMigration, /event_media_approved_embed_preview_complete/);
  assert.match(archivePreviewMigration, /preview_original_media_url/);
  assert.match(archivePreviewMigration, /preview_original_sha256/);
  assert.match(archivePreviewMigration, /preview_derivative_sha256/);
  assert.match(
    archivePreviewMigration,
    /preview_same_event_verified[\s\S]*?preview_privacy_reviewed[\s\S]*?preview_safety_reviewed[\s\S]*?preview_integrity_reviewed[\s\S]*?preview_approved_source_verified/,
  );
  assert.match(
    archivePreviewMigration,
    /case[\s\S]*?then em\.preview_storage_path[\s\S]*?else null/,
  );
  assert.doesNotMatch(
    archivePreviewMigration.match(
      /create function public\.get_public_event_media[\s\S]*?\$\$;/,
    )?.[0] ?? "",
    /preview_original_media_url|preview_original_sha256|preview_review_notes/,
  );
});

test("browser processing decodes, resizes, re-encodes and hashes the original", () => {
  assert.match(adminForm, /createImageBitmap\(file\)/);
  assert.match(adminForm, /Math\.min\(1, 1600 \/ longestSide\)/);
  assert.match(adminForm, /canvas\.toBlob/);
  assert.match(adminForm, /"image\/webp"/);
  assert.match(adminForm, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(adminForm, /Processed WebP preview/);
});

test("server independently verifies size, WebP signature and metadata removal", () => {
  assert.match(adminHelpers, /bytes\.byteLength > 10 \* 1024 \* 1024/);
  assert.match(adminHelpers, /ascii\(0, 4\) === "RIFF"/);
  assert.match(adminHelpers, /ascii\(8, 12\) === "WEBP"/);
  assert.match(adminHelpers, /Exif\|GPSLatitude\|GPSLongitude\|GPSInfo\|xmpmeta/);
  assert.match(adminActions, /verifyStagedWebp\(supabase, media\.storage_path\)/);
});

test("duplicate hashes and media URLs are constrained", () => {
  assert.match(migration, /event_media_unique_media_url_idx/);
  assert.match(migration, /event_media_private_review_sha256_idx/);
  assert.match(dbTest, /duplicate uploaded-file hashes are rejected/);
  assert.match(adminApi, /This media URL or file is already registered/);
});

test("only reviewed embed hosts are accepted and raw iframe HTML is absent", () => {
  for (const host of ["www.ndtv.com", "www.instagram.com", "www.facebook.com"]) {
    assert.match(validation, new RegExp(host.replaceAll(".", "\\.")));
  }
  assert.match(validation, /The embed host is not approved/);
  assert.doesNotMatch(adminForm + adminApi, /dangerouslySetInnerHTML|iframeHtml|rawHtml/);
});

test("public loader returns only approved published media and never staging paths", () => {
  assert.match(publicLoader, /rpc\("get_public_event_media"/);
  assert.match(publicLoader, /event\.publicationStatus !== "published"/);
  assert.match(publicLoader, /event-media-public/);
  assert.doesNotMatch(publicLoader, /event-media-staging/);
  assert.match(migration, /where em\.status = 'approved'/);
  assert.match(publicLoader, /approved-event-media-v3/);
  assert.match(
    publicLoader,
    /if \(!availability\.enabled\) return \[\];[\s\S]*?loadPublicMediaRowsFromEnabledLibrary\(availability\.projectRef\)/,
  );
  assert.match(publicLoader, /previewImageUrl/);
});

test("archive and Phase 2 verification commands are registered", () => {
  assert.equal(
    packageJson.scripts["media:verify-archive"],
    "node scripts/media-verify-archive.mjs",
  );
  assert.equal(packageJson.scripts["media:verify-phase2"], "node scripts/media-verify-phase2.mjs");
});

test("withdrawal removes public display and invalidates affected pages", () => {
  assert.match(migration, /create function public\.withdraw_event_media/);
  assert.match(migration, /status = 'withdrawn'/);
  assert.match(adminActions, /revalidateTag\("event-media", "max"\)/);
  assert.match(adminActions, /revalidatePath\(`\/events\/\$\{eventSlug\}`\)/);
  assert.match(adminActions, /event-media-public"\)\.remove/);
});

test("admin route is protected, unlisted and exposes all 50 controlled events", () => {
  assert.match(adminPage, /redirect\("\/auth\/sign-in\?returnTo=%2Fadmin%2Fmedia"\)/);
  assert.match(adminPage, /if \(!session\.admin \|\| !session\.supabase\) notFound\(\)/);
  assert.match(adminPage, /reviewedEventsPreview\.map/);
  assert.match(adminPage, /Published events[\s\S]*?<dd>50<\/dd>/);
  assert.match(adminPage, /Approved public sources/);
  assert.match(adminPage, /Review and replacement history/);
});

test("canonical URL, sitemap and robots use NEXT_PUBLIC_SITE_URL", () => {
  assert.match(siteConfig, /NEXT_PUBLIC_SITE_URL/);
  assert.match(layout, /metadataBase: getPublicSiteUrl\(\)/);
  assert.match(sitemap, /getPublicSiteUrl/);
  assert.match(sitemap, /getReviewedEvents/);
  assert.match(sitemap, /events\.map/);
  assert.match(robots, /new URL\("\/sitemap\.xml", site\)/);
  assert.doesNotMatch(siteConfig + layout + sitemap + robots, /india-observed\.vercel\.app/);
});

test("Production refuses the development Supabase project and following remains separate", () => {
  assert.match(mediaConfig, /developmentSupabaseProjectRef = "czdsfqykhpwiijhxwbps"/);
  assert.match(mediaConfig, /projectRef !== developmentSupabaseProjectRef/);
  assert.match(mediaConfig, /Production media library is required/);
  assert.doesNotMatch(mediaConfig, /EVENT_FOLLOWING_ENABLED/);
});

test("security policy restricts frames, images, objects, forms and embedding", () => {
  for (const directive of [
    "default-src",
    "script-src",
    "style-src",
    "img-src",
    "frame-src",
    "connect-src",
    "font-src",
    "object-src",
    "base-uri",
    "form-action",
    "frame-ancestors",
  ]) {
    assert.match(nextConfig, new RegExp(directive));
  }
  assert.doesNotMatch(nextConfig, /frame-src[^"\n]*https:\s/);
  assert.doesNotMatch(nextConfig, /img-src[^"`\n]*https:\s/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(nextConfig, /Referrer-Policy/);
  assert.match(nextConfig, /Permissions-Policy/);
  assert.doesNotMatch(nextConfig, /Strict-Transport-Security/);
});

test("media coverage and launch verification are explicit package commands", () => {
  assert.equal(packageJson.scripts["media:coverage"], "node scripts/media-coverage.mjs");
  assert.equal(
    packageJson.scripts["media:verify-homepage"],
    "node scripts/media-verify-homepage.mjs",
  );
  assert.equal(packageJson.scripts["media:verify-launch"], "node scripts/media-verify-launch.mjs");
  assert.deepEqual(launchExceptions, []);
  const verifier = read("scripts/media-verify-launch.mjs");
  assert.match(verifier, /NEXT_PUBLIC_SITE_URL/);
  assert.match(verifier, /PUBLIC_CONTACT_EMAIL/);
  assert.match(verifier, /productionVisible\.length === 0/);
  assert.match(verifier, /no fallback is public/);
  assert.match(verifier, /Launch blocked/);
});
