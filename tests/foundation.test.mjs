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
  const onRecordBlock = page.match(/const onRecords = \[([\s\S]*?)\] as const;/)?.[1];
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

  assert.match(styles, /body,[\s\S]*?background: #ffffff;/);
  assert.match(styles, /\.site-header,[\s\S]*?background: #000000;/);
  assert.match(styles, /\.utility-bar,[\s\S]*?background: #000000;/);
  assert.match(styles, /\.site-header[\s\S]*?color: #ffffff;/);
  assert.match(styles, /\.site-footer,[\s\S]*?background: #ffffff;/);

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
  assert.match(featuredBlock, /publicationStatus: "published_source_embed"/);
  assert.match(featuredBlock, /rightsStatus: "permission_requested"/);
  assert.equal((featuredBlock.match(/kind: "text_record"/g) ?? []).length, 2);
  assert.match(carousel, /featured-record-right[\s\S]*featured-record-media-area/);
  assert.match(carousel, /loadedMediaId === activeRecord\.id[\s\S]*featured-record-caption/);
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
  for (const stage of [
    "Find the event",
    "Separate the claims",
    "Check the evidence",
    "Review before publication",
  ]) {
    assert.match(page, new RegExp(stage));
  }

  assert.doesNotMatch(page, /Explore the archive/i);
});
