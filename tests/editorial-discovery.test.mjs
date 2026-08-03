import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const workflow = read(
  "supabase/migrations/20260801000400_add_private_editorial_discovery_workflow.sql",
);
const compliance = read(
  "supabase/migrations/20260801000500_enforce_discovery_compliance_gates.sql",
);
const safety = read("src/lib/discovery/fetchSafety.ts");
const privacy = read("src/lib/discovery/privacy.ts");
const pipeline = read("src/lib/discovery/pipeline.ts");
const orchestrator = read("src/lib/discovery/orchestrator.ts");
const connectors = read("src/lib/discovery/connectors/registry.ts");
const dashboard = read("src/app/admin/review/[view]/page.tsx");
const dashboardActions = read("src/app/admin/review/actions.ts");
const manualControl = read("src/app/admin/review/ManualGdeltDryRunControl.tsx");
const fallbackControl = read("src/app/admin/review/ManualFallbackDryRunControl.tsx");
const internalRoute = read("src/app/api/internal/discovery/route.ts");
const freeConnectors = read("src/lib/discovery/connectors/freeConnectors.ts");
const queryStrategy = read("src/lib/discovery/queryStrategy.ts");
const keywords = JSON.parse(read("data/discovery-keywords.json"));
const leadInputs = read("src/lib/discovery/leadInputs.ts");
const sourceDiscovery = read("src/lib/discovery/sourceDiscovery.ts");
const controlledGdelt = read(
  "supabase/migrations/20260802000100_add_controlled_gdelt_metadata_dry_run.sql",
);
const protectedGdeltControl = read(
  "supabase/migrations/20260803000100_protect_manual_gdelt_editor_run.sql",
);
const fallbackDryRun = read("supabase/migrations/20260803000200_add_manual_fallback_dry_run.sql");

test("production scheduling and all external effects default off", () => {
  assert.match(workflow, /scheduler_enabled boolean not null default false/);
  assert.match(workflow, /dry_run_only boolean not null default true/);
  assert.match(workflow, /outbound_email_enabled boolean not null default false/);
  assert.match(workflow, /github_write_enabled boolean not null default false/);
  assert.match(workflow, /real_notifications_enabled boolean not null default false/);
  assert.match(internalRoute, /DISCOVERY_SCHEDULER_ENABLED/);
  assert.match(internalRoute, /dryRun: env\.DISCOVERY_DRY_RUN_ONLY === "true"/);
});

test("unreviewed, rejected, expired and paywalled sources fail closed", () => {
  assert.match(compliance, /A compliance review is required before enabling a source/);
  assert.match(compliance, /review_expires_at <= now\(\)/);
  assert.match(compliance, /paywall_status in \('paywalled', 'access_controlled'\)/);
  assert.match(compliance, /legal_review_status not in/);
  assert.match(compliance, /robots_policy in \('not_assessed', 'restricted', 'forbidden'\)/);
});

test("fetcher blocks SSRF, unusual ports, redirects and oversized content", () => {
  assert.match(safety, /localhost|\.local/);
  assert.match(safety, /private_source_forbidden/);
  assert.match(safety, /unsafe_source_port/);
  assert.match(safety, /MAX_REDIRECTS = 3/);
  assert.match(safety, /MAX_SOURCE_BYTES = 2 \* 1024 \* 1024/);
  assert.match(safety, /redirect: "manual"/);
  assert.doesNotMatch(safety, /rejectUnauthorized:\s*false/);
});

test("privacy, children, live-location and reputation risks require review", () => {
  assert.match(privacy, /\[redacted \$\{entry\.kind\}\]/);
  assert.match(privacy, /possibleChild/);
  assert.match(privacy, /liveTacticalLocation/);
  assert.match(privacy, /reputationalRisk/);
  assert.match(orchestrator, /manual_review/);
  assert.match(pipeline, /limitSupportingPassage/);
});

test("media rights and retained source evidence are private and bounded", () => {
  assert.match(workflow, /unknown_pending_review/);
  assert.match(workflow, /candidate_media_unknown_rights_gate/);
  assert.match(workflow, /octet_length\(original_text\) <= 32768/);
  assert.match(workflow, /'scan_runs', 'scan_jobs', 'discovered_items'/);
  assert.match(workflow, /alter table public\.%I enable row level security/);
  assert.doesNotMatch(workflow, /grant select[^;]*discovered_items[^;]*to anon/s);
});

test("notifications use opt-in preferences and never lead contacts", () => {
  assert.match(workflow, /select 1 from public\.event_follows/);
  assert.match(workflow, /global_opt_out/);
  assert.match(workflow, /Real follower notifications are disabled/);
  const notificationFunction =
    workflow.match(/create or replace function public\.queue_notifications[\s\S]*?\$\$;/)?.[0] ??
    "";
  assert.doesNotMatch(notificationFunction, /lead_submissions|contact_email|contact_phone/);
});

test("dashboard exposes review, compliance and coverage without public navigation", () => {
  for (const label of [
    "Today",
    "New Events",
    "Event Updates",
    "Media",
    "Sources",
    "Scan Runs",
    "Settings",
    "Source Coverage",
    "Compliance",
  ])
    assert.match(dashboard, new RegExp(label));
  assert.match(dashboard, /robots: \{ index: false, follow: false \}/);
  assert.match(connectors, /productionEnabled: false/g);
});

test("multilingual benchmark meets declared deterministic baseline", () => {
  const output = execFileSync(
    process.execPath,
    [fileURLToPath(new URL("../scripts/scanner-benchmark.mjs", import.meta.url))],
    { encoding: "utf8" },
  );
  const result = JSON.parse(output);
  assert.equal(result.languages, 13);
  assert.ok(result.metrics.newEventPrecision >= 0.9);
  assert.ok(result.metrics.newEventRecall >= 0.9);
  assert.equal(result.metrics.safetyRecall, 1);
  assert.ok(Object.values(result.metrics).every((value) => value === null || value >= 0.8));
});

test("free version implements bounded feed, sitemap, GDELT, YouTube and Bluesky discovery", () => {
  assert.match(freeConnectors, /discoverFeedLinks/);
  assert.match(freeConnectors, /parseFeed/);
  assert.match(freeConnectors, /fetchSitemapCandidates/);
  assert.match(freeConnectors, /maximumChildSitemaps/);
  assert.match(freeConnectors, /api\.gdeltproject\.org/);
  assert.match(freeConnectors, /www\.googleapis\.com\/youtube\/v3\/search/);
  assert.match(freeConnectors, /regionCode.*IN/s);
  assert.match(freeConnectors, /public\.api\.bsky\.app/);
  assert.doesNotMatch(
    freeConnectors,
    /x\.com\/search|facebook\.com\/search|instagram\.com\/explore/,
  );
});

test("query budgets, rotations and reviewed multilingual dictionaries are bounded", () => {
  const geography = read("src/lib/discovery/geography.ts");
  assert.equal(Object.keys(keywords.languages).length, 13);
  assert.ok(Object.values(keywords.languages).every((terms) => terms.length >= 15));
  assert.match(queryStrategy, /gdelt: 60/);
  assert.match(queryStrategy, /youtube: 100/);
  assert.match(queryStrategy, /maximumCalls: 45/);
  assert.match(queryStrategy, /NEAR/);
  assert.match(queryStrategy, /REPEAT/);
  assert.match(queryStrategy, /rotatingCoverageBatch/);
  assert.match(geography, /reviewedLocalitiesByState/);
  assert.match(geography, /ongoingEventLocalities/);
  assert.match(geography, /weakCoverageStates/);
  assert.match(geography, /recentItemLocalities/);
});

test("manual dry runs enforce the first-rollout source, item and candidate stops", () => {
  assert.match(orchestrator, /maximumSources: 20/);
  assert.match(orchestrator, /maximumItemsPerSource: 20/);
  assert.match(orchestrator, /maximumFetchedItems: 300/);
  assert.match(orchestrator, /maximumCandidates: 100/);
  assert.match(orchestrator, /maximumGdeltSearches: 60/);
  assert.match(orchestrator, /maximumYoutubeSearches: 50/);
  assert.match(orchestrator, /maximumBlueskyRequests: 100/);
  assert.match(orchestrator, /controlledManualDryRun/);
  assert.match(orchestrator, /controlledFallbackRun/);
  assert.match(orchestrator, /neq\("scan_method", "gdelt"\)/);
  assert.match(orchestrator, /status: "skipped"/);
  assert.match(orchestrator, /limitReached/);
  assert.match(sourceDiscovery, /maximumItems/);
});

test("fallback dry run selects only compliant non-GDELT sources in the requested order", () => {
  assert.match(fallbackDryRun, /manual_fallback_dry_run/);
  assert.match(fallbackDryRun, /limit 20/);
  assert.match(
    fallbackDryRun,
    /source\.scan_method in \('rss', 'atom', 'sitemap', 'html_list', 'youtube_api', 'bluesky_api'\)/,
  );
  assert.doesNotMatch(fallbackDryRun, /source\.scan_method in \([^)]*gdelt/);
  assert.match(fallbackDryRun, /review\.production_enabled/);
  assert.match(
    fallbackDryRun,
    /review\.robots_policy not in \('not_assessed', 'restricted', 'forbidden'\)/,
  );
  assert.match(fallbackDryRun, /fallback_processing_purpose_not_approved/);
  assert.match(fallbackDryRun, /fallback_sources_unavailable/);
  assert.doesNotMatch(fallbackDryRun, /discovery_schedule_settings/);
  assert.match(dashboardActions, /trigger: "manual_fallback_dry_run"/);
  assert.match(fallbackControl, /Run fallback dry scan/);
  assert.match(fallbackControl, /approved non-GDELT metadata sources only/);
  assert.match(fallbackControl, /role="status" aria-live="polite"/);
  assert.match(dashboard, /approvedFallbackSources/);
  assert.match(dashboard, /No approved non-GDELT production source is currently available/);
});

test("private lead discovery excludes contributor contact details", () => {
  const select = leadInputs.match(/\.select\(\s*"([^"]+)"/s)?.[1] ?? "";
  assert.match(select, /title,description,location/);
  assert.doesNotMatch(select, /contact_email|contact_phone/);
  assert.match(leadInputs, /pending_review/);
});

test("controlled GDELT run is metadata-only, single-use and never scheduled", () => {
  assert.match(controlledGdelt, /manual_gdelt_dry_run/);
  assert.match(controlledGdelt, /manual_dry_run_only/);
  assert.match(controlledGdelt, /manual_run_consumed_at/);
  assert.match(controlledGdelt, /fullArticleFetching.*false/);
  assert.match(controlledGdelt, /mediaFetching.*false/);
  assert.match(controlledGdelt, /enabled = false/);
  assert.match(orchestrator, /approved_for_controlled_metadata_dry_run/);
  assert.match(sourceDiscovery, /buildManualGdeltDryRunQueries/);
});

test("only authorised editors can see and invoke the manual GDELT control", () => {
  assert.match(dashboard, /if \(!session\.user\)[\s\S]*redirect/);
  assert.match(dashboard, /if \(!session\.editor \|\| !session\.supabase\) notFound\(\)/);
  assert.ok(
    dashboard.indexOf("if (!session.editor") < dashboard.indexOf("<ManualGdeltDryRunControl"),
  );
  assert.match(manualControl, /Run GDELT dry scan/);
  assert.match(dashboardActions, /const supabase = await editor\(\)/);
  assert.match(protectedGdeltControl, /not coalesce\(public\.is_authorised_editor\(\), false\)/);
  assert.match(protectedGdeltControl, /Authorised editor access required/);
  assert.doesNotMatch(manualControl, /SERVICE_ROLE|service-role|service_role/);
});

test("manual GDELT control confirms, reports progress and renders safe outcomes", () => {
  assert.match(manualControl, /Run one controlled GDELT metadata scan for the previous 48 hours\?/);
  assert.match(manualControl, /Run dry scan/);
  assert.match(manualControl, /Cancel/);
  assert.match(manualControl, /pending \? "Running…"/);
  assert.match(manualControl, /role="status" aria-live="polite"/);
  assert.match(manualControl, /Items discovered/);
  assert.match(manualControl, /Candidates created/);
  assert.match(manualControl, /Open the resulting review queue/);
  assert.match(dashboardActions, /No public records were changed/);
});

test("manual GDELT control is idempotent and refreshes dashboard data", () => {
  assert.match(manualControl, /disabled=\{pending/);
  assert.match(protectedGdeltControl, /pg_advisory_xact_lock/);
  assert.match(protectedGdeltControl, /status in \('queued', 'running'\)/);
  assert.match(protectedGdeltControl, /dry_scan_already_running/);
  assert.match(protectedGdeltControl, /dry_scan_already_used/);
  assert.match(dashboardActions, /revalidatePath\("\/admin\/review\/scan-runs"\)/);
  assert.match(dashboardActions, /revalidatePath\("\/admin\/review\/today"\)/);
  assert.match(manualControl, /router\.refresh\(\)/);
});

test("editor control requires exact metadata-only limits without enabling automation", () => {
  for (const expected of [
    /"maximumQueries":60/,
    /"maximumDiscoveredItems":300/,
    /"maximumCandidates":100/,
    /"timeWindowHours":48/,
    /"fullArticleFetching":false/,
    /"mediaFetching":false/,
    /approved_for_manual_dry_run_only/,
    /gdelt_metadata_editorial_discovery_dry_run/,
  ])
    assert.match(protectedGdeltControl, expected);
  assert.doesNotMatch(protectedGdeltControl, /update public\.discovery_schedule_settings/);
  assert.doesNotMatch(protectedGdeltControl, /insert into public\.(events|event_media)/);
});
