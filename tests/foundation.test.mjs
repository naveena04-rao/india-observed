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
    ["#about", "About"],
    ["#events", "Events"],
    ["#methodology", "Methodology"],
    ["#lead", "Submit a lead"],
  ];
  const navigationLinks = (markup) =>
    [...markup.matchAll(/<a(?: className="[^"]*")? href="([^"]+)">([\s\S]*?)<\/a>/g)].map(
      ([, href, label]) => [
        href,
        label
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      ],
    );
  const desktopNav = page.match(
    /<nav className="desktop-nav" aria-label="Primary navigation">([\s\S]*?)<\/nav>/,
  )?.[1];
  const mobileNav = page.match(/<nav aria-label="Mobile navigation">([\s\S]*?)<\/nav>/)?.[1];

  assert.ok(desktopNav);
  assert.ok(mobileNav);
  assert.deepEqual(navigationLinks(desktopNav), expectedNavigation);
  assert.deepEqual(navigationLinks(mobileNav), expectedNavigation);
  assert.match(page, /<main id="home">/);
  assert.match(carousel, /id="about"/);
  assert.match(carousel, /id="events"/);
  assert.match(page, /id="methodology"/);
  assert.match(page, /id="lead"/);

  assert.match(page, /Independent records of protests and civic movements across India/i);
  assert.match(page, /Sources linked\. Identities protected\. Corrections visible\./i);
  assert.match(page, /tactical information/i);
  assert.match(page, /Human review/i);
  for (const label of [
    "Media format",
    "Source &amp; provenance",
    "Event verification",
    "Publication &amp; rights status",
  ]) {
    assert.match(carousel, new RegExp(label));
  }
  for (const removedCopy of [
    "Media type",
    "No approved media",
    "Not published",
    "Typographic record preview",
    "Awaiting rights and verification review",
  ]) {
    assert.doesNotMatch(carousel, new RegExp(removedCopy, "i"));
  }
  assert.match(featuredBlock, /IO-CM-KA-0002[\s\S]*kind: "publisher_video"/);
  assert.match(featuredBlock, /www\.ndtv\.com\/videos\/embed-player\/\?id=1120270/);
  assert.match(
    featuredBlock,
    /thumbnailUrl:\s*"https:\/\/c\.ndtvimg\.com\/2026-06\/t9gf8cms_bidadi_160x120_30_June_26\.png\?downsize=1600:900"/,
  );
  assert.match(featuredBlock, /thumbnailAlt:\s*"People gathered outdoors during the Bidadi/);
  assert.match(featuredBlock, /publicationStatus: "published_source_embed"/);
  assert.match(featuredBlock, /rightsStatus: "permission_requested"/);
  assert.equal((featuredBlock.match(/kind: "text_record"/g) ?? []).length, 2);
  assert.match(
    carousel,
    /featured-record-disclosure[\s\S]*featured-record-content[\s\S]*featuredRecordCopy\(false\)[\s\S]*featured-record-media[\s\S]*featured-record-media--empty[\s\S]*featured-record-video-frame[\s\S]*featured-record-media-empty[\s\S]*\{carouselPosition\}/,
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
  assert.match(
    carousel,
    /type PublisherVideoMedia = \{[\s\S]*thumbnailUrl: string;[\s\S]*thumbnailAlt: string;/,
  );
  assert.match(
    carousel,
    /loadedMediaId === activeRecord\.id[\s\S]*?<iframe[\s\S]*?: \([\s\S]*?publisher-video-gate[\s\S]*?<img src=\{activeMedia\.thumbnailUrl\}/,
  );
  assert.match(carousel, /onClick=\{\(\) => setLoadedMediaId\(activeRecord\.id\)\}/);
  assert.doesNotMatch(carousel, /autoPlay/);
  assert.doesNotMatch(featuredBlock, /thumbnailUrl:\s*"\//);
  assert.match(carousel, /Auto-publication remains disabled/);
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

  assert.match(page, /<h2 id="on-record-title">ON record<\/h2>/);
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

  assert.match(page, /<h2 className="coverage-heading">Coverage<\/h2>/);
  assert.match(page, /<p className="coverage-subheading">Across India, event by event\.<\/p>/);
  for (const [count, label] of [
    ["16", "states and Union Territories represented"],
    ["22", "reviewed event records"],
    ["77", "source records linked to reviewed events"],
  ]) {
    assert.match(page, new RegExp(`<strong>${count}<\\/strong>[\\s\\S]*?${label}`));
  }
  assert.doesNotMatch(page, /live locations or participant directories published/i);
  assert.match(styles, /\.coverage-heading\s*\{[\s\S]*?font-size: clamp\(2\.6rem/);
  assert.match(
    styles,
    /\.coverage-grid > div:first-child \.coverage-subheading\s*\{[\s\S]*?font-size: clamp\(1\.4rem/,
  );

  assert.doesNotMatch(page, /Explore the archive/i);
  assert.doesNotMatch(page, /Open questions|Documentation still needed|Documentation gap/);
  assert.doesNotMatch(styles, /\.open-questions/);
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
  assert.match(carousel, /"id" \| "eventType" \| "eventStatus" \| "title"/);
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
    ".correction-stream",
    ".participation-section",
    ".site-footer",
    ".mobile-menu nav",
    ".document-preview",
    ".media-fallback",
  ]) {
    assert.ok(activeSurfaceStyles.includes(selector));
  }

  assert.match(activeSurfaceStyles, /\.media-fallback,[\s\S]*?background: #ffffff;/);
  assert.doesNotMatch(activeSurfaceStyles, /#f5f2ea|#ebe6db|#fbfaf6|#f7f2e8|#fbf8f1/);
  assert.doesNotMatch(read("src/app/page.tsx"), /Open questions/i);
});
