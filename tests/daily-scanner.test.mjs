import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260803000400_add_minimum_daily_scanner.sql");
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
    /maximumSources: 5/,
    /maximumFetchedItems: 100/,
    /maximumStoredItems: 50/,
    /maximumCandidates: 25/,
    /maximumRuntimeMs: 230_000/,
    /timeWindowHours: 48/,
  ])
    assert.match(orchestrator, expected);
  assert.match(orchestrator, /scheduledRun/);
  assert.match(orchestrator, /no_approved_source/);
  assert.match(orchestrator, /sourceQuery\.eq\("scan_frequency", "daily"\)/);
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
