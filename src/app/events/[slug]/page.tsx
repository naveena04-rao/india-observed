import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatEventDate, formatEventDateRange } from "../../../lib/events/archive";
import { getReviewedEvents, isReviewedPreviewEnabled } from "../../../lib/events/getReviewedEvents";
import { ArchiveShell } from "../components/ArchiveShell";
import { EventDetailMedia } from "../components/EventDetailMedia";
import { EventSafety } from "../components/EventSafety";
import { EventSources } from "../components/EventSources";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

async function findEvent(slug: string) {
  if (!isReviewedPreviewEnabled()) return undefined;
  const events = await getReviewedEvents();
  return events.find((event) => event.slug === slug);
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await findEvent(slug);
  return event
    ? { title: `${event.title} | India Observed`, description: event.summary }
    : { title: "Event record unavailable | India Observed" };
}

export default async function EventRecordPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) notFound();

  return (
    <ArchiveShell>
      <article className="event-record-page">
        <div className="page-shell event-record-layout">
          <p className="preview-notice" role="note">
            This is a reviewed candidate record shown for design and editorial testing. It has not
            yet been publicly published.
          </p>

          <header className="event-record-header">
            <div className="event-tags">
              <span className="event-type-tag">{event.eventType}</span>
              <span className="event-status-tag event-archive-status">{event.eventStatus}</span>
            </div>
            <h1>{event.title}</h1>
            <p className="event-record-location">
              {event.publicLocation} · {event.stateOrUnionTerritory}
            </p>
            <p className="event-record-topic">{event.topic}</p>
          </header>

          <div className="event-record-visual">
            <EventDetailMedia visual={event.visual} detailMedia={event.detailMedia} />
          </div>

          <dl className="event-record-facts">
            <div>
              <dt>Event date</dt>
              <dd>{formatEventDateRange(event)}</dd>
            </div>
            <div>
              <dt>Last reviewed</dt>
              <dd>{formatEventDate(event.lastReviewed)}</dd>
            </div>
            <div>
              <dt>Directed at</dt>
              <dd>{event.directedAt}</dd>
            </div>
            <div>
              <dt>Event verification</dt>
              <dd>{event.eventVerification}</dd>
            </div>
          </dl>

          <section className="event-record-summary" aria-labelledby="record-summary-heading">
            <h2 id="record-summary-heading">Record summary</h2>
            <p>{event.summary}</p>
            <p className="event-record-source-count">
              {event.approvedSourceCount} public{" "}
              {event.approvedSourceCount === 1 ? "source" : "sources"}
            </p>
          </section>

          <EventSafety event={event} />

          <EventSources sources={event.sources} />

          <section className="event-record-actions" aria-labelledby="record-actions-heading">
            <h2 id="record-actions-heading">Contribute to this record</h2>
            <div>
              {["Add a public source", "Suggest a correction", "Submit an official response"].map(
                (label) => (
                  <button key={label} type="button" disabled>
                    <span>{label}</span>
                    <small>Available after public launch</small>
                  </button>
                ),
              )}
            </div>
          </section>
        </div>
      </article>
    </ArchiveShell>
  );
}
