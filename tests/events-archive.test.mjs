import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const dataset = read("src/data/reviewed-events-preview.ts").replaceAll("\r\n", "\n");
const mediaRegistry = read("src/data/event-media-registry.ts").replaceAll("\r\n", "\n");
const publicMediaLoader = read("src/lib/media/public.ts");
const mediaMigration = read("supabase/migrations/20260728000100_add_event_media_library.sql");
const evidenceDataset = read("src/data/reviewed-event-evidence-preview.ts");
const archivePage = read("src/app/events/page.tsx");
const detailPage = read("src/app/events/[slug]/page.tsx");
const sitemap = read("src/app/sitemap.ts");
const archiveLogic = read("src/lib/events/archive.ts");
const previewGate = read("src/lib/events/getReviewedEvents.ts");
const following = read("src/lib/events/following.ts");
const adminMedia = read("src/app/admin/media/page.tsx");
const archiveRow = read("src/app/events/components/EventArchiveRow.tsx");
const filters = read("src/app/events/components/EventFilters.tsx");
const pagination = read("src/app/events/components/EventPagination.tsx");
const visual = read("src/app/events/components/EventVisual.tsx");
const archiveMediaPreview = read("src/app/events/components/ArchiveMediaPreview.tsx");
const detailMedia = read("src/app/events/components/EventDetailMedia.tsx");
const publicMediaPresentation = read("src/lib/media/presentation.ts");
const eventSafety = read("src/app/events/components/EventSafety.tsx");
const eventSources = read("src/app/events/components/EventSources.tsx");
const shell = read("src/app/events/components/ArchiveShell.tsx");
const homepage = read("src/app/page.tsx");
const publicFooter = read("src/app/components/PublicSiteFooter.tsx");
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
  assert.match(dataset, /76958985A005AFE9EF332F657959FFB039334E7B97D0205D3FC82C5DDD249262/);
  for (const total of [
    "50 events",
    "263 claims",
    "173 sources",
    "197 organisations",
    "2 corrections",
    "12 safety incidents",
  ]) {
    assert.match(dataset, new RegExp(total));
  }
});

test("snapshot has 50 unique readable slugs and one truthful fallback per event", () => {
  const ids = [...dataset.matchAll(/internalId: "([^"]+)"/g)].map((match) => match[1]);
  const slugs = [...dataset.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
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
  assert.equal((mediaRegistry.match(/kind: "publisher_video"/g) ?? []).length, 0);
  assert.match(mediaRegistry, /createEventMediaRegistry[\s\S]*?events\.map\(\(event\)/);
  assert.match(
    dataset,
    /eventMediaRegistry = createEventMediaRegistry\(reviewedEventsWithoutMedia\)/,
  );
  assert.match(
    dataset,
    /eventMediaRegistry satisfies Record<PublishedEventSlug, EventMediaRegistryEntry>/,
  );
  assert.doesNotMatch(dataset, /visual: (?:recordCover|publisherVideo)/);
  assert.equal(Object.values(evidence).flatMap((event) => event.sources).length, 173);
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
  assert.match(dataset, /static snapshot contains only truthful media fallbacks/i);
  assert.doesNotMatch(visual, /Verified event media|MediaClassificationLabel/);
  assert.match(visual, /Verified visual unavailable/);
  assert.doesNotMatch(dataset, /stock|unsplash|pexels|pixabay/i);
});

test("all reviewed records carry approved publication metadata", () => {
  const ids = [...dataset.matchAll(/internalId: "(IO-CM-[^"]+)"/g)].map((match) => match[1]);

  assert.equal(ids.length, 50);
  assert.match(dataset, /publicationStatus: "published"/);
  assert.match(dataset, /publishedAt: "2026-07-21"/);
  assert.match(
    dataset,
    /reviewedEventRecords\.map\([\s\S]*?publicationStatus: "published" as const,[\s\S]*?publishedAt: "2026-07-21"/,
  );
  assert.match(previewGate, /event\.publicationStatus === "published"/);
});

test("all public-safe records are complete and resolve media through the registry", () => {
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
    assert.doesNotMatch(block, /visual:|detailMedia:|embedUrl/);
  }

  assert.match(mediaRegistry, /kind: "no_approved_event_media"/);
  assert.doesNotMatch(mediaRegistry, /https?:\/\//);
  assert.match(publicMediaLoader, /get_public_event_media/);
  assert.match(publicMediaLoader, /event-media-public/);
  assert.doesNotMatch(publicMediaLoader, /event-media-staging/);
  assert.doesNotMatch(mediaRegistry, /(?:imageUrl|thumbnailUrl):\s*"(?:\/|\.\.\/|\.\/)/);
});

test("every Preview record has an ordered public-safe source list", () => {
  const entries = Object.entries(evidence);
  const sources = entries.flatMap(([, event]) => event.sources);

  assert.equal(entries.length, 50);
  assert.equal(sources.length, 173);
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
  assert.equal(jantar.sources.length, 9);
  assert.equal(jantar.safetyIncidents.length, 2);
  assert.deepEqual(
    jantar.safetyIncidents.map((incident) => incident.date),
    ["2026-07-18", "2026-07-20"],
  );
  const jantarBlock = eventBlock("IO-CM-DL-0001");
  assert.match(jantarBlock, /eventStatus: "Concluded"/);
  assert.match(jantarBlock, /endDate: "2026-07-25"/);
  assert.match(jantarBlock, /lastConfirmedActive: "2026-07-25"/);
  assert.match(jantarBlock, /lastReviewed: "2026-08-03"/);
  assert.match(jantarBlock, /Police removed him from the site and transferred him to hospital/);
  assert.match(jantarBlock, /latestOfficialResponse:/);
  assert.doesNotMatch(archiveRow, /safety|incident/i);

  const verifiedStatusChanges = new Map([
    ["IO-CM-MP-0001", "Outcome pending"],
    ["IO-CM-DL-0001", "Concluded"],
    ["IO-CM-KA-0001", "Outcome pending"],
    ["IO-CM-KA-0002", "Outcome pending"],
    ["IO-CM-UP-0001", "Outcome pending"],
    ["IO-CM-MN-0001", "Outcome pending"],
    ["IO-CM-UK-0001", "Outcome pending"],
    ["IO-CM-MH-0002", "Concluded"],
    ["IO-CM-MH-0003", "Concluded"],
    ["IO-CM-MH-0004", "Concluded"],
    ["IO-CM-MH-0005", "Concluded"],
    ["IO-CM-DL-0007", "Concluded"],
    ["IO-CM-KA-0003", "Outcome pending"],
    ["IO-CM-MP-0002", "Outcome pending"],
    ["IO-CM-PB-0005", "Concluded"],
  ]);
  for (const [eventId, status] of verifiedStatusChanges) {
    assert.equal(literalField(eventBlock(eventId), "eventStatus"), status);
  }
});

test("only controlled visual types are allowed and the archive never loads video iframes", () => {
  const types = read("src/lib/events/types.ts");
  for (const mediaType of [
    "uploaded_event_image",
    "publisher_video_embed",
    "official_social_embed",
  ]) {
    assert.match(types, new RegExp(`"${mediaType}"`));
  }
  assert.match(types, /kind: "no_approved_event_media"/);
  assert.doesNotMatch(
    types,
    /kind: "(?:record_cover|publisher_image|open_licensed_image|document_preview)"/,
  );
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
  assert.doesNotMatch(visual, /iframe/i);
  assert.doesNotMatch(archiveMediaPreview, /iframe/i);
  assert.match(visual, /View event sources/);
  assert.match(visual, /ArchiveMediaPreview/);
  assert.match(archiveMediaPreview, /previewImageUrl/);
  assert.match(archiveMediaPreview, /Event media unavailable/);
  assert.match(archiveRow, /eventHref=\{href\}/);
});

test("previous exact-event embeds are migrated as private drafts, not public static media", () => {
  assert.equal((mediaRegistry.match(/kind: "publisher_video"/g) ?? []).length, 0);
  assert.match(mediaMigration, /'jamia-yuva-kumbh-campus-protest'/);
  assert.match(mediaMigration, /jamia-students-protest-rss-yuva-kumbh-event-on-campus/);
  assert.match(mediaMigration, /1091649/);
  assert.match(mediaMigration, /four previously reviewed embeds are migrated as drafts/i);
  assert.equal((mediaMigration.match(/'draft'/g) ?? []).length >= 4, true);
});

test("database-approved detail embeds require explicit activation", () => {
  assert.match(detailMedia, /useState<"idle" \| "loaded" \| "failed">\("idle"\)/);
  assert.match(detailMedia, /onClick=\{\(\) => setEmbedState\("loaded"\)\}/);
  assert.match(detailMedia, /embedState === "loaded" \? \(/);
  assert.match(detailMedia, /<iframe/);
  assert.match(detailMedia, /publisher&apos;s official embed/);
  assert.match(detailMedia, /getPublicSourceLinkLabel\(approvedMedia\)/);
  assert.match(publicMediaPresentation, /View original/);
  assert.match(detailPage, /approvedMedia=\{event\.approvedMedia\}/);
  assert.match(publicMediaLoader, /row\.media_type !== "uploaded_event_image"/);
  assert.doesNotMatch(archivePage, /iframe/i);
  assert.doesNotMatch(archiveRow, /iframe/i);
});

test("excluded media candidates remain disabled with truthful filled fallbacks", () => {
  for (const slug of [
    "noida-factory-workers-protest",
    "bhaniyawala-rishikesh-tree-felling-protest",
    "bidadi-farmers-land-acquisition",
  ]) {
    assert.match(dataset, new RegExp(`slug: "${slug}"`));
    assert.doesNotMatch(
      mediaRegistry,
      new RegExp(`"${slug}": \\{[\\s\\S]*?(?:publisher_video|social_embed)`),
    );
  }
  assert.match(mediaRegistry, /visual: createNoApprovedMediaVisual\(event\)/);
  assert.match(publicMediaLoader, /row\.approved_source_verified/);
});

test("publication-aware server gate exposes published records and protects future candidates", () => {
  assert.match(
    previewGate,
    /process\.env\.NODE_ENV === "development" \|\| process\.env\.VERCEL_ENV === "preview"/,
  );
  assert.match(previewGate, /import "server-only"/);
  assert.match(previewGate, /includeCandidates[\s\S]*?events\.filter/);
  assert.match(previewGate, /event\.publicationStatus === "published"/);
  assert.match(previewGate, /event\.publicLaunchStatus === "launchable"/);
  assert.doesNotMatch(previewGate, /NEXT_PUBLIC/);

  const candidateFixture = [
    {
      slug: "published-record",
      publicationStatus: "published",
      publicLaunchStatus: "launchable",
    },
    {
      slug: "candidate-record",
      publicationStatus: "candidate",
      publicLaunchStatus: "launchable",
    },
    {
      slug: "withheld-record",
      publicationStatus: "published",
      publicLaunchStatus: "temporarily_withheld",
    },
  ];
  const selectVisible = (events, includeCandidates) => {
    const launchableEvents = events.filter((event) => event.publicLaunchStatus === "launchable");
    return includeCandidates
      ? launchableEvents
      : launchableEvents.filter((event) => event.publicationStatus === "published");
  };
  assert.deepEqual(
    selectVisible(candidateFixture, true).map((event) => event.slug),
    ["published-record", "candidate-record"],
  );
  assert.deepEqual(
    selectVisible(candidateFixture, false).map((event) => event.slug),
    ["published-record"],
  );

  assert.match(dataset, /event\.internalId === "IO-CM-OD-0001"[\s\S]*?"temporarily_withheld"/);
  assert.match(sitemap, /const events = await getReviewedEvents\(\)/);
  assert.match(homepage, /featuredRecords\.flatMap/);
  assert.match(homepage, /homepageVisualsByInternalId\.has\(record\.id\)/);
  assert.doesNotMatch(homepage, /id: "IO-CM-OD-0001"/);
  assert.match(following, /event\.publicLaunchStatus === "launchable"/);

  assert.match(archivePage, /candidatePreviewEnabled && candidateCount/);
  assert.match(archivePage, /Preview includes \{candidateCount\} reviewed candidate/);
  assert.doesNotMatch(archivePage, /Preview of reviewed candidate records/);
  assert.match(archivePage, /Public event records are being prepared for publication\./);
  assert.match(archivePage, /Records will appear here after human editorial approval\./);
  assert.match(archivePage, /\{events\.length \? \(/);
  assert.match(archivePage, /<strong>\{events\.length\} reviewed records<\/strong>/);
  assert.match(detailPage, /if \(!event\) notFound\(\)/);
  assert.match(detailPage, /event\.publicationStatus === "candidate"/);
  assert.doesNotMatch(detailPage, /It has not yet been publicly published/);
  assert.doesNotMatch(archivePage, /internalId|IO-CM-/);
  assert.doesNotMatch(detailPage, /internalId|IO-CM-|Internal notes/i);
  assert.doesNotMatch(archiveRow, /internalId|IO-CM-/);
});

test("the conflicting Odisha record is retained for authorised editorial access only", () => {
  const ids = [...dataset.matchAll(/internalId: "(IO-CM-[^"]+)"/g)].map((match) => match[1]);

  assert.equal(ids.length, 50);
  assert.equal(new Set(ids).size, 50);
  assert.match(dataset, /internalId: "IO-CM-OD-0001"/);
  assert.match(adminMedia, /import \{ reviewedEventsPreview \}/);
  assert.match(adminMedia, /const session = await getMediaAdminSession\(\)/);
  assert.match(adminMedia, /if \(!session\.user\) redirect/);
  assert.match(adminMedia, /if \(!session\.admin \|\| !session\.supabase\) notFound\(\)/);
  assert.match(adminMedia, /reviewedEventsPreview\.map/);
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

test("latest-activity sorting and pagination cover all 49 launchable records", () => {
  assert.match(
    archiveLogic,
    /event\.lastConfirmedActive \?\? event\.endDate \?\? event\.startDate \?\? event\.lastReviewed/,
  );
  assert.match(archiveLogic, /export const EVENTS_PER_PAGE = 10/);
  assert.equal(Math.ceil(49 / 10), 5);
  assert.match(archivePage, /Math\.ceil\(filteredEvents\.length \/ EVENTS_PER_PAGE\)/);
  assert.match(archivePage, /Math\.min\(Math\.max\(requestedPage, 1\), pageCount\)/);
  assert.match(archivePage, /slice\(startIndex, startIndex \+ EVENTS_PER_PAGE\)/);
  assert.match(archivePage, /<strong>\{events\.length\} reviewed records<\/strong>/);
  assert.match(archivePage, /Showing \{startIndex \+ 1\}–/);
  assert.match(pagination, /aria-label="Events pagination"/);
  assert.match(pagination, />Previous</);
  assert.match(pagination, />Next</);
  assert.match(pagination, /aria-current="page"/);

  const records = [...dataset.matchAll(/internalId: "([^"]+)"/g)]
    .map(([, id]) => {
      const block = eventBlock(id);
      return {
        id,
        slug: literalField(block, "slug"),
        title: literalField(block, "title"),
        startDate: literalField(block, "startDate"),
        endDate: literalField(block, "endDate"),
        lastConfirmedActive: literalField(block, "lastConfirmedActive"),
        lastReviewed: literalField(block, "lastReviewed"),
      };
    })
    .filter((record) => record.id !== "IO-CM-OD-0001");
  assert.equal(records.length, 49);
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
      "education-accountability-jantar-mantar",
      "karapur-sarvan-luxury-township-protest",
      "kisan-ghat-india-us-trade-deal",
      "indore-dewas-ring-road-compensation",
      "jammu-kashmir-statehood-jantar-mantar",
      "bundelkhand-rehabilitation-compensation-protest",
      "bhaniyawala-rishikesh-tree-felling-protest",
      "mumbai-police-action-education-protest",
      "shamshabad-high-speed-rail-land-protest",
      "bharat-tiwari-justice-rights-assembly",
    ],
  );
  assert.deepEqual(
    pages.map((page) => page.length),
    [10, 10, 10, 10, 9],
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
    /\.event-archive-row[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(20rem, 42fr\)/,
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
    /\.event-no-media,[\s\S]*?\.event-source-media-cover \{[\s\S]*?aspect-ratio: 16 \/ 9/,
  );
  assert.match(
    styles,
    /\.event-detail-embed,[\s\S]*?\.event-media-activation,[\s\S]*?\.event-media-unavailable \{[\s\S]*?aspect-ratio: 16 \/ 9/,
  );
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
    /\.event-archive-row \{[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(20rem, 42fr\);[\s\S]*?padding-block: clamp\(0\.9rem, 1\.7vw, 1\.35rem\)/,
  );
  assert.match(styles, /\.featured-carousel \.featured-slide \{[\s\S]*?height: 30rem/);
  assert.match(
    styles,
    /@media \(max-width: 700px\)[\s\S]*?\.events-archive \{[\s\S]*?padding-top: 0\.5rem[\s\S]*?\.event-filters input,[\s\S]*?min-height: 2\.75rem/,
  );
  assert.equal((mediaRegistry.match(/kind: "publisher_video"/g) ?? []).length, 0);
  assert.match(mediaRegistry, /createNoApprovedMediaVisual\(event\)/);
});

test("detail pages show full public-safe records and working contribution actions", () => {
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
  for (const contribution of ["public-source", "correction", "official-response"]) {
    assert.match(
      detailPage,
      new RegExp(`contribution=\\$\\{type\\}`),
      `${contribution} action uses the event-aware contribution route`,
    );
  }
  assert.match(detailPage, /event=\$\{encodeURIComponent\(event\.slug\)\}/);
  assert.match(detailPage, /Send privately for editorial review/);
  assert.doesNotMatch(detailPage, /Available after public launch|disabled>/);
  assert.match(detailPage, /<EventSafety event=\{event\} \/>/);
  assert.match(detailPage, /<EventSources sources=\{event\.sources\} \/>/);
  assert.ok(detailPage.indexOf("<EventSafety") < detailPage.indexOf("<EventSources"));
  assert.ok(detailPage.indexOf("<EventSources") < detailPage.indexOf("event-record-actions"));
  assert.match(eventSafety, /Safety and conflict incidents/);
  assert.match(eventSafety, /event\.safetyIncidents\.map/);
  assert.match(eventSources, /sources\.map/);
});

test("homepage navigation and coverage totals are synchronized with the canonical workbook", () => {
  assert.equal((homepage.match(/<Link href="\/events">Events<\/Link>/g) ?? []).length, 2);
  assert.match(publicFooter, /\{ href: "\/events", label: "Events" \}/);
  for (const [countExpression, label] of [
    ["coverageStates", "states and Union Territories represented"],
    ["reviewedEvents.length", "reviewed event records"],
    ["coverageSources", "source records linked to reviewed events"],
  ]) {
    assert.match(
      homepage,
      new RegExp(
        `<strong>\\{${countExpression.replace(".", "\\.")}\\}<\\/strong>[\\s\\S]*?${label}`,
      ),
    );
  }
  assert.equal((shell.match(/href="\/events"/g) ?? []).length, 2);
  assert.match(publicFooter, /\{ href: "\/events", label: "Events" \}/);
  assert.doesNotMatch(homepage, /Open questions|Documentation still needed|Documentation gap/);
  assert.doesNotMatch(styles, /\.open-questions/);
});
