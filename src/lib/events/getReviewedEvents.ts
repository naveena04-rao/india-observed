import "server-only";

import type { ReviewedEventPreview } from "./types";

export function isCandidatePreviewEnabled() {
  const showCandidateRecords =
    process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";

  return showCandidateRecords;
}

export function selectVisibleEvents(
  events: readonly ReviewedEventPreview[],
  includeCandidates: boolean,
) {
  return includeCandidates
    ? events
    : events.filter((event) => event.publicationStatus === "published");
}

export async function getReviewedEvents(): Promise<readonly ReviewedEventPreview[]> {
  const { reviewedEventsPreview } = await import("../../data/reviewed-events-preview");
  return selectVisibleEvents(reviewedEventsPreview, isCandidatePreviewEnabled());
}
