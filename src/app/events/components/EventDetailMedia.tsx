"use client";

import { useState } from "react";
import type {
  EventDetailMedia as DetailMedia,
  EventVisual as EventVisualData,
} from "../../../lib/events/types";
import { EventVisual } from "./EventVisual";

type EventDetailMediaProps = {
  visual: EventVisualData;
  detailMedia?: DetailMedia;
};

export function EventDetailMedia({ visual, detailMedia }: EventDetailMediaProps) {
  const [isActivated, setIsActivated] = useState(false);
  const publisherVideo = visual.kind === "publisher_video" ? visual : undefined;
  const embed = publisherVideo ?? detailMedia;

  if (!embed) return <EventVisual visual={visual} />;

  const isInstagram = embed.kind === "instagram_embed";
  const publisher = isInstagram ? embed.platform : embed.publisher;
  const actionLabel = isInstagram ? "Load Instagram post" : "Load NDTV video";
  const connectionNotice = isInstagram
    ? "Loading connects to Instagram's official embed."
    : "Loading connects to NDTV's publisher-hosted player.";

  return (
    <div className="event-detail-media">
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
        <EventVisual visual={visual} />
      )}

      <div className="event-detail-media-controls">
        <p>{embed.credit}</p>
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
