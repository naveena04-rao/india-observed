import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const registry = read("src/data/event-media-registry.ts");
const types = read("src/lib/events/types.ts");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const externalMedia = read("src/app/events/components/ExternalMediaImage.tsx");
const classification = read("src/app/events/components/MediaClassificationLabel.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const archivePage = read("src/app/events/page.tsx");
const archiveRow = read("src/app/events/components/EventArchiveRow.tsx");
const detailPage = read("src/app/events/[slug]/page.tsx");
const homepage = read("src/app/page.tsx");
const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const policy = read("docs/MEDIA_POLICY.md");
const audit = read("docs/EVENT_MEDIA_AUDIT.md");

const publishedSlugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const configuredVideoSlugs = [
  ...registry.matchAll(/^  "([^"]+)": \{\r?\n    kind: "publisher_video"/gm),
].map((match) => match[1]);
const selections = registry.slice(
  registry.indexOf("const licensedMediaSelections = {"),
  registry.indexOf("} as const satisfies Record<string, LicensedSelection>;"),
);
const licensedSlugs = [...selections.matchAll(/^  "([^"]+)": \{/gm)].map((match) => match[1]);
const auditRows = audit.split(/\r?\n/).filter((line) => line.startsWith("| `"));
const auditSlugs = auditRows.map((line) => line.match(/^\|\s+`([^`]+)`/)?.[1]);

function repositorySourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".next", "node_modules", "public"].includes(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? repositorySourceFiles(path) : [path];
  });
}

test("the registry exhaustively gives one approved visual to all 50 events", () => {
  assert.equal(publishedSlugs.length, 50);
  assert.equal(new Set(publishedSlugs).size, 50);
  assert.equal(configuredVideoSlugs.length, 5);
  assert.equal(licensedSlugs.length, 45);
  assert.equal(new Set([...configuredVideoSlugs, ...licensedSlugs]).size, 50);
  assert.deepEqual(
    [...new Set([...configuredVideoSlugs, ...licensedSlugs])].sort(),
    [...publishedSlugs].sort(),
  );
  assert.match(registry, /Published event has no approved primary visual/);
  assert.match(registry, /Published event has multiple primary visuals/);
  assert.match(dataset, /createEventMediaRegistry\(reviewedEventsWithoutMedia\)/);
  assert.match(
    dataset,
    /eventMediaRegistry satisfies Record<PublishedEventSlug, EventMediaRegistryEntry>/,
  );
});

test("the visual mix is five event videos, 43 context photographs and two documentary maps", () => {
  assert.equal((registry.match(/kind: "publisher_video"/g) ?? []).length, 5);
  assert.equal((selections.match(/evidenceClass: "context_media"/g) ?? []).length, 43);
  assert.equal((selections.match(/evidenceClass: "documentary_context"/g) ?? []).length, 2);
  assert.doesNotMatch(types, /editorial_illustration|record_cover/);
  assert.doesNotMatch(registry, /editorial_illustration|record_cover/);
  assert.doesNotMatch(eventVisual, /EventEditorialIllustration|<svg|illustration/i);
  assert.equal(
    existsSync(
      new URL("../src/app/events/components/EventEditorialIllustration.tsx", import.meta.url),
    ),
    false,
  );
});

test("all 45 licensed local derivatives exist in their event folders", () => {
  for (const slug of licensedSlugs) {
    const visualPath = new URL(`../public/media/events/${slug}/context.webp`, import.meta.url);
    assert.equal(existsSync(visualPath), true, `${slug} must have a context.webp visual`);
    assert.ok(statSync(visualPath).size > 0, `${slug} visual must not be empty`);
  }

  const localVisuals = readdirSync(new URL("../public/media/events", import.meta.url), {
    recursive: true,
  }).filter((path) => path.endsWith("context.webp"));
  assert.equal(localVisuals.length, 45);
});

test("rights, attribution, relevance, privacy and safety metadata are controlled", () => {
  for (const field of [
    "evidenceClass",
    "rightsBasis",
    "credit",
    "rightsReviewedAt",
    "creator",
    "sourceUrl",
    "originalMediaUrl",
    "licenseName",
    "licenseUrl",
    "attributionText",
    "modificationDisclosure",
    "relevance",
    "privacyReview",
    "safetyReview",
  ]) {
    assert.match(types, new RegExp(`${field}[?:]`));
  }
  assert.match(registry, /assertCompleteRightsMetadata/);
  assert.match(registry, /Open-licensed media lacks audit metadata/);
  assert.match(registry, /External media source is not HTTPS/);
  assert.match(registry, /item\.localPath !== item\.imageUrl/);
  assert.match(registry, /Wikimedia Commons/);
});

test("the public interface uses the three exact evidence labels", () => {
  for (const label of [
    "Verified event media",
    "Context photograph — does not depict this event",
    "Documentary context — does not depict this event",
  ]) {
    assert.match(classification, new RegExp(label));
  }
  assert.match(classification, /aria-label=\{compact \? fullLabel : undefined\}/);
  assert.match(detailMedia, /mediaClassificationText\(visual\.evidenceClass\)/);
  assert.match(detailMedia, /visual\.attributionText/);
  assert.match(detailMedia, /visual\.modificationDisclosure/);
  assert.match(detailMedia, /visual\.relevance/);
});

test("failed images use one load attempt and a truthful text-record fallback", () => {
  assert.match(externalMedia, /useState\(false\)/);
  assert.equal((externalMedia.match(/onError=/g) ?? []).length, 1);
  assert.match(externalMedia, /className="event-record-fallback"/);
  assert.match(externalMedia, /visual\.fallbackRecord\.title/);
  assert.match(externalMedia, /visual\.fallbackRecord\.location/);
  assert.match(externalMedia, /Publisher thumbnail unavailable/);
  assert.match(externalMedia, /Open original source/);
  assert.doesNotMatch(externalMedia, /svg|illustration|setTimeout|setInterval|retry/i);
});

test("homepage, archive and detail routes share each registry visual", () => {
  assert.match(homepage, /reviewedEventsPreview\.map\(\(\{ internalId, slug, visual \}\)/);
  assert.equal((homepage.match(/getHomepageVisual\(record\.id\)/g) ?? []).length, 3);
  assert.match(carousel, /<EventVisual[\s\S]*?variant="homepage-featured"/);
  assert.match(carousel, /<EventVisual[\s\S]*?variant="homepage-latest"/);
  assert.match(homepage, /variant="homepage-on-record"/);
  assert.match(archiveRow, /<EventVisual visual=\{event\.visual\} eventHref=\{href\}/);
  assert.match(detailPage, /<EventDetailMedia visual=\{event\.visual\}/);
});

test("NDTV and Preview-only Instagram remain source-hosted and click-to-load", () => {
  assert.equal((registry.match(/https:\/\/www\.ndtv\.com\/videos\/embed-player/g) ?? []).length, 5);
  assert.match(registry, /"save-sgnp-human-chain-thane"/);
  assert.match(registry, /kind: "instagram_embed"/);
  assert.match(registry, /previewOnly: true/);
  assert.match(detailMedia, /useState\(false\)/);
  assert.match(detailMedia, /isActivated \? \([\s\S]*?<iframe/);
  assert.match(detailMedia, /onClick=\{\(\) => setIsActivated\(true\)\}/);
  assert.match(carousel, /loadedMediaId === activeRecord\.id \? \([\s\S]*?<iframe/);
  assert.doesNotMatch(carousel, /autoPlay/);
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
});

test("the audit has exactly one complete row for each published event", () => {
  assert.equal(auditSlugs.length, 50);
  assert.equal(new Set(auditSlugs).size, 50);
  assert.deepEqual([...auditSlugs].sort(), [...publishedSlugs].sort());
  const columns = auditRows.map((row) => row.split("|").map((cell) => cell.trim()));
  assert.equal(
    columns.filter((cells) => cells[11] === "Passed" && cells[12] === "Passed").length,
    50,
  );
  assert.equal(columns.filter((cells) => cells[13].startsWith("Local WebP")).length, 45);
  assert.equal(columns.filter((cells) => cells[13] === "Click-to-load embed").length, 5);
});

test("all nine topics retain meaningful, event-specific relevance statements", () => {
  const primaryTopics = [...dataset.matchAll(/"IO-CM-[A-Z]+-\d{4}": "([^"]+)",/g)].map(
    (match) => match[1],
  );
  assert.equal(primaryTopics.length, 50);
  assert.equal(new Set(primaryTopics).size, 9);
  assert.equal((selections.match(/\n    relevance:/g) ?? []).length, 45);
  assert.doesNotMatch(selections, /generic stock|unrelated crowd|placeholder/i);
});

test("no abstract, AI, scraped or unlicensed visual path remains in source", () => {
  const sourceFiles = repositorySourceFiles(fileURLToPath(new URL("../src", import.meta.url)));
  const sourceText = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(sourceText, /editorial_illustration|EventEditorialIllustration/);
  assert.doesNotMatch(eventVisual, /fetch\(|proxy|scrap|base64/i);
  assert.doesNotMatch(externalMedia, /fetch\(|proxy|scrap|base64/i);
  assert.doesNotMatch(registry, /unsplash|pexels|pixabay|generated image|ai-generated/i);
});

test("media policy records legal, safety, replacement and takedown boundaries", () => {
  const normalisedPolicy = policy.replace(/\s+/g, " ");
  for (const statement of [
    "A source article is not automatically a media licence.",
    "A search-engine image result is never sufficient provenance.",
    "An `og:image` URL is not itself permission.",
    "No image is added solely because a card needs visual variety.",
    "Visual classifications do not affect an event's verification status.",
    "Auto-publication remains disabled.",
  ]) {
    assert.match(normalisedPolicy, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const heading of [
    "Attribution and licence verification",
    "Verification, privacy and safety",
    "Broken media and takedowns",
    "Replacement workflow",
    "Media review template",
  ]) {
    assert.match(policy, new RegExp(heading));
  }
});
