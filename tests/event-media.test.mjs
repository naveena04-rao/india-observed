import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const registry = read("src/data/event-media-registry.ts");
const types = read("src/lib/events/types.ts");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const illustration = read("src/app/events/components/EventEditorialIllustration.tsx");
const externalMedia = read("src/app/events/components/ExternalMediaImage.tsx");
const classification = read("src/app/events/components/MediaClassificationLabel.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const archiveRow = read("src/app/events/components/EventArchiveRow.tsx");
const detailPage = read("src/app/events/[slug]/page.tsx");
const homepage = read("src/app/page.tsx");
const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const policy = read("docs/MEDIA_POLICY.md");

const publishedSlugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const configuredVideoSlugs = [
  ...registry.matchAll(/^  "([^"]+)": \{\r?\n    kind: "publisher_video"/gm),
].map((match) => match[1]);

function repositoryFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", ".next", "node_modules"].includes(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? repositoryFiles(path) : [path];
  });
}

test("the media registry exhaustively resolves all 50 published events", () => {
  assert.equal(publishedSlugs.length, 50);
  assert.equal(new Set(publishedSlugs).size, 50);
  assert.equal(configuredVideoSlugs.length, 5);
  assert.match(registry, /const entries = events\.map\(\(event\) => \{/);
  assert.match(registry, /Media registry contains unknown event slug/);
  assert.match(dataset, /createEventMediaRegistry\(reviewedEventsWithoutMedia\)/);
  assert.match(
    dataset,
    /eventMediaRegistry satisfies Record<PublishedEventSlug, EventMediaRegistryEntry>/,
  );
  assert.match(dataset, /\.\.\.eventMediaRegistry\[event\.slug\]/);
});

test("published visuals comprise five verified publisher videos and 45 illustrations", () => {
  assert.equal((registry.match(/kind: "publisher_video"/g) ?? []).length, 5);
  assert.match(
    registry,
    /visual: publisherVideo[\s\S]*?\? \{ \.\.\.publisherVideo, fallbackIllustration \}[\s\S]*?: fallbackIllustration/,
  );
  assert.equal(50 - configuredVideoSlugs.length, 45);
  assert.doesNotMatch(dataset, /record_cover|recordCover/);
  assert.doesNotMatch(types, /kind: "record_cover"/);
  assert.match(types, /kind: "editorial_illustration"/);
});

test("rights and attribution metadata are controlled and validated", () => {
  for (const field of ["evidenceClass", "rightsBasis", "credit", "rightsReviewedAt"]) {
    assert.match(types, new RegExp(`${field}:`));
  }
  assert.match(types, /publisher: string;/);
  assert.doesNotMatch(types, /publisher: "NDTV"/);
  assert.match(registry, /assertCompleteRightsMetadata/);
  assert.match(registry, /Incomplete media rights metadata/);
  assert.match(registry, /External media source is not HTTPS/);
  assert.match(registry, /rightsBasis: "owned_original"/);
  assert.match(registry, /credit: "Illustration: India Observed"/);
});

test("all three visible media classifications use unambiguous wording", () => {
  assert.match(classification, /Verified event media/);
  assert.match(classification, /Context image — does not depict this event/);
  assert.match(classification, /Editorial illustration — not event evidence/);
  assert.match(classification, /aria-label=\{compact \? fullLabel : undefined\}/);
  assert.match(detailMedia, /MediaClassificationLabel evidenceClass=/);
  assert.match(detailMedia, /Editorial illustration — not event evidence/);
  assert.match(detailMedia, /Context image — does not depict this event/);
});

test("procedural illustrations are deterministic and avoid documentary depictions", () => {
  assert.match(illustration, /function stableSeed\(value: string\)/);
  assert.match(illustration, /Math\.imul/);
  assert.doesNotMatch(illustration, /Math\.random|Date\.now/);
  assert.match(illustration, /MovementMotif/);
  assert.match(illustration, /TopicPattern/);
  assert.match(illustration, /visual\.slug/);
  assert.match(registry, /It does not depict the event/);
});

test("external thumbnail failure performs one attempt and falls back truthfully", () => {
  assert.match(externalMedia, /useState\(false\)/);
  assert.equal((externalMedia.match(/onError=/g) ?? []).length, 1);
  assert.match(externalMedia, /if \(failed\)/);
  assert.match(externalMedia, /EventEditorialIllustration visual=\{visual\.fallbackIllustration\}/);
  assert.match(externalMedia, /Publisher thumbnail unavailable/);
  assert.match(externalMedia, /Open the original source to view the media/);
  assert.match(externalMedia, /Fallback illustration — not event evidence/);
  assert.doesNotMatch(externalMedia, /setTimeout|setInterval|retry/i);
});

test("homepage, archive and detail routes share the registry visual", () => {
  assert.match(homepage, /reviewedEventsPreview\.map\(\(\{ internalId, slug, visual \}\)/);
  assert.equal((homepage.match(/getHomepageVisual\(record\.id\)/g) ?? []).length, 3);
  assert.match(carousel, /<EventVisual[\s\S]*?variant="homepage-featured"/);
  assert.match(carousel, /<EventVisual[\s\S]*?variant="homepage-latest"/);
  assert.match(homepage, /variant="homepage-on-record"/);
  assert.match(archiveRow, /<EventVisual visual=\{event\.visual\} eventHref=\{href\}/);
  assert.match(detailPage, /<EventDetailMedia visual=\{event\.visual\}/);
  assert.match(eventVisual, /MediaClassificationLabel/);
});

test("publisher video and Preview-only Instagram remain click-to-load", () => {
  assert.equal((registry.match(/https:\/\/www\.ndtv\.com\/videos\/embed-player/g) ?? []).length, 5);
  assert.match(registry, /"save-sgnp-human-chain-thane"/);
  assert.match(registry, /kind: "instagram_embed"/);
  assert.match(registry, /previewOnly: true/);
  assert.match(detailMedia, /useState\(false\)/);
  assert.match(detailMedia, /isActivated \? \([\s\S]*?<iframe/);
  assert.match(detailMedia, /onClick=\{\(\) => setIsActivated\(true\)\}/);
  assert.match(carousel, /loadedMediaId === activeRecord\.id \? \([\s\S]*?<iframe/);
  assert.doesNotMatch(carousel, /autoPlay/);
});

test("no copied image asset, scraper or media proxy is introduced", () => {
  const files = repositoryFiles(fileURLToPath(new URL("../", import.meta.url)));
  const copiedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

  assert.equal(
    files.some((file) => copiedImageExtensions.has(extname(file).toLowerCase())),
    false,
  );
  assert.doesNotMatch(eventVisual, /fetch\(|proxy|scrap/i);
  assert.doesNotMatch(externalMedia, /fetch\(|proxy|scrap|base64/i);
});

test("media policy records legal, safety, replacement and takedown boundaries", () => {
  const normalisedPolicy = policy.replace(/\s+/g, " ");
  for (const statement of [
    "A source article is not automatically a media licence.",
    "A search-engine image result is never sufficient provenance.",
    "An `og:image` URL is not itself permission.",
    "No image is added solely because a card needs visual variety.",
    "Visual classifications do not affect event verification status.",
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
