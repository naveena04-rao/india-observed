import type { EventVisual as EventVisualData } from "../../../lib/events/types";
import { ExternalMediaImage } from "./ExternalMediaImage";
import { MediaClassificationLabel } from "./MediaClassificationLabel";

type EventVisualVariant =
  "archive" | "homepage-latest" | "homepage-on-record" | "homepage-featured";

export function EventVisual({
  visual,
  eventHref,
  showClassification = true,
  variant = "archive",
}: {
  visual: EventVisualData;
  eventHref?: string;
  showClassification?: boolean;
  variant?: EventVisualVariant;
}) {
  const variantClassName = `event-visual--${variant}`;

  if (visual.kind === "document_preview") {
    return (
      <figure className={`event-visual-shell ${variantClassName}`}>
        <a className="event-document-preview" href={visual.sourceUrl} rel="noreferrer">
          <span className="event-visual-kicker">Document preview</span>
          <strong>{visual.title}</strong>
          <span>{visual.publisher}</span>
          <small>{visual.alt}</small>
        </a>
        {showClassification ? (
          <figcaption>
            <MediaClassificationLabel evidenceClass={visual.evidenceClass} compact />
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const imageUrl = visual.kind === "publisher_video" ? visual.thumbnailUrl : visual.imageUrl;
  const media = (
    <ExternalMediaImage
      imageUrl={imageUrl}
      mediaHref={eventHref ?? visual.sourceUrl}
      visual={visual}
    >
      {visual.kind === "publisher_video" ? (
        <span className="event-video-indicator" aria-hidden="true">
          Play video
        </span>
      ) : null}
    </ExternalMediaImage>
  );

  return (
    <figure
      className={`event-publisher-visual event-publisher-visual--${visual.kind} ${variantClassName}`}
    >
      {media}
      {showClassification ? (
        <figcaption>
          <MediaClassificationLabel evidenceClass={visual.evidenceClass} compact />
          <span>{visual.credit}</span>
          {visual.kind === "publisher_video" && visual.duration ? ` · ${visual.duration}` : ""}
        </figcaption>
      ) : null}
    </figure>
  );
}
