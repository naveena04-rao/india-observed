import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const archivePage = read("src/app/events/page.tsx");
const detailPage = read("src/app/events/[slug]/page.tsx");
const archiveLogic = read("src/lib/events/archive.ts");
const previewGate = read("src/lib/events/getReviewedEvents.ts");
const archiveRow = read("src/app/events/components/EventArchiveRow.tsx");
const filters = read("src/app/events/components/EventFilters.tsx");
const pagination = read("src/app/events/components/EventPagination.tsx");
const visual = read("src/app/events/components/EventVisual.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const shell = read("src/app/events/components/ArchiveShell.tsx");
const homepage = read("src/app/page.tsx");
const styles = read("src/app/globals.css");

test("reviewed Events routes and the canonical public-safe snapshot exist", () => {
  assert.match(archivePage, /export default async function EventsPage/);
  assert.match(detailPage, /export default async function EventRecordPage/);
  assert.match(
    dataset,
    /C:\\Users\\navee\\Documents\\IndiaObserved\\tasks\\India_Observed_Master_Tracker\.xlsx/,
  );
  assert.match(dataset, /1A08A5B9798CC041B118A7D8F865267E568981F42CDC1ABA6707309BA81AC7BA/);
  assert.match(dataset, /23 events, 143 claims, 83 sources, 98 organisations, 2 corrections/);
});

test("Preview snapshot has 23 unique readable slugs and one filled visual per event", () => {
  const ids = [...dataset.matchAll(/internalId: "([^"]+)"/g)].map((match) => match[1]);
  const slugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
  const recordCovers = [...dataset.matchAll(/visual: recordCover\(/g)];
  const publisherVideos = [...dataset.matchAll(/visual: publisherVideo\(\{/g)];
  const sourceCounts = [...dataset.matchAll(/approvedSourceCount: (\d+)/g)].map((match) =>
    Number(match[1]),
  );
  const states = [...dataset.matchAll(/stateOrUnionTerritory: "([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.equal(ids.length, 23);
  assert.equal(slugs.length, 23);
  assert.equal(new Set(slugs).size, 23);
  assert.equal(recordCovers.length, 18);
  assert.equal(publisherVideos.length, 5);
  assert.equal(recordCovers.length + publisherVideos.length, 23);
  assert.equal(
    sourceCounts.reduce((total, count) => total + count, 0),
    83,
  );
  assert.equal(new Set(states).size, 16);
  assert.equal(
    slugs.some((slug) => /IO-CM/i.test(slug)),
    false,
  );
  assert.equal(
    slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)),
    true,
  );
  assert.doesNotMatch(dataset, /recordCover\(\s*""/);
  assert.match(dataset, /Rights-pending photographs are not reproduced/);
  assert.match(visual, /No approved visual media/);
  assert.match(visual, /role="img" aria-label=\{visual\.alt\}/);
  assert.doesNotMatch(dataset, /stock|unsplash|pexels|pixabay/i);
});

test("only controlled visual types are allowed and the archive never loads video iframes", () => {
  const types = read("src/lib/events/types.ts");
  for (const kind of ["publisher_image", "publisher_video", "document_preview", "record_cover"]) {
    assert.match(types, new RegExp(`kind: "${kind}"`));
  }
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
  assert.doesNotMatch(visual, /iframe/i);
  assert.match(visual, /visual\.credit/);
  assert.match(visual, /href=\{visual\.sourceUrl\}/);
  assert.match(archiveRow, /eventHref=\{href\}/);
});

test("exactly five NDTV records use verified publisher thumbnails and click-to-load embeds", () => {
  const approved = [
    {
      id: "IO-CM-KA-0002",
      source:
        "https://www.ndtv.com/video/protests-in-karnataka-s-bidadi-after-government-proposes-to-cut-trees-for-ai-city-project-1120270",
      embed:
        "https://www.ndtv.com/videos/embed-player/?id=1120270&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
      thumbnail:
        "https://c.ndtvimg.com/2026-06/t9gf8cms_bidadi_160x120_30_June_26.png?downsize=1600:900",
    },
    {
      id: "IO-CM-DL-0001",
      source:
        "https://www.ndtv.com/video/from-online-movement-to-street-protest-cjp-gathers-at-jantar-mantar-1109578",
      embed:
        "https://www.ndtv.com/videos/embed-player/?id=1109578&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
      thumbnail:
        "https://c.ndtvimg.com/2026-06/ihl87sqg_image_160x120_06_June_26.jpg?downsize=1600:900",
    },
    {
      id: "IO-CM-DL-0002",
      source:
        "https://www.ndtv.com/video/jamia-protests-rss-event-sparks-protests-at-jamia-university-in-delhi-1091649",
      embed:
        "https://www.ndtv.com/videos/embed-player/?id=1091649&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
      thumbnail:
        "https://drop.ndtv.com/video/images/vod/medium/2026-04/1091649_maxresdefault.jpg?downsize=1600:900",
    },
    {
      id: "IO-CM-DL-0003",
      source:
        "https://www.ndtv.com/video/neet-exam-leak-protesters-intensify-attack-on-nta-after-neet-exam-cancellation-1098156",
      embed:
        "https://www.ndtv.com/videos/embed-player/?id=1098156&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
      thumbnail:
        "https://drop.ndtv.com/video/images/vod/medium/2026-05/1098156_maxresdefault.jpg?downsize=1600:900",
    },
    {
      id: "IO-CM-RJ-0001",
      source:
        "https://www.ndtv.com/video/neet-paper-leak-row-protests-in-jaipur-water-cannons-used-to-disperse-crowds-1102287",
      embed:
        "https://www.ndtv.com/videos/embed-player/?id=1102287&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
      thumbnail:
        "https://c.ndtvimg.com/2026-05/f1fjibmo_neet-protest_160x120_21_May_26.jpg?downsize=1600:900",
    },
  ];

  assert.equal((dataset.match(/visual: publisherVideo\(\{/g) ?? []).length, 5);
  for (const media of approved) {
    const start = dataset.indexOf(`internalId: "${media.id}"`);
    const end = dataset.indexOf("\n  {\n    internalId:", start + 1);
    const block = dataset.slice(start, end === -1 ? undefined : end);
    assert.ok(start >= 0, `${media.id} must exist`);
    assert.ok(block.includes(media.source));
    assert.ok(block.includes(media.embed));
    assert.ok(block.includes(media.thumbnail));
    assert.match(block, /alt: "[^"]+"/);
  }
  assert.match(dataset, /credit: "Video: NDTV"/);
  assert.match(dataset, /thumbnailSource: "og:image"/);
  assert.equal((dataset.match(/thumbnailUrl:\s*"https:\/\//g) ?? []).length, 5);
  assert.doesNotMatch(dataset, /thumbnailUrl:\s*"(?:\/|\.\.\/|\.\/)/);
});

test("detail embeds require activation and the Instagram candidate remains Preview-only", () => {
  assert.match(detailMedia, /useState\(false\)/);
  assert.match(detailMedia, /onClick=\{\(\) => setIsActivated\(true\)\}/);
  assert.match(detailMedia, /isActivated \? \(/);
  assert.match(detailMedia, /<iframe/);
  assert.match(detailMedia, /Loading connects to NDTV's publisher-hosted player\./);
  assert.match(detailMedia, /Loading connects to Instagram's official embed\./);
  assert.match(detailMedia, /View original on \{publisher\}/);
  assert.match(dataset, /https:\/\/www\.instagram\.com\/reel\/DacYWWktqjL\/embed\//);
  assert.match(dataset, /previewOnly: true/);
  assert.match(dataset, /visual: recordCover\("Save SGNP human chain"/);
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
});

test("excluded media candidates remain disabled with truthful filled fallbacks", () => {
  for (const id of ["IO-CM-UP-0002", "IO-CM-UP-0001", "IO-CM-UK-0001"]) {
    const start = dataset.indexOf(`internalId: "${id}"`);
    const end = dataset.indexOf("\n  {\n    internalId:", start + 1);
    const block = dataset.slice(start, end === -1 ? undefined : end);
    assert.ok(start >= 0, `${id} must exist`);
    assert.match(block, /visual: recordCover\(/);
    assert.doesNotMatch(block, /publisherVideo|instagram_embed|embedUrl/);
  }
});

test("Preview and Production publication gates remain server-side and candidate-safe", () => {
  assert.match(
    previewGate,
    /process\.env\.NODE_ENV === "development" \|\| process\.env\.VERCEL_ENV === "preview"/,
  );
  assert.match(previewGate, /import "server-only"/);
  assert.match(previewGate, /if \(!isReviewedPreviewEnabled\(\)\) return \[\]/);
  assert.doesNotMatch(previewGate, /NEXT_PUBLIC/);
  assert.match(
    archivePage,
    /Preview of reviewed candidate records\. These records are not yet publicly published\./,
  );
  assert.match(archivePage, /Public event records are being prepared for publication\./);
  assert.match(archivePage, /Records will appear here after human editorial approval\./);
  assert.match(detailPage, /if \(!event\) notFound\(\)/);
  assert.match(
    detailPage,
    /This is a reviewed candidate record shown for design and editorial testing\. It has not[\s\S]*yet been publicly published\./,
  );
  assert.doesNotMatch(archivePage, /internalId|IO-CM-/);
  assert.doesNotMatch(detailPage, /internalId|IO-CM-|Internal notes/i);
  assert.doesNotMatch(archiveRow, /internalId|IO-CM-/);
});

test("archive filters use only public-safe search fields and preserve URL state", () => {
  const searchFields = archiveLogic.match(/const searchablePublicFields = \[([\s\S]*?)\]/)?.[1];
  assert.ok(searchFields);
  for (const field of [
    "event.title",
    "event.publicLocation",
    "event.stateOrUnionTerritory",
    "event.topic",
    "event.directedAt",
  ]) {
    assert.match(searchFields, new RegExp(field.replace(".", "\\.")));
  }
  assert.doesNotMatch(searchFields, /internalId|summary|notes|claim/i);
  assert.match(filters, /name="q"/);
  assert.match(filters, /name="state"/);
  assert.match(filters, /name="topic"/);
  assert.match(filters, /name="type"/);
  assert.match(filters, /name="status"/);
  assert.match(filters, /name="sort"/);
  assert.match(filters, /Latest activity/);
  assert.match(filters, /Recently reviewed/);
  assert.match(filters, /Event date: oldest first/);
  assert.match(archivePage, /new URLSearchParams\(\)/);
  assert.match(pagination, /new URLSearchParams\(params\)/);
  assert.match(pagination, /nextParams\.set\("page", String\(page\)\)/);
});

test("latest-activity sorting and accessible ten-record pagination cover all records", () => {
  assert.match(
    archiveLogic,
    /event\.lastConfirmedActive \?\? event\.endDate \?\? event\.startDate \?\? event\.lastReviewed/,
  );
  assert.match(archiveLogic, /export const EVENTS_PER_PAGE = 10/);
  assert.match(archivePage, /slice\(startIndex, startIndex \+ EVENTS_PER_PAGE\)/);
  assert.match(archivePage, /Showing \{startIndex \+ 1\}–/);
  assert.match(pagination, /aria-label="Events pagination"/);
  assert.match(pagination, />Previous</);
  assert.match(pagination, />Next</);
  assert.match(pagination, /aria-current="page"/);
});

test("archive rows follow the ON RECORD structure and link to readable detail routes", () => {
  for (const field of [
    "event.eventType",
    "event.eventStatus",
    "event.title",
    "event.publicLocation",
    "event.stateOrUnionTerritory",
    "event.topic",
    "event.summary",
    "event.directedAt",
    "event.eventVerification",
    "event.lastReviewed",
    "event.approvedSourceCount",
  ]) {
    assert.match(archiveRow, new RegExp(field.replace(".", "\\.")));
  }
  assert.match(archiveRow, /const href = `\/events\/\$\{event\.slug\}`/);
  assert.equal((archiveRow.match(/href=\{href\}/g) ?? []).length, 2);
  assert.match(archiveRow, /View full record →/);
  assert.match(
    styles,
    /\.event-archive-row[\s\S]*?grid-template-columns: minmax\(0, 68fr\) minmax\(15rem, 32fr\)/,
  );
  assert.match(styles, /\.event-row-summary[\s\S]*?-webkit-line-clamp: 4/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.event-row-visual[\s\S]*?grid-row: 1/);
});

test("archive controls use compact spacing without changing title, grid, rows, or homepage", () => {
  assert.match(
    styles,
    /\.events-archive \{[\s\S]*?padding-bottom: clamp\(3\.5rem, 7vw, 6rem\);[\s\S]*?padding-top: clamp\(0\.75rem, 1\.5vw, 1\.25rem\);/,
  );
  assert.match(styles, /\.events-intro \{[\s\S]*?padding-bottom: 0\.6rem/);
  assert.match(styles, /\.events-intro h1 \{[\s\S]*?font-size: clamp\(2\.6rem, 6vw, 5rem\)/);
  assert.match(
    styles,
    /\.preview-notice \{[\s\S]*?margin-block: 0\.45rem;[\s\S]*?padding: 0\.35rem 0\.65rem/,
  );
  assert.match(
    styles,
    /\.event-filters \{[\s\S]*?gap: 0\.35rem 1rem;[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*?padding-block: 0\.45rem 0\.6rem/,
  );
  assert.match(
    styles,
    /\.event-filters input,[\s\S]*?\.event-filters select \{[\s\S]*?font-size: 0\.82rem;[\s\S]*?min-height: 2\.3rem;[\s\S]*?padding: 0\.35rem 0\.6rem/,
  );
  assert.match(styles, /\.events-result-count \{[\s\S]*?margin-block: 0\.45rem 0\.3rem/);
  assert.match(
    styles,
    /\.event-archive-row \{[\s\S]*?grid-template-columns: minmax\(0, 68fr\) minmax\(15rem, 32fr\);[\s\S]*?padding-block: clamp\(1\.25rem, 2\.5vw, 2rem\)/,
  );
  assert.match(styles, /\.featured-carousel \.featured-slide \{[\s\S]*?height: 30rem/);
  assert.match(
    styles,
    /@media \(max-width: 700px\)[\s\S]*?\.events-archive \{[\s\S]*?padding-top: 0\.75rem[\s\S]*?\.event-filters input,[\s\S]*?min-height: 2\.75rem/,
  );
  assert.equal((dataset.match(/visual: publisherVideo\(\{/g) ?? []).length, 5);
  assert.equal((dataset.match(/visual: recordCover\(/g) ?? []).length, 18);
});

test("detail pages show full public-safe records and disabled launch actions", () => {
  for (const field of [
    "event.eventType",
    "event.eventStatus",
    "event.title",
    "event.publicLocation",
    "event.topic",
    "event.directedAt",
    "event.eventVerification",
    "event.summary",
    "event.approvedSourceCount",
  ]) {
    assert.match(detailPage, new RegExp(field.replace(".", "\\.")));
  }
  for (const action of [
    "Add a public source",
    "Suggest a correction",
    "Submit an official response",
  ]) {
    assert.match(detailPage, new RegExp(action));
  }
  assert.match(detailPage, /Available after public launch/);
  assert.match(detailPage, /<button key=\{label\} type="button" disabled>/);
});

test("homepage navigation and coverage totals are synchronized with the canonical workbook", () => {
  assert.equal((homepage.match(/<Link href="\/events">Events<\/Link>/g) ?? []).length, 3);
  for (const [count, label] of [
    ["16", "states and Union Territories represented"],
    ["23", "reviewed event records"],
    ["83", "source records linked to reviewed events"],
  ]) {
    assert.match(homepage, new RegExp(`<strong>${count}<\\/strong>[\\s\\S]*?${label}`));
  }
  assert.equal((shell.match(/href="\/events"/g) ?? []).length, 3);
  assert.doesNotMatch(homepage, /Open questions|Documentation still needed|Documentation gap/);
  assert.doesNotMatch(styles, /\.open-questions/);
});
