import "server-only";

import type { ReviewedEventPreview } from "./types";
import { loadApprovedEventMedia } from "@/lib/media/public";
import {
  applyVerifiedScannerEventPatches,
  verifiedScannerEventAdditions,
} from "@/data/verified-scanner-events-2026-08-04";
import { publishedVerificationEventAdditions } from "@/data/published-verification-events-2026-08-05";

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
  const patchedReviewedEvents = applyVerifiedScannerEventPatches(reviewedEventsPreview);
  const reviewedEventsWithVerifiedCandidates = [
    ...patchedReviewedEvents,
    ...publishedVerificationEventAdditions,
    ...(includeCandidates ? verifiedScannerEventAdditions : []),
  ];
  const publicationVisibleEvents = selectVisibleEvents(
    reviewedEventsWithVerifiedCandidates,
    includeCandidates,
  );
  const approvedMedia = await loadApprovedEventMedia(publicationVisibleEvents);
  const mediaReadyEvents = includeCandidates
    ? publicationVisibleEvents
    : publicationVisibleEvents.filter((event) => approvedMedia.has(event.slug));

  return mediaReadyEvents.map((event) => ({
    ...event,
    ...(approvedMedia.has(event.slug) ? { approvedMedia: approvedMedia.get(event.slug) } : {}),
  }));
}
