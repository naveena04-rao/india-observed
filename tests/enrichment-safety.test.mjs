import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/discovery/sourceDiscovery.ts", import.meta.url),
  "utf8",
);
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiled = { exports: {} };
Function("require", "exports", "module", output)(() => ({}), compiled.exports, compiled);
const { robotsAllowsPath } = compiled.exports;

test("targeted enrichment obeys longest-match robots rules", () => {
  const robots = `
User-agent: *
Disallow: /private/
Disallow: /news/
Allow: /news/public/
`;
  assert.equal(robotsAllowsPath(robots, "/private/story"), false);
  assert.equal(robotsAllowsPath(robots, "/news/internal/story"), false);
  assert.equal(robotsAllowsPath(robots, "/news/public/story"), true);
  assert.equal(robotsAllowsPath(robots, "/india/story"), true);
});

test("enrichment falls back to the reviewed base hostname when stored domains are malformed", () => {
  const source = readFileSync(
    new URL("../src/lib/discovery/sourceDiscovery.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /configuredDomains\.filter/);
  assert.match(source, /new URL\(input\.source\.base_url\)\.hostname/);
});
