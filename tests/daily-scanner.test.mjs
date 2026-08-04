import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260803000400_add_minimum_daily_scanner.sql");
const focusedMigration = read(
  "supabase/migrations/20260804000100_focus_daily_scanner_iteration.sql",
);
const shortlistMigration = read(
  "supabase/migrations/20260804000200_add_event_candidate_shortlist.sql",
);
const indiaWideMigration = read("supabase/migrations/20260804000300_expand_india_wide_scanner.sql");
const orchestrator = read("src/lib/discovery/orchestrator.ts");
const discovery = read("src/lib/discovery/sourceDiscovery.ts");
const classification = read("src/lib/discovery/classification.ts");
const route = read("src/app/api/internal/discovery/route.ts");
const dashboard = read("src/app/admin/review/[view]/page.tsx");
const control = read("src/app/admin/review/ManualDailyScannerControl.tsx");
const vercel = JSON.parse(read("vercel.json"));

test("daily scanner contains only the two reviewed metadata sources", () => {
  assert.match(migration, /NorthEast Now RSS/);
  assert.match(migration, /Press Information Bureau RSS/);
  assert.match(migration, /https:\/\/www\.nenow\.in\/feed/);
  assert.match(migration, /RssMain\.aspx\?ModId=6&Lang=1&Regid=6/);
  assert.match(migration, /feed_metadata_and_canonical_links_only/g);
  assert.doesNotMatch(migration, /GDELT DOC API|Bluesky Public Search|youtube_api/);
});

test("scheduled runs enforce source, item, candidate and runtime limits", () => {
  for (const expected of [
    /maximumSources: 15/,
    /maximumFetchedItems: 300/,
    /maximumStoredItems: 100/,
    /maximumCandidates: 40/,
    /maximumRuntimeMs: 350_000/,
    /timeWindowHours: 72/,
  ])
    assert.match(orchestrator, expected);
  assert.match(orchestrator, /scheduledRun/);
  assert.match(orchestrator, /no_approved_source/);
  assert.match(orchestrator, /sourceQuery\.eq\("scan_frequency", "daily"\)/);
  assert.match(orchestrator, /discovery-v3/);
  assert.match(orchestrator, /rankPreliminaryReviewItems/);
  assert.match(orchestrator, /itemsPassingIndiaGate/);
  assert.match(orchestrator, /itemsPassingPreliminaryCivicFilter/);
  assert.match(orchestrator, /persisted\.eventCandidate/);
});

test("India-wide migration selects reviewed regional feeds without enabling automation", () => {
  for (const expected of [
    /Indian Express India RSS/,
    /Hindustan Times India RSS/,
    /Times of India India RSS/,
    /Indian Express Delhi RSS/,
    /Hindustan Times Lucknow RSS/,
    /Indian Express Bengaluru RSS/,
    /Telangana Today RSS/,
    /Indian Express Kolkata RSS/,
    /Hindustan Times Patna RSS/,
    /Indian Express Mumbai RSS/,
    /Indian Express Ahmedabad RSS/,
    /NorthEast Now RSS/,
    /EastMojo RSS/,
    /Madhya Pradesh Information RSS/,
    /"maximumRawItems":300/,
    /"maximumStoredItems":100/,
    /"maximumCandidates":40/,
    /eligible_count < 8 or eligible_count > 15/,
  ])
    assert.match(indiaWideMigration, expected);
  assert.doesNotMatch(
    indiaWideMigration,
    /scheduler_enabled\s*=\s*true|outbound_email_enabled\s*=\s*true|real_notifications_enabled\s*=\s*true|github_write_enabled\s*=\s*true/,
  );
});

test("the shortlist migration tightens limits without enabling automation", () => {
  assert.match(shortlistMigration, /"maximumRawItems":60/);
  assert.match(shortlistMigration, /"maximumStoredItems":30/);
  assert.match(shortlistMigration, /"maximumCandidates":15/);
  assert.match(shortlistMigration, /not coalesce\(public\.is_authorised_editor\(\), false\)/);
  assert.doesNotMatch(
    shortlistMigration,
    /scheduler_enabled\s*=\s*true|outbound_email_enabled\s*=\s*true|real_notifications_enabled\s*=\s*true|github_write_enabled\s*=\s*true/,
  );
});

test("today separates event candidates from private scanner diagnostics", () => {
  assert.match(dashboard, /partitionCandidateReviewRows/);
  assert.match(dashboard, /heading="Event candidates"/);
  assert.match(dashboard, /heading="Scanner diagnostics"/);
  assert.match(dashboard, /collapsed/);
  assert.match(dashboard, /confidence >= 0\.5|partitionCandidateReviewRows/);
});

test("safety review never replaces a credible event classification with generic manual review", () => {
  assert.match(orchestrator, /const persistedCandidateType = candidateType/);
  assert.doesNotMatch(orchestrator, /candidate_type:\s*manualReview\s*\?/);
  assert.match(orchestrator, /processing_status: manualReview \? "manual_review" : "classified"/);
});

test("focused iteration disables PIB and enables only the reviewed replacement", () => {
  assert.match(focusedMigration, /Press Information Bureau RSS/);
  assert.match(focusedMigration, /enabled = false/);
  assert.match(focusedMigration, /Telangana Today RSS/);
  assert.match(focusedMigration, /https:\/\/telanganatoday\.com\/feed/);
  assert.match(focusedMigration, /eligible_count <> 2/);
  assert.match(focusedMigration, /"timeWindowHours":72/);
  assert.match(focusedMigration, /"maximumSources":2/);
  assert.doesNotMatch(focusedMigration, /GDELT|Bluesky|YouTube|youtube_api|bluesky_api/);
});

test("connectors retry temporary failures once and never crawl item pages", () => {
  assert.match(discovery, /fetchWithOneTemporaryRetry/);
  assert.match(discovery, /status === 408 \|\| status === 425 \|\| status >= 500/);
  assert.doesNotMatch(discovery, /status === 429 \|\|/);
  assert.match(discovery, /Math\.min\(Math\.max\(retryAfter, 250\), 5_000\)/);
  assert.match(discovery, /feedSummary: item\.summary/);
  assert.match(discovery, /metadataOnly: true/);
  assert.doesNotMatch(discovery, /fetchApprovedSource\(item\.url/);
});

test("deduplication and all-record matching diagnostics are retained", () => {
  assert.match(orchestrator, /canonical_url/);
  assert.match(orchestrator, /normalized_title/);
  assert.match(orchestrator, /source_family/);
  assert.match(orchestrator, /syndicated_copy/);
  assert.match(orchestrator, /target_event_internal_id/);
  assert.match(orchestrator, /matching_signals/);
  assert.match(orchestrator, /conflicting_signals/);
  assert.match(orchestrator, /source_is_newer_than_event/);
  assert.doesNotMatch(classification, /publicationStatus === "published"/);
  assert.match(classification, /event\.directedAt/);
  assert.match(classification, /event\.topic/);
});

test("plural protest metadata requires a second civic context signal", () => {
  const civicPatternSource = classification.match(/const civicEventPattern\s*=\s*(\/[^;]+\/);/s);
  const contextPatternSource = classification.match(
    /const civicContextPattern\s*=\s*(\/[^;]+\/);/s,
  );
  assert.ok(civicPatternSource);
  assert.ok(contextPatternSource);
  const civicPattern = Function(`return ${civicPatternSource[1]}`)();
  const contextPattern = Function(`return ${contextPatternSource[1]}`)();
  const falseNegative =
    "Over 60 organisations and trade unions condemn government action against democratic protests in Assam after a court order.";
  assert.match(falseNegative.toLowerCase(), civicPattern);
  assert.match(falseNegative.toLowerCase(), contextPattern);
  assert.match(classification, /if \(civicEventSignal && civicContextSignal\)/);
  assert.doesNotMatch("A protest-themed food festival opens", contextPattern);
  assert.doesNotMatch("The government publishes a routine budget", civicPattern);
});

test("readiness action is editor-only and gates schedule activation", () => {
  assert.match(migration, /claim_manual_daily_scanner_dry_run/);
  assert.match(migration, /not coalesce\(public\.is_authorised_editor\(\), false\)/);
  assert.match(migration, /success_count >= 2/);
  assert.match(migration, /A successful two-source controlled daily-scanner run is required/);
  assert.ok(
    dashboard.indexOf("if (!session.editor") < dashboard.indexOf("<ManualDailyScannerControl"),
  );
  assert.match(control, /Run scanner readiness check/);
  assert.doesNotMatch(control, /SERVICE_ROLE|service-role|service_role/);
});

test("Vercel has exactly one 07:00 IST scan and no digest cron", () => {
  assert.deepEqual(vercel.crons, [
    { path: "/api/internal/discovery?task=scan", schedule: "30 1 * * *" },
  ]);
  assert.match(route, /env\.DISCOVERY_SCHEDULER_ENABLED !== "true"/);
  assert.match(route, /settings\?\.scheduler_enabled/);
  assert.match(route, /EDITORIAL_DIGEST_EMAIL_ENABLED !== "true"/);
  assert.match(route, /getServerEnvironment\(\)\.CRON_SECRET/);
});

test("migration never enables effects or writes public records", () => {
  assert.doesNotMatch(
    migration,
    /insert into public\.(events|event_media|event_notifications|approved_change_sets)/,
  );
  assert.doesNotMatch(
    migration,
    /outbound_email_enabled\s*=\s*true|real_notifications_enabled\s*=\s*true|github_write_enabled\s*=\s*true/,
  );
});
