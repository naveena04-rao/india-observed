import "server-only";

import type { ReviewedEventPreview } from "./types";

export function isReviewedPreviewEnabled() {
  const showReviewedPreview =
    process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";

  return showReviewedPreview;
}

export async function getReviewedEvents(): Promise<readonly ReviewedEventPreview[]> {
  if (!isReviewedPreviewEnabled()) return [];

  const { reviewedEventsPreview } = await import("../../data/reviewed-events-preview");
  return reviewedEventsPreview;
}
