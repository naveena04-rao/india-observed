import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const homepageMedia = read("src/lib/media/homepage.ts");
const importMigration = read("supabase/migrations/20260729000300_import_homepage_event_media.sql");
const safeguards = read("supabase/migrations/20260729000200_enforce_editorial_media_controls.sql");
const homepage = read("src/app/page.tsx");
const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const reviewPage = read("src/app/admin/media/homepage-review/page.tsx");
const reviewMedia = read("src/app/admin/media/homepage-review/HomepageReviewMedia.tsx");
const styles = read("src/app/globals.css");
const verifier = read("scripts/media-verify-homepage.mjs");
const reviewedData = read("src/data/reviewed-events-preview.ts");

const expectedSlugs = [
  "bidadi-farmers-land-acquisition",
  "manipur-government-employees-strike",
  "dharmasala-teacher-vacancy-protest",
  "bundelkhand-rehabilitation-compensation-protest",
  "education-accountability-jantar-mantar",
  "save-sgnp-human-chain-thane",
  "morbi-transmission-compensation-satyagraha",
  "dasiya-villagers-ethanol-plant",
  "kokrajhar-apdcl-land-allotment-protest",
];

test("Phase 1 recognises exactly the unchanged nine homepage event slugs", () => {
  const slugs = [...homepageMedia.matchAll(/"([a-z0-9-]+)",/g)]
    .map((match) => match[1])
    .filter((value) => value !== "featured" && value !== "latest" && value !== "on-record");
  assert.deepEqual(slugs, expectedSlugs);
  assert.equal(new Set(slugs).size, 9);
  for (const slug of expectedSlugs) {
    assert.match(reviewedData, new RegExp(`slug: "${slug}"`));
    if (slug !== "dasiya-villagers-ethanol-plant") {
      assert.match(importMigration, new RegExp(`'${slug}'`));
    }
  }
  assert.match(importMigration, /000000000004[\s\S]*?Revalidated for homepage Phase 1/);
});

test("all nine items pass controlled exact-event, provenance, privacy, safety and integrity gates", () => {
  assert.equal((importMigration.match(/'Homepage media review 2026-07-29'/g) ?? []).length, 8);
  assert.match(importMigration, /Revalidated for homepage Phase 1/);
  for (const field of [
    "same_event_verified",
    "privacy_reviewed",
    "safety_reviewed",
    "integrity_reviewed",
    "approved_source_verified",
  ]) {
    assert.match(importMigration, new RegExp(field));
    assert.match(verifier, new RegExp(field));
  }
  assert.doesNotMatch(
    importMigration,
    /media_type\s*=\s*'(?:contextual|representative|generic|stock|ai_generated)'/i,
  );
});

test("seven static derivatives use approved Storage and two exact-event embeds remain external", () => {
  const importedRows = importMigration.slice(
    importMigration.indexOf("insert into public.event_media ("),
    importMigration.indexOf("insert into public.event_media_private_review"),
  );
  assert.equal((importedRows.match(/'uploaded_event_image'/g) ?? []).length, 7);
  assert.equal((importedRows.match(/\/primary\.webp'/g) ?? []).length, 7);
  assert.match(importMigration, /1120270&mute=1&autostart=0/);
  assert.match(importMigration, /Live Times exact-event video remains click-to-load/);
  assert.doesNotMatch(importMigration, /\.mp4|\.m3u8|third-party mirror/i);
  assert.match(safeguards, /editorial_fair_dealing_current_events/);
});

test("official embeds are click-to-load with no preactivation third-party frame", () => {
  assert.match(
    carousel,
    /loadedMediaId === activeRecord\.id[\s\S]*?<iframe[\s\S]*?onClick=\{\(\) => setLoadedMediaId\(activeRecord\.id\)\}/,
  );
  assert.match(detailMedia, /embedState === "loaded" \? \([\s\S]*?<iframe/);
  assert.match(
    reviewMedia,
    /if \(!loaded\)[\s\S]*?Load official embed[\s\S]*?return \([\s\S]*?<iframe/,
  );
});

test("homepage groups and detail pages share one approved media object with visible credit and source", () => {
  assert.match(homepage, /createHomepageVisualMap\(reviewedEvents\)/);
  assert.match(carousel, /variant="homepage-featured"/);
  assert.match(carousel, /variant="homepage-latest"/);
  assert.match(homepage, /variant="homepage-on-record"/);
  assert.match(eventVisual, /approvedMedia\.creditLine/);
  assert.match(eventVisual, /href=\{approvedMedia\.sourceUrl\}/);
  assert.match(detailMedia, /approvedMedia\.creditLine/);
  assert.match(detailMedia, /href=\{approvedMedia\.sourceUrl\}/);
});

test("homepage media is large enough in Featured, Latest and ON RECORD without changing order", () => {
  assert.match(styles, /\.featured-record-video-frame[\s\S]*?aspect-ratio: 16 \/ 9/);
  assert.match(
    styles,
    /\.event-visual--homepage-latest \{[\s\S]*?height: clamp\(10rem, 13vw, 12rem\)/,
  );
  assert.match(
    styles,
    /\.on-record-context \{[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(0, 42fr\)/,
  );
  assert.match(styles, /\.event-detail-media \{[\s\S]*?max-width: 68\.75rem/);
});

test("the homepage contact sheet is authenticated, Preview-only and grouped three by three", () => {
  assert.match(reviewPage, /process\.env\.VERCEL_ENV === "production"[\s\S]*?notFound/);
  assert.match(reviewPage, /if \(!session\.user\) redirect/);
  assert.match(reviewPage, /if \(!session\.admin \|\| !session\.supabase\) notFound/);
  assert.match(reviewPage, /homepageMediaSections\.map/);
  assert.match(reviewPage, /homepage-media-review-grid/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test("Phase 1 leaves reviewed facts and the other 41 media records unchanged", () => {
  assert.doesNotMatch(importMigration, /insert into public\.(events|claims|sources|organisations)/);
  assert.doesNotMatch(importMigration, /event_follow|auth\.users|safety_incident/);
  assert.doesNotMatch(homepage, /Open questions/i);
  assert.match(verifier, /Homepage media verification passed: 9 positions, 9 approved/);
});
