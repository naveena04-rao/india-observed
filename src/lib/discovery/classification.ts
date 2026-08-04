import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import keywordData from "@/../data/discovery-keywords.json";
import { detectReviewedLocality, detectReviewedState } from "./geography";
import type { DiscoveryClassification } from "./types";

const stopWords = new Set([
  "and",
  "for",
  "from",
  "over",
  "the",
  "their",
  "with",
  "india",
  "indian",
  "protest",
  "strike",
  "rally",
  "march",
  "farmers",
  "students",
  "against",
  "action",
  "opposition",
  "government",
  "police",
]);

const civicEventPattern =
  /\b(protests?|strikes?|march(?:es)?|rall(?:y|ies)|dharnas?|demonstrations?|shutdowns?|bandhs?|hartals?|sit-ins?|hunger strikes?|indefinite fasts?|cease-works?|walkouts?|suspend(?:s|ed|ing)? services?|blockades?|road rokos?|rail rokos?|agitations?|gheraos?|picketing|boycotts?|memorandum submissions?|condemn(?:s|ed|ing|ation)?)\b/;
const civicContextPattern =
  /\b(organisations?|organizations?|associations?|trade unions?|unions?|movements?|activists?|rights defenders?|civil society|mps?|lawmakers?|legislators?|workers?|students?|farmers?|residents?|employees?|villagers?|communities?|tribal groups?|groups?|detention|detained|demands?|grievances?|evictions?|land acquisition|compensation|labour disputes?|community mobilisation|police|courts?|government|administration|authorit(?:y|ies))\b/;
const grievancePattern =
  /\b(demands?|seeking|against|oppose[ds]?|opposition|grievances?|rights?|wages?|salary|pension|compensation|eviction|land acquisition|jobs?|employment|water|electricity|fees?|policy|order|detention|release|justice|withdraw(?:al)?|cancel(?:lation)?|implementation)\b/;
const authorityPattern =
  /\b(government|administration|ministry|department|minister|chief minister|prime minister|police|court|high court|supreme court|collector|commissioner|municipality|university|management|authority)\b/;
const indiaInstitutionPattern =
  /\b(government of india|union (?:government|ministry)|supreme court of india|high court|indian railways|election commission of india|bharatiya kisan union|bku|aituc|citu|intuc|asha workers?|anganwadi workers?|kisan morcha|district administration)\b/;
const explicitForeignPattern =
  /\b(sudan|darfur|pakistan|bangladesh|dhaka|sri lanka|nepal|myanmar|china|russia|ukraine|israel|gaza|iran|iraq|afghanistan|united states|u\.s\.|united kingdom|britain|england|scotland|wales|london|france|paris|germany|canada|toronto|australia|south africa|kenya|nigeria|brazil)\b/;
const ambiguousStrikePattern =
  /\b(?:military|air|airborne|drone|missile|surgical|lightning|precision) strikes?\b|\bstrike rate\b|\bstrikes? down\b/;
const routineNonCivicPattern =
  /\b(recruitment|vacanc(?:y|ies)|horoscope|fashion|food festival|sports?|football|cricket|stock market|shares?|virus|disease|outbreak|drug smugglers?|kidnapping|murder|killing|box office|film|actor|actress|technology|smartphone)\b/;
const routinePoliticalMeetingPattern =
  /\b(?:party|nda|bjp|congress|rss)\b.{0,80}\b(?:meeting|meet|conference|conclave|outreach|election rally)\b/;
const plannedPattern =
  /\b(?:announce[ds]?|plans?|planned|will|to hold|to stage|to begin|to launch|calls? for|invites?.{0,40}join|scheduled|threatens?)\b.{0,100}\b(?:protest|march|strike|bandh|rally|dharna|blockade|hunger strike|agitation|walkout|suspend services?)\b|\b(?:protest|march|strike|bandh|rally|dharna|blockade|hunger strike|agitation|walkout|suspend services?)\b.{0,80}\b(?:from|starting|next|tomorrow|on\s+(?:\d{1,2}|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/;
const nationalInstitutionPattern =
  /\b(parliament|rajya sabha|lok sabha|supreme court|prime minister|union government|centre)\b/;
const officialResponsePattern =
  /\b(official response|government response|court order|court intervened|administration said|minister announced|assurance given|talks held|police detained protesters|firs? (?:withdrawn|closed)|government order issued|supreme court.{0,100}(?:said|says|allows?|opens? the door|withdraw|close))\b/;
const outcomePattern =
  /\b(settlement reached|settled|agreement reached|resolved|concluded|withdrawn|called off|suspended|blockade lifted|demands accepted|strike withdrawn|protest suspended|assurance given|talks held|agitation intensified|protest resumed)\b/;

const dictionaryEntries = Object.entries(keywordData.languages).flatMap(([language, values]) =>
  values.map((value) => ({ language, value: value.toLocaleLowerCase() })),
);

const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase();
const terms = (value: string) =>
  new Set(
    normalize(value)
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2 && !stopWords.has(term)),
  );
const overlap = (left: Set<string>, right: Set<string>) =>
  [...left].filter((term) => right.has(term));

function extractPhrase(content: string, pattern: RegExp, maximum = 180) {
  const match = content.match(pattern)?.[0]?.trim();
  return match ? match.slice(0, maximum) : null;
}

function extractPlannedDate(content: string) {
  const raw = content.match(
    /\b(?:on|from|starting)\s+((?:\d{1,2}\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i,
  )?.[1];
  return raw ?? null;
}

type MatchableEvent = (typeof reviewedEventsPreview)[number];

export function matchExistingEvent(input: {
  content: string;
  state: string | null;
  publishedAt?: string | null;
  events?: readonly MatchableEvent[];
}) {
  const contentTerms = terms(input.content);
  const published = input.publishedAt ? Date.parse(input.publishedAt) : Number.NaN;
  return [...(input.events ?? reviewedEventsPreview)]
    .map((event) => {
      const eventState = normalize(event.stateOrUnionTerritory);
      const stateTokens = terms(event.stateOrUnionTerritory);
      const stateMismatch = Boolean(input.state && normalize(input.state) !== eventState);
      const locationTokens = terms(event.publicLocation);
      const topicTokens = terms(`${event.topic} ${event.summary}`);
      const authorityTokens = terms(event.directedAt);
      const titleTokens = terms(event.title);
      const locationOverlap = overlap(contentTerms, locationTokens).filter(
        (term) => !stateTokens.has(term),
      );
      const topicOverlap = overlap(contentTerms, topicTokens).filter(
        (term) => !stateTokens.has(term),
      );
      const authorityOverlap = overlap(contentTerms, authorityTokens).filter(
        (term) => !stateTokens.has(term),
      );
      const titleOverlap = overlap(contentTerms, titleTokens).filter(
        (term) => !stateTokens.has(term),
      );
      const specificLocation = locationOverlap.length > 0;
      const positives = [
        specificLocation ? `specific locality: ${locationOverlap.join(", ")}` : null,
        topicOverlap.length >= 2 ? `demand/dispute: ${topicOverlap.slice(0, 5).join(", ")}` : null,
        authorityOverlap.length >= 2
          ? `authority/organisation: ${authorityOverlap.slice(0, 4).join(", ")}`
          : null,
        titleOverlap.length >= 2
          ? `specific title terms: ${titleOverlap.slice(0, 5).join(", ")}`
          : null,
        input.state && normalize(input.state) === eventState ? `same state: ${input.state}` : null,
      ].filter((signal): signal is string => Boolean(signal));
      const negatives = [
        stateMismatch
          ? `state mismatch: ${input.state} versus ${event.stateOrUnionTerritory}`
          : null,
      ].filter((signal): signal is string => Boolean(signal));
      const start = event.startDate ? Date.parse(event.startDate) : Number.NaN;
      if (Number.isFinite(published) && Number.isFinite(start) && published < start)
        negatives.push("source timestamp predates the reviewed event");
      const specificity =
        (specificLocation ? 0.3 : 0) +
        Math.min(topicOverlap.length, 4) * 0.08 +
        Math.min(authorityOverlap.length, 3) * 0.08 +
        Math.min(titleOverlap.length, 4) * 0.06 +
        (input.state && normalize(input.state) === eventState ? 0.08 : 0) -
        negatives.length * 0.35;
      const eligible =
        negatives.length === 0 &&
        positives.length >= 3 &&
        (specificLocation ||
          (topicOverlap.length >= 3 && authorityOverlap.length >= 2 && titleOverlap.length >= 2));
      return {
        event,
        score: eligible ? Math.max(0, Math.min(1, specificity)) : 0,
        positives,
        negatives,
        newer: Number.isFinite(published) ? published > Date.parse(event.lastReviewed) : null,
      };
    })
    .sort((left, right) => right.score - left.score)[0];
}

export function classifyDiscoveredItem(input: {
  title: string;
  text: string;
  sourceUrl: string;
  publishedAt?: string | null;
  sourceStateHint?: string | null;
  detectedLanguage?: string | null;
}): DiscoveryClassification {
  const content = normalize(`${input.title} ${input.text}`);
  const dictionaryMatches = dictionaryEntries
    .filter(({ value }) => content.includes(value))
    .map(({ language, value }) => `${language}:${value}`)
    .slice(0, 20);
  const dictionaryLanguage = dictionaryMatches[0]?.split(":", 1)[0] ?? null;
  const rawCivicSignal =
    content.match(civicEventPattern)?.[0] ??
    dictionaryMatches[0]?.slice(dictionaryMatches[0].indexOf(":") + 1) ??
    null;
  const civicSignal =
    (rawCivicSignal?.includes("strike") && ambiguousStrikePattern.test(content)) ||
    (rawCivicSignal === "memorandum" &&
      !/\bmemorandum\b.{0,40}\b(submit|submitted|submission|present|presented|handed)\b/.test(
        content,
      ))
      ? null
      : rawCivicSignal;
  const contextSignal = content.match(civicContextPattern)?.[0] ?? null;
  const grievanceSignal = content.match(grievancePattern)?.[0] ?? null;
  const authoritySignal = content.match(authorityPattern)?.[0] ?? null;
  const titleContent = normalize(input.title);
  const explicitState = detectReviewedState(titleContent) ?? detectReviewedState(content);
  const locality = detectReviewedLocality(titleContent) ?? detectReviewedLocality(content);
  const foreignSignal = content.match(explicitForeignPattern)?.[0] ?? null;
  const explicitIndia = content.match(/\b(?:india|indian)\b/)?.[0] ?? null;
  const institution = content.match(indiaInstitutionPattern)?.[0] ?? null;
  const nationalInstitution = content.match(nationalInstitutionPattern)?.[0] ?? null;
  const indiaSignal = explicitState ?? explicitIndia ?? institution ?? nationalInstitution;
  const resolvedState =
    locality?.state ?? explicitState ?? (nationalInstitution ? "National" : null);
  const base = {
    targetEventSlug: null,
    state: resolvedState,
    priority: "low" as const,
    targetEventInternalId: null,
    matchingSignals: [] as string[],
    conflictingSignals: [] as string[],
    sourceIsNewerThanEvent: null,
    actionType: civicSignal,
    districtOrRegion: locality?.locality ?? null,
    eventDate: null,
    plannedDate: plannedPattern.test(content) ? extractPlannedDate(content) : null,
    affectedGroup: extractPhrase(
      content,
      /\b(?:farmers?|workers?|students?|residents?|villagers?|employees?|teachers?|doctors?|nurses?|drivers?|tribal (?:people|groups?)|trade unions?|organisations?|associations?)\b/,
    ),
    demand: extractPhrase(
      content,
      /\b(?:demand(?:s|ed|ing)?|seeking|oppose[ds]?|against|over)\b.{0,140}/,
    ),
    authorityResponse: extractPhrase(content, officialResponsePattern),
    dictionaryMatches,
    detectedLanguage: input.detectedLanguage ?? dictionaryLanguage ?? "und",
    civicRelevanceScore: 0,
  };

  if (!indiaSignal || (foreignSignal && !explicitState && !institution)) {
    return {
      ...base,
      candidateType: "irrelevant",
      confidence: 0.1,
      reason: "irrelevant_non_india",
      conflictingSignals: [
        foreignSignal
          ? `Foreign location signal without a specific India event signal: ${foreignSignal}`
          : "No reliable India location, authority, organisation or affected-group signal was found.",
      ],
    };
  }

  const routineNonCivic =
    ambiguousStrikePattern.test(content) ||
    routineNonCivicPattern.test(content) ||
    routinePoliticalMeetingPattern.test(content);
  const affectedGroup = base.affectedGroup;
  const ungroundedThreat = /\bprotest threats?\b/.test(content) && !affectedGroup;
  const collectiveEvidence = [
    civicSignal,
    contextSignal,
    grievanceSignal,
    locality?.locality ?? explicitState,
    authoritySignal,
  ].filter(Boolean);
  const relevance = Math.min(
    1,
    (civicSignal ? 0.35 : 0) +
      (contextSignal ? 0.2 : 0) +
      (grievanceSignal ? 0.2 : 0) +
      (locality || explicitState ? 0.1 : 0) +
      (authoritySignal ? 0.1 : 0) +
      (dictionaryMatches.length ? 0.05 : 0),
  );
  base.civicRelevanceScore = relevance;
  if (routineNonCivic || ungroundedThreat || !civicSignal || collectiveEvidence.length < 3) {
    return {
      ...base,
      candidateType: "irrelevant",
      confidence: Math.min(0.35, relevance),
      reason: "irrelevant_non_collective_context",
      matchingSignals: [`India signal: ${indiaSignal}`],
      conflictingSignals: [
        routineNonCivic
          ? "A military, market, sport, crime, routine-political or other non-civic use was detected."
          : ungroundedThreat
            ? "A protest threat without a named affected group or organiser is not treated as an event."
            : "The metadata lacks enough collective-action, group, grievance, location or authority context.",
      ],
    };
  }

  const match = matchExistingEvent({
    content,
    state: resolvedState,
    publishedAt: input.publishedAt,
  });
  const officialResponse = officialResponsePattern.test(content);
  const outcome = outcomePattern.test(content);
  const planned = plannedPattern.test(content) && !outcome;

  if (match && match.score >= 0.38) {
    return {
      ...base,
      candidateType: outcome
        ? "outcome_status_change"
        : officialResponse
          ? "official_response"
          : "event_update",
      targetEventSlug: match.event.slug,
      targetEventInternalId: match.event.internalId,
      state: match.event.stateOrUnionTerritory,
      confidence: Math.min(0.95, Number((0.55 + match.score * 0.4).toFixed(4))),
      priority: officialResponse || outcome ? "high" : "normal",
      reason:
        "Multiple specific location, organisation, demand, authority and chronology signals match a reviewed event.",
      matchingSignals: match.positives,
      conflictingSignals: match.negatives,
      sourceIsNewerThanEvent: match.newer,
    };
  }

  return {
    ...base,
    candidateType: planned
      ? "possible_planned_event"
      : outcome
        ? "outcome_status_change"
        : officialResponse
          ? "official_response"
          : "new_event",
    confidence: Number(Math.max(0.52, Math.min(0.82, relevance)).toFixed(4)),
    priority: officialResponse || outcome ? "high" : "normal",
    reason: planned
      ? "A credible group announcement describes future collective action; it is not treated as already occurring."
      : "India-specific collective action, affected-group and grievance or authority context passed the deterministic civic-event threshold.",
    matchingSignals: [
      `India signal: ${indiaSignal}`,
      `action: ${civicSignal}`,
      contextSignal ? `group/context: ${contextSignal}` : null,
      grievanceSignal ? `grievance: ${grievanceSignal}` : null,
      authoritySignal ? `authority: ${authoritySignal}` : null,
    ].filter((signal): signal is string => Boolean(signal)),
    conflictingSignals: match?.negatives ?? [],
  };
}
