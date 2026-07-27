import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const evidenceDataset = read("src/data/reviewed-event-evidence-preview.ts");
const registry = read("src/data/event-media-registry.ts");
const types = read("src/lib/events/types.ts");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const classification = read("src/app/events/components/MediaClassificationLabel.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const detailPage = read("src/app/events/[slug]/page.tsx");
const archivePage = read("src/app/events/page.tsx");
const archiveRow = read("src/app/events/components/EventArchiveRow.tsx");
const homepage = read("src/app/page.tsx");
const styles = read("src/app/globals.css");
const policy = read("docs/MEDIA_POLICY.md");
const audit = read("docs/EVENT_MEDIA_AUDIT.md");

const publishedSlugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const auditRows = audit.split(/\r?\n/).filter((line) => line.startsWith("| `"));
const auditSlugs = auditRows.map((line) => line.match(/^\|\s+`([^`]+)`/)?.[1]);

const evidenceSource = evidenceDataset.slice(
  evidenceDataset.indexOf("export const reviewedEventEvidenceByInternalId = ") +
    "export const reviewedEventEvidenceByInternalId = ".length,
  evidenceDataset.indexOf(" as const satisfies"),
);
const evidence = Function(`"use strict"; return (${evidenceSource});`)();

const recordSource = dataset.slice(
  dataset.indexOf("const reviewedEventRecords = ") + "const reviewedEventRecords = ".length,
  dataset.indexOf("] as const satisfies") + 1,
);
const records = Function(`"use strict"; return (${recordSource});`)();
const recordBySlug = new Map(records.map((record) => [record.slug, record]));

function filesRecursively(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesRecursively(path) : [path];
  });
}

function approvedUrls(slug) {
  const record = recordBySlug.get(slug);
  assert.ok(record, `${slug} must be a reviewed record`);
  return evidence[record.internalId].sources.map((source) => source.url);
}

test("all 50 records receive only verified source media or an honest text fallback", () => {
  assert.equal(publishedSlugs.length, 50);
  assert.equal(new Set(publishedSlugs).size, 50);
  assert.equal((registry.match(/kind: "publisher_video"/g) ?? []).length, 1);
  assert.equal((registry.match(/kind: "social_embed"/g) ?? []).length, 3);
  assert.match(registry, /createNoApprovedMediaVisual\(event\)/);
  assert.match(registry, /Media registry does not cover every reviewed event/);
  assert.match(dataset, /createEventMediaRegistry\(reviewedEventsWithoutMedia\)/);
  assert.match(eventVisual, /No approved event image available|MediaClassificationLabel/);
  assert.match(eventVisual, /visual\.title/);
  assert.match(eventVisual, /visual\.location/);
  assert.match(eventVisual, /visual\.dateOrStatus/);
  assert.match(eventVisual, /visual\.sourceCount/);
  assert.match(eventVisual, />View event sources</);
});

test("the media model exposes only the two owner-approved classifications", () => {
  assert.match(types, /MediaEvidenceClass = "verified_event_media" \| "no_approved_event_media"/);
  for (const forbidden of ["context_media", "documentary_context", "editorial_illustration"]) {
    assert.doesNotMatch(types, new RegExp(forbidden));
    assert.doesNotMatch(registry, new RegExp(forbidden));
    assert.doesNotMatch(eventVisual, new RegExp(forbidden));
  }
  assert.match(classification, /Verified event media/);
  assert.match(classification, /No approved event image available/);
});

test("every retained media item belongs to the matching event source set", () => {
  const approved = [
    [
      "jamia-yuva-kumbh-campus-protest",
      "https://www.ndtv.com/education/jamia-students-protest-rss-yuva-kumbh-event-on-campus-heavy-police-deployed-11419540",
    ],
    ["save-sgnp-human-chain-thane", "https://www.instagram.com/reel/DacYWWktqjL/"],
    ["morbi-transmission-compensation-satyagraha", "https://www.instagram.com/p/DadCC4NFo-C/"],
    [
      "dasiya-villagers-ethanol-plant",
      "https://www.facebook.com/LiveTimesNewsChannel/videos/uttarpradesh-%E0%A4%AC%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%80-%E0%A4%AE%E0%A5%87%E0%A4%82-%E0%A4%8F%E0%A4%A5%E0%A5%87%E0%A4%A8%E0%A5%89%E0%A4%B2-%E0%A4%AB%E0%A5%88%E0%A4%95%E0%A5%8D%E0%A4%9F%E0%A5%8D%E0%A4%B0%E0%A5%80-%E0%A4%95%E0%A5%87-%E0%A4%96%E0%A4%BF%E0%A4%B2%E0%A4%BE%E0%A4%AB-%E0%A4%9C%E0%A4%A8-%E0%A4%86%E0%A4%82%E0%A4%A6%E0%A5%8B%E0%A4%B2%E0%A4%A8-%E0%A4%B9%E0%A4%9C%E0%A4%BE%E0%A4%B0%E0%A5%8B%E0%A4%82-%E0%A4%97%E0%A5%8D%E0%A4%B0%E0%A4%BE%E0%A4%AE%E0%A5%80%E0%A4%A3%E0%A5%8B%E0%A4%82-%E0%A4%A8%E0%A5%87-%E0%A4%95%E0%A4%BF/2065530604339052/",
    ],
  ];

  for (const [slug, approvedSourceUrl] of approved) {
    assert.ok(approvedUrls(slug).includes(approvedSourceUrl));
    const slugStart = registry.indexOf(`"${slug}": {`);
    assert.ok(slugStart >= 0, `${slug} must be configured`);
    const nextSlug = registry.indexOf('\n  "', slugStart + 1);
    const block = registry.slice(
      slugStart,
      nextSlug === -1 ? registry.indexOf("\n} as const", slugStart) : nextSlug,
    );
    assert.match(block, /sameEventVerified: true/);
  }

  assert.match(
    registry,
    /event\.sources\.some\(\(source\) => source\.url === item\.approvedSourceUrl\)/,
  );
  assert.match(registry, /Media does not belong to an approved source/);
  assert.match(registry, /Media lacks same-event verification/);
});

test("all contextual assets and obsolete image infrastructure are gone", () => {
  const publicMediaRoot = fileURLToPath(new URL("../public/media/events", import.meta.url));
  assert.deepEqual(filesRecursively(publicMediaRoot), []);
  assert.equal(
    existsSync(new URL("../src/app/events/components/ExternalMediaImage.tsx", import.meta.url)),
    false,
  );
  for (const forbidden of [
    "Wikimedia Commons",
    "open_licensed_image",
    "publisher_image",
    "document_preview",
    "thumbnailUrl",
    "focalPosition",
  ]) {
    assert.doesNotMatch(registry, new RegExp(forbidden));
  }
});

test("retained publisher and social media stay click-to-load without automatic frames", () => {
  assert.match(detailMedia, /useState<"idle" \| "loaded" \| "failed">\("idle"\)/);
  assert.match(detailMedia, /embedState === "loaded" \? \([\s\S]*?<iframe/);
  assert.match(detailMedia, /onClick=\{\(\) => setEmbedState\("loaded"\)\}/);
  assert.match(detailMedia, /No third-party frame loads before activation/);
  assert.match(detailMedia, /onError=\{\(\) => setEmbedState\("failed"\)\}/);
  assert.match(detailMedia, /Event media unavailable/);
  assert.match(detailMedia, /Open original source/);
  assert.match(registry, /previewOnly: true/);
  assert.match(
    detailPage,
    /candidatePreviewEnabled \|\| !event\.detailMedia\?\.previewOnly \? event\.detailMedia : undefined/,
  );
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
  assert.doesNotMatch(eventVisual, /iframe/i);
  assert.doesNotMatch(carousel, /autoPlay/);
});

test("media is substantial on detail, archive and homepage layouts", () => {
  assert.match(styles, /\.event-record-layout \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /\.event-record-visual \{[\s\S]*?max-width: 60rem/);
  assert.match(
    styles,
    /\.event-detail-embed,[\s\S]*?\.event-media-activation,[\s\S]*?\.event-media-unavailable \{[\s\S]*?aspect-ratio: 16 \/ 9/,
  );
  assert.match(
    styles,
    /\.event-archive-row \{[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(20rem, 42fr\)/,
  );
  assert.match(
    styles,
    /\.event-visual--homepage-latest \{[\s\S]*?height: auto;[\s\S]*?width: min\(100%, 21\.333rem\)/,
  );
  assert.doesNotMatch(styles, /\.event-visual--homepage-latest \{[\s\S]*?height: 6\.75rem/);
  assert.match(
    styles,
    /\.on-record-context \{[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(0, 42fr\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 700px\)[\s\S]*?\.event-row-visual \{[\s\S]*?grid-row: 1/,
  );
  assert.match(
    styles,
    /@media \(max-width: 700px\)[\s\S]*?\.event-visual--homepage-on-record \{[\s\S]*?grid-row: 1/,
  );
});

test("the source-only audit has one complete row for every published event", () => {
  assert.equal(auditRows.length, 50);
  assert.equal(new Set(auditSlugs).size, 50);
  assert.deepEqual([...auditSlugs].sort(), [...publishedSlugs].sort());
  assert.match(audit, /all 165\s+approved source records/i);
  assert.match(audit, /one official publisher-video embed, three official social embeds and 46/);
  assert.equal((audit.match(/No approved event image available/g) ?? []).length, 46);
  assert.doesNotMatch(audit, /Wikimedia Commons|Local WebP|Approved context/);
  for (const heading of [
    "All approved sources checked",
    "Visibly depicts the same event",
    "Permission or licence",
    "Identifiable people assessment",
    "Rejection reason",
  ]) {
    assert.match(audit, new RegExp(heading));
  }
});

test("policy preserves strict source, rights, privacy and fallback boundaries", () => {
  const normalisedPolicy = policy.replace(/\s+/g, " ");
  for (const statement of [
    "A source article is not automatically a media licence.",
    "A search-engine image result is never sufficient provenance.",
    "An `og:image` URL is not itself permission.",
    "Auto-publication remains disabled",
    "No approved event image available",
    "Event media unavailable",
  ]) {
    assert.match(normalisedPolicy, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(policy, /one NDTV publisher-video embed and three approved-source social embeds/);
  assert.match(policy, /No iframe,[\s\S]*?before activation/);
  assert.match(policy, /rights approval cannot override a failed verification/i);
});

test("event records, sources, safety, following and authentication remain wired", () => {
  assert.match(homepage, /EventFollowControl/);
  assert.match(detailPage, /EventFollowControl/);
  assert.match(detailPage, /createSessionSupabaseClient/);
  assert.match(detailPage, /<EventSafety event=\{event\} \/>/);
  assert.match(detailPage, /<EventSources sources=\{event\.sources\} \/>/);
  assert.equal(Object.values(evidence).flatMap((event) => event.sources).length, 165);
  assert.equal(Object.values(evidence).flatMap((event) => event.safetyIncidents).length, 12);
});
