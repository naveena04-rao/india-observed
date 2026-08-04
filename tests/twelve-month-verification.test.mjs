import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const data = read("src/data/twelveMonthVerification.ts");
const dashboard = read("src/app/admin/review/[view]/page.tsx");
const actions = read("src/app/admin/review/actions.ts");
const decisionForm = read("src/app/admin/review/VerificationDecisionForm.tsx");
const migration = read(
  "supabase/migrations/20260804000600_add_twelve_month_verification_review.sql",
);
const report = read("docs/TWELVE_MONTH_LEAD_VERIFICATION_2026-08-04.md");

test("bounded verification packet accounts for all fresh leads", () => {
  assert.equal(data.match(/ref: "YR-\d{2}"/g)?.length, 32);
  assert.equal(data.match(/recommendation: "approve_new_event_draft"/g)?.length, 25);
  assert.equal(data.match(/recommendation: "retain_for_more_evidence"/g)?.length, 6);
  assert.equal(data.match(/recommendation: "reject_duplicate"/g)?.length, 1);
  assert.match(report, /32 leads reviewed/);
  assert.match(report, /25 are sufficiently evidenced for private new-event drafts/);
  assert.match(report, /0 public records are changed/);
});

test("proposed event IDs and lead references are unique", () => {
  const refs = [...data.matchAll(/ref: "(YR-\d{2})"/g)].map((match) => match[1]);
  const ids = [...data.matchAll(/proposedEventId: "(IO-CM-[A-Z]{2}-\d{4})"/g)].map(
    (match) => match[1],
  );
  assert.equal(new Set(refs).size, 32);
  assert.equal(ids.length, 25);
  assert.equal(new Set(ids).size, 25);
  assert.match(data, /matchedEventId: "IO-CM-JH-0001"/);
});

test("every dashboard lead has attributable primary evidence", () => {
  assert.equal(data.match(/publisher:\s*"/g)?.length, 32);
  assert.equal(data.match(/evidenceNote:\s*"/g)?.length, 32);
});

test("verification UI stays private and distinguishes decisions from publication", () => {
  assert.match(dashboard, /\["verification", "12-month verification"\]/);
  assert.match(decisionForm, /Approve private draft/);
  assert.match(dashboard, /it cannot publish an event/);
  assert.match(dashboard, /getEditorialAdminSession/);
  assert.match(dashboard, /if \(!session\.editor \|\| !session\.supabase\) notFound\(\)/);
  assert.doesNotMatch(dashboard, /Publish event/);
});

test("verification UI does not depend on scanner schema availability", () => {
  assert.match(dashboard, /view === "verification"/);
  assert.match(dashboard, /emptyPrivateDataResult/);
  assert.match(dashboard, /editorial_verification_decisions/);
});

test("decision action rechecks editor access and whitelists the bounded packet", () => {
  assert.match(actions, /const supabase = await editor\(\)/);
  assert.match(actions, /twelveMonthVerificationLeads\.some/);
  assert.match(actions, /review_twelve_month_verification_lead/);
  assert.match(actions, /revalidatePath\("\/admin\/review\/verification"\)/);
});

test("decision controls expose pending, success and safe failure feedback", () => {
  assert.match(decisionForm, /useActionState/);
  assert.match(decisionForm, /Saving decision…/);
  assert.match(decisionForm, /role="status"/);
  assert.match(decisionForm, /aria-live="polite"/);
  assert.match(actions, /status: "saved"/);
  assert.match(actions, /status: "error"/);
  assert.match(actions, /Please retry/);
});

test("database decisions fail closed and cannot write public records", () => {
  assert.match(migration, /enable row level security/);
  assert.match(migration, /coalesce\(public\.is_authorised_editor\(\), false\)/g);
  assert.match(migration, /Authorised editor access required/);
  assert.doesNotMatch(migration, /insert into public\.events|update public\.events/);
  assert.doesNotMatch(migration, /notifications|scheduler_enabled|publication/);
});
