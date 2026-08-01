import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  eventFieldDefinitions,
  eventFieldKeys,
  internalOnlyEventKeys,
} from "../src/lib/leads/eventFieldMap.ts";

const read = (path) => readFileSync(path, "utf8");
const form = read("src/app/submit-a-lead/LeadSubmissionForm.tsx");
const page = read("src/app/submit-a-lead/page.tsx");
const route = read("src/app/api/leads/route.ts");
const validation = read("src/lib/leads/validation.ts");
const migration = read("supabase/migrations/20260801000100_add_structured_event_contributions.sql");
const eventDetail = read("src/app/events/[slug]/page.tsx");

test("the shared map points to real event storage and public display fields", () => {
  assert.equal(eventFieldDefinitions.length, 12);
  for (const definition of eventFieldDefinitions) {
    assert.match(definition.dbColumn, /^(events\.|event_organisations)/);
    assert.ok(definition.displayField);
  }
  for (const key of internalOnlyEventKeys) assert.ok(!eventFieldKeys.includes(key));
});

test("new event mode accepts deliberate structured fields", () => {
  assert.match(validation, /submissionMode: z\.enum\(\["new-event", "existing-event"\]\)/);
  assert.match(validation, /Add at least one proposed event field/);
  assert.match(validation, /const fieldKey = z\.enum\([\s\S]*?eventFieldKeys as/);
});

test("existing correction preserves target and current value", () => {
  assert.match(
    validation,
    /existing !== Boolean\(value\.relatedEventSlug && value\.relatedEventId\)/,
  );
  assert.match(validation, /existingValueSnapshot: text\(5000\)/);
  assert.match(form, /existingValueSnapshot: currentValues\?\.\[fieldKey\]/);
});

test("source and official-response modes enforce their evidence", () => {
  assert.match(
    validation,
    /\["public-source", "official-response"\][\s\S]*?value\.sources\.length === 0/,
  );
  assert.match(validation, /fieldKey === "latest_official_response"/);
  assert.match(validation, /sourceRoles = \[/);
});

test("photo and video evidence are structured and unsafe URLs are rejected", () => {
  assert.match(validation, /mediaType: z\.enum\(\["photo", "video"\]\)/);
  assert.match(validation, /Use an HTTP or HTTPS link/);
  assert.doesNotMatch(form, /type="file"/);
});

test("form uses progressive repeatable sections and current-value comparison", () => {
  assert.match(form, /Current published value/);
  assert.match(form, /Add another field/);
  assert.match(form, /Add public source/);
  assert.match(form, /Add photo or video/);
  assert.match(form, /Photo/);
  assert.match(form, /Video/);
  assert.match(form, /Submit for editorial review/);
});

test("event links preserve contribution type and exact event context", () => {
  for (const type of ["public-source", "correction", "official-response"])
    assert.match(eventDetail, new RegExp(`type: "${type}"`));
  assert.match(page, /relatedEventId=\{relatedEvent\?\.internalId\}/);
  assert.match(page, /currentEventValues\(relatedEvent\)/);
  assert.match(page, /if \(event && !relatedEvent\) notFound\(\)/);
});

test("server validates and writes only through the structured private RPC", () => {
  assert.match(route, /leadSubmissionSchema\.safeParse\(body\)/);
  assert.match(route, /supabase\.rpc\("submit_structured_lead"/);
  assert.match(route, /p_proposals: lead\.proposals/);
  assert.match(route, /p_sources: lead\.sources/);
  assert.match(route, /p_media: lead\.media/);
  assert.doesNotMatch(route, /\.from\("events"\)|submit_lead"/);
});

test("database remains private, pending review and backward compatible", () => {
  assert.match(migration, /Legacy lead rows and submit_lead remain readable/);
  assert.match(migration, /create table public\.lead_event_field_proposals/);
  assert.match(migration, /create table public\.lead_submission_sources/);
  assert.match(migration, /create table public\.lead_submission_media/);
  assert.match(migration, /review_status text not null default 'pending_review'/);
  assert.match(migration, /revoke all on table[\s\S]*?from public, anon, authenticated/);
  assert.match(migration, /grant execute on function[\s\S]*?to service_role/);
  assert.doesNotMatch(migration, /insert into public\.events|update public\.events/);
});

test("contact, consent, anti-spam and private-review wording remain", () => {
  assert.match(form, /Email address/);
  assert.match(form, /Phone number/);
  assert.match(form, /goodFaith/);
  assert.match(form, /policyAcknowledgement/);
  assert.match(form, /lead-honeypot/);
  assert.match(form, /Nothing has been published or changed automatically/);
});
