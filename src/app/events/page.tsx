import type { Metadata } from "next";
import Link from "next/link";
import {
  filterReviewedEvents,
  EVENTS_PER_PAGE,
  sortReviewedEvents,
} from "../../lib/events/archive";
import { getReviewedEvents, isCandidatePreviewEnabled } from "../../lib/events/getReviewedEvents";
import type { ArchiveFilters, ArchiveSort } from "../../lib/events/types";
import { ArchiveShell } from "./components/ArchiveShell";
import { EventArchiveRow } from "./components/EventArchiveRow";
import { EventFilters } from "./components/EventFilters";
import { EventPagination } from "./components/EventPagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events | India Observed",
  description: "Browse reviewed records of protests and civic movements across India.",
  alternates: { canonical: "/events" },
};

type PageSearchParams = Record<string, string | string[] | undefined>;

function readParam(params: PageSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function readSort(params: PageSearchParams): ArchiveSort {
  const value = readParam(params, "sort");
  return value === "reviewed" || value === "oldest" ? value : "latest";
}

function unique(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "en-IN"));
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const candidatePreviewEnabled = isCandidatePreviewEnabled();
  const events = await getReviewedEvents();
  const candidateCount = events.filter((event) => event.publicationStatus === "candidate").length;
  const params = await searchParams;
  const filters: ArchiveFilters = {
    query: readParam(params, "q"),
    state: readParam(params, "state"),
    topic: readParam(params, "topic"),
    eventType: readParam(params, "type"),
    status: readParam(params, "status"),
    sort: readSort(params),
  };

  const filteredEvents = sortReviewedEvents(filterReviewedEvents(events, filters), filters.sort);
  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const requestedPage = Number.parseInt(readParam(params, "page"), 10);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const visibleEvents = filteredEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue && key !== "page") queryParams.set(key, firstValue);
  }

  const authReturnParams = new URLSearchParams();
  const normalisedAuthFilters = {
    q: filters.query,
    state: filters.state,
    topic: filters.topic,
    type: filters.eventType,
    status: filters.status,
    sort: filters.sort === "latest" ? "" : filters.sort,
  };

  for (const [key, value] of Object.entries(normalisedAuthFilters)) {
    if (value) authReturnParams.set(key, value);
  }

  if (currentPage > 1) authReturnParams.set("page", String(currentPage));
  const authReturnTo = authReturnParams.size ? `/events?${authReturnParams.toString()}` : "/events";

  return (
    <ArchiveShell authReturnTo={authReturnTo}>
      <section className="events-archive editorial-typography" aria-labelledby="events-heading">
        <div className="page-shell">
          <div className="events-intro">
            <p className="section-kicker">Reviewed civic record archive</p>
            <h1 id="events-heading">EVENTS</h1>
            <p>Browse reviewed records of protests and civic movements across India.</p>
            {events.length ? <strong>{events.length} reviewed records</strong> : null}
          </div>

          {events.length ? (
            <>
              {candidatePreviewEnabled && candidateCount ? (
                <p className="preview-notice" role="note">
                  Preview includes {candidateCount} reviewed candidate{" "}
                  {candidateCount === 1 ? "record" : "records"} that are not publicly published.
                </p>
              ) : null}
              <EventFilters
                filters={filters}
                options={{
                  states: unique(events.map((event) => event.stateOrUnionTerritory)),
                  topics: unique(events.map((event) => event.primaryTopic)),
                  eventTypes: unique(events.map((event) => event.eventType)),
                  statuses: unique(events.map((event) => event.eventStatus)),
                }}
              />

              {filteredEvents.length ? (
                <>
                  <p className="events-result-count" aria-live="polite">
                    Showing {startIndex + 1}–
                    {Math.min(startIndex + EVENTS_PER_PAGE, filteredEvents.length)} of{" "}
                    {filteredEvents.length} reviewed records
                  </p>
                  <div className="event-archive-list">
                    {visibleEvents.map((event) => (
                      <EventArchiveRow key={event.slug} event={event} />
                    ))}
                  </div>
                  <EventPagination
                    currentPage={currentPage}
                    pageCount={pageCount}
                    params={queryParams}
                  />
                </>
              ) : (
                <div className="events-empty-state">
                  <h2>No reviewed records match these filters.</h2>
                  <p>
                    Try removing a filter or searching a broader term. A missing record does not
                    mean that no civic activity occurred.
                  </p>
                  <Link href="/submit-a-lead">Submit a public lead</Link>
                </div>
              )}
            </>
          ) : (
            <div className="events-empty-state events-production-empty">
              <h2>Public event records are being prepared for publication.</h2>
              <p>Records will appear here after human editorial approval.</p>
            </div>
          )}
        </div>
      </section>
    </ArchiveShell>
  );
}
