import Link from "next/link";
import type { ApprovedEventMedia, EventVisual as EventVisualData } from "../../../lib/events/types";
import { MediaClassificationLabel } from "./MediaClassificationLabel";

type EventVisualVariant =
  "archive" | "homepage-latest" | "homepage-on-record" | "homepage-featured";

export function EventVisual({
  visual,
  approvedMedia,
  eventHref,
  showClassification = true,
  variant = "archive",
}: {
  visual: EventVisualData;
  approvedMedia?: ApprovedEventMedia;
  eventHref?: string;
  showClassification?: boolean;
  variant?: EventVisualVariant;
}) {
  const variantClassName = `event-visual--${variant}`;

  if (approvedMedia?.mediaType === "uploaded_event_image") {
    const creator = approvedMedia.creator ?? approvedMedia.rightsHolder ?? "Rights holder";
    const publisher = approvedMedia.publisher ?? "Approved source";

    return (
      <figure className={`event-approved-image ${variantClassName}`}>
        {showClassification ? (
          <MediaClassificationLabel evidenceClass="verified_event_media" compact />
        ) : null}
        {/* Dynamic URLs are limited to the configured Supabase public-media bucket. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={approvedMedia.altText}
          src={approvedMedia.publicUrl}
          style={{ objectPosition: approvedMedia.focalPosition }}
        />
        {showClassification ? (
          <figcaption>
            <span>Photo: {creator} · </span>
            <a href={approvedMedia.sourceUrl} rel="noreferrer">
              Source: {publisher}
            </a>
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (approvedMedia) {
    return (
      <figure className={`event-source-media-cover ${variantClassName}`}>
        <div className="event-source-media-cover__body">
          {showClassification ? (
            <MediaClassificationLabel evidenceClass="verified_event_media" compact />
          ) : null}
          <span>
            {approvedMedia.mediaType === "publisher_video_embed"
              ? "Publisher-hosted video"
              : "Official source-linked post"}
          </span>
          <strong>{approvedMedia.publisher ?? "Approved source"}</strong>
          <p>{approvedMedia.altText}</p>
          {eventHref ? <Link href={eventHref}>View event media →</Link> : null}
        </div>
        {showClassification ? (
          <figcaption>
            <span>{approvedMedia.creditLine}</span>
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const sourceHref = eventHref ? `${eventHref}#event-sources` : visual.sourceHref;

  return (
    <figure className={`event-no-media ${variantClassName}`}>
      <div className="event-no-media__body">
        <span className="event-no-media__label">No approved event image available</span>
        <strong>{visual.title}</strong>
        <p>{visual.location}</p>
        <p className="event-no-media__meta">
          {visual.dateOrStatus} · {visual.sourceCount} reviewed{" "}
          {visual.sourceCount === 1 ? "source" : "sources"}
        </p>
        <Link href={sourceHref}>View event sources</Link>
      </div>
    </figure>
  );
}
