"use client";

import { useState } from "react";
import type {
  EventDetailMedia as DetailMedia,
  EventVisual as EventVisualData,
} from "../../../lib/events/types";
import { EventVisual } from "./EventVisual";
import { MediaClassificationLabel } from "./MediaClassificationLabel";

type EventDetailMediaProps = {
  visual: EventVisualData;
  detailMedia?: DetailMedia;
};

export function EventDetailMedia({ visual, detailMedia }: EventDetailMediaProps) {
  const [isActivated, setIsActivated] = useState(false);
  const publisherVideo = visual.kind === "publisher_video" ? visual : undefined;
  const embed = publisherVideo ?? detailMedia;

  if (!embed) {
    return (
      <div className="event-detail-media">
        <MediaClassificationLabel evidenceClass={visual.evidenceClass} />
        <EventVisual visual={visual} showClassification={false} />
        <MediaRightsDisclosure visual={visual} />
      </div>
    );
  }

  const isInstagram = embed.kind === "instagram_embed";
  const publisher = isInstagram ? embed.platform : embed.publisher;
  const actionLabel = isInstagram ? "Load Instagram post" : `Load video from ${publisher}`;
  const connectionNotice = isInstagram
    ? "Loading connects to Instagram's official embed."
    : "Loading connects to NDTV's publisher-hosted player.";

  return (
    <div className="event-detail-media">
      <MediaClassificationLabel evidenceClass={embed.evidenceClass} />
      {isActivated ? (
        <div className={`event-detail-embed event-detail-embed--${embed.kind}`}>
          <iframe
            src={embed.embedUrl}
            title={embed.alt}
            loading="lazy"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <>
          <EventVisual visual={visual} showClassification={false} />
          {isInstagram && visual.evidenceClass === "editorial_illustration" ? (
            <MediaClassificationLabel evidenceClass={visual.evidenceClass} />
          ) : null}
        </>
      )}

      <div className="event-detail-media-controls">
        <p>Verified event media · {embed.credit}</p>
        {!isActivated ? (
          <button type="button" onClick={() => setIsActivated(true)}>
            {actionLabel}
          </button>
        ) : null}
        <p>{connectionNotice}</p>
        <a href={embed.sourceUrl} rel="noreferrer">
          View original on {publisher} →
        </a>
      </div>
    </div>
  );
}

function MediaRightsDisclosure({ visual }: { visual: EventVisualData }) {
  if (visual.kind === "editorial_illustration") {
    return (
      <p className="event-media-rights">
        Editorial illustration — not event evidence · {visual.credit}
      </p>
    );
  }

  if (visual.kind === "document_preview") {
    return (
      <p className="event-media-rights">
        {visual.evidenceClass === "context_media"
          ? "Context image — does not depict this event"
          : "Verified event media"}{" "}
        · {visual.credit} ·{" "}
        <a href={visual.sourceUrl} rel="noreferrer">
          Original source
        </a>
      </p>
    );
  }

  if (visual.kind === "open_licensed_image") {
    return (
      <p className="event-media-rights">
        {visual.evidenceClass === "context_media"
          ? "Context image — does not depict this event"
          : "Verified event media"}{" "}
        ·{" "}
        {visual.creatorUrl ? (
          <a href={visual.creatorUrl} rel="noreferrer">
            {visual.creator}
          </a>
        ) : (
          visual.creator
        )}{" "}
        ·{" "}
        <a href={visual.licenseUrl} rel="noreferrer">
          {visual.licenseName}
        </a>{" "}
        ·{" "}
        <a href={visual.sourceUrl} rel="noreferrer">
          Original source
        </a>
      </p>
    );
  }

  return (
    <p className="event-media-rights">
      {visual.evidenceClass === "context_media"
        ? "Context image — does not depict this event"
        : "Verified event media"}{" "}
      · {visual.credit} ·{" "}
      <a href={visual.sourceUrl} rel="noreferrer">
        Original source
      </a>
    </p>
  );
}
