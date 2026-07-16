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
  assert.match(page, /Independent records of protests and civic movements across India/i);
  assert.match(page, /Sources linked\. Identities protected\. Corrections visible\./i);
  assert.match(page, /tactical information/i);
  assert.match(page, /Human review/i);
  assert.match(carousel, /No approved media/i);
  assert.match(page, /<FeaturedRecordCarousel records=\{featuredRecords\} \/>/);
  assert.equal(page.match(/id: "IO-CM-/g)?.length, 3);
  for (const title of [
    "Bidadi farmers oppose township land acquisition",
    "Manipur government employees continue cease-work strike",
    "Dharmasala students protest teacher vacancies",
  ]) {
    assert.match(page, new RegExp(title));
  }
  assert.match(page, /<h2 id="accounts-title">On the record<\/h2>/);
  assert.match(page, /<p className="accounts-subheading">Compare the accounts<\/p>/);
  assert.doesNotMatch(page, /Explore the archive/i);
  assert.match(carousel, /filter\(\(\{ index \}\) => index !== activeIndex\)/);
  assert.match(page, /attributed claims, not independently verified facts/i);
});
