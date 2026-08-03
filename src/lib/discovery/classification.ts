import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import type { DiscoveryClassification } from "./types";

const stopWords = new Set(["and", "for", "from", "over", "the", "their", "with"]);

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
}): DiscoveryClassification {
  const inputTerms = terms(`${input.title} ${input.text.slice(0, 4000)}`);
  const ranked = reviewedEventsPreview
    .filter((event) => event.publicationStatus === "published")
    .map((event) => ({
      event,
      score: similarity(
        inputTerms,
        terms(
          `${event.title} ${event.summary} ${event.stateOrUnionTerritory} ${event.publicLocation}`,
        ),
      ),
    }))
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
    pibSource &&
    /\b(settlement|settled|agreement reached|resolved|concluded|withdrawn|called off|court order|court directed|approved|decision|status change)\b/.test(
      content,
    );
  const mediaEvidence = /\b(video|photograph|photo|footage|livestream)\b/.test(content);

  if (best && best.score >= 0.22) {
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
    };
  }

  if (
    /\b(protest|strike|march|rally|dharna|demonstration|shutdown|hunger strike)\b/.test(content)
  ) {
    return {
      candidateType: "new_event",
      targetEventSlug: null,
      state: null,
      confidence: 0.55,
      priority: "normal",
      reason:
        "Civic-event terms were found, but no reviewed event passed the deterministic match threshold.",
    };
  }

  return {
    candidateType: "irrelevant",
    targetEventSlug: null,
    state: null,
    confidence: 0.25,
    priority: "low",
    reason: "The metadata does not match a reviewed event or a deterministic civic-event rule.",
  };
}
