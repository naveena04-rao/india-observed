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
  const launchableEvents = events.filter((event) => event.publicLaunchStatus === "launchable");

  return includeCandidates
    ? launchableEvents
    : launchableEvents.filter((event) => event.publicationStatus === "published");
}

export async function getReviewedEvents(): Promise<readonly ReviewedEventPreview[]> {
  const { reviewedEventsPreview } = await import("../../data/reviewed-events-preview");
  const includeCandidates = isCandidatePreviewEnabled();
  const publicationVisibleEvents = selectVisibleEvents(reviewedEventsPreview, includeCandidates);
  const approvedMedia = await loadApprovedEventMedia(publicationVisibleEvents);
  const mediaReadyEvents = includeCandidates
    ? publicationVisibleEvents
    : publicationVisibleEvents.filter((event) => approvedMedia.has(event.slug));

  return mediaReadyEvents.map((event) => ({
    ...event,
    ...(approvedMedia.has(event.slug) ? { approvedMedia: approvedMedia.get(event.slug) } : {}),
  }));
}
