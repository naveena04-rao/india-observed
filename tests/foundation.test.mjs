import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("auto-publication is explicitly disabled", () => {
  assert.match(read("AGENTS.md"), /No autonomous publication/i);
  assert.match(read("docs/SECURITY.md"), /auto-publication is disabled/i);
});

test("database migration contains every Week 1 core table", () => {
  const migration = read("supabase/migrations/20260715000100_initial_schema.sql");
  for (const table of [
    "events",
    "claims",
    "sources",
    "claim_sources",
    "organisations",
    "event_organisations",
    "corrections",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\b`, "i"));
  }
});

test("service role key is server-only", () => {
  assert.doesNotMatch(read(".env.example"), /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(read("src/lib/supabase/server.ts"), /server-only/);
});

test("prototype contains core trust language", () => {
  const page = read("prototype/index.html");
  assert.match(page, /Broad discovery\. Conservative publication\./);
  assert.match(page, /not live tracking/i);
});

test("homepage keeps the public archive safety boundaries visible", () => {
  const page = read("src/app/page.tsx");
  const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
  const styles = read("src/app/globals.css");
  const mediaMigration = read("supabase/migrations/20260728000100_add_event_media_library.sql");
  const featuredBlock = page.match(/const featuredRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const latestBlock = page.match(/const latestRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const onRecordBlock = page.match(
    /const onRecords = \[([\s\S]*?)\] as const satisfies readonly OnRecord\[\];/,
  )?.[1];
  const latestMarkup = carousel.match(
    /\{latestRecords\.map\(\(record\) => \(([\s\S]*?)\)\)\}/,
  )?.[1];

  assert.ok(featuredBlock);
  assert.ok(latestBlock);
  assert.ok(onRecordBlock);
  assert.ok(latestMarkup);

  const recordIds = (source) => [...source.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
  const featuredIds = recordIds(featuredBlock);
  const latestIds = recordIds(latestBlock);
  const onRecordIds = recordIds(onRecordBlock);

  assert.deepEqual(featuredIds, ["IO-CM-KA-0002", "IO-CM-MN-0001", "IO-CM-OD-0001"]);
  assert.deepEqual(latestIds, ["IO-CM-MP-0001", "IO-CM-DL-0001", "IO-CM-MH-0001"]);
  assert.deepEqual(onRecordIds, ["IO-CM-GJ-0001", "IO-CM-UP-0001", "IO-CM-AS-0001"]);
  assert.equal(
    onRecordIds.some((id) => [...featuredIds, ...latestIds].includes(id)),
    false,
  );

  assert.match(
    styles,
    /featured-record-context[\s\S]*font-size: clamp\(1\.2rem, 1\.6vw, 1\.4rem\)/,
  );

  const expectedNavigation = [
    ["#home", "Home"],
    ["/about", "About"],
    ["/events", "Events"],
    ["/methodology", "Methodology"],
    ["#lead", "Submit a lead"],
  ];
  const navigationLinks = (markup) =>
    [
      ...markup.matchAll(
        /<(?:a|Link)(?: className="[^"]*")? href="([^"]+)">([\s\S]*?)<\/(?:a|Link)>/g,
      ),
    ].map(([, href, label]) => [
      href,
      label
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    ]);
  const desktopNav = page.match(
    /<nav className="desktop-nav" aria-label="Primary navigation">([\s\S]*?)<\/nav>/,
  )?.[1];
  const mobileNav = page.match(/<nav aria-label="Mobile navigation">([\s\S]*?)<\/nav>/)?.[1];

  assert.ok(desktopNav);
  assert.ok(mobileNav);
  assert.deepEqual(navigationLinks(desktopNav), expectedNavigation);
  assert.deepEqual(navigationLinks(mobileNav), expectedNavigation);
  assert.match(page, /<main className="editorial-typography" id="home">/);
  assert.match(carousel, /id="about"/);
  assert.match(carousel, /id="events"/);
  assert.match(page, /id="methodology"/);
  assert.match(page, /id="lead"/);

  assert.match(page, /Independent records of protests and civic movements across India/i);
  assert.match(page, /Sources linked\. Identities protected\. Corrections visible\./i);
  assert.match(page, /tactical information/i);
  assert.match(page, /Human review/i);
  const mediaGridMarkup = carousel.match(
    /const mediaStatusGrid = \(\s*(<dl className="media-status-grid">[\s\S]*?<\/dl>)\s*\);/,
  )?.[1];
  assert.ok(mediaGridMarkup);
  const mediaGridCells = [...mediaGridMarkup.matchAll(/<div(?: [^>]*)?>([\s\S]*?)<\/div>/g)].map(
    (match) => match[0],
  );
  assert.equal(mediaGridCells.length, 4);
  assert.match(mediaGridCells[0], /<dt>Media format<\/dt>[\s\S]*activeMedia\.format/);
  assert.match(mediaGridCells[1], /<dt>Directed at<\/dt>[\s\S]*activeRecord\.directedAt/);
  assert.match(
    mediaGridCells[2],
    /<dt>Event verification<\/dt>[\s\S]*activeMedia\.eventVerification/,
  );
  assert.match(mediaGridCells[3], /className="media-status-grid-empty" aria-hidden="true"/);
  assert.match(mediaGridCells[3], /<dt \/>[\s\S]*<dd \/>/);
  assert.equal(mediaGridCells[3].replace(/<[^>]+>/g, "").trim(), "");
  assert.doesNotMatch(mediaGridMarkup, /Source &amp; provenance|Publication &amp; rights status/);
  for (const removedCopy of [
    "Media type",
    "No approved media",
    "Not published",
    "Typographic record preview",
    "Awaiting rights and verification review",
  ]) {
    assert.doesNotMatch(carousel, new RegExp(removedCopy, "i"));
  }
  assert.match(page, /const reviewedEvents = await getReviewedEvents\(\)/);
  assert.match(page, /events\.map\(\(\{ approvedMedia, internalId, slug, visual \}\)/);
  assert.match(page, /getHomepageVisual\(homepageVisualsByInternalId, record\.id\)/);
  assert.doesNotMatch(page, /https?:\/\//);
  assert.doesNotMatch(featuredBlock, /publicationStatus: "published_source_embed"/);
  assert.doesNotMatch(featuredBlock, /rightsStatus: "permission_requested"/);
  assert.match(
    featuredBlock,
    /sourceProvenance: "Reviewed record sources; no approved event visual"/,
  );
  assert.equal((featuredBlock.match(/publicationRightsStatus:/g) ?? []).length, 3);
  assert.match(carousel, /sourceProvenance: string;/);
  assert.match(carousel, /publicationRightsStatus: string;/);
  assert.equal((carousel.match(/eventVerification: string;/g) ?? []).length, 2);
  assert.match(carousel, /type FeaturedRecord = \{[\s\S]*?directedAt: string;/);

  const publicDisclosureMappings = Object.fromEntries(
    [
      ...featuredBlock.matchAll(
        /id: "([^"]+)",[\s\S]*?directedAt: "([^"]+)",[\s\S]*?media: \{[\s\S]*?eventVerification: "([^"]+)"/g,
      ),
    ].map(([, id, directedAt, eventVerification]) => [id, { directedAt, eventVerification }]),
  );
  assert.deepEqual(publicDisclosureMappings, {
    "IO-CM-KA-0002": {
      directedAt: "State government — Karnataka",
      eventVerification: "Event confirmed",
    },
    "IO-CM-MN-0001": {
      directedAt: "State government — Manipur",
      eventVerification: "Event confirmed",
    },
    "IO-CM-OD-0001": {
      directedAt: "District education authorities — Jajpur",
      eventVerification: "Event and outcome confirmed",
    },
  });
  for (const { directedAt, eventVerification } of Object.values(publicDisclosureMappings)) {
    assert.ok(directedAt.trim());
    assert.doesNotMatch(
      eventVerification,
      /occurrence verified|provenance|event match|corroborated|human editorial review|verification gate|status code/i,
    );
  }
  assert.equal((featuredBlock.match(/format: "Text record"/g) ?? []).length, 3);
  assert.match(styles, /\.media-status-grid\s*\{[\s\S]*?grid-template-columns: 1fr 1fr;/);
  assert.match(
    styles,
    /\.featured-carousel \.featured-slide--media\s*\{[\s\S]*?grid-template-columns: minmax\(0, 34fr\) minmax\(0, 66fr\);/,
  );
  assert.match(
    styles,
    /\.featured-record-video-frame\s*\{[\s\S]*?aspect-ratio: 16 \/ 9;[\s\S]*?width: 100%;/,
  );
  assert.match(
    carousel,
    /featured-record-disclosure[\s\S]*featured-record-content[\s\S]*featuredRecordCopy\(false\)[\s\S]*featured-record-media[\s\S]*featured-record-video-frame[\s\S]*<EventVisual[\s\S]*variant="homepage-featured"[\s\S]*\{carouselPosition\}/,
  );
  assert.match(carousel, /className="hero-copy featured-slide featured-slide--media"/);
  assert.match(
    carousel,
    /featured-record-context[\s\S]*Event context[\s\S]*activeRecord\.description/,
  );
  assert.match(featuredBlock, /Farmers and villagers near Bidadi oppose land acquisition/);
  assert.match(featuredBlock, /statewide cease-work strike centres on a seven-point charter/);
  assert.match(featuredBlock, /Students protested after staffing fell to 11 teachers/);
  const disclosureMarkup = carousel.match(
    /<aside className="featured-record-disclosure"[\s\S]*?<\/aside>/,
  )?.[0];
  assert.ok(disclosureMarkup);
  assert.doesNotMatch(disclosureMarkup, /publisher-video|featured-record-caption|<h1>/);
  assert.match(carousel, /loadedMediaId === activeRecord\.id[\s\S]*featured-record-caption/);
  assert.match(carousel, /visual: EventVisualData;[\s\S]*eventHref: string;/);
  assert.match(
    carousel,
    /loadedMediaId === activeRecord\.id[\s\S]*?<iframe[\s\S]*?: \([\s\S]*?publisher-video-gate event-media-activation[\s\S]*?No third-party[\s\S]*?before activation/,
  );
  assert.match(carousel, /onClick=\{\(\) => setLoadedMediaId\(activeRecord\.id\)\}/);
  assert.doesNotMatch(carousel, /autoPlay/);
  assert.doesNotMatch(featuredBlock, /thumbnailUrl|embedUrl|sourceUrl|thumbnailAlt|sourceName/);
  assert.match(mediaMigration, /status public\.media_review_status not null default 'draft'/);
  assert.match(mediaMigration, /create function public\.approve_event_media\s*\(/);
  for (const controlledStatus of [
    "candidate",
    "provenance_confirmed",
    "event_match_confirmed",
    "corroborated",
    "rejected",
    "original_source_display",
    "permission_requested",
    "permission_granted",
    "permission_denied",
    "reuse_restricted",
    "published_source_embed",
    "published_source_link",
    "published_with_permission",
    "withheld_privacy",
    "withheld_safety",
    "rejected_verification",
    "removed_or_corrected",
  ]) {
    assert.match(carousel, new RegExp(`"${controlledStatus}"`));
  }
  assert.match(carousel, /4000/);
  assert.doesNotMatch(carousel, /isHovered|onMouseEnter|onMouseLeave/);
  assert.doesNotMatch(latestMarkup, /Currently featured|aria-current|onClick|setActiveIndex/);

  assert.match(page, /<h2 id="on-record-title">ON RECORD<\/h2>/);
  assert.doesNotMatch(page, />On the record</);
  assert.doesNotMatch(page, /Compare the accounts/);
  assert.doesNotMatch(page, /Movement representatives said|Authorities said|accounts-grid/);
  assert.match(onRecordBlock, /IO-CM-GJ-0001/);
  assert.match(onRecordBlock, /Land & rehabilitation/);
  assert.match(onRecordBlock, /Jetpar village, Morbi district, Gujarat/);
  assert.match(
    onRecordBlock,
    /Morbi farmers continue satyagraha over compensation for power-transmission infrastructure/,
  );
  assert.match(
    onRecordBlock,
    /Farmers centred in Jetpar village began protesting on 7 June[\s\S]*implementation remained\./,
  );
  assert.match(onRecordBlock, /15 July 2026/);
  assert.match(
    onRecordBlock,
    /Dasiya villagers protest construction of an ethanol plant in Basti district/,
  );
  assert.match(
    onRecordBlock,
    /Bodo residents protest proposed APDCL land allotment and resettlement plan in Kokrajhar/,
  );
  assert.doesNotMatch(page, /verificationLabels|verification-key/);
  for (const label of ["REPORTED", "CORROBORATED", "ATTRIBUTED", "DISPUTED", "CORRECTED"]) {
    assert.doesNotMatch(page, new RegExp(">" + label + "<", "i"));
  }

  assert.match(page, /<div className="methodology-intro">\s*<h2>Methodology<\/h2>/);
  assert.match(
    styles,
    /\.methodology-section\s*\{\s*padding-block: 0\.75rem clamp\(3rem, 6vw, 4\.5rem\)/,
  );
  assert.match(styles, /\.methodology-section \.process-list p\s*\{\s*color: #365f5a/);
  assert.match(styles, /\.methodology-description\s*\{\s*color: #365f5a/);
  for (const stage of [
    "Find the event",
    "Separate the claims",
    "Check the evidence",
    "Review before publication",
  ]) {
    assert.match(page, new RegExp(stage));
  }

  assert.match(page, /<h2 className="coverage-heading">COVERAGE<\/h2>/);
  assert.match(page, /<p className="coverage-subheading">Across India, event by event\.<\/p>/);
  for (const [countExpression, label] of [
    ["coverageStates", "states and Union Territories represented"],
    ["reviewedEvents.length", "reviewed event records"],
    ["coverageSources", "source records linked to reviewed events"],
  ]) {
    assert.match(
      page,
      new RegExp(
        `<strong>\\{${countExpression.replace(".", "\\.")}\\}<\\/strong>[\\s\\S]*?${label}`,
      ),
    );
  }
  assert.doesNotMatch(page, /live locations or participant directories published/i);
  assert.match(styles, /\.coverage-heading\s*\{[\s\S]*?font-size: clamp\(2rem, 3\.2vw, 2\.9rem\)/);
  assert.match(
    styles,
    /\.coverage-grid > div:first-child \.coverage-subheading\s*\{[\s\S]*?font-size: clamp\(1\.45rem, 2\.4vw, 2\.1rem\)/,
  );

  assert.doesNotMatch(page, /Explore the archive/i);
  assert.doesNotMatch(page, /Open questions|Documentation still needed|Documentation gap/);
  assert.doesNotMatch(styles, /\.open-questions/);
});

test("all nine homepage records use the central reviewed visual treatments", () => {
  const page = read("src/app/page.tsx");
  const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
  const eventVisual = read("src/app/events/components/EventVisual.tsx");
  const mediaRegistry = read("src/data/event-media-registry.ts");
  const publicMediaLoader = read("src/lib/media/public.ts");
  const dataset = read("src/data/reviewed-events-preview.ts");
  const styles = read("src/app/globals.css");

  const datasetBlock = (id) => {
    const start = dataset.indexOf(`internalId: "${id}"`);
    const end = dataset.indexOf('\n  {\n    internalId: "', start + 1);
    assert.ok(start >= 0, `${id} must exist in the reviewed Events dataset`);
    return dataset.slice(start, end === -1 ? undefined : end);
  };

  const featuredIds = ["IO-CM-KA-0002", "IO-CM-MN-0001", "IO-CM-OD-0001"];
  const latestIds = ["IO-CM-MP-0001", "IO-CM-DL-0001", "IO-CM-MH-0001"];
  const onRecordIds = ["IO-CM-GJ-0001", "IO-CM-UP-0001", "IO-CM-AS-0001"];
  assert.equal(new Set([...featuredIds, ...latestIds, ...onRecordIds]).size, 9);
  for (const id of [...featuredIds, ...latestIds, ...onRecordIds]) datasetBlock(id);
  assert.doesNotMatch(dataset, /visual: (?:recordCover|publisherVideo)/);
  assert.equal((mediaRegistry.match(/kind: "publisher_video"/g) ?? []).length, 0);
  assert.match(mediaRegistry, /createNoApprovedMediaVisual\(event\)/);

  assert.match(
    page,
    /import \{ getReviewedEvents, isCandidatePreviewEnabled \} from "\.\.\/lib\/events\/getReviewedEvents"/,
  );
  assert.match(page, /createHomepageVisualMap\(reviewedEvents\)/);
  assert.equal((page.match(/getHomepageVisual\(/g) ?? []).length >= 3, true);
  assert.doesNotMatch(page, /thumbnailUrl:|embedUrl:|sourceUrl:|https?:\/\//);
  assert.match(publicMediaLoader, /get_public_event_media/);

  assert.match(carousel, /variant="homepage-featured"/);
  assert.match(carousel, /variant="homepage-latest"/);
  assert.match(page, /variant="homepage-on-record"/);
  assert.match(carousel, /approvedMedia\.mediaType !== "uploaded_event_image"/);
  assert.match(carousel, /src=\{approvedMedia\.embedUrl\}/);
  assert.match(carousel, /useState<string \| null>\(null\)/);
  assert.match(
    carousel,
    /loadedMediaId === activeRecord\.id[\s\S]*?<iframe[\s\S]*?onClick=\{\(\) => setLoadedMediaId\(activeRecord\.id\)\}/,
  );

  const latestMarkup = carousel.match(
    /\{latestRecords\.map\(\(record\) => \(([\s\S]*?)\)\)\}/,
  )?.[1];
  assert.ok(latestMarkup);
  assert.match(latestMarkup, /<EventVisual[\s\S]*?variant="homepage-latest"/);
  assert.doesNotMatch(latestMarkup, /iframe|embedUrl|setLoadedMediaId/);
  assert.doesNotMatch(page, /instagram\.com|facebook\.com|(?:https?:\/\/)?x\.com/);
  assert.doesNotMatch(page, /<iframe/);

  assert.doesNotMatch(eventVisual, /EventEditorialIllustration|<svg/);
  assert.doesNotMatch(eventVisual, /Verified event media|MediaClassificationLabel/);
  assert.match(eventVisual, /getPublicMediaCaption\(approvedMedia\)/);
  assert.match(eventVisual, /getPublicSourceLinkLabel\(approvedMedia\)/);
  assert.doesNotMatch(eventVisual, /ExternalMediaImage/);

  assert.match(styles, /\.featured-carousel \.featured-slide[\s\S]*?height: 30rem;/);
  assert.match(
    styles,
    /\.featured-carousel \.featured-slide--media[\s\S]*?grid-template-columns: minmax\(0, 34fr\) minmax\(0, 66fr\);/,
  );
  assert.match(
    styles,
    /\.featured-record-video-frame[\s\S]*?aspect-ratio: 16 \/ 9;[\s\S]*?width: 100%;/,
  );
  assert.match(
    styles,
    /\.latest-records-grid[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    styles,
    /\.latest-entry-preview[\s\S]*?grid-template-columns: minmax\(0, 1fr\);[\s\S]*?grid-template-rows: auto auto;/,
  );
  assert.match(
    styles,
    /\.on-record-context[\s\S]*?border-bottom: 1px solid var\(--ink\);[\s\S]*?border-top: 1px solid var\(--ink\);[\s\S]*?grid-template-columns: minmax\(0, 58fr\) minmax\(0, 42fr\);/,
  );
  assert.match(
    styles,
    /\.on-record-context h3[\s\S]*?font-size: clamp\(1\.45rem, 2\.5vw, 2\.1rem\)/,
  );
  assert.match(styles, /\.on-record-copy > p[\s\S]*?font-size: 0\.9rem/);
  assert.doesNotMatch(page, /Open questions/i);
});

test("homepage event types use one controlled vocabulary across every record area", () => {
  const page = read("src/app/page.tsx");
  const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
  const tag = read("src/app/components/EventTypeTag.tsx");
  const vocabulary = read("src/app/eventTypes.ts");

  const featuredBlock = page.match(/const featuredRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const latestBlock = page.match(/const latestRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const onRecordBlock = page.match(
    /const onRecords = \[([\s\S]*?)\] as const satisfies readonly OnRecord\[\];/,
  )?.[1];
  const vocabularyBlock = vocabulary.match(
    /export const eventTypes = \{([\s\S]*?)\} as const;/,
  )?.[1];

  assert.ok(featuredBlock);
  assert.ok(latestBlock);
  assert.ok(onRecordBlock);
  assert.ok(vocabularyBlock);

  const recordEventTypes = (source) =>
    Object.fromEntries(
      [...source.matchAll(/id: "([^"]+)",\s+eventType: "([^"]+)"/g)].map(([, id, eventType]) => [
        id,
        eventType,
      ]),
    );
  const vocabularyEntries = [
    ...vocabularyBlock.matchAll(
      /^\s{2}([a-z_]+): \{\s+label: "([^"]+)",\s+definition:\s+"([^"]+)"/gm,
    ),
  ];
  const vocabularyKeys = vocabularyEntries.map(([, key]) => key);
  const definitions = Object.fromEntries(
    vocabularyEntries.map(([, key, label, definition]) => [key, { label, definition }]),
  );

  assert.deepEqual(recordEventTypes(featuredBlock), {
    "IO-CM-KA-0002": "protest",
    "IO-CM-MN-0001": "strike",
    "IO-CM-OD-0001": "protest",
  });
  assert.deepEqual(recordEventTypes(latestBlock), {
    "IO-CM-MP-0001": "protest",
    "IO-CM-DL-0001": "sit_in",
    "IO-CM-MH-0001": "human_chain",
  });
  assert.deepEqual(recordEventTypes(onRecordBlock), {
    "IO-CM-GJ-0001": "satyagraha",
    "IO-CM-UP-0001": "demonstration",
    "IO-CM-AS-0001": "demonstration",
  });

  for (const eventType of [
    ...Object.values(recordEventTypes(featuredBlock)),
    ...Object.values(recordEventTypes(latestBlock)),
    ...Object.values(recordEventTypes(onRecordBlock)),
  ]) {
    assert.ok(vocabularyKeys.includes(eventType));
  }
  assert.equal(vocabularyEntries.length, 11);
  for (const [, , label, definition] of vocabularyEntries) {
    assert.ok(label.trim());
    assert.ok(definition.trim());
  }
  assert.deepEqual(
    Object.fromEntries(Object.entries(definitions).map(([key, value]) => [key, value.definition])),
    {
      dharna:
        "A sustained protest at a fixed place where participants remain present while pressing stated demands.",
      strike:
        "A coordinated refusal to work or provide normal services as a form of collective protest.",
      sit_in:
        "A protest in which participants sit or remain at a particular place for a period of time.",
      hunger_strike:
        "A protest in which one or more participants abstain from food to press stated demands.",
      rally:
        "An organised public gathering where people assemble to express support, opposition or demands.",
      march: "An organised protest in which participants move together from one place to another.",
      demonstration:
        "An organised public action or gathering expressing opposition, support or a demand.",
      human_chain:
        "A symbolic public action in which participants stand together in a connected line or formation.",
      satyagraha: "A form of nonviolent resistance used to press a demand or oppose an action.",
      shutdown:
        "A coordinated closure or suspension of businesses, transport or services as a form of protest.",
      protest: "A public expression of opposition, support or demands by an individual or group.",
    },
  );
  for (const { definition } of Object.values(definitions)) {
    assert.doesNotMatch(
      definition,
      /Use this|Do not|fallback|classification|organisers|reliable sources|more specific event form/i,
    );
  }

  assert.match(carousel, /eventType: EventType;/);
  assert.match(
    carousel,
    /type LatestRecord = Pick<[\s\S]*?"id"[\s\S]*?"eventType"[\s\S]*?"eventStatus"[\s\S]*?"title"/,
  );
  assert.match(page, /type OnRecord = \{[\s\S]*?eventType: EventType;/);
  assert.match(
    carousel,
    /featured-meta[\s\S]*?<EventTypeTag eventType=\{activeRecord\.eventType\}/,
  );
  assert.match(carousel, /latestRecords\.map[\s\S]*?<EventTypeTag eventType=\{record\.eventType\}/);
  assert.match(page, /on-record-meta[\s\S]*?<EventTypeTag eventType=\{record\.eventType\}/);
  assert.match(page, /<details className="event-type-guide">/);
  assert.match(page, /<summary>Event type definitions<\/summary>/);
  assert.match(page, /Object\.entries\(eventTypes\)\.map/);
  assert.match(tag, /eventType: EventType;/);
  assert.match(tag, /aria-label=\{`Event type: \$\{label\}\. \$\{definition\}`\}/);
  assert.match(tag, /title=\{definition\}/);
  assert.doesNotMatch(tag, /<button/);

  for (const block of [featuredBlock, latestBlock, onRecordBlock]) {
    assert.match(block, /eventType:/);
    assert.match(block, /topic:/);
  }
  assert.doesNotMatch(page, /Open questions/i);
});

test("homepage event statuses use one controlled public vocabulary", () => {
  const page = read("src/app/page.tsx");
  const carousel = read("src/app/components/FeaturedRecordCarousel.tsx");
  const statuses = read("src/app/eventStatuses.ts");
  const statusTag = read("src/app/components/EventStatusTag.tsx");
  const styles = read("src/app/globals.css");

  const featuredBlock = page.match(/const featuredRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const latestBlock = page.match(/const latestRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const onRecordBlock = page.match(
    /const onRecords = \[([\s\S]*?)\] as const satisfies readonly OnRecord\[\];/,
  )?.[1];
  assert.ok(featuredBlock);
  assert.ok(latestBlock);
  assert.ok(onRecordBlock);

  const recordStatuses = (source) =>
    Object.fromEntries(
      [...source.matchAll(/id: "([^"]+)",[\s\S]*?eventStatus: "([^"]+)"/g)].map(
        ([, id, eventStatus]) => [id, eventStatus],
      ),
    );
  assert.deepEqual(recordStatuses(featuredBlock), {
    "IO-CM-KA-0002": "ongoing",
    "IO-CM-MN-0001": "ongoing",
    "IO-CM-OD-0001": "concluded",
  });
  assert.deepEqual(recordStatuses(latestBlock), {
    "IO-CM-MP-0001": "ongoing",
    "IO-CM-DL-0001": "ongoing",
    "IO-CM-MH-0001": "concluded",
  });
  assert.deepEqual(recordStatuses(onRecordBlock), {
    "IO-CM-GJ-0001": "ongoing",
    "IO-CM-UP-0001": "ongoing",
    "IO-CM-AS-0001": "concluded",
  });

  for (const [key, label] of [
    ["announced", "Upcoming"],
    ["ongoing", "Ongoing"],
    ["paused", "Paused"],
    ["concluded", "Completed"],
    ["unresolved", "Unresolved"],
    ["outcome_pending", "Outcome pending"],
    ["unknown", "Status unclear"],
  ]) {
    assert.match(statuses, new RegExp(`${key}: \\{ label: "${label}"`));
  }
  assert.match(carousel, /eventStatus: EventStatus;/);
  assert.match(page, /eventStatus: EventStatus;/);
  assert.match(statusTag, /eventStatus: EventStatus;/);
  assert.match(statusTag, /aria-label=\{`Event status: \$\{label\}`\}/);
  assert.doesNotMatch(statusTag, /<button/);
  assert.match(
    carousel,
    /featured-meta[\s\S]*?event-tags[\s\S]*?<EventTypeTag[\s\S]*?<EventStatusTag/,
  );
  assert.match(
    carousel,
    /latestRecords\.map[\s\S]*?event-tags[\s\S]*?<EventTypeTag[\s\S]*?<EventStatusTag/,
  );
  assert.match(
    page,
    /on-record-meta[\s\S]*?event-tags[\s\S]*?<EventTypeTag[\s\S]*?<EventStatusTag/,
  );
  assert.match(
    styles,
    /\.event-type-tag,[\s\S]*?\.event-status-tag\s*\{[\s\S]*?border-width: 2px;/,
  );
});

test("homepage uses the refined section hierarchy and editorial footer", () => {
  const page = read("src/app/page.tsx");
  const styles = read("src/app/globals.css");
  const social = read("src/app/components/FooterSocialPlaceholders.tsx");
  const footer = page.match(/<footer className="site-footer">([\s\S]*?)<\/footer>/)?.[1];

  assert.ok(footer);
  assert.doesNotMatch(page, /Recent corrections and clarifications|Changes remain visible/);
  assert.doesNotMatch(page, /No recent record changes have been published/);
  assert.doesNotMatch(styles, /\.correction-stream|\.correction-empty-state/);
  assert.match(footer, /href="\/corrections">Corrections/);
  assert.doesNotMatch(footer, /href="#corrections"/i);

  assert.match(page, /<h2 id="on-record-title">ON RECORD<\/h2>/);
  assert.match(
    styles,
    /\.on-record-section h2\s*\{[\s\S]*?border-top: 3px double var\(--ink\);[\s\S]*?text-align: center;/,
  );

  assert.match(page, /<section className="coverage-section" id="coverage">/);
  assert.match(
    page,
    /coverage-heading">COVERAGE<[\s\S]*?coverage-subheading">Across India, event by event\.<[\s\S]*?coverage-description">/,
  );
  assert.match(styles, /\.coverage-section\s*\{\s*padding-block: 0\.4rem/);

  const maxClampValue = (selector) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const value = styles.match(
      new RegExp(
        `${escapedSelector}\\s*\\{[\\s\\S]*?font-size: clamp\\([^,]+,[^,]+, ([0-9.]+)rem\\)`,
      ),
    )?.[1];
    assert.ok(value, `Missing clamp size for ${selector}`);
    return Number(value);
  };
  assert.ok(
    maxClampValue(".coverage-heading") >
      maxClampValue(".coverage-grid > div:first-child .coverage-subheading"),
  );
  assert.ok(
    maxClampValue(".coverage-grid > div:first-child .coverage-subheading") >
      maxClampValue(".coverage-grid > div:first-child .coverage-description"),
  );

  for (const [countExpression, label] of [
    ["coverageStates", "states and Union Territories represented"],
    ["reviewedEvents.length", "reviewed event records"],
    ["coverageSources", "source records linked to reviewed events"],
  ]) {
    assert.match(
      page,
      new RegExp(
        `<strong>\\{${countExpression.replace(".", "\\.")}\\}<\\/strong>[\\s\\S]*?${label}`,
      ),
    );
  }

  assert.match(
    page,
    /<section className="participation-section" aria-labelledby="contribute-title">/,
  );
  assert.match(page, /id="contribute-title" className="contribute-heading"[\s\S]*?CONTRIBUTE/);
  assert.match(page, /className="contribute-subheading">Want to report a public event\?<\/p>/);
  assert.doesNotMatch(page, /Know of an undercovered civic event\?/);
  assert.match(styles, /\.lead-panel\s*\{[\s\S]*?text-align: center;/);
  assert.ok(
    maxClampValue(".contribute-heading") > maxClampValue(".lead-panel .contribute-subheading"),
  );
  assert.ok(
    maxClampValue(".lead-panel .contribute-subheading") >
      maxClampValue(".lead-panel .contribute-description"),
  );

  assert.match(styles, /--footer-background: #173f38;/);
  assert.match(styles, /--footer-text: #f7f2e8;/);
  assert.match(styles, /--footer-muted: #c2d1cb;/);
  assert.match(styles, /--footer-line: #4f726a;/);
  assert.match(styles, /\.site-footer\s*\{\s*background: var\(--footer-background\);/);
  for (const group of [
    "footer-identity",
    "footer-explore",
    "footer-follow",
    "footer-trust-strip",
  ]) {
    assert.match(footer, new RegExp(`className="${group}"`));
  }
  const footerNav = footer.match(/<nav aria-label="Footer navigation">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(footerNav);
  assert.deepEqual(
    [...footerNav.matchAll(/<(?:a|Link) href="([^"]+)">([^<]+)<\/(?:a|Link)>/g)].map(
      ([, href, label]) => [href, label],
    ),
    [
      ["#home", "Home"],
      ["/events", "Events"],
      ["/methodology", "Methodology"],
      ["#coverage", "Coverage"],
      ["/editorial-policy", "Editorial policy"],
      ["/sources-verification", "Sources & verification"],
      ["/corrections", "Corrections"],
      ["/media-policy", "Media policy"],
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
      ["/contact", "Contact"],
      ["/copyright", "Copyright & takedown"],
      ["#lead", "Submit a lead"],
    ],
  );

  assert.match(social, /aria-label="Planned social channels: Instagram, YouTube and X"/);
  for (const platform of ["Instagram", "YouTube", "X"]) {
    assert.match(social, new RegExp(`<span className="sr-only">${platform}<\\/span>`));
  }
  assert.equal((social.match(/<svg /g) ?? []).length, 3);
  assert.equal((social.match(/focusable="false"/g) ?? []).length, 3);
  assert.doesNotMatch(social, /<a\b|href=|tabIndex=|followers?|@[A-Za-z]|Coming soon/i);
  for (const trustItem of [
    "Sources linked",
    "Human review before publication",
    "Identities protected",
  ]) {
    assert.match(footer, new RegExp(trustItem));
  }
});

test("homepage preserves the approved black header and white page surfaces", () => {
  const styles = read("src/app/globals.css");
  const activeSurfaceStyles = styles.slice(
    styles.lastIndexOf("/* Approved black-header and white-page treatment */"),
  );

  assert.match(
    activeSurfaceStyles,
    /:root\s*\{[\s\S]*?--paper: #ffffff;[\s\S]*?--paper-deep: #ffffff;[\s\S]*?--surface: #ffffff;/,
  );
  assert.match(activeSurfaceStyles, /body,[\s\S]*?main,[\s\S]*?background: #ffffff;/);
  assert.match(activeSurfaceStyles, /\.site-header\s*\{[\s\S]*?background: #151616;/);
  assert.match(
    activeSurfaceStyles,
    /\.site-header \.nav-action\s*\{\s*border-color: #ffffff;\s*color: #ffffff;/,
  );
  assert.match(activeSurfaceStyles, /\.mobile-menu nav a\s*\{\s*color: var\(--ink\);/);
  assert.match(
    activeSurfaceStyles,
    /\.site-header \.brand-copy small,[\s\S]*?\.site-header \.desktop-nav,[\s\S]*?color: #ffffff;/,
  );
  assert.match(
    activeSurfaceStyles,
    /\.site-header \.brand-mark,[\s\S]*?\.site-header \.mobile-menu summary[\s\S]*?border-color: #ffffff;/,
  );
  assert.match(styles, /:focus-visible\s*\{\s*outline: 3px solid var\(--focus\);/);
  assert.doesNotMatch(activeSurfaceStyles, /\.site-header \.nav-action,\s*\.mobile-menu nav a/);

  for (const selector of [
    ".utility-bar",
    ".featured-carousel",
    ".on-record-section",
    ".methodology-section",
    ".coverage-section",
    ".participation-section",
    ".mobile-menu nav",
  ]) {
    assert.ok(activeSurfaceStyles.includes(selector));
  }

  assert.match(
    styles,
    /\.event-no-media,[\s\S]*?\.event-source-media-cover \{[\s\S]*?background: #ffffff;/,
  );
  const whiteSurfaceRule = activeSurfaceStyles.match(
    /body,[\s\S]*?main \.lead-panel\s*\{\s*background: #ffffff;\s*\}/,
  )?.[0];
  assert.ok(whiteSurfaceRule);
  assert.doesNotMatch(whiteSurfaceRule, /#f5f2ea|#ebe6db|#fbfaf6|#f7f2e8|#fbf8f1/);
  assert.match(activeSurfaceStyles, /\.site-footer\s*\{\s*background: var\(--footer-background\);/);
  assert.doesNotMatch(read("src/app/page.tsx"), /Open questions/i);
});
