import type { ArchiveFilters, ReviewedEventPreview } from "./types";

export const EVENTS_PER_PAGE = 10;

export function latestActivityDate(event: ReviewedEventPreview) {
  return event.lastConfirmedActive ?? event.endDate ?? event.startDate ?? event.lastReviewed;
}

export function filterReviewedEvents(
  events: readonly ReviewedEventPreview[],
  filters: ArchiveFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase("en-IN");

  return events.filter((event) => {
    const searchablePublicFields = [
      event.title,
      event.publicLocation,
      event.stateOrUnionTerritory,
      event.topic,
      event.directedAt,
    ]
      .join(" ")
      .toLocaleLowerCase("en-IN");

    return (
      (!query || searchablePublicFields.includes(query)) &&
      (!filters.state || event.stateOrUnionTerritory === filters.state) &&
      (!filters.topic || event.topic === filters.topic) &&
      (!filters.eventType || event.eventType === filters.eventType) &&
      (!filters.status || event.eventStatus === filters.status)
    );
  });
}

export function sortReviewedEvents(
  events: readonly ReviewedEventPreview[],
  sort: ArchiveFilters["sort"],
) {
  return [...events].sort((left, right) => {
    let comparison = 0;

    if (sort === "reviewed") {
      comparison = right.lastReviewed.localeCompare(left.lastReviewed);
    } else if (sort === "oldest") {
      const leftDate = left.startDate ?? left.endDate ?? left.lastReviewed;
      const rightDate = right.startDate ?? right.endDate ?? right.lastReviewed;
      comparison = leftDate.localeCompare(rightDate);
    } else {
      comparison = latestActivityDate(right).localeCompare(latestActivityDate(left));
    }

    return (
      comparison ||
      right.lastReviewed.localeCompare(left.lastReviewed) ||
      left.title.localeCompare(right.title)
    );
  });
}

export function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatEventDateRange(event: ReviewedEventPreview) {
  if (!event.startDate) return "Start date not recorded";
  if (!event.endDate || event.endDate === event.startDate) return formatEventDate(event.startDate);
  return `${formatEventDate(event.startDate)} – ${formatEventDate(event.endDate)}`;
}
