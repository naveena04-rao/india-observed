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
const { groupCandidatesByState, unknownStateGroup } = compiledModule.exports;

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
