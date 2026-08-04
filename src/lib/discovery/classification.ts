import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import keywordData from "@/../data/discovery-keywords.json";
import { detectReviewedState } from "./geography";
import type { DiscoveryClassification } from "./types";

const stopWords = new Set(["and", "for", "from", "over", "the", "their", "with"]);

const civicEventPattern =
  /\b(protests?|strikes?|march(?:es)?|rall(?:y|ies)|dharnas?|demonstrations?|shutdowns?|bandhs?|hartals?|sit-ins?|hunger strikes?|blockades?|agitations?|boycotts?|memorandum submissions?|condemn(?:s|ed|ing|ation)?)\b/;
const civicContextPattern =
  /\b(organisations?|organizations?|trade unions?|unions?|movements?|activists?|rights defenders?|civil society|bodies?|government|administration|authorit(?:y|ies)|courts?|workers?|students?|farmers?|residents?|employees?|communities?|groups?|detention|detained|demands?|demanded|urges?|grievances?|evictions?|land acquisition|compensation|labour disputes?|community mobilisation)\b/;
const multilingualCivicTerms = Object.values(keywordData.languages)
  .flat()
  .map((term) => term.toLocaleLowerCase())
  .sort((left, right) => right.length - left.length);
const indiaInstitutionPattern =
  /\b(government of india|union (?:government|ministry)|supreme court of india|high court|indian railways|election commission of india|bharatiya kisan union|bku|aituc|citu|intuc|asha workers?|anganwadi workers?)\b/;
const ambiguousStrikePattern =
  /\b(?:military|air|airborne|drone|missile|surgical|lightning|precision) strikes?\b|\bstrike rate\b/;
const routineNonCivicPattern =
  /\b(recruitment|vacanc(?:y|ies)|horoscope|fashion|food festival|sports?|football|cricket|virus|disease|outbreak|drug smugglers?|murder|killing|citizenship revocation|cabinet expansion)\b/;
const routinePoliticalMeetingPattern =
  /\b(?:party|nda|bjp|congress|rss)\b.{0,80}\b(?:meeting|meet|conference|conclave|outreach)\b/;

function terms(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2 && !stopWords.has(term)),
  );
}

function similarity(left: Set<string>, right: Set<string>) {
  const intersection = [...left].filter((term) => right.has(term)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export function classifyDiscoveredItem(input: {
  title: string;
  text: string;
  sourceUrl: string;
  publishedAt?: string | null;
}): DiscoveryClassification {
  const inputTerms = terms(`${input.title} ${input.text.slice(0, 4000)}`);
  const ranked = reviewedEventsPreview
    .map((event) => {
      const titleScore = similarity(inputTerms, terms(event.title));
      const topicScore = similarity(inputTerms, terms(`${event.topic} ${event.summary}`));
      const locationScore = similarity(
        inputTerms,
        terms(`${event.stateOrUnionTerritory} ${event.publicLocation}`),
      );
      const authorityScore = similarity(inputTerms, terms(event.directedAt));
      const stateMatch = input.text
        .toLocaleLowerCase()
        .includes(event.stateOrUnionTerritory.toLocaleLowerCase());
      const score = Math.min(
        1,
        titleScore * 0.45 +
          topicScore * 0.25 +
          locationScore * 0.15 +
          authorityScore * 0.1 +
          (stateMatch ? 0.05 : 0),
      );
      const signals = [
        titleScore >= 0.12 ? "title similarity" : null,
        topicScore >= 0.12 ? "event topic or affected-group overlap" : null,
        locationScore >= 0.12 ? "state, district or location overlap" : null,
        authorityScore >= 0.12 ? "organisation or authority overlap" : null,
        stateMatch ? "explicit state match" : null,
      ].filter((signal): signal is string => Boolean(signal));
      const published = input.publishedAt ? Date.parse(input.publishedAt) : Number.NaN;
      const start = event.startDate ? Date.parse(event.startDate) : Number.NaN;
      const verified = Date.parse(event.lastReviewed);
      return {
        event,
        score,
        signals,
        conflicts:
          Number.isFinite(published) && Number.isFinite(start) && published < start
            ? ["source timestamp predates the reviewed event"]
            : [],
        newer: Number.isFinite(published) ? published > verified : null,
      };
    })
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  const content = `${input.title} ${input.text}`.toLowerCase();
  const pibSource = new URL(input.sourceUrl).hostname.toLowerCase().endsWith("pib.gov.in");
  const officialResponse =
    /\b(official response|government response|court order|administration said|minister announced)\b/.test(
      content,
    ) ||
    (pibSource && /\b(government announced|ministry announced|cabinet approved)\b/.test(content));
  const outcomeOrStatusChange =
    /\b(settlement|settled|agreement reached|resolved|concluded|withdrawn|called off|suspended|court order|court directed|approved|decision|status change)\b/.test(
      content,
    );
  const mediaEvidence = /\b(video|photograph|photo|footage|livestream)\b/.test(content);
  const rawCivicEventSignal =
    content.match(civicEventPattern)?.[0] ??
    multilingualCivicTerms.find((term) => content.includes(term)) ??
    null;
  const civicEventSignal =
    rawCivicEventSignal?.includes("strike") && ambiguousStrikePattern.test(content)
      ? null
      : rawCivicEventSignal;
  const civicContextSignal = content.match(civicContextPattern)?.[0] ?? null;
  const indiaState = detectReviewedState(content);
  const indiaSignal =
    indiaState ??
    content.match(/\b(?:india|indian)\b/)?.[0] ??
    content.match(indiaInstitutionPattern)?.[0] ??
    null;
  const routineNonCivic =
    routineNonCivicPattern.test(content) || routinePoliticalMeetingPattern.test(content);

  if (!indiaSignal) {
    return {
      candidateType: "irrelevant",
      targetEventSlug: null,
      state: null,
      confidence: 0.1,
      priority: "low",
      reason: "irrelevant_non_india",
      targetEventInternalId: null,
      matchingSignals: [],
      conflictingSignals: ["No reliable India location or institution signal was found."],
      sourceIsNewerThanEvent: null,
    };
  }

  if (routineNonCivic && !(civicEventSignal && civicContextSignal)) {
    return {
      candidateType: "irrelevant",
      targetEventSlug: null,
      state: indiaState,
      confidence: 0.2,
      priority: "low",
      reason: "irrelevant_non_collective_context",
      targetEventInternalId: null,
      matchingSignals: [`India signal: ${indiaSignal}`],
      conflictingSignals: ["Routine news without collective civic action."],
      sourceIsNewerThanEvent: null,
    };
  }

  if (
    best &&
    best.score >= 0.12 &&
    best.signals.length >= 2 &&
    ((civicEventSignal && civicContextSignal) || officialResponse || outcomeOrStatusChange)
  ) {
    return {
      candidateType: outcomeOrStatusChange
        ? "outcome_status_change"
        : officialResponse
          ? "official_response"
          : mediaEvidence
            ? "media_evidence"
            : "event_update",
      targetEventSlug: best.event.slug,
      state: best.event.stateOrUnionTerritory,
      confidence: Math.min(0.95, Number((0.55 + best.score).toFixed(4))),
      priority:
        officialResponse || /\b(concluded|settlement|court order|released)\b/.test(content)
          ? "high"
          : "normal",
      reason: "Deterministic title, location and event-term overlap with a reviewed public record.",
      targetEventInternalId: best.event.internalId,
      matchingSignals: best.signals,
      conflictingSignals: best.conflicts,
      sourceIsNewerThanEvent: best.newer,
    };
  }

  if (civicEventSignal && civicContextSignal) {
    return {
      candidateType: "new_event",
      targetEventSlug: null,
      state: indiaState,
      confidence: 0.55,
      priority: "normal",
      reason:
        "A civic-event term and a location, organisation, affected-group, authority or action context were found, but no reviewed event passed the deterministic match threshold.",
      targetEventInternalId: null,
      matchingSignals: [
        `India signal: ${indiaSignal}`,
        `civic-event term: ${civicEventSignal}`,
        `context term: ${civicContextSignal}`,
      ],
      conflictingSignals: [],
      sourceIsNewerThanEvent: null,
    };
  }

  return {
    candidateType: "irrelevant",
    targetEventSlug: null,
    state: null,
    confidence: 0.25,
    priority: "low",
    reason: "The metadata does not match a reviewed event or a deterministic civic-event rule.",
    targetEventInternalId: null,
    matchingSignals: [],
    conflictingSignals: [],
    sourceIsNewerThanEvent: null,
  };
}
