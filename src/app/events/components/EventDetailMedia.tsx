"use client";

import { useState } from "react";
import type {
  EventDetailMedia as DetailMedia,
  EventVisual as EventVisualData,
} from "../../../lib/events/types";
import { EventVisual } from "./EventVisual";
import { MediaClassificationLabel, mediaClassificationText } from "./MediaClassificationLabel";

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
    : `Loading connects to ${publisher}'s publisher-hosted player.`;

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
          {isInstagram && visual.evidenceClass !== embed.evidenceClass ? (
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
  if (visual.kind === "document_preview") {
    return (
      <p className="event-media-rights">
        {mediaClassificationText(visual.evidenceClass)} · {visual.credit} ·{" "}
        <a href={visual.sourceUrl} rel="noreferrer">
          Original source
        </a>
      </p>
    );
  }

  if (visual.kind === "open_licensed_image") {
    return (
      <div className="event-media-rights">
        <p>
          <strong>{mediaClassificationText(visual.evidenceClass)}</strong> ·{" "}
          {visual.creatorUrl ? (
            <a href={visual.creatorUrl} rel="noreferrer">
              {visual.creator}
            </a>
          ) : (
            visual.creator
          )}{" "}
          · {visual.publisher} ·{" "}
          <a href={visual.licenseUrl} rel="noreferrer">
            {visual.licenseName}
          </a>
        </p>
        <p>{visual.attributionText}</p>
        <p>{visual.modificationDisclosure}</p>
        <p>{visual.relevance}</p>
        <p>
          <a href={visual.sourceUrl} rel="noreferrer">
            Original file page
          </a>{" "}
          ·{" "}
          <a href={visual.originalMediaUrl} rel="noreferrer">
            Original media
          </a>
        </p>
      </div>
    );
  }

  return (
    <p className="event-media-rights">
      {mediaClassificationText(visual.evidenceClass)} · {visual.credit} ·{" "}
      <a href={visual.sourceUrl} rel="noreferrer">
        Original source
      </a>
    </p>
  );
}
