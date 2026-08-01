import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const form = read("src/app/submit-a-lead/LeadSubmissionForm.tsx");
const page = read("src/app/submit-a-lead/page.tsx");
const route = read("src/app/api/leads/route.ts");
const validation = read("src/lib/leads/validation.ts");
const mapping = read("src/lib/leads/publicMapping.ts");
const fieldMap = read("src/lib/leads/eventFieldMap.ts");
const migration = read(
  "supabase/migrations/20260801000200_add_editorial_mapping_proposal_categories.sql",
);
const eventDetail = read("src/app/events/[slug]/page.tsx");
const styles = read("src/app/globals.css");

test("new-event mode asks only plain reader-facing questions", () => {
  for (const question of [
    "What happened?",
    "Where did it happen?",
    "When did it happen?",
    "What kind of event was it?",
    "Who organised or took part publicly?",
    "What were the main demands or issues?",
    "How did authorities respond?",
    "What happened afterward?",
  ])
    assert.match(form, new RegExp(question.replace(/[?]/g, "\\?")));
  assert.match(form, /contributionType === "new-event"/);
  assert.match(form, /Describe the event in your own words/);
  assert.match(form, /Protest using several forms of action/);
});

test("source mode shows only source-focused contribution questions", () => {
  assert.match(form, /contributionType === "public-source"/);
  assert.match(form, /What does this source help confirm or explain\?/);
  assert.match(form, /Public source links/);
  assert.match(validation, /Add at least one public source link\./);
});

test("correction mode uses three plain-language correction questions", () => {
  assert.match(form, /contributionType === "correction"/);
  assert.match(form, /What information appears incorrect\?/);
  assert.match(form, /What should it say instead\?/);
  assert.match(form, /Why do you believe it should change\?/);
  assert.match(form, /Supporting source links/);
  assert.match(validation, /Explain what information should be corrected\./);
});

test("official-response mode exposes only relevant response fields", () => {
  assert.match(form, /contributionType === "official-response"/);
  for (const label of [
    "Name of authority or organisation",
    "Name or public role of the official",
    "Date of response",
    "What was the official response?",
    "What part of the event does this response address?",
    "Official statement or source links",
  ])
    assert.match(form, new RegExp(label.replace(/[?]/g, "\\?")));
});

test("technical event editing controls are not rendered publicly", () => {
  assert.doesNotMatch(form, /eventFieldDefinitions|fieldKey|existingValueSnapshot/);
  assert.doesNotMatch(
    form,
    /Current published value|Proposed record changes|Event field|Source role|Source type|Supported field/i,
  );
  for (const internal of [
    "verification_status",
    "publication_status",
    "internal_notes",
    "reviewer_id",
  ])
    assert.doesNotMatch(form, new RegExp(internal));
  assert.match(fieldMap, /internalOnlyEventKeys/);
});

test("simple answers map into structured proposal categories", () => {
  for (const mappingRule of [
    'proposal("neutral_summary", input.whatHappened)',
    'proposal("general_location", input.location)',
    'proposal("event_type", input.eventType)',
    'proposal("main_issue", input.mainIssues)',
    'proposal("latest_official_response", input.authorityResponse)',
    'proposal("outcome_or_follow_up", input.outcome)',
    '"correction_request",',
  ])
    assert.ok(mapping.includes(mappingRule), `missing mapping: ${mappingRule}`);
  assert.match(migration, /editorial_mapping/);
  assert.match(migration, /correction_request/);
  assert.match(migration, /never mutates public events/);
});

test("simple source and media links become normalized records", () => {
  assert.match(mapping, /const sources = input\.sourceLinks\.map/);
  assert.match(mapping, /sourceRole:/);
  assert.match(mapping, /sourceType:/);
  assert.match(mapping, /input\.photoUrls\.map/);
  assert.match(mapping, /input\.videoUrls\.map/);
  assert.match(mapping, /mediaType: "photo"/);
  assert.match(mapping, /mediaType: "video"/);
  assert.doesNotMatch(form, /type="file"/);
});

test("event context and contribution action remain server-verified", () => {
  assert.match(page, /relatedEventSlug=\{relatedEvent\?\.slug\}/);
  assert.match(page, /relatedEventId=\{relatedEvent\?\.internalId\}/);
  assert.match(page, /relatedEventTitle=\{relatedEvent\?\.title\}/);
  assert.match(route, /target\.internalId !== lead\.relatedEventId/);
  assert.match(form, /For: \{relatedEventTitle\}/);
  for (const type of ["public-source", "correction", "official-response"])
    assert.match(eventDetail, new RegExp(`type: "${type}"`));
});

test("reader validation remains private, bounded and plain-language", () => {
  assert.match(validation, /publicLeadSubmissionSchema/);
  assert.match(validation, /Describe what happened\./);
  assert.match(validation, /Enter a location\./);
  assert.match(validation, /Choose when the event happened\./);
  assert.match(validation, /Enter a valid email address\./);
  assert.match(validation, /Use an HTTP or HTTPS link\./);
  assert.match(validation, /MAX_LEAD_PAYLOAD_BYTES = 64 \* 1024/);
  assert.match(route, /consumeLeadSubmissionAttempt/);
  assert.match(form, /lead-honeypot/);
});

test("contact, confirmation and media disclosure remain accessible", () => {
  assert.match(form, /Email address <span>Required<\/span>/);
  assert.match(form, /Phone number <span>Optional<\/span>/);
  assert.match(form, /Your contact details will be used only/);
  assert.match(form, /not be published\./);
  assert.match(form, /made in\s+good faith/);
  assert.match(form, /Privacy policy/);
  assert.match(form, /No photo or video/);
  assert.match(form, /Photo and video/);
  assert.match(styles, /\.lead-choice-row label[\s\S]*?min-height: 2\.75rem/);
});

test("API validates public input, maps it, then uses only the private RPC", () => {
  assert.ok(
    route.indexOf("publicLeadSubmissionSchema.safeParse(body)") <
      route.indexOf("mapPublicLeadSubmission(publicLead)"),
  );
  assert.ok(
    route.indexOf("mapPublicLeadSubmission(publicLead)") <
      route.indexOf('supabase.rpc("submit_structured_lead"'),
  );
  assert.doesNotMatch(route, /\.from\("events"\)|insert into public\.events/);
  assert.match(route, /submissionMode/);
  assert.match(route, /proposals/);
  assert.match(route, /sources/);
  assert.match(route, /media/);
});
