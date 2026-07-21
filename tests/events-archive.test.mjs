import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts");
const evidenceDataset = read("src/data/reviewed-event-evidence-preview.ts");
const archivePage = read("src/app/events/page.tsx");
const detailPage = read("src/app/events/[slug]/page.tsx");
const archiveLogic = read("src/lib/events/archive.ts");
const previewGate = read("src/lib/events/getReviewedEvents.ts");
const archiveRow = read("src/app/events/components/EventArchiveRow.tsx");
const filters = read("src/app/events/components/EventFilters.tsx");
const pagination = read("src/app/events/components/EventPagination.tsx");
const visual = read("src/app/events/components/EventVisual.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const eventSafety = read("src/app/events/components/EventSafety.tsx");
const eventSources = read("src/app/events/components/EventSources.tsx");
const shell = read("src/app/events/components/ArchiveShell.tsx");
const homepage = read("src/app/page.tsx");
const styles = read("src/app/globals.css");

const evidenceSource = evidenceDataset.slice(
  evidenceDataset.indexOf("export const reviewedEventEvidenceByInternalId = ") +
    "export const reviewedEventEvidenceByInternalId = ".length,
  evidenceDataset.indexOf(" as const satisfies"),
);
const evidence = Function(`"use strict"; return (${evidenceSource});`)();

const sourceRolePriority = [
  "Official response",
  "Official context",
  "Corroboration",
  "Follow-up",
  "Lead",
  "Historical context",
  "Alternate access",
];

const newEventIds = [
  "IO-CM-PB-0002",
  "IO-CM-RJ-0002",
  "IO-CM-MH-0002",
  "IO-CM-MH-0003",
  "IO-CM-AS-0002",
  "IO-CM-AS-0003",
  "IO-CM-NL-0001",
  "IO-CM-MH-0004",
  "IO-CM-MH-0005",
  "IO-CM-PB-0003",
  "IO-CM-MH-0006",
  "IO-CM-PB-0004",
  "IO-CM-KA-0003",
  "IO-CM-MH-0007",
  "IO-CM-DL-0006",
  "IO-CM-DL-0007",
  "IO-CM-MP-0002",
  "IO-CM-TN-0001",
  "IO-CM-MH-0008",
  "IO-CM-PB-0005",
  "IO-CM-MH-0009",
  "IO-CM-GA-0001",
  "IO-CM-TS-0002",
  "IO-CM-TN-0002",
  "IO-CM-MH-0010",
  "IO-CM-JH-0001",
  "IO-CM-HR-0003",
];

function eventBlock(internalId) {
  const start = dataset.indexOf(`internalId: "${internalId}"`);
  assert.ok(start >= 0, `${internalId} must exist`);
  const end = dataset.indexOf("\n  {\n    internalId:", start + 1);
  return dataset.slice(start, end === -1 ? dataset.indexOf("\n] as const", start) : end);
}

function literalField(block, name) {
  const literal = block.match(new RegExp(`\\n\\s+${name}:\\s*(null|"(?:[^"\\\\]|\\\\.)*")`))?.[1];
  assert.ok(literal, `Missing ${name}`);
  return literal === "null" ? null : JSON.parse(literal);
}

test("reviewed Events routes and the canonical public-safe snapshot exist", () => {
  assert.match(archivePage, /export default async function EventsPage/);
  assert.match(detailPage, /export default async function EventRecordPage/);
  assert.match(
    dataset,
    /C:\\Users\\navee\\Documents\\IndiaObserved\\tasks\\India_Observed_Master_Tracker\.xlsx/,
  );
  assert.match(dataset, /0B0497363ABF26F86E94C5782349820FD61630358AE7710E866EDA5BB8492E42/);
  for (const total of [
    "50 events",
    "263 claims",
    "165 sources",
    "197 organisations",
    "2 corrections",
    "12 safety incidents",
  ]) {
    assert.match(dataset, new RegExp(total));
  }
});

test("Preview snapshot has 50 unique readable slugs and one filled visual per event", () => {
  const ids = [...dataset.matchAll(/internalId: "([^"]+)"/g)].map((match) => match[1]);
  const slugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
  const recordCovers = [...dataset.matchAll(/visual: recordCover\(/g)];
  const publisherVideos = [...dataset.matchAll(/visual: publisherVideo\(\{/g)];
  const states = [...dataset.matchAll(/stateOrUnionTerritory: "([^"]+)"/g)].map(
    (match) => match[1],
  );
  const primaryTopics = [...dataset.matchAll(/"IO-CM-[A-Z]+-\d{4}": "([^"]+)",/g)].map(
    (match) => match[1],
  );

  assert.equal(ids.length, 50);
  assert.equal(new Set(ids).size, 50);
  assert.equal(slugs.length, 50);
  assert.equal(new Set(slugs).size, 50);
  assert.equal(recordCovers.length, 45);
  assert.equal(publisherVideos.length, 5);
  assert.equal(recordCovers.length + publisherVideos.length, 50);
  assert.equal((dataset.match(/visual: documentPreview|visual: publisherImage/g) ?? []).length, 0);
  assert.equal(Object.values(evidence).flatMap((event) => event.sources).length, 165);
  assert.equal(new Set(states).size, 20);
  assert.equal(primaryTopics.length, 50);
  assert.equal(new Set(primaryTopics).size, 9);
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

test("all public-safe records are complete and the 27 additions use record covers", () => {
  const requiredFields = [
    "slug",
    "title",
    "eventType",
    "eventStatus",
    "topic",
    "stateOrUnionTerritory",
    "publicLocation",
    "startDate",
    "endDate",
    "lastConfirmedActive",
    "lastReviewed",
    "summary",
    "directedAt",
    "eventVerification",
    "approvedSourceCount",
    "visual",
  ];
  const ids = [...dataset.matchAll(/internalId: "([^"]+)"/g)].map((match) => match[1]);

  for (const id of ids) {
    const block = eventBlock(id);
    for (const field of requiredFields) {
      assert.match(block, new RegExp(`\\b${field}:`), `${id} must include ${field}`);
    }
    assert.match(dataset, new RegExp(`"${id}": "[^"]+",`), `${id} needs a primary topic`);
  }

  assert.equal(newEventIds.length, 27);
  for (const id of newEventIds) {
    const block = eventBlock(id);
    assert.match(block, /visual: recordCover\(/);
    assert.doesNotMatch(block, /publisherVideo|publisher_image|document_preview|embedUrl/);
  }

  assert.match(
    dataset,
    /alt: `Text-only record cover for \$\{title\}\. No approved visual media\.`/,
  );
  assert.match(visual, />No approved visual media</);
  assert.equal((dataset.match(/https:\/\/www\.ndtv\.com\/videos\/embed-player/g) ?? []).length, 5);
  assert.equal(
    (dataset.match(/https:\/\/www\.instagram\.com\/reel\/DacYWWktqjL\/embed\//g) ?? []).length,
    1,
  );
  assert.equal((dataset.match(/embedUrl:\s*"https:\/\//g) ?? []).length, 6);
  assert.doesNotMatch(dataset, /(?:imageUrl|thumbnailUrl):\s*"(?:\/|\.\.\/|\.\/)/);
});

test("every Preview record has an ordered public-safe source list", () => {
  const entries = Object.entries(evidence);
  const sources = entries.flatMap(([, event]) => event.sources);

  assert.equal(entries.length, 50);
  assert.equal(sources.length, 165);
  assert.equal(
    entries.every(([, event]) => event.sources.length >= 1),
    true,
  );
  assert.match(dataset, /approvedSourceCount: evidence\.sources\.length/);
  assert.doesNotMatch(evidenceDataset, /IO-SRC-|IO-CLM-|IO-SAFE-/);

  for (const source of sources) {
    assert.doesNotThrow(() => new URL(source.url));
    assert.match(source.url, /^https?:\/\//);
    assert.ok(sourceRolePriority.includes(source.sourceRole));
  }

  for (const [, event] of entries) {
    for (let index = 1; index < event.sources.length; index += 1) {
      const previous = event.sources[index - 1];
      const current = event.sources[index];
      const previousRole = sourceRolePriority.indexOf(previous.sourceRole);
      const currentRole = sourceRolePriority.indexOf(current.sourceRole);
      assert.ok(previousRole <= currentRole);
      if (previousRole === currentRole) {
        assert.ok((previous.publicationDate ?? "") >= (current.publicationDate ?? ""));
      }
    }
  }

  assert.match(eventSources, /target="_blank"/);
  assert.match(eventSources, /rel="noreferrer noopener"/);
  assert.match(eventSources, /Open original source/);
  for (const label of [
    "Official source",
    "Independent reporting",
    "Follow-up",
    "Discovery lead",
    "Historical context",
    "Alternate access",
  ]) {
    assert.match(eventSources, new RegExp(label));
  }
});

test("all events have qualified safety summaries and only attributed incident details", () => {
  const entries = Object.entries(evidence);
  const incidentEvents = entries.filter(([, event]) => event.safetyIncidents.length > 0);
  const zeroIncidentEvents = entries.filter(([, event]) => event.safetyIncidents.length === 0);
  const incidents = incidentEvents.flatMap(([, event]) => event.safetyIncidents);
  const noIncidentStatement =
    "No violence or coercive-force incident was identified in the source set reviewed for this event. This is an evidence statement, not proof that no incident occurred.";
  const expectedIncidentEvents = [
    "IO-CM-KA-0002",
    "IO-CM-HR-0002",
    "IO-CM-UP-0002",
    "IO-CM-DL-0002",
    "IO-CM-RJ-0001",
    "IO-CM-PB-0002",
    "IO-CM-PB-0004",
    "IO-CM-MP-0002",
    "IO-CM-TS-0002",
    "IO-CM-DL-0001",
    "IO-CM-MH-0007",
  ];

  assert.equal(
    entries.every(([, event]) => event.safety),
    true,
  );
  assert.equal(incidentEvents.length, 11);
  assert.equal(incidents.length, 12);
  assert.equal(zeroIncidentEvents.length, 39);
  assert.equal(
    entries.every(([, event]) =>
      [
        "assessment",
        "incidentCount",
        "highestClassification",
        "injuriesAndDeathsStatus",
        "propertyDamageStatus",
        "summary",
        "lastReviewed",
      ].every((field) => event.safety[field] !== null && event.safety[field] !== ""),
    ),
    true,
  );
  assert.equal(
    entries.every(([, event]) => event.safety.incidentCount === event.safetyIncidents.length),
    true,
  );
  assert.equal(
    zeroIncidentEvents.every(([, event]) => event.safety.summary === noIncidentStatement),
    true,
  );
  assert.deepEqual(incidentEvents.map(([id]) => id).sort(), expectedIncidentEvents.sort());
  assert.equal(
    incidents.every((incident) => /^No deaths reported$/i.test(incident.deathsStatus)),
    true,
  );
  assert.doesNotMatch(evidenceDataset, /violent protest/i);
  assert.doesNotMatch(eventSafety, /violent protest/i);
  assert.match(eventSafety, /\{event\.safety\.summary\}/);

  const jantar = evidence["IO-CM-DL-0001"];
  assert.equal(jantar.sources.length, 8);
  assert.equal(jantar.safetyIncidents.length, 2);
  assert.deepEqual(
    jantar.safetyIncidents.map((incident) => incident.date),
    ["2026-07-18", "2026-07-20"],
  );
  const jantarBlock = eventBlock("IO-CM-DL-0001");
  assert.match(jantarBlock, /lastConfirmedActive: "2026-07-20"/);
  assert.match(jantarBlock, /lastReviewed: "2026-07-21"/);
  assert.match(jantarBlock, /Police removed him from the site and transferred him to hospital/);
  assert.match(jantarBlock, /latestOfficialResponse:/);
  assert.doesNotMatch(archiveRow, /safety|incident/i);
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
    "event.primaryTopic",
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
  assert.match(
    archivePage,
    /states: unique\(events\.map\(\(event\) => event\.stateOrUnionTerritory\)\)/,
  );
  assert.match(archivePage, /topics: unique\(events\.map\(\(event\) => event\.primaryTopic\)\)/);
  assert.match(archivePage, /eventTypes: unique\(events\.map\(\(event\) => event\.eventType\)\)/);
  assert.match(archivePage, /statuses: unique\(events\.map\(\(event\) => event\.eventStatus\)\)/);
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
  assert.equal(50 / 10, 5);
  assert.match(archivePage, /Math\.ceil\(filteredEvents\.length \/ EVENTS_PER_PAGE\)/);
  assert.match(archivePage, /Math\.min\(Math\.max\(requestedPage, 1\), pageCount\)/);
  assert.match(archivePage, /slice\(startIndex, startIndex \+ EVENTS_PER_PAGE\)/);
  assert.match(archivePage, /<strong>50 reviewed records<\/strong>/);
  assert.match(archivePage, /Showing \{startIndex \+ 1\}–/);
  assert.match(pagination, /aria-label="Events pagination"/);
  assert.match(pagination, />Previous</);
  assert.match(pagination, />Next</);
  assert.match(pagination, /aria-current="page"/);

  const records = [...dataset.matchAll(/internalId: "([^"]+)"/g)].map(([, id]) => {
    const block = eventBlock(id);
    return {
      slug: literalField(block, "slug"),
      title: literalField(block, "title"),
      startDate: literalField(block, "startDate"),
      endDate: literalField(block, "endDate"),
      lastConfirmedActive: literalField(block, "lastConfirmedActive"),
      lastReviewed: literalField(block, "lastReviewed"),
    };
  });
  const activityDate = (record) =>
    record.lastConfirmedActive ?? record.endDate ?? record.startDate ?? record.lastReviewed;
  const ordered = records.toSorted(
    (left, right) =>
      activityDate(right).localeCompare(activityDate(left)) ||
      right.lastReviewed.localeCompare(left.lastReviewed) ||
      left.title.localeCompare(right.title),
  );
  const pages = Array.from({ length: Math.ceil(ordered.length / 10) }, (_, index) =>
    ordered.slice(index * 10, index * 10 + 10),
  );

  assert.deepEqual(
    ordered.slice(0, 10).map((record) => record.slug),
    [
      "kisan-ghat-india-us-trade-deal",
      "education-accountability-jantar-mantar",
      "indore-dewas-ring-road-compensation",
      "jammu-kashmir-statehood-jantar-mantar",
      "mumbai-police-action-education-protest",
      "shamshabad-high-speed-rail-land-protest",
      "bharat-tiwari-justice-rights-assembly",
      "hidkal-displaced-farmers-belagavi-compensation",
      "channot-drinking-water-pipeline-protest",
      "khanna-mgnrega-workers-regularisation-salaries",
    ],
  );
  assert.deepEqual(
    pages.map((page) => page.length),
    [10, 10, 10, 10, 10],
  );
  assert.equal(pages[5], undefined);
  assert.equal(Math.min(Math.max(6, 1), pages.length), 5);
});

test("archive rows follow the ON RECORD structure and link to readable detail routes", () => {
  for (const field of [
    "event.eventType",
    "event.eventStatus",
    "event.title",
    "event.publicLocation",
    "event.stateOrUnionTerritory",
    "event.primaryTopic",
    "event.summary",
    "event.startDate",
    "event.endDate",
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
  assert.match(styles, /\.event-row-summary[\s\S]*?-webkit-line-clamp: 2/);
  assert.match(archiveRow, /Start date/);
  assert.match(archiveRow, /Under verification/);
  assert.match(archiveRow, /event\.endDate \? \(/);
  assert.doesNotMatch(archiveRow, /formatEventDateRange/);
  assert.match(archiveRow, /Last reviewed/);
  assert.match(archiveRow, /event\.approvedSourceCount/);
  assert.match(styles, /\.event-row-disclosure--with-end-date[\s\S]*?repeat\(4/);
  assert.match(styles, /\.event-row-disclosure--without-end-date[\s\S]*?repeat\(3/);
  assert.match(
    styles,
    /\.event-row-visual \.event-record-cover,[\s\S]*?aspect-ratio: 16 \/ 9;[\s\S]*?min-height: 0/,
  );
  assert.match(styles, /\.event-detail-embed \{[\s\S]*?aspect-ratio: 4 \/ 3/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.event-row-visual[\s\S]*?grid-row: 1/);
});

test("archive controls use the compact title and spacing without changing grid, rows, or homepage", () => {
  assert.match(
    styles,
    /\.events-archive \{[\s\S]*?padding-bottom: clamp\(3\.5rem, 7vw, 6rem\);[\s\S]*?padding-top: 0\.5rem;/,
  );
  assert.match(styles, /\.events-intro \{[\s\S]*?padding-bottom: 0\.4rem/);
  assert.match(
    styles,
    /\.events-intro h1 \{[\s\S]*?font-size: clamp\(2\.4rem, 4vw, 3\.25rem\);[\s\S]*?line-height: 0\.9/,
  );
  assert.match(
    styles,
    /\.preview-notice \{[\s\S]*?line-height: 1\.25;[\s\S]*?margin-block: 0\.3rem;[\s\S]*?padding: 0\.25rem 0\.6rem/,
  );
  assert.match(
    styles,
    /\.event-filters \{[\s\S]*?gap: 0\.25rem 1rem;[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*?padding-block: 0\.3rem 0\.4rem/,
  );
  assert.match(
    styles,
    /\.event-filters input,[\s\S]*?\.event-filters select \{[\s\S]*?font-size: 0\.82rem;[\s\S]*?min-height: 2\.3rem;[\s\S]*?padding: 0\.95rem 0\.6rem 0/,
  );
  assert.match(
    styles,
    /\.event-filters > div:not\(\.event-filter-actions\) \{[\s\S]*?position: relative[\s\S]*?\.event-filters label \{[\s\S]*?font-size: 0\.67rem;[\s\S]*?position: absolute/,
  );
  assert.match(styles, /\.events-result-count \{[\s\S]*?margin-block: 0\.3rem 0\.2rem/);
  assert.match(
    styles,
    /\.event-archive-row \{[\s\S]*?grid-template-columns: minmax\(0, 68fr\) minmax\(15rem, 32fr\);[\s\S]*?padding-block: clamp\(0\.9rem, 1\.7vw, 1\.35rem\)/,
  );
  assert.match(styles, /\.featured-carousel \.featured-slide \{[\s\S]*?height: 30rem/);
  assert.match(
    styles,
    /@media \(max-width: 700px\)[\s\S]*?\.events-archive \{[\s\S]*?padding-top: 0\.5rem[\s\S]*?\.event-filters input,[\s\S]*?min-height: 2\.75rem/,
  );
  assert.equal((dataset.match(/visual: publisherVideo\(\{/g) ?? []).length, 5);
  assert.equal((dataset.match(/visual: recordCover\(/g) ?? []).length, 45);
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
  assert.match(detailPage, /<EventSafety event=\{event\} \/>/);
  assert.match(detailPage, /<EventSources sources=\{event\.sources\} \/>/);
  assert.ok(detailPage.indexOf("<EventSafety") < detailPage.indexOf("<EventSources"));
  assert.ok(detailPage.indexOf("<EventSources") < detailPage.indexOf("event-record-actions"));
  assert.match(eventSafety, /Safety and conflict incidents/);
  assert.match(eventSafety, /event\.safetyIncidents\.map/);
  assert.match(eventSources, /sources\.map/);
});

test("homepage navigation and coverage totals are synchronized with the canonical workbook", () => {
  assert.equal((homepage.match(/<Link href="\/events">Events<\/Link>/g) ?? []).length, 3);
  for (const [count, label] of [
    ["20", "states and Union Territories represented"],
    ["50", "reviewed event records"],
    ["165", "source records linked to reviewed events"],
  ]) {
    assert.match(homepage, new RegExp(`<strong>${count}<\\/strong>[\\s\\S]*?${label}`));
  }
  assert.equal((shell.match(/href="\/events"/g) ?? []).length, 3);
  assert.doesNotMatch(homepage, /Open questions|Documentation still needed|Documentation gap/);
  assert.doesNotMatch(styles, /\.open-questions/);
});
