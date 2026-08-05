import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("publishes the media-ready approved verification leads without the rejected or media-blocked leads", () => {
  const events = read("src/data/published-verification-events-2026-08-05.ts");
  const configs = [...events.matchAll(/ref: "(YR-\d+)"/g)].map((match) => match[1]);
  assert.equal(new Set(configs).size, 30);
  assert.ok(!configs.includes("YR-17"));
  assert.ok(!configs.includes("YR-30"));
  assert.match(events, /publicationStatus: "published" as const/);
  assert.match(events, /publicLaunchStatus: "launchable" as const/);
  assert.match(events, /publishedAt: "2026-08-05"/);
});

test("requires one reviewed derivative for every newly published event", () => {
  const manifest = JSON.parse(read("data/event-media-approved-leads.json"));
  assert.equal(manifest.expectedNewPublishedEvents, 30);
  assert.equal(manifest.newTreatments, 30);
  assert.deepEqual(manifest.withheldApprovedLeadRefs, ["YR-30"]);
  assert.equal(new Set(manifest.treatments.map((item) => item.eventSlug)).size, 30);
  for (const item of manifest.treatments) {
    assert.equal(item.sameEventVerified, true);
    assert.equal(item.privacyReviewed, true);
    assert.equal(item.safetyReviewed, true);
    assert.equal(item.integrityReviewed, true);
    assert.equal(item.approvedSourceVerified, true);
    assert.equal(item.rightsBasis, "editorial_fair_dealing_current_events");
    assert.ok(item.altText.length >= 25);
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.match(item.originalMediaUrl, /^https:\/\//);
    assert.match(item.derivativeSha256, /^[a-f0-9]{64}$/);
    assert.ok(existsSync(join("data/event-media-approved-leads", item.eventSlug, "primary.webp")));
  }
});

test("loads published verification additions in every environment and candidates only in preview", () => {
  const loader = read("src/lib/events/getReviewedEvents.ts");
  assert.ok(loader.includes("...publishedVerificationEventAdditions"));
  assert.ok(loader.includes("...(includeCandidates ? verifiedScannerEventAdditions : [])"));
});
