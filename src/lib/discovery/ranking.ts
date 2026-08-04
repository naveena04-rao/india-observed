import type { DiscoveryClassification } from "./types";

const eventCandidateTypes = new Set([
  "new_event",
  "possible_planned_event",
  "event_update",
  "official_response",
  "outcome_status_change",
]);

export type PreliminaryReviewItem<T> = {
  value: T;
  classification: DiscoveryClassification;
  publishedAt: string | null;
};

export function isCredibleEventCandidate(classification: DiscoveryClassification) {
  return eventCandidateTypes.has(classification.candidateType) && classification.confidence >= 0.5;
}

export function rankPreliminaryReviewItems<T>(items: PreliminaryReviewItem<T>[]) {
  return items
    .map((item, index) => ({
      ...item,
      index,
      indiaGatePassed: item.classification.reason !== "irrelevant_non_india",
      preliminaryCivicPassed: isCredibleEventCandidate(item.classification),
    }))
    .sort((left, right) => {
      if (left.preliminaryCivicPassed !== right.preliminaryCivicPassed)
        return left.preliminaryCivicPassed ? -1 : 1;
      if (left.indiaGatePassed !== right.indiaGatePassed) return left.indiaGatePassed ? -1 : 1;
      if (left.classification.confidence !== right.classification.confidence)
        return right.classification.confidence - left.classification.confidence;
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightTime - leftTime || left.index - right.index;
    });
}
