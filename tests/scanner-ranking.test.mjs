import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/discovery/ranking.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
Function(
  "require",
  "exports",
  "module",
  output,
)(() => ({}), compiledModule.exports, compiledModule);
const { rankPreliminaryReviewItems } = compiledModule.exports;

const classification = (candidateType, confidence, reason = "test") => ({
  candidateType,
  confidence,
  reason,
  targetEventSlug: null,
  state: null,
  priority: "normal",
  targetEventInternalId: null,
  matchingSignals: [],
  conflictingSignals: [],
  sourceIsNewerThanEvent: null,
});

test("credible India civic candidates rank ahead of generic and foreign metadata", () => {
  const ranked = rankPreliminaryReviewItems([
    {
      value: "foreign",
      classification: classification("irrelevant", 0.9, "irrelevant_non_india"),
      publishedAt: "2026-08-04T10:00:00Z",
    },
    {
      value: "generic-india",
      classification: classification("irrelevant", 0.25),
      publishedAt: "2026-08-04T09:00:00Z",
    },
    {
      value: "civic-event",
      classification: classification("new_event", 0.55),
      publishedAt: "2026-08-04T08:00:00Z",
    },
  ]);
  assert.deepEqual(
    ranked.map((item) => item.value),
    ["civic-event", "generic-india", "foreign"],
  );
  assert.equal(ranked[0].preliminaryCivicPassed, true);
  assert.equal(ranked[2].indiaGatePassed, false);
});

test("equally credible candidates are ordered by confidence and discovery time", () => {
  const ranked = rankPreliminaryReviewItems([
    {
      value: "older",
      classification: classification("official_response", 0.7),
      publishedAt: "2026-08-03T08:00:00Z",
    },
    {
      value: "newer",
      classification: classification("event_update", 0.7),
      publishedAt: "2026-08-04T08:00:00Z",
    },
    {
      value: "higher-confidence",
      classification: classification("new_event", 0.8),
      publishedAt: "2026-08-02T08:00:00Z",
    },
  ]);
  assert.deepEqual(
    ranked.map((item) => item.value),
    ["higher-confidence", "newer", "older"],
  );
});
