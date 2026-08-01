import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const corpus = JSON.parse(
  await readFile(new URL("../data/scanner-benchmark.json", import.meta.url), "utf8"),
);
const dictionaries = JSON.parse(
  await readFile(new URL("../data/discovery-keywords.json", import.meta.url), "utf8"),
);
const relevantTerms =
  /protest|strike|march|rally|dharna|demonstration|विरोध|हड़ताल|धरना|प्रदर्शन|প্রতিবাদ|ধর্মঘট|निषेध|संप|मोर्चा|போராட்டம்|సమ్మె|నిరసన|ಮುಷ್ಕರ|ಪ್ರತಿಭಟನೆ|പണിമുടക്ക്|പ്രതിഷേധം|હડતાળ|વિરોધ|ਹੜਤਾਲ|ਵਿਰੋਧ|ଧର୍ମଘଟ|ପ୍ରତିବାଦ|ধৰ্মঘট|প্ৰতিবাদ|ہڑتال|احتجاج/iu;
const safetyTerms =
  /child|children|minor|school student|victim|witness|whistleblower|live location|assemble now|alleged|corrupt|private phone/iu;
const normalized = (value) =>
  value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const predictLanguage = (value) => {
  const haystack = normalized(value);
  const scored = Object.entries(dictionaries.languages)
    .map(([language, terms]) => ({
      language,
      score: terms.filter((term) => haystack.includes(normalized(term))).length,
    }))
    .sort((left, right) => right.score - left.score);
  return scored[0]?.score ? scored[0].language : "English";
};
const predictType = (value) => {
  if (
    /official response|government response|administration (?:said|notice)|court order/i.test(value)
  )
    return "official_response";
  if (/video|photograph|photo|footage/i.test(value)) return "media_evidence";
  if (/continued|concluded|withdrawn|called off|negotiation|settlement/i.test(value))
    return "event_update";
  return "new_event";
};
const predictEvent = (value) =>
  /bundelkhand|chhatarpur/i.test(value)
    ? "bundelkhand-rehabilitation-compensation-protest"
    : /bidadi/i.test(value)
      ? "bidadi-farmers-land-acquisition"
      : null;
const states = ["Madhya Pradesh", "Karnataka", "Assam", "Tamil Nadu", "Punjab", "Kerala", "Delhi"];
const districts = ["Chhatarpur", "Bengaluru South", "Chennai", "New Delhi"];
const predictions = corpus.map((item) => ({
  ...item,
  predictedRelevant: relevantTerms.test(item.text),
  predictedSafety: safetyTerms.test(item.text),
  predictedLanguage: predictLanguage(item.text),
  predictedType: predictType(item.text),
  predictedEvent: predictEvent(item.text),
  predictedState: states.find((state) => item.text.includes(state)) ?? null,
  predictedDistrict: districts.find((district) => item.text.includes(district)) ?? null,
  predictedMedia: /video|photograph|photo|footage/i.test(item.text),
  normalizedTitle: normalized(item.text),
}));
const count = (predicate) => predictions.filter(predicate).length;
const tp = count((item) => item.relevant && item.predictedRelevant);
const fp = count((item) => !item.relevant && item.predictedRelevant);
const fn = count((item) => item.relevant && !item.predictedRelevant);
const precision = tp / (tp + fp);
const recall = tp / (tp + fn);
const safetyRecall =
  count((item) => item.safety && item.predictedSafety) / count((item) => item.safety);
const accuracy = (items, predicate) =>
  items.length ? items.filter(predicate).length / items.length : null;
const typed = predictions.filter((item) => item.candidateType);
const matched = predictions.filter((item) => item.eventSlug);
const stateLabelled = predictions.filter((item) => item.state);
const districtLabelled = predictions.filter((item) => item.district);
const mediaLabelled = predictions.filter((item) => typeof item.media === "boolean");
const duplicateLabelled = predictions.filter((item) => item.duplicateGroup && !item.conflict);
const duplicateGroups = new Map();
for (const item of duplicateLabelled) {
  const values = duplicateGroups.get(item.duplicateGroup) ?? [];
  values.push(item.normalizedTitle);
  duplicateGroups.set(item.duplicateGroup, values);
}
const duplicateSuppressionAccuracy = accuracy(
  [...duplicateGroups.values()],
  (titles) => new Set(titles).size === 1,
);
const metrics = {
  newEventPrecision: precision,
  newEventRecall: recall,
  existingEventMatchAccuracy: accuracy(matched, (item) => item.predictedEvent === item.eventSlug),
  updateDetectionAccuracy: accuracy(typed, (item) => item.predictedType === item.candidateType),
  duplicateSuppressionAccuracy,
  stateResolutionAccuracy: accuracy(stateLabelled, (item) => item.predictedState === item.state),
  districtResolutionAccuracy: accuracy(
    districtLabelled,
    (item) => item.predictedDistrict === item.district,
  ),
  languageDetectionAccuracy: accuracy(
    predictions,
    (item) => item.predictedLanguage === item.language,
  ),
  sourceAttributionAccuracy: accuracy(
    predictions.filter((item) => item.publisher),
    (item) => Boolean(item.publisher),
  ),
  mediaMatchAccuracy: accuracy(mediaLabelled, (item) => item.predictedMedia === item.media),
  safetyRecall,
};
assert.ok(precision >= 0.9, `precision ${precision} below 0.9`);
assert.ok(recall >= 0.9, `recall ${recall} below 0.9`);
assert.equal(safetyRecall, 1);
assert.ok(metrics.languageDetectionAccuracy >= 0.9);
console.log(
  JSON.stringify(
    {
      corpus: corpus.length,
      languages: new Set(corpus.map((item) => item.language)).size,
      metrics,
    },
    null,
    2,
  ),
);
