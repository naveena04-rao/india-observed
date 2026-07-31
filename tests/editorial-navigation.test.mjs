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

test("About uses the reader-facing editorial layout and approved concise content", () => {
  assert.match(about, /<EditorialGuidePage/);
  assert.doesNotMatch(about, /LaunchPolicyPage|Return to Events/);
  for (const text of [
    "A public record of civic action",
    "Why this exists",
    "What each record shows",
    "What we do not publish",
    "A record can change",
    "See the record for yourself",
  ]) {
    assert.match(about, new RegExp(text));
  }
  assert.match(about, /\{ href: "\/events", label: "Explore events" \}/);
  assert.match(about, /\{ href: "\/methodology", label: "Read the methodology" \}/);
  assert.match(editorialLayout, /<ArchiveShell authReturnTo=\{path\}>/);
});

test("Methodology derives current verification labels and preserves four semantic stages", () => {
  assert.match(methodology, /await getReviewedEvents\(\)/);
  assert.match(methodology, /reviewedEvents\.map\(\(event\) => event\.eventVerification\)/);
  assert.match(methodology, /presentVerificationLabels\.has\(title\)/);
  assert.equal((methodology.match(/<MethodologyStep /g) ?? []).length, 4);
  for (const heading of [
    "Find the event",
    "Separate the information",
    "Check the evidence",
    "Review before publication",
    "What verification labels mean",
    "How sources are used",
    "Privacy, safety and media",
    "Updates and corrections",
  ]) {
    assert.match(methodology, new RegExp(heading));
  }
  assert.match(methodology, /\{ href: "\/events", label: "Explore reviewed events" \}/);
  assert.match(methodology, /\{ href: "\/editorial-policy", label: "Read the editorial policy" \}/);
  assert.doesNotMatch(methodology, /same_event_verified|approval status|reviewer|rights_basis/i);
});

test("editorial pages have scoped readable widths without changing legal page presentation", () => {
  assert.match(css, /\.editorial-guide-page\s*\{[\s\S]*?max-width: 68\.75rem;/);
  assert.match(css, /\.editorial-guide-body\s*\{[\s\S]*?max-width: 45rem;/);
  assert.match(css, /\.editorial-guide-page h1\s*\{[\s\S]*?max-width: 13ch;/);
  assert.match(
    css,
    /\.editorial-guide-page p,[\s\S]*?font-size: clamp\(1rem, 1\.4vw, 1\.125rem\);[\s\S]*?line-height: 1\.72;/,
  );
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*?grid-template-columns: 1fr;/);

  for (const path of [
    "src/app/editorial-policy/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/media-policy/page.tsx",
    "src/app/copyright/page.tsx",
  ]) {
    assert.match(read(path), /LaunchPolicyPage/);
  }
});
