import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
const homepage = read("src/app/page.tsx");
const eventsPage = read("src/app/events/page.tsx");
const eventVisual = read("src/app/events/components/EventVisual.tsx");
const archivePreview = read("src/app/events/components/ArchiveMediaPreview.tsx");
const archiveShell = read("src/app/events/components/ArchiveShell.tsx");
const editorialLayout = read("src/app/components/EditorialGuidePage.tsx");
const about = read("src/app/about/page.tsx");
const methodology = read("src/app/methodology/page.tsx");
const css = read("src/app/globals.css");
const editorialCss = css.slice(css.indexOf("/* Reader-facing About and Methodology pages */"));
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
  assert.match(about, /className="editorial-page--about"/);
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
  assert.equal((about.match(/What stays private/g) ?? []).length, 1);
  assert.equal((about.match(/A public record is not static/g) ?? []).length, 1);
  assert.match(
    about,
    /introduction="India Observed brings protests, strikes, marches and other civic movements into one clear, source-linked public record\. Public events are often reported in fragments\. India Observed brings those fragments together into a record people can inspect\."/,
  );
  assert.equal((about.match(/Public events are often reported in fragments\./g) ?? []).length, 1);
  assert.match(
    about,
    /introduction=[\s\S]*Why India Observed exists[\s\S]*What stays private[\s\S]*A public record is not static/,
  );
  assert.doesNotMatch(about, /about-fragments|Bringing fragmented reporting together/);
  assert.doesNotMatch(about, /Civic events,[\s\S]*<br\s*\/?>[\s\S]*clearly documented\./);
  assert.match(
    css,
    /\.editorial-page--about h1\s*\{[\s\S]*?max-width: none;[\s\S]*?white-space: nowrap;/,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*?\.editorial-page--about h1\s*\{[\s\S]*?white-space: normal;/,
  );
  assert.match(
    about,
    /Reporting about a public event may be spread across articles, videos, statements and\s+social posts\. India Observed organises that material so readers can understand what\s+happened, what people are asking for, how authorities responded and what remains\s+unresolved\.\s*<\/p>/,
  );
  assert.match(
    about,
    /India Observed does not publish confidential-source identities, participant directories,\s+live tactical locations or private documents\. Images and videos are reviewed for event\s+match, attribution, privacy and safety before they appear publicly\.\s*<\/p>/,
  );
  assert.match(
    about,
    /Records may change when stronger evidence, an official response, a correction or a\s+meaningful outcome becomes available\. Review dates and important corrections remain\s+visible so readers can understand what changed\.\s*<\/p>/,
  );
});

test("Methodology derives current verification labels and uses the four-stage story process", () => {
  assert.match(methodology, /className="editorial-page--methodology"/);
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
    /EditorialSummaryStrip|EditorialFeatureGrid|MethodologyStep|EditorialCallout|about-fragments/,
  );
  for (const heading of [
    "Find the event",
    "Separate the information",
    "Check the evidence",
    "Review before publication",
    "How to read verification labels",
    "A source count is not a reliability score",
    "Not every available detail is published",
    "Records remain open to stronger evidence",
    "See the methodology in practice",
  ]) {
    assert.match(methodology, new RegExp(heading));
  }
  assert.match(methodology, /\{ href: "\/events", label: "Explore events" \}/);
  assert.doesNotMatch(methodology, /\/editorial-policy|Editorial policy/);
  assert.match(methodology, /primaryLink=\{\{ href: "\/events", label: "Explore events" \}\}/);
  assert.doesNotMatch(editorialLayout, /hideEditorialPolicyLink/);
  assert.doesNotMatch(archiveShell, /hideEditorialPolicyLink/);
  assert.doesNotMatch(methodology, /same_event_verified|approval status|reviewer|rights_basis/i);
  for (const paragraph of [
    "We begin with public reporting, official information or a credible public lead. There must be enough reliable information to establish that the event occurred.",
    "A report may mix confirmed details, participant claims, official responses and opinion. We separate them so readers can see what is established, what is attributed and what remains disputed.",
    "We compare sources and look for official notices, statements, photographs, videos and supporting documents. Important or disputed claims require stronger evidence than the basic occurrence of an event.",
    "The record is checked for accuracy, source quality, privacy, safety, media attribution and avoidable harm. Automated tools may assist with organisation and checks, but publication remains a human editorial decision.",
  ]) {
    assert.match(methodology, new RegExp(`description: \\[\\s*"${paragraph}"`));
  }
  assert.match(
    css,
    /\.editorial-page--methodology \.methodology-sequence,[\s\S]*?background: transparent;[\s\S]*?margin-inline: 0;[\s\S]*?max-width: none;[\s\S]*?width: 100%;/,
  );
  assert.match(
    css,
    /\.editorial-page--methodology h1\s*\{[\s\S]*?max-width: none;[\s\S]*?white-space: nowrap;/,
  );
  assert.match(
    css,
    /\.editorial-page--methodology \.editorial-eyebrow\s*\{[\s\S]*?font-size: 0\.875rem;[\s\S]*?font-weight: 800;/,
  );
  assert.doesNotMatch(methodology, /Not every available detail should be published/);
});

test("editorial pages use one orderly reading column without artificial About visuals", () => {
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
  assert.match(
    editorialCss,
    /\.editorial-page \.editorial-page-inner\s*\{[\s\S]*?margin-inline: auto;[\s\S]*?max-width: 46rem;/,
  );
  assert.match(
    editorialCss,
    /\.editorial-page \.editorial-reading-column,[\s\S]*?\.editorial-page \.editorial-closing\s*\{[\s\S]*?margin-inline: 0;[\s\S]*?max-width: none;[\s\S]*?width: 100%;/,
  );
  assert.match(
    css,
    /\.editorial-page h1\s*\{[\s\S]*?font-size: clamp\(2rem, 3\.2vw, 2\.8125rem\);[\s\S]*?line-height: 1\.08;/,
  );
  assert.match(
    css,
    /\.editorial-page \.editorial-hero-introduction\s*\{[\s\S]*?font-size: clamp\(1rem, 1\.25vw, 1\.125rem\);[\s\S]*?line-height: 1\.55;[\s\S]*?max-width: 42rem;/,
  );
  assert.match(css, /\.editorial-page p,[\s\S]*?font-size: 1rem;[\s\S]*?line-height: 1\.6;/);
  assert.match(
    css,
    /\.editorial-page \.editorial-section h2,[\s\S]*?font-size: clamp\(1\.375rem, 2vw, 1\.75rem\);[\s\S]*?line-height: 1\.2;/,
  );
  assert.match(
    css,
    /\.editorial-page \.story-principles-list\s*\{[\s\S]*?display: block;[\s\S]*?\.editorial-page \.story-principles-list article\s*\{[\s\S]*?grid-template-columns: 2\.5rem minmax\(0, 10rem\) minmax\(0, 1fr\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*?\.editorial-page h1\s*\{[\s\S]*?font-size: clamp\(1\.8125rem, 7\.7vw, 2rem\);/,
  );
  assert.match(css, /\.editorial-page \.story-hero-copy\s*\{[\s\S]*?max-width: none;/);
  assert.match(
    css,
    /\.editorial-page \.story-statement > p\s*\{[\s\S]*?font-size: clamp\(1\.4rem, 2\.5vw, 2rem\);[\s\S]*?max-width: 42rem;/,
  );
  assert.match(
    editorialCss,
    /\.editorial-page \.editorial-hero\s*\{[\s\S]*?background: transparent;[\s\S]*?box-shadow: none;[\s\S]*?clip-path: none;/,
  );
  assert.match(
    editorialCss,
    /\.editorial-page \.methodology-steps > li\s*\{[\s\S]*?background: transparent;[\s\S]*?grid-template-columns: 3rem minmax\(0, 1fr\);[\s\S]*?padding-block: 1\.5rem;/,
  );
  assert.match(
    editorialCss,
    /\.editorial-page \.editorial-closing\s*\{[\s\S]*?background: transparent;[\s\S]*?color: var\(--ink\);[\s\S]*?display: block;/,
  );
  assert.doesNotMatch(editorialCss, /0 0 0 100vmax|clip-path: inset|linear-gradient/);
  assert.doesNotMatch(editorialCss, /methodology-steps > li:nth-child\(even\)/);
  assert.doesNotMatch(editorialCss, /max-width: (?:30rem|33rem|27ch|60ch)/);
  assert.doesNotMatch(
    `${editorialLayout}\n${css}`,
    /story-source-motif|story-record-diagram|PUBLIC RECORD|REPORTING|STATEMENTS|DOCUMENTS|01 \/ SOURCE \/ REVIEW/,
  );
  assert.doesNotMatch(css, /\.editorial-page[\s\S]*?background: #151616;/);

  for (const path of [
    "src/app/editorial-policy/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/media-policy/page.tsx",
    "src/app/copyright/page.tsx",
  ]) {
    assert.match(read(path), /LaunchPolicyPage/);
  }

  for (const href of ["/about", "/events", "/methodology"]) {
    assert.match(archiveShell, new RegExp(`href="${href}"`));
  }
  assert.equal((dataset.match(/internalId: "IO-CM-/g) ?? []).length, 50);
});

test("Home and Events opt into shared editorial typography without structural rewrites", () => {
  assert.match(homepage, /<main className="editorial-typography" id="home">/);
  assert.match(eventsPage, /className="events-archive editorial-typography"/);
  assert.match(
    css,
    /\.editorial-typography\s*\{[\s\S]*?font-family: Arial, "Helvetica Neue", system-ui, sans-serif;/,
  );
  assert.match(css, /\.editorial-typography \.event-archive-row h2/);
  assert.match(homepage, /href="\/events"/);
  assert.match(eventsPage, /<EventFilters[\s\S]*<EventArchiveRow[\s\S]*<EventPagination/);
});
