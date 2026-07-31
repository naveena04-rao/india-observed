import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const page = read("src/app/submit-a-lead/page.tsx");
const form = read("src/app/submit-a-lead/LeadSubmissionForm.tsx");
const route = read("src/app/api/leads/route.ts");
const validation = read("src/lib/leads/validation.ts");
const rateLimit = read("src/lib/leads/rateLimit.ts");
const migration = read("supabase/migrations/20260731000100_add_lead_submissions.sql");
const databaseTest = read("supabase/tests/database/0007_lead_submissions.test.sql");
const footer = read("src/app/components/PublicSiteFooter.tsx");
const archiveShell = read("src/app/events/components/ArchiveShell.tsx");
const leadNavigation = read("src/app/components/LeadNavigationAction.tsx");
const privacy = read("src/app/privacy/page.tsx");
const styles = read("src/app/globals.css");
const { leadSubmissionSchema } = await import("../src/lib/leads/validation.ts");

const validLead = (overrides = {}) => ({
  title: "Public meeting announced",
  description:
    "Residents attended a public meeting about a civic issue and further details remain unclear.",
  location: "New Delhi",
  datePrecision: "exact",
  eventDate: "2026-07-31",
  sourceLinks: ["https://example.org/report"],
  additionalContext: "",
  contactEmail: "reader@example.org",
  contactPhone: "",
  goodFaith: true,
  policyAcknowledgement: true,
  website: "",
  formStartedAt: Date.now() - 5000,
  ...overrides,
});

test("footer and editorial page expose the private lead route", () => {
  assert.match(footer, /href: "\/submit-a-lead", label: "Submit a lead"/);
  assert.match(archiveShell, /const onLeadPage = authReturnTo === "\/submit-a-lead"/);
  assert.equal(
    (archiveShell.match(/<LeadNavigationAction onLeadPage=\{onLeadPage\} \/>/g) ?? []).length,
    2,
  );
  assert.match(leadNavigation, /const href = onLeadPage \? "#lead-title" : "\/submit-a-lead"/);
  assert.match(
    leadNavigation,
    /titleField\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/,
  );
  assert.match(leadNavigation, /titleField\.focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(archiveShell, /className="nav-action" href="\/#lead"/);
  assert.match(page, /eyebrow="SUBMIT A LEAD"/);
  assert.match(page, /title="Submit a lead"/);
  assert.match(
    page,
    /className="lead-safety-notice"[\s\S]*?<LeadSubmissionForm \/>[\s\S]*?className="lead-next-steps"/,
  );
  assert.match(page, /Submissions are reviewed and are not automatically published/);
  assert.match(page, /Do not submit confidential-source identities or participant directories/);
  assert.match(page, /Do not submit live tactical locations/);
  assert.match(page, /<StoryPage/);
});

test("one enabled primary submit button uses native form semantics", () => {
  assert.equal((form.match(/<form\b/g) ?? []).length, 1);
  assert.equal((form.match(/<button\b/g) ?? []).length, 1);
  assert.equal((form.match(/className="lead-submit"/g) ?? []).length, 1);
  assert.match(
    form,
    /<form className="lead-form" id="lead-submission-form" noValidate onSubmit=\{submit\}>/,
  );
  assert.match(form, /<button className="lead-submit" type="submit" disabled=\{submitting\}>/);
  assert.ok(form.indexOf('<button className="lead-submit"') > form.indexOf("<form "));
  assert.ok(form.indexOf('<button className="lead-submit"') < form.lastIndexOf("</form>"));
  assert.doesNotMatch(form, /useState\(true\)/);
});

test("client validates native form values before starting exactly one request", () => {
  assert.equal((form.match(/await fetch\("\/api\/leads"/g) ?? []).length, 1);
  assert.ok(
    form.indexOf("new FormData(form)") < form.indexOf("leadSubmissionSchema.safeParse(payload)"),
  );
  assert.ok(
    form.indexOf("leadSubmissionSchema.safeParse(payload)") < form.indexOf("setSubmitting(true)"),
  );
  assert.ok(form.indexOf("setSubmitting(true)") < form.indexOf('await fetch("/api/leads"'));
  assert.match(form, /goodFaith: data\.get\("goodFaith"\) === "on"/);
  assert.match(form, /policyAcknowledgement: data\.get\("policyAcknowledgement"\) === "on"/);
  assert.match(form, /datePrecision: data\.get\("datePrecision"\)/);
  assert.match(form, /eventDate: data\.get\("eventDate"\)/);
  assert.match(form, /sourceLinks,[\s\S]*?contactPhone: data\.get\("contactPhone"\)/);
  assert.match(form, /body: JSON\.stringify\(parsed\.data\)/);
});

test("client recovers from request errors, timeouts and duplicate activation", () => {
  assert.match(form, /if \(submitting\) return/);
  assert.match(form, /new AbortController\(\)/);
  assert.match(form, /window\.setTimeout\(\(\) => controller\.abort\(\), REQUEST_TIMEOUT_MS\)/);
  assert.match(form, /response\.json\(\)\.catch\(\(\) => \(\{\}\)\)/);
  assert.match(
    form,
    /finally \{[\s\S]*?window\.clearTimeout\(timeout\)[\s\S]*?setSubmitting\(false\)/,
  );
  assert.match(form, /setSuccess\(true\)[\s\S]*?Your lead has been submitted for review\./);
  assert.match(
    form,
    /summaryRef\.current\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/,
  );
  assert.match(form, /summaryRef\.current\.focus\(\{ preventScroll: true \}\)/);
  assert.match(form, /setFeedbackVersion\(\(version\) => version \+ 1\)/);
});

test("required fields and optional phone render in the prescribed order", () => {
  const orderedLabels = [
    "Event or lead title",
    "What happened?",
    "Location",
    "When did this happen?",
    "Source links",
    "Additional context",
    "Email address",
    "Phone number",
  ];
  let prior = -1;
  for (const label of orderedLabels) {
    const index = form.indexOf(label);
    assert.ok(index > prior, `${label} must follow the prior field`);
    prior = index;
  }
  assert.match(form, /name="contactEmail"[\s\S]*?type="email"[\s\S]*?required/);
  assert.match(form, /name="contactPhone"[\s\S]*?type="tel"[\s\S]*?maxLength=\{30\}/);
  assert.match(form, /Email address <span>Required<\/span>/);
  assert.match(form, /Phone number <span>Optional<\/span>/);
  assert.match(form, /name="goodFaith"[\s\S]*?type="checkbox"[\s\S]*?required/);
  assert.match(form, /name="policyAcknowledgement"[\s\S]*?type="checkbox"[\s\S]*?required/);
  assert.match(form, /Submitting…/);
  assert.match(form, /disabled=\{submitting\}/);
});

test("server validation bounds every field and rejects unsafe links", () => {
  assert.match(validation, /title: trimmed\(5, 160\)/);
  assert.match(validation, /description: trimmed\(40, 5000\)/);
  assert.match(validation, /location: trimmed\(2, 200\)/);
  assert.match(validation, /additionalContext: z[\s\S]*?\.max\(3000/);
  assert.match(
    validation,
    /contactEmail: z[\s\S]*?\.toLowerCase\(\)[\s\S]*?\.max\(254[\s\S]*?\.email\(/,
  );
  assert.match(validation, /digits\.length >= 7 && digits\.length <= 15/);
  assert.match(validation, /protocol === "http:" \|\| protocol === "https:"/);
  assert.match(validation, /MAX_SOURCE_LINKS = 10/);
  assert.match(validation, /MAX_LEAD_PAYLOAD_BYTES = 32 \* 1024/);
  assert.match(validation, /z\.enum\(\["exact", "approximate", "ongoing"\]\)/);
});

test("server schema rejects invalid contact data and accepts international phone formats", () => {
  assert.equal(leadSubmissionSchema.safeParse(validLead()).success, true);
  assert.equal(
    leadSubmissionSchema.safeParse(validLead({ contactEmail: "not-an-email" })).success,
    false,
  );
  assert.equal(
    leadSubmissionSchema.safeParse(validLead({ contactPhone: "call me tomorrow" })).success,
    false,
  );
  for (const contactPhone of ["+91 98765 43210", "+44 (0)20 7946-0958", "+1-202-555-0147"]) {
    assert.equal(leadSubmissionSchema.safeParse(validLead({ contactPhone })).success, true);
  }
});

test("server schema rejects unsafe URLs, excessive links and overlong content", () => {
  for (const unsafe of ["javascript:alert(1)", "data:text/plain,unsafe", "file:///private.txt"]) {
    assert.equal(
      leadSubmissionSchema.safeParse(validLead({ sourceLinks: [unsafe] })).success,
      false,
    );
  }
  assert.equal(
    leadSubmissionSchema.safeParse(
      validLead({
        sourceLinks: Array.from({ length: 10 }, (_, index) => `https://example.org/${index}`),
      }),
    ).success,
    true,
  );
  assert.equal(
    leadSubmissionSchema.safeParse(
      validLead({
        sourceLinks: Array.from({ length: 11 }, (_, index) => `https://example.org/${index}`),
      }),
    ).success,
    false,
  );
  assert.equal(
    leadSubmissionSchema.safeParse(validLead({ description: "x".repeat(5001) })).success,
    false,
  );
  assert.equal(
    leadSubmissionSchema.safeParse(validLead({ additionalContext: "x".repeat(3001) })).success,
    false,
  );
});

test("submission endpoint revalidates, rate limits and avoids duplicate publication", () => {
  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, /leadSubmissionSchema\.safeParse\(body\)/);
  assert.match(route, /isSameOriginMutation\(request\)/);
  assert.match(route, /consumeLeadSubmissionAttempt\(request\)/);
  assert.match(route, /new TextEncoder\(\)\.encode\(raw\)\.byteLength > MAX_LEAD_PAYLOAD_BYTES/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /supabase\.rpc\("submit_lead"/);
  assert.match(route, /error\?\.code === "23505"[\s\S]*?status: 409/);
  assert.doesNotMatch(route, /console\.(?:log|error)|\.from\("events"\)/);
  assert.match(rateLimit, /MAX_ATTEMPTS = 5/);
  assert.match(rateLimit, /WINDOW_MS = 15 \* 60 \* 1000/);
  assert.match(rateLimit, /randomBytes\(32\)/);
  assert.match(form, /name="website" tabIndex=\{-1\}/);
  assert.match(form, /if \(submitting\) return/);
  assert.ok(
    route.indexOf("leadSubmissionSchema.safeParse(body)") <
      route.indexOf("consumeLeadSubmissionAttempt(request)"),
  );
  assert.match(route, /elapsed < 500/);
  assert.match(route, /headers: \{ "Retry-After": "900" \}/);
});

test("database keeps leads and contact details private pending review", () => {
  assert.match(migration, /create table public\.lead_submissions/);
  assert.match(migration, /id uuid primary key default gen_random_uuid\(\)/);
  assert.match(migration, /status text not null default 'pending_review'/);
  assert.match(migration, /alter table public\.lead_submissions enable row level security/);
  assert.match(
    migration,
    /revoke all on table public\.lead_submissions from public, anon, authenticated/,
  );
  assert.match(migration, /using \(public\.is_media_admin\(\)\)/);
  assert.match(migration, /grant execute on function[\s\S]*?to service_role/);
  assert.match(migration, /revoke all on function[\s\S]*?from public, anon, authenticated/);
  assert.doesNotMatch(migration, /create policy[\s\S]*?to anon/);
  assert.match(databaseTest, /anonymous SELECT is denied/);
  assert.match(databaseTest, /authenticated direct INSERT is denied/);
  assert.match(databaseTest, /initial status is pending review/);
  assert.match(databaseTest, /duplicate fingerprint is rejected/);
  assert.match(databaseTest, /submission does not create another public event/);
});

test("success, failure, accessibility and privacy wording are explicit", () => {
  assert.match(form, /Your lead has been submitted for review\./);
  assert.match(form, /Submission does not guarantee publication\./);
  assert.match(form, /Review the highlighted fields and submit again\./);
  assert.match(form, /We could not submit this lead right now\. Please try again later\./);
  assert.match(route, /This lead appears to have already been submitted\./);
  assert.match(route, /Too many submission attempts were made\. Please try again later\./);
  assert.match(route, /We could not submit this lead right now\. Please try again later\./);
  assert.match(form, /role="alert" tabIndex=\{-1\}/);
  assert.match(form, /aria-live="polite"/);
  assert.match(styles, /\.lead-field textarea[\s\S]*?resize: vertical/);
  assert.match(privacy, /Contact details are used only to review or follow up on the submission/);
  assert.match(styles, /\.lead-submit[\s\S]*?background: var\(--ink\)/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.lead-submit[\s\S]*?width: 100%/);
});

test("public form deliberately omits file uploads", () => {
  assert.doesNotMatch(form, /type="file"|FormData\([^)]*file|attachment/i);
  assert.doesNotMatch(page, /upload|attachment/i);
});
