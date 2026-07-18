/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { EventVisual as EventVisualData } from "../../../lib/events/types";

export function EventVisual({
  visual,
  eventHref,
}: {
  visual: EventVisualData;
  eventHref?: string;
}) {
  if (visual.kind === "record_cover") {
    return (
      <div className="event-record-cover" role="img" aria-label={visual.alt}>
        <span className="event-visual-kicker">Record preview</span>
        <strong>{visual.title}</strong>
        <span>{visual.location}</span>
        <span>{visual.dateLabel}</span>
        <small>No approved visual media</small>
      </div>
    );
  }

  if (visual.kind === "document_preview") {
    return (
      <a className="event-document-preview" href={visual.sourceUrl} rel="noreferrer">
        <span className="event-visual-kicker">Document preview</span>
        <strong>{visual.title}</strong>
        <span>{visual.publisher}</span>
        <small>{visual.alt}</small>
      </a>
    );
  }

  const imageUrl = visual.kind === "publisher_video" ? visual.thumbnailUrl : visual.imageUrl;
  const media = (
    <>
      <img
        src={imageUrl}
        alt={visual.alt}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {visual.kind === "publisher_video" ? (
        <span className="event-video-indicator" aria-hidden="true">
          Play video
        </span>
      ) : null}
    </>
  );

  return (
    <figure className={`event-publisher-visual event-publisher-visual--${visual.kind}`}>
      {eventHref ? (
        <Link href={eventHref} aria-label={`View event record: ${visual.alt}`}>
          {media}
        </Link>
      ) : (
        <a href={visual.sourceUrl} rel="noreferrer">
          {media}
        </a>
      )}
      <figcaption>
        {visual.credit}
        {visual.kind === "publisher_video" && visual.duration ? ` · ${visual.duration}` : ""}
      </figcaption>
    </figure>
  );
}
