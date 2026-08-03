import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260803000300_add_manual_pib_rss_dry_run.sql");
const orchestrator = read("src/lib/discovery/orchestrator.ts");
const sourceDiscovery = read("src/lib/discovery/sourceDiscovery.ts");
const fetchSafety = read("src/lib/discovery/fetchSafety.ts");
const actions = read("src/app/admin/review/actions.ts");
const control = read("src/app/admin/review/ManualPibRssDryRunControl.tsx");
const dashboard = read("src/app/admin/review/[view]/page.tsx");

test("PIB RSS dry run is exact, one-time, private, and never scheduled", () => {
  assert.match(migration, /manual_pib_rss_dry_run/);
  assert.match(migration, /claim_manual_pib_rss_dry_run/);
  assert.match(migration, /Press Information Bureau RSS/);
  assert.match(migration, /RssMain\.aspx\?ModId=6&Lang=1&Regid=6/);
  assert.match(migration, /approved_for_one_manual_metadata_dry_run_only/);
  assert.match(migration, /"timeWindowHours":72/);
  assert.match(migration, /"maximumFeedItems":20/);
  assert.match(migration, /"maximumDiscoveredItems":20/);
  assert.match(migration, /"maximumCandidates":15/);
  assert.match(migration, /"fullArticleFetching":false/);
  assert.match(migration, /"pdfFetching":false/);
  assert.match(migration, /"mediaFetching":false/);
  assert.match(migration, /"scheduledScanning":false/);
  assert.match(migration, /'manual'/);
  assert.match(migration, /false,\s*'rss'/);
  assert.doesNotMatch(migration, /update public\.discovery_schedule_settings/);
  assert.doesNotMatch(migration, /insert into public\.(events|event_media|event_notifications)/);
});

test("PIB RSS claim is editor-gated, serialised, and source-specific", () => {
  assert.match(migration, /not coalesce\(public\.is_authorised_editor\(\), false\)/);
  assert.match(migration, /Authorised editor access required/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /dry_scan_already_running/);
  assert.match(migration, /dry_scan_already_used/);
  assert.match(migration, /source\.name = 'Press Information Bureau RSS'/);
  assert.match(migration, /source\.scan_method = 'rss'/);
  assert.match(migration, /source\.manual_run_consumed_at is null/);
  assert.match(migration, /grant execute[\s\S]*authenticated, service_role/);
  assert.match(migration, /revoke all[\s\S]*public, anon/);
});

test("PIB RSS connector keeps publication metadata and applies the 72-hour boundary", () => {
  assert.match(sourceDiscovery, /configNumber\(source, "timeWindowHours"\)/);
  assert.match(sourceDiscovery, /publishedAt: item\.publishedAt/);
  assert.match(sourceDiscovery, /publisher: source\.name/);
  assert.match(sourceDiscovery, /metadataOnly: true/);
  assert.match(sourceDiscovery, /etag: source\.last_etag/);
  assert.match(sourceDiscovery, /lastModified: source\.last_modified_header/);
  assert.match(sourceDiscovery, /maximumRedirects: 0/);
  assert.match(fetchSafety, /options\.maximumRedirects \?\? MAX_REDIRECTS/);
});

test("PIB RSS run uses dedicated limits and no other connector", () => {
  assert.match(orchestrator, /maximumSources: 1/);
  assert.match(orchestrator, /maximumItemsPerSource: 20/);
  assert.match(orchestrator, /maximumFetchedItems: 20/);
  assert.match(orchestrator, /maximumCandidates: 15/);
  assert.match(orchestrator, /timeWindowHours: 72/);
  assert.match(orchestrator, /controlledPibRssRun/);
  assert.match(orchestrator, /\.eq\("name", "Press Information Bureau RSS"\)/);
  assert.match(orchestrator, /claim_manual_pib_rss_dry_run/);
  assert.match(orchestrator, /controlledFallbackRun \|\| controlledPibRssRun/);
  assert.match(orchestrator, /controlledGdeltRun \|\| controlledPibRssRun/);
});

test("only an authorised editor can see and invoke the PIB control", () => {
  assert.ok(
    dashboard.indexOf("if (!session.editor") < dashboard.indexOf("<ManualPibRssDryRunControl"),
  );
  assert.match(dashboard, /approvedPibRssSources/);
  assert.match(dashboard, /manual_pib_rss_dry_run/);
  assert.match(actions, /const supabase = await editor\(\)/);
  assert.match(actions, /trigger: "manual_pib_rss_dry_run"/);
  assert.match(control, /Run PIB RSS dry scan/);
  assert.match(control, /previous 72 hours/);
  assert.match(control, /role="status" aria-live="polite"/);
  assert.doesNotMatch(control, /SERVICE_ROLE|service-role|service_role/);
});
