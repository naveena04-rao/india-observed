import Link from "next/link";
import { formatEventDate } from "../../../lib/events/archive";
import type { ReviewedEventPreview } from "../../../lib/events/types";
import { EventVisual } from "./EventVisual";

export function EventArchiveRow({ event }: { event: ReviewedEventPreview }) {
  const href = `/events/${event.slug}`;

  return (
    <article className="event-archive-row">
      <div className="event-row-copy">
        <div className="event-tags">
          <span className="event-type-tag">{event.eventType}</span>
          <span className="event-status-tag event-archive-status">{event.eventStatus}</span>
        </div>
        <h2>
          <Link href={href}>{event.title}</Link>
        </h2>
        <p className="event-row-place">
          {event.publicLocation} · {event.stateOrUnionTerritory}
        </p>
        <p className="event-row-topic">{event.primaryTopic}</p>
        <p className="event-row-summary">{event.summary}</p>
        <dl
          className={`event-row-disclosure ${
            event.endDate
              ? "event-row-disclosure--with-end-date"
              : "event-row-disclosure--without-end-date"
          }`}
        >
          <div>
            <dt>Start date</dt>
            <dd>{event.startDate ? formatEventDate(event.startDate) : "Under verification"}</dd>
          </div>
          {event.endDate ? (
            <div>
              <dt>End date</dt>
              <dd>{formatEventDate(event.endDate)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Directed at</dt>
            <dd>{event.directedAt}</dd>
          </div>
          <div>
            <dt>Event verification</dt>
            <dd>{event.eventVerification}</dd>
          </div>
        </dl>
        <p className="event-row-dates">
          <span>Last reviewed {formatEventDate(event.lastReviewed)}</span>
          <span>
            {event.approvedSourceCount} public{" "}
            {event.approvedSourceCount === 1 ? "source" : "sources"}
          </span>
        </p>
        <Link className="event-record-link" href={href}>
          View full record →
        </Link>
      </div>
      <div className="event-row-visual">
        <EventVisual visual={event.visual} eventHref={href} />
      </div>
    </article>
  );
}
