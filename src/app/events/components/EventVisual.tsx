import Link from "next/link";
import type { ApprovedEventMedia, EventVisual as EventVisualData } from "../../../lib/events/types";
import { getPublicMediaCaption, getPublicSourceLinkLabel } from "../../../lib/media/presentation";
import { ArchiveMediaPreview } from "./ArchiveMediaPreview";
import { HomepageEventEmbed } from "./HomepageEventEmbed";

type EventVisualVariant =
  "archive" | "homepage-latest" | "homepage-on-record" | "homepage-featured";

export function EventVisual({
  visual,
  approvedMedia,
  eventHref,
  imageLinksToEvent = false,
  showClassification = true,
  variant = "archive",
}: {
  visual: EventVisualData;
  approvedMedia?: ApprovedEventMedia;
  eventHref?: string;
  imageLinksToEvent?: boolean;
  showClassification?: boolean;
  variant?: EventVisualVariant;
}) {
  const variantClassName = `event-visual--${variant}`;

  if (approvedMedia?.mediaType === "uploaded_event_image") {
    const isSourceDocument = approvedMedia.publicDisplayKind === "source_document_preview";
    const image = (
      // Dynamic URLs are limited to the configured Supabase public-media bucket.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={approvedMedia.altText}
        src={approvedMedia.publicUrl}
        style={{ objectPosition: approvedMedia.focalPosition }}
      />
    );
    return (
      <figure className={`event-approved-image ${variantClassName}`}>
        {isSourceDocument ? (
          <span className="source-document-preview-label">
            Source document preview — not an event photograph
          </span>
        ) : null}
        {imageLinksToEvent && eventHref ? (
          <Link
            aria-label={`View full record: ${visual.title}`}
            className="latest-entry-media-navigation"
            href={eventHref}
          >
            {image}
          </Link>
        ) : (
          image
        )}
        {showClassification ? (
          <figcaption>
            <span>{getPublicMediaCaption(approvedMedia)} · </span>
            <a href={approvedMedia.sourceUrl} rel="noreferrer">
              {getPublicSourceLinkLabel(approvedMedia)}
            </a>
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (approvedMedia) {
    if (imageLinksToEvent && eventHref) {
      return (
        <ArchiveMediaPreview
          approvedMedia={approvedMedia}
          eventHref={eventHref}
          linkClassName="latest-entry-media-navigation"
          showCaption={showClassification}
          variantClassName={variantClassName}
        />
      );
    }

    if (variant !== "archive") {
      return (
        <HomepageEventEmbed approvedMedia={approvedMedia} variantClassName={variantClassName} />
      );
    }

    return (
      <ArchiveMediaPreview
        approvedMedia={approvedMedia}
        eventHref={eventHref ?? `/events/${approvedMedia.eventSlug}`}
        showCaption={showClassification}
        variantClassName={variantClassName}
      />
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
