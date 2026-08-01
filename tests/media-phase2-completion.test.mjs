import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("data/event-media-phase2.json"));
const dataset = read("src/data/reviewed-events-preview.ts");
const population = read("scripts/media-populate-phase2.mjs");
const metadataMigration = read(
  "supabase/migrations/20260730000200_complete_event_media_metadata.sql",
);
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const archivePreview = read("src/app/events/components/ArchiveMediaPreview.tsx");
const presentation = read("src/lib/media/presentation.ts");
const mediaTypes = read("src/lib/events/types.ts");
const publicMediaLoader = read("src/lib/media/public.ts");
const completionRecord = read("docs/MEDIA_PHASE2_COMPLETION.md");

const publishedSlugs = new Set(
  [...dataset.matchAll(/internalId:\s*"IO-CM-[A-Z]{2,3}-\d{4}"\s*,\s*slug:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  ),
);
const preservedSlugs = new Set([
  "jamia-yuva-kumbh-campus-protest",
  "dasiya-villagers-ethanol-plant",
  "indore-dewas-ring-road-compensation",
  "bidadi-farmers-land-acquisition",
  "manipur-government-employees-strike",
  "dharmasala-teacher-vacancy-protest",
  "bundelkhand-rehabilitation-compensation-protest",
  "education-accountability-jantar-mantar",
  "save-sgnp-human-chain-thane",
  "morbi-transmission-compensation-satyagraha",
  "kokrajhar-apdcl-land-allotment-protest",
]);

test("Phase 2 completes one controlled treatment for all 50 published events", () => {
  const phase2Slugs = manifest.treatments.map((item) => item.eventSlug);
  const combined = new Set([...preservedSlugs, ...phase2Slugs]);
  assert.equal(publishedSlugs.size, 50);
  assert.equal(preservedSlugs.size, 11);
  assert.equal(manifest.treatments.length, 39);
  assert.equal(new Set(phase2Slugs).size, 39);
  assert.equal(combined.size, 50);
  assert.deepEqual([...combined].toSorted(), [...publishedSlugs].toSorted());
  assert.equal(manifest.expectedApprovedTreatments, 50);
});

test("every new treatment records exact-event, source, credit, rights and processing evidence", () => {
  for (const item of manifest.treatments) {
    assert.equal(item.rightsBasis, "editorial_fair_dealing_current_events");
    assert.equal(item.sameEventVerified, true);
    assert.equal(item.privacyReviewed, true);
    assert.equal(item.safetyReviewed, true);
    assert.equal(item.integrityReviewed, true);
    assert.equal(item.approvedSourceVerified, true);
    assert.equal(item.sourcePageVerified, true);
    assert.equal(item.ownerAcceptance, true);
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.match(item.originalMediaUrl, /^https:\/\//);
    assert.match(item.creditLine, / · View original$/);
    assert.ok(item.sameEventReasoning.length >= 80);
    assert.ok(item.privacyNotes.length >= 40);
    assert.ok(item.safetyNotes.length >= 40);
    assert.ok(item.integrityNotes.length >= 40);
    assert.match(item.originalSha256, /^[a-f0-9]{64}$/);
    assert.match(item.derivativeSha256, /^[a-f0-9]{64}$/);
    assert.equal(item.derivativeWidth > 0, true);
    assert.equal(item.derivativeHeight > 0, true);
    assert.equal(Math.max(item.derivativeWidth, item.derivativeHeight) <= 1600, true);
    assert.match(item.publicStoragePath, new RegExp(`^${item.eventSlug}/`));
    assert.match(item.publicStoragePath, /\/primary\.webp$/);
  }
  assert.doesNotMatch(JSON.stringify(manifest.treatments), /permission_pending/i);
});

test("owner approval does not erase substantive rejections or permit generic media", () => {
  assert.equal(manifest.exceptions.length, 8);
  for (const exception of manifest.exceptions) {
    assert.ok(exception.rejected.length >= 30);
    assert.ok(exception.replacement.length >= 30);
    assert.ok(publishedSlugs.has(exception.eventSlug));
  }
  const approvedReviewText = manifest.treatments
    .map((item) => `${item.treatmentClass} ${item.sameEventReasoning}`)
    .join("\n");
  assert.doesNotMatch(
    approvedReviewText,
    /\b(?:stock|AI-style|generic placeholder|representative image approved|context image approved)\b/i,
  );
});

test("Kolli Hills is the sole, visibly labelled source-document exception", () => {
  const documents = manifest.treatments.filter(
    (item) => item.publicDisplayKind === "source_document_preview",
  );
  assert.equal(documents.length, 1);
  assert.equal(documents[0].eventSlug, "kolli-hills-land-patta-protest");
  assert.equal(
    manifest.treatments.filter((item) => item.publicDisplayKind === "photograph").length,
    38,
  );
  for (const source of [eventVisual, detailMedia]) {
    assert.match(source, /Source document preview — not an event photograph/);
  }
  assert.match(mediaTypes, /"source_document_preview"/);
  assert.match(presentation, /Source document/);
});

test("the hosted population path uses private staging and the protected approval RPC", () => {
  assert.match(population, /event-media-staging/);
  assert.match(population, /event-media-public/);
  assert.match(population, /\.rpc\("approve_event_media"/);
  assert.match(population, /\.rpc\("is_media_admin"/);
  assert.match(population, /createTemporaryMediaAdmin/);
  assert.match(population, /destroyTemporaryMediaAdmin/);
  assert.match(population, /\.from\("media_admins"\)\.delete/);
  assert.match(population, /admin\.auth\.admin\.deleteUser/);
  assert.match(population, /containsSensitiveMetadata/);
  assert.match(population, /derivative SHA-256 mismatch/);
  assert.match(population, /Expected 11 preserved approvals/);
  assert.match(population, /approved !== 50 \|\| draft !== 0/);
  assert.match(population, /private-derivative-root/);
  assert.doesNotMatch(JSON.stringify(manifest), /localDerivativePath/);
});

test("the media metadata migration preserves natural public display categories", () => {
  assert.match(metadataMigration, /public_display_kind/);
  assert.match(metadataMigration, /source_document_preview/);
  assert.match(metadataMigration, /derivative_sha256/);
  assert.match(metadataMigration, /original_width/);
  assert.match(metadataMigration, /derivative_width/);
  assert.match(metadataMigration, /get_public_event_media/);
  assert.match(metadataMigration, /em\.public_display_kind/);
});

test("public routes retain credits and sources without internal verification terminology", () => {
  const publicMedia = eventVisual + detailMedia + archivePreview + presentation;
  assert.doesNotMatch(publicMedia, />\s*Verified event media\s*</i);
  assert.doesNotMatch(publicMedia, /Same-event verified|Approval status|Internal review status/);
  assert.match(eventVisual, /getPublicMediaCaption/);
  assert.match(eventVisual, /approvedMedia\.sourceUrl/);
  assert.match(detailMedia, /Rights remain with the credited creator or publisher/);
  assert.match(archivePreview, /getPublicSourceLinkLabel/);
  assert.doesNotMatch(archivePreview, /<iframe\b/i);
});

test("the population script cannot modify factual, safety, following or authentication records", () => {
  for (const table of [
    "events",
    "claims",
    "claim_sources",
    "sources",
    "event_safety_incidents",
    "event_follows",
  ]) {
    assert.doesNotMatch(population, new RegExp(`\\.from\\("${table}"\\)`));
  }
  assert.doesNotMatch(population, /reviewed-events-preview\.ts/);
});

test("the completion record documents full coverage without treating display basis as ownership", () => {
  assert.match(completionRecord, /Approved primary visual treatments: 50/);
  assert.match(completionRecord, /Missing treatments: 0/);
  assert.match(completionRecord, /Exact-event photographs or thumbnails: 49/);
  assert.match(completionRecord, /does not claim ownership, licence, permission/);
  assert.match(completionRecord, /publisher-image derivatives remain outside Git/);
});

test("the public media cache is invalidated after hosted Phase 2 population", () => {
  assert.match(publicMediaLoader, /approved-event-media-v4/);
  assert.doesNotMatch(publicMediaLoader, /approved-event-media-v3/);
});
