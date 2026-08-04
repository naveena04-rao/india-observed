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
const keywordData = JSON.parse(
  readFileSync(new URL("../data/discovery-keywords.json", import.meta.url), "utf8"),
);
const classification = compile("src/lib/discovery/classification.ts", (specifier) => {
  if (specifier === "./geography") return geography;
  if (specifier === "@/data/reviewed-events-preview") return { reviewedEventsPreview: [] };
  if (specifier === "@/../data/discovery-keywords.json") return { default: keywordData };
  return {};
});
const { classifyDiscoveredItem, matchExistingEvent } = classification;

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

test("foreign civic actions remain outside the shortlist even on Indian publisher feeds", () => {
  for (const [title, text] of [
    [
      "Workers strike in France over pension law",
      "French unions began a nationwide strike in Paris.",
    ],
    ["Students protest in Canada", "Students and unions protested tuition policy in Toronto."],
    ["Bangladesh workers block road", "Garment workers in Dhaka blockaded a road over wages."],
    [
      "Global protest report mentions India",
      "A protest in London cited India only in background context.",
    ],
  ]) {
    const result = classifyDiscoveredItem({
      title,
      text,
      sourceUrl: "https://indianexpress.com/world/example",
      sourceStateHint: "National",
    });
    assert.equal(result.reason, "irrelevant_non_india", title);
  }
});

test("the confirmed Pranab Doley detention mobilisation becomes a civic candidate", () => {
  const result = classifyDiscoveredItem({
    title: "Organisations condemn Pranab Doley’s detention",
    text: "Assam organisations and trade unions condemn the detention and urge the Assam government to comply with the court order.",
    sourceUrl: "https://www.nenow.in/north-east-news/assam/pranab-doley-detention.html",
    publishedAt: "2026-08-03T15:14:22Z",
  });
  assert.ok(["new_event", "official_response"].includes(result.candidateType));
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

test("credible future collective action uses the planned-event classification", () => {
  const result = classifyDiscoveredItem({
    title: "Punjab farmers announce protest march on 12 August",
    text: "The farmers union announced a protest march in Chandigarh on 12 August seeking compensation from the government.",
    sourceUrl: "https://example.in/punjab-farmers-plan-march",
    sourceStateHint: "Punjab",
  });
  assert.equal(result.candidateType, "possible_planned_event");
  assert.equal(result.state, "Chandigarh");
  assert.equal(result.plannedDate, "12 august");
});

test("Cauvery farmers protest cannot match the Hidkal compensation event", () => {
  const hidkal = {
    internalId: "IO-CM-KA-0001",
    slug: "hidkal-displaced-farmers-belagavi-compensation",
    title: "Hidkal displaced farmers protest for compensation",
    topic: "Compensation for Hidkal dam displacement",
    summary: "Farmers displaced by the Hidkal dam demand rehabilitation compensation.",
    directedAt: "Karnataka Government; Belagavi District Administration",
    stateOrUnionTerritory: "Karnataka",
    publicLocation: "Hidkal, Belagavi district, Karnataka",
    startDate: "2026-06-01",
    lastReviewed: "2026-07-21",
  };
  const match = matchExistingEvent({
    content: "Cauvery crisis sparks farmers protest in Tamil Nadu seeking river water release",
    state: "Tamil Nadu",
    publishedAt: "2026-08-04T03:21:39Z",
    events: [hidkal],
  });
  assert.equal(match.score, 0);
  assert.match(match.negatives.join(" "), /state mismatch/i);
});

test("native-script dictionaries are active across all 13 configured languages", () => {
  assert.equal(Object.keys(keywordData.languages).length, 13);
  for (const [language, entries] of Object.entries(keywordData.languages)) {
    assert.ok(entries.length >= 10, language);
  }
});
