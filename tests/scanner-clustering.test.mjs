import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/discovery/clustering.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiled = { exports: {} };
Function(
  "require",
  "exports",
  "module",
  output,
)((specifier) => (specifier === "node:crypto" ? { createHash } : {}), compiled.exports, compiled);
const { createEventClusterKey, representsSameEvent } = compiled.exports;

const report = (overrides = {}) => ({
  title: "Farmers block highway in Patiala seeking crop compensation",
  canonicalUrl: "https://publisher.example/report-a",
  state: "Punjab",
  district: "Patiala",
  eventDate: "2026-08-04T06:00:00Z",
  actionType: "blockade",
  affectedGroup: "farmers",
  demand: "crop compensation",
  ...overrides,
});

test("same-event reports cluster while retaining distinct publisher URLs", () => {
  assert.equal(
    representsSameEvent(
      report(),
      report({
        title: "Patiala farmers stage highway blockade for crop compensation",
        canonicalUrl: "https://other.example/report-b",
      }),
    ),
    true,
  );
  assert.match(createEventClusterKey(report()), /^[a-f0-9]{64}$/);
});

test("different district, demand or action prevents clustering", () => {
  assert.equal(
    representsSameEvent(
      report(),
      report({ district: "Ludhiana", canonicalUrl: "https://other.example/district" }),
    ),
    false,
  );
  assert.equal(
    representsSameEvent(
      report(),
      report({ actionType: "hunger strike", canonicalUrl: "https://other.example/action" }),
    ),
    false,
  );
});
