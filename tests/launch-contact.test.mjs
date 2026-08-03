import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const contact = read("src/app/contact/page.tsx");
const corrections = read("src/app/corrections/page.tsx");
const privacy = read("src/app/privacy/page.tsx");
const site = read("src/lib/site.ts");

test("public contact pages use the shared server-only contact configuration", () => {
  for (const page of [contact, corrections, privacy]) {
    assert.match(page, /getPublicContactEmail/);
    assert.match(page, /mailto:\$\{/);
    assert.doesNotMatch(page, /indiaobservedadmin@gmail\.com/);
  }
});

test("contact, corrections and privacy fail closed when contact configuration is missing", () => {
  assert.match(contact, /Production launch remains[\s\S]*?blocked/);
  assert.match(corrections, /Production launch remains[\s\S]*?blocked/);
  assert.match(privacy, /Production launch remains blocked/);
  assert.match(site, /if \(env\.VERCEL_ENV !== "production"\) return/);
  assert.match(site, /!env\.PUBLIC_CONTACT_EMAIL \? "PUBLIC_CONTACT_EMAIL" : null/);
  assert.doesNotMatch(
    site,
    /env\.VERCEL_ENV !== "production" \|\| env\.MEDIA_REQUIRED_FOR_LAUNCH !== "true"/,
  );
});
