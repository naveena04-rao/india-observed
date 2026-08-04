import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function compile(path, requireModule) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  Function(
    "require",
    "exports",
    "module",
    output,
  )(requireModule, compiledModule.exports, compiledModule);
  return compiledModule.exports;
}

const geography = compile("src/lib/discovery/geography.ts", () => ({}));
const classification = compile("src/lib/discovery/classification.ts", (specifier) => {
  if (specifier === "./geography") return geography;
  if (specifier === "@/data/reviewed-events-preview") return { reviewedEventsPreview: [] };
  return {};
});
const { classifyDiscoveredItem } = classification;

test("foreign military strike metadata fails the hard India gate", () => {
  const result = classifyDiscoveredItem({
    title: "35 dead in Sudan army drone strike on Darfur civil court",
    text: "35 dead in Sudan army drone strike on Darfur civil court",
    sourceUrl: "https://telanganatoday.com/sudan-drone-strike",
    publishedAt: "2026-08-04T02:45:19Z",
  });
  assert.equal(result.candidateType, "irrelevant");
  assert.equal(result.reason, "irrelevant_non_india");
});

test("the confirmed Pranab Doley detention mobilisation becomes a civic candidate", () => {
  const result = classifyDiscoveredItem({
    title: "Organisations condemn Pranab Doley’s detention",
    text: "Assam organisations and trade unions condemn the detention and urge the Assam government to comply with the court order.",
    sourceUrl: "https://www.nenow.in/north-east-news/assam/pranab-doley-detention.html",
    publishedAt: "2026-08-03T15:14:22Z",
  });
  assert.equal(result.candidateType, "new_event");
  assert.equal(result.state, "Assam");
  assert.ok(result.confidence >= 0.5);
});

test("ambiguous and routine-news uses of civic words remain irrelevant", () => {
  for (const [title, text] of [
    ["India reviews air strike readiness", "The Indian military reviewed air strike readiness."],
    ["India batter improves strike rate", "The Indian cricket player improved his strike rate."],
    [
      "Manipur police arrest alleged drug smugglers",
      "Police arrested four alleged drug smugglers in Manipur.",
    ],
    [
      "NDA to hold meeting in New Delhi",
      "The NDA will hold a routine political meeting in New Delhi.",
    ],
    ["Gujarat reports virus cases", "Gujarat reported a disease outbreak."],
    ["Assam recruitment notice", "The Assam department advertised vacancies."],
  ]) {
    const result = classifyDiscoveredItem({
      title,
      text,
      sourceUrl: "https://example.in/item",
      publishedAt: "2026-08-04T00:00:00Z",
    });
    assert.equal(result.candidateType, "irrelevant", title);
  }
});
