import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const connector = read("src/lib/discovery/connectors/freeConnectors.ts");
const orchestrator = read("src/lib/discovery/orchestrator.ts");
const actions = read("src/app/admin/review/actions.ts");
const dashboard = read("src/app/admin/review/[view]/page.tsx");

test("GDELT throttling stops immediately and persists a safe cooldown", () => {
  assert.doesNotMatch(connector, /GDELT_MAX_ATTEMPTS|GDELT_BACKOFF_MS/);
  assert.match(connector, /A 429 is not retried in the same run/);
  assert.match(orchestrator, /error\.diagnostics\.statusCode === 429/);
  assert.match(orchestrator, /cooldown_until/);
  assert.match(orchestrator, /GDELT returned HTTP 429 \(rate limited\)\. No items were stored\./);
  assert.match(actions, /result\.safeFailureSummary/);
  assert.match(
    dashboard,
    /scan_jobs\(status,attempt_count,request_count,items_discovered,error_code,safe_error_summary\)/,
  );
});

test("GDELT parsing accepts empty results and rejects unsafe shapes", () => {
  assert.match(connector, /export function parseGdeltResponse/);
  assert.match(connector, /if \(articles === undefined\) return \[\]/);
  assert.match(connector, /gdelt_response_parsing_failed/);
  assert.match(connector, /gdelt_response_validation_failed/);
});
