import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const homepage = read("src/app/page.tsx");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const archivePreview = read("src/app/events/components/ArchiveMediaPreview.tsx");
const editorialLayout = read("src/app/components/EditorialGuidePage.tsx");
const about = read("src/app/about/page.tsx");
const methodology = read("src/app/methodology/page.tsx");
const css = read("src/app/globals.css");
const dataset = read("src/data/reviewed-events-preview.ts");

const expectedLatestRecords = [
  ["IO-CM-MP-0001", "bundelkhand-rehabilitation-compensation-protest"],
  ["IO-CM-DL-0001", "education-accountability-jantar-mantar"],
  ["IO-CM-MH-0001", "save-sgnp-human-chain-thane"],
];

test("all three Latest Records titles and visible actions use their internal event routes", () => {
  assert.match(
    carousel,
    /<h3 className="latest-entry-title">\s*<Link href=\{record\.eventHref\}>\{record\.title\}<\/Link>/,
  );
  assert.match(
    carousel,
    /<Link className="latest-entry-record-link" href=\{record\.eventHref\}>\s*View full record →/,
  );
  assert.equal((carousel.match(/View full record →/g) ?? []).length >= 2, true);

  for (const [id, slug] of expectedLatestRecords) {
    assert.match(homepage, new RegExp(`id: "${id}"`));
    assert.match(dataset, new RegExp(`internalId: "${id}"[\\s\\S]*?slug: "${slug}"`, "m"));
  }
  const latestPositions = expectedLatestRecords.map(([id]) => homepage.indexOf(`id: "${id}"`));
  assert.deepEqual(
    latestPositions,
    latestPositions.toSorted((a, b) => a - b),
  );
});

test("Latest Records images link internally while credits and publisher sources stay separate", () => {
  assert.match(
    carousel,
    /<EventVisual[\s\S]*?eventHref=\{record\.eventHref\}[\s\S]*?imageLinksToEvent[\s\S]*?variant="homepage-latest"/,
  );
  assert.match(
    eventVisual,
    /imageLinksToEvent && eventHref[\s\S]*?<Link[\s\S]*?aria-label=\{`View full record: \$\{visual\.title\}`\}[\s\S]*?>\s*\{image\}\s*<\/Link>/,
  );
  assert.match(
    eventVisual,
    /imageLinksToEvent && eventHref[\s\S]*?<ArchiveMediaPreview[\s\S]*?eventHref=\{eventHref\}[\s\S]*?showCaption=\{showClassification\}/,
  );
  assert.match(
    archivePreview,
    /<Link[\s\S]*?href=\{eventHref\}[\s\S]*?>[\s\S]*?<img[\s\S]*?<\/Link>[\s\S]*?<figcaption>[\s\S]*?<a href=\{approvedMedia\.sourceUrl\}/,
  );
  assert.doesNotMatch(archivePreview, /<iframe\b/i);
  assert.match(
    eventVisual,
    /<Link[\s\S]*?>\s*\{image\}\s*<\/Link>[\s\S]*?\{showClassification \? \(\s*<figcaption>/,
  );
});

test("Follow controls remain independent and homepage sections expose explicit event navigation", () => {
  assert.match(
    carousel,
    /<div className="latest-entry-footer">[\s\S]*?<EventFollowControl[\s\S]*?<\/div>[\s\S]*?<Link className="latest-entry-record-link"/,
  );
  assert.doesNotMatch(
    carousel,
    /<Link[^>]*>\s*<article className="latest-entry latest-entry-preview"/,
  );
  assert.match(carousel, /className="featured-record-link" href=\{activeRecord\.eventHref\}/);
  assert.match(homepage, /<h3>\s*<Link href=\{eventHref\}>\{record\.title\}<\/Link>\s*<\/h3>/);
  assert.match(homepage, /className="on-record-record-link" href=\{eventHref\}/);
});

test("record links have visible focus and linked media has an obvious stable interaction", () => {
  assert.match(css, /\.latest-entry-media-navigation\s*\{[\s\S]*?cursor: pointer;/);
  assert.match(
    css,
    /\.latest-entry-media-navigation:hover img,[\s\S]*?transform: scale\(1\.025\);/,
  );
  assert.match(
    css,
    /\.latest-entry-title a:focus-visible,[\s\S]*?\.latest-entry-media-navigation:focus-visible[\s\S]*?outline: 3px solid var\(--terracotta\);/,
  );
});

test("About uses the reference-inspired story system and approved narrative content", () => {
  assert.match(about, /<StoryPage/);
  assert.match(about, /<StoryStatement>/);
  assert.match(about, /<StorySplitSection/);
  assert.match(about, /<StoryPrinciples/);
  assert.doesNotMatch(
    about,
    /LaunchPolicyPage|Return to Events|EditorialSummaryStrip|EditorialFeatureGrid/,
  );
  for (const text of [
    "Civic events, clearly documented.",
    "Public events are often reported in fragments.",
    "Why India Observed exists",
    "Core principles",
    "What a record contains",
    "What stays private",
    "A public record is not static",
    "Explore the record",
  ]) {
    assert.match(about, new RegExp(text));
  }
  assert.match(about, /\{ href: "\/events", label: "Explore events" \}/);
  assert.match(about, /\{ href: "\/methodology", label: "How records are reviewed" \}/);
  assert.match(editorialLayout, /<ArchiveShell authReturnTo=\{path\}>/);
  assert.match(about, /<StoryRows items=\{recordRows\}/);
  assert.match(about, /tone="teal"/);
});

test("Methodology derives current verification labels and uses the four-stage story process", () => {
  assert.match(methodology, /await getReviewedEvents\(\)/);
  assert.match(methodology, /reviewedEvents\.map\(\(event\) => event\.eventVerification\)/);
  assert.match(methodology, /presentVerificationLabels\.has\(label\)/);
  assert.match(methodology, /<StoryProcess stages=\{methodologyStages\}/);
  assert.equal((methodology.match(/number: "[1-4]"/g) ?? []).length, 4);
  assert.deepEqual(
    [...methodology.matchAll(/shortTitle: "(Find|Separate|Check|Review)"/g)].map(
      (match) => match[1],
    ),
    ["Find", "Separate", "Check", "Review"],
  );
  assert.doesNotMatch(
    methodology,
    /EditorialSummaryStrip|EditorialFeatureGrid|MethodologyStep|EditorialCallout/,
  );
  for (const heading of [
    "Find the event",
    "Separate the information",
    "Check the evidence",
    "Review before publication",
    "How to read verification labels",
    "A source count is not a reliability score",
    "Not every available detail should be published",
    "Records remain open to stronger evidence",
    "See the methodology in practice",
  ]) {
    assert.match(methodology, new RegExp(heading));
  }
  assert.match(methodology, /\{ href: "\/events", label: "Explore events" \}/);
  assert.match(methodology, /\{ href: "\/editorial-policy", label: "Editorial policy" \}/);
  assert.doesNotMatch(methodology, /same_event_verified|approval status|reviewer|rights_basis/i);
});

test("editorial pages use modern scoped typography and remove the rejected boxed layout", () => {
  for (const component of [
    "StoryPage",
    "StoryHero",
    "StoryStatement",
    "StorySection",
    "StorySplitSection",
    "StoryPrinciples",
    "StoryRows",
    "StoryProcess",
    "StoryClosing",
  ]) {
    assert.match(editorialLayout, new RegExp(`export function ${component}`));
  }
  assert.doesNotMatch(
    `${editorialLayout}\n${css}`,
    /editorial-summary-strip|editorial-feature-grid|editorial-methodology-step|editorial-callout/,
  );
  assert.match(
    css,
    /\.editorial-page\s*\{[\s\S]*?font-family: Arial, "Helvetica Neue", system-ui, sans-serif;/,
  );
  assert.match(css, /\.editorial-page \.editorial-page-inner\s*\{[\s\S]*?max-width: 72rem;/);
  assert.match(css, /\.editorial-page \.editorial-reading-column\s*\{[\s\S]*?max-width: 44rem;/);
  assert.match(
    css,
    /\.editorial-page h1\s*\{[\s\S]*?font-size: clamp\(2\.75rem, 4\.2vw, 3\.75rem\);/,
  );
  assert.match(css, /\.editorial-page p,[\s\S]*?font-size: 1\.0625rem;[\s\S]*?line-height: 1\.65;/);
  assert.match(
    css,
    /\.editorial-page \.story-principles-list\s*\{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*?\.editorial-page h1\s*\{[\s\S]*?font-size: clamp\(2\.35rem, 10vw, 3rem\);/,
  );
  assert.match(css, /\.editorial-page \.story-source-motif\s*\{/);
  assert.match(css, /\.editorial-page \.story-statement > p\s*\{/);
  assert.doesNotMatch(css, /\.editorial-page[\s\S]*?background: #151616;/);

  for (const path of [
    "src/app/editorial-policy/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/media-policy/page.tsx",
    "src/app/copyright/page.tsx",
  ]) {
    assert.match(read(path), /LaunchPolicyPage/);
  }
});
