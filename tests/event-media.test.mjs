import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const evidenceDataset = read("src/data/reviewed-event-evidence-preview.ts");
const fallbackRegistry = read("src/data/event-media-registry.ts");
const publicLoader = read("src/lib/media/public.ts");
const mediaTypes = read("src/lib/events/types.ts");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
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

function filesRecursively(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesRecursively(path) : [path];
  });
}

test("all 50 static records use a truthful fallback until database approval", () => {
  assert.equal(publishedSlugs.length, 50);
  assert.equal(new Set(publishedSlugs).size, 50);
  assert.match(fallbackRegistry, /createNoApprovedMediaVisual\(event\)/);
  assert.doesNotMatch(fallbackRegistry, /publisher_video|social_embed|https?:\/\//);
  assert.match(dataset, /createEventMediaRegistry\(reviewedEventsWithoutMedia\)/);
  assert.match(eventVisual, /No approved event image available/);
  assert.match(eventVisual, /visual\.title/);
  assert.match(eventVisual, /visual\.location/);
  assert.match(eventVisual, /visual\.dateOrStatus/);
  assert.match(eventVisual, /visual\.sourceCount/);
  assert.match(eventVisual, />View event sources</);
});

test("the public model supports only approved images, publisher videos and official posts", () => {
  for (const mediaType of [
    "uploaded_event_image",
    "publisher_video_embed",
    "official_social_embed",
  ]) {
    assert.match(mediaTypes, new RegExp(`"${mediaType}"`));
  }
  for (const forbidden of [
    "context_media",
    "documentary_context",
    "editorial_illustration",
    "stock_image",
    "representative_image",
  ]) {
    assert.doesNotMatch(mediaTypes + fallbackRegistry + eventVisual, new RegExp(forbidden));
  }
});

test("approved public media is loaded server-side and rechecked against published sources", () => {
  assert.match(publicLoader, /import "server-only"/);
  assert.match(publicLoader, /rpc\("get_public_event_media"/);
  assert.match(publicLoader, /event\.publicationStatus !== "published"/);
  assert.match(
    publicLoader,
    /event\.sources\.some\(\(source\) => source\.url === row\.source_url\)/,
  );
  assert.match(publicLoader, /event-media-public/);
  assert.doesNotMatch(publicLoader, /event-media-staging/);
  assert.match(publicLoader, /approved\.has\(row\.event_slug\)/);
});

test("contextual assets and obsolete external image infrastructure remain absent", () => {
  const publicMediaRoot = fileURLToPath(new URL("../public/media/events", import.meta.url));
  assert.deepEqual(filesRecursively(publicMediaRoot), []);
  assert.equal(
    existsSync(new URL("../src/app/events/components/ExternalMediaImage.tsx", import.meta.url)),
    false,
  );
  assert.doesNotMatch(fallbackRegistry, /Wikimedia Commons|thumbnailUrl|publisher_image/);
});

test("official embeds remain click-to-load and never enter archive rendering", () => {
  assert.match(detailMedia, /useState<"idle" \| "loaded" \| "failed">\("idle"\)/);
  assert.match(detailMedia, /embedState === "loaded" \? \([\s\S]*?<iframe/);
  assert.match(detailMedia, /onClick=\{\(\) => setEmbedState\("loaded"\)\}/);
  assert.match(detailMedia, /No third-party frame loads[\s\S]*?before activation/);
  assert.match(detailMedia, /Event media unavailable/);
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
  assert.doesNotMatch(eventVisual, /iframe/i);
});

test("uploaded media has visible credit, source, licence and focal-position handling", () => {
  assert.match(eventVisual, /approvedMedia\.creditLine/);
  assert.match(eventVisual, /href=\{approvedMedia\.sourceUrl\}/);
  assert.match(eventVisual, /objectPosition: approvedMedia\.focalPosition/);
  assert.match(detailMedia, /approvedMedia\.licenceName/);
  assert.match(detailMedia, /approvedMedia\.licenceUrl/);
  assert.match(detailMedia, /Reviewed \{new Date\(approvedMedia\.approvedAt\)/);
  assert.match(detailPage, /approvedMedia=\{event\.approvedMedia\}/);
});

test("approved-media dimensions are substantial while fallbacks may remain compact", () => {
  assert.match(styles, /\.event-record-visual,[\s\S]*?max-width: 70rem/);
  assert.match(styles, /\.event-approved-image \{[\s\S]*?aspect-ratio: 16 \/ 9/);
  assert.match(
    styles,
    /\.event-archive-row \{[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(20rem, 42fr\)/,
  );
  assert.match(
    styles,
    /\.event-archive-row--fallback \{[\s\S]*?minmax\(0, 72fr\) minmax\(15rem, 28fr\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 700px\)[\s\S]*?\.event-record-visual \{[\s\S]*?width: calc\(100% \+ 2rem\)/,
  );
});

test("the source-only audit still covers every published record and source", () => {
  assert.equal(auditRows.length, 50);
  assert.equal(new Set(auditSlugs).size, 50);
  assert.deepEqual([...auditSlugs].sort(), [...publishedSlugs].sort());
  assert.match(audit, /all 165\s+approved source records/i);
  assert.equal(
    Object.values(
      Function(
        `"use strict"; return (${evidenceDataset.slice(
          evidenceDataset.indexOf("export const reviewedEventEvidenceByInternalId = ") +
            "export const reviewedEventEvidenceByInternalId = ".length,
          evidenceDataset.indexOf(" as const satisfies"),
        )});`,
      )(),
    ).flatMap((event) => event.sources).length,
    165,
  );
});

test("media policy keeps source, credit, rights, privacy and safety as separate gates", () => {
  const normalised = policy.replace(/\s+/g, " ");
  for (const statement of [
    "A source article is not automatically a media licence.",
    "A search-engine image result is never sufficient provenance.",
    "An `og:image` URL is not itself permission.",
    "Auto-publication remains disabled",
    "No approved event image available",
  ]) {
    assert.match(normalised, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(policy, /rights approval cannot override a failed verification/i);
});

test("event facts, sources, safety, following and authentication remain wired", () => {
  assert.match(homepage, /EventFollowControl/);
  assert.match(detailPage, /EventFollowControl/);
  assert.match(detailPage, /createSessionSupabaseClient/);
  assert.match(detailPage, /<EventSafety event=\{event\} \/>/);
  assert.match(detailPage, /<EventSources sources=\{event\.sources\} \/>/);
});
