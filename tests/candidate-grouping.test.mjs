import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/editorial/candidateGrouping.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
Function("exports", "module", compiled)(compiledModule.exports, compiledModule);
const { groupCandidatesByState, partitionCandidateReviewRows, unknownStateGroup } =
  compiledModule.exports;

test("candidates are grouped by resolved state", () => {
  const groups = groupCandidatesByState([
    { id: "a", state: "Punjab", discovery_time: "2026-08-02T08:00:00Z" },
    { id: "b", state: "Delhi", discovery_time: "2026-08-02T09:00:00Z" },
    { id: "c", state: "Punjab", discovery_time: "2026-08-02T10:00:00Z" },
  ]);
  assert.deepEqual(
    groups.map((group) => [group.state, group.items.map((item) => item.id)]),
    [
      ["Delhi", ["b"]],
      ["Punjab", ["c", "a"]],
    ],
  );
});

test("items within each state are ordered by discovery time newest first", () => {
  const [group] = groupCandidatesByState([
    { id: "old", state: "Kerala", discovery_time: "2026-08-01T10:00:00Z" },
    { id: "new", state: "Kerala", discovery_time: "2026-08-02T10:00:00Z" },
  ]);
  assert.deepEqual(
    group.items.map((item) => item.id),
    ["new", "old"],
  );
});

test("missing and blank states use the Unknown / National group", () => {
  const groups = groupCandidatesByState([
    { id: "a", state: null, discovery_time: "2026-08-02T10:00:00Z" },
    { id: "b", state: " ", discovery_time: "2026-08-02T09:00:00Z" },
  ]);
  assert.equal(groups[0].state, unknownStateGroup);
  assert.deepEqual(
    groups[0].items.map((item) => item.id),
    ["a", "b"],
  );
});

test("the default review shortlist contains only credible event candidate types", () => {
  const rows = [
    {
      id: "planned",
      state: "Tamil Nadu",
      discovery_time: "2026-08-04T09:30:00Z",
      candidate_type: "possible_planned_event",
      confidence: 0.7,
    },
    {
      id: "new",
      state: "Assam",
      discovery_time: "2026-08-04T10:00:00Z",
      candidate_type: "new_event",
      confidence: 0.55,
    },
    {
      id: "update",
      state: "Delhi",
      discovery_time: "2026-08-04T09:00:00Z",
      candidate_type: "event_update",
      confidence: 0.72,
    },
    {
      id: "response",
      state: "Punjab",
      discovery_time: "2026-08-04T08:00:00Z",
      candidate_type: "official_response",
      confidence: 0.8,
    },
    {
      id: "outcome",
      state: "Kerala",
      discovery_time: "2026-08-04T07:00:00Z",
      candidate_type: "outcome_status_change",
      confidence: 0.6,
    },
    {
      id: "low",
      state: "Assam",
      discovery_time: "2026-08-04T06:00:00Z",
      candidate_type: "new_event",
      confidence: 0.49,
    },
    {
      id: "manual",
      state: "Assam",
      discovery_time: "2026-08-04T05:00:00Z",
      candidate_type: "manual_review",
      confidence: 0.9,
    },
    {
      id: "irrelevant",
      state: null,
      discovery_time: "2026-08-04T04:00:00Z",
      candidate_type: "irrelevant",
      confidence: 0.1,
    },
    {
      id: "duplicate",
      state: null,
      discovery_time: "2026-08-04T03:00:00Z",
      candidate_type: "duplicate",
      confidence: 0.9,
    },
    {
      id: "failed",
      state: null,
      discovery_time: "2026-08-04T02:00:00Z",
      candidate_type: "processing_failed",
      confidence: null,
    },
  ];
  const result = partitionCandidateReviewRows(rows);
  assert.deepEqual(
    result.eventCandidates.map((item) => item.id),
    ["planned", "new", "update", "response", "outcome"],
  );
  assert.deepEqual(
    result.diagnostics.map((item) => item.id),
    ["low", "manual", "irrelevant", "duplicate", "failed"],
  );
});
