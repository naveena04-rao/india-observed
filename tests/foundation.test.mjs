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
  const featuredBlock = page.match(/const featuredRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const latestBlock = page.match(/const latestRecords = \[([\s\S]*?)\] as const;/)?.[1];
  const latestMarkup = carousel.match(
    /\{latestRecords\.map\(\(record\) => \(([\s\S]*?)\)\)\}/,
  )?.[1];

  assert.ok(featuredBlock);
  assert.ok(latestBlock);
  assert.ok(latestMarkup);

  const recordIds = (source) => [...source.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
  const featuredIds = recordIds(featuredBlock);
  const latestIds = recordIds(latestBlock);

  assert.deepEqual(featuredIds, ["IO-CM-KA-0002", "IO-CM-MN-0001", "IO-CM-OD-0001"]);
  assert.deepEqual(latestIds, ["IO-CM-MP-0001", "IO-CM-DL-0001", "IO-CM-MH-0001"]);
  assert.equal(featuredIds.filter((id) => latestIds.includes(id)).length, 0);

  assert.match(page, /Independent records of protests and civic movements across India/i);
  assert.match(page, /Sources linked\. Identities protected\. Corrections visible\./i);
  assert.match(page, /tactical information/i);
  assert.match(page, /Human review/i);
  assert.match(carousel, /No approved media/i);
  assert.match(
    page,
    /<FeaturedRecordCarousel records=\{featuredRecords\} latestRecords=\{latestRecords\} \/>/,
  );
  assert.match(carousel, /4000/);
  assert.doesNotMatch(carousel, /Show previous featured record|Show next featured record/);
  assert.doesNotMatch(latestMarkup, /Currently featured|aria-current|onClick|setActiveIndex/);

  assert.match(page, /<div className="methodology-intro">\s*<h2>Methodology<\/h2>/);
  assert.match(page, /<p className="methodology-subheading">How are records reviewed<\/p>/);
  assert.match(
    page,
    /Every record is reviewed before publication\. We verify the event, separate claims from\s*established facts, compare supporting sources and check for privacy or safety risks\./,
  );
  for (const stage of [
    "Find the event",
    "Separate the claims",
    "Check the evidence",
    "Review before publication",
  ]) {
    assert.match(page, new RegExp(stage));
  }

  assert.match(page, /<h2 id="accounts-title">On the record<\/h2>/);
  assert.match(page, /<p className="accounts-subheading">Compare the accounts<\/p>/);
  assert.match(page, /attributed claims, not independently verified facts/i);
  assert.doesNotMatch(page, /Explore the archive/i);
});
