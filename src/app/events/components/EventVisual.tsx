import Link from "next/link";
import type { EventVisual as EventVisualData } from "../../../lib/events/types";
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

  if (visual.kind === "publisher_video") {
    return (
      <figure className={`event-source-media-cover ${variantClassName}`}>
        <div className="event-source-media-cover__body">
          {showClassification ? (
            <MediaClassificationLabel evidenceClass={visual.evidenceClass} compact />
          ) : null}
          <span>Publisher-hosted video</span>
          <strong>{visual.publisher}</strong>
          <p>{visual.alt}</p>
          {eventHref ? <Link href={eventHref}>View event media →</Link> : null}
        </div>
        {showClassification ? (
          <figcaption>
            <span>{visual.credit}</span>
            {visual.duration ? ` · ${visual.duration}` : ""}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const sourceHref = eventHref ? `${eventHref}#event-sources` : visual.sourceHref;

  return (
    <figure className={`event-no-media ${variantClassName}`}>
      <div className="event-no-media__body">
        {showClassification ? (
          <MediaClassificationLabel evidenceClass={visual.evidenceClass} compact />
        ) : null}
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
