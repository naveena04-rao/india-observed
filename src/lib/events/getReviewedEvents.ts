import "server-only";

import type { ReviewedEventPreview } from "./types";
import { loadApprovedEventMedia } from "@/lib/media/public";

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
  const visibleEvents = selectVisibleEvents(reviewedEventsPreview, isCandidatePreviewEnabled());
  const approvedMedia = await loadApprovedEventMedia(visibleEvents);

  return visibleEvents.map((event) => ({
    ...event,
    ...(approvedMedia.has(event.slug) ? { approvedMedia: approvedMedia.get(event.slug) } : {}),
  }));
}
