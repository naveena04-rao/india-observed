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
  const [embedState, setEmbedState] = useState<"idle" | "loaded" | "failed">("idle");
  const publisherVideo = visual.kind === "publisher_video" ? visual : undefined;
  const embed = publisherVideo ?? detailMedia;

  if (!embed) {
    return (
      <div className="event-detail-media">
        <MediaClassificationLabel evidenceClass={visual.evidenceClass} />
        <EventVisual visual={visual} showClassification={false} />
      </div>
    );
  }

  const isSocial = embed.kind === "social_embed";
  const publisher = isSocial ? embed.platform : embed.publisher;
  const actionLabel =
    publisher === "Instagram"
      ? "Load Instagram post"
      : publisher === "Facebook"
        ? "Load Facebook video"
        : `Load video from ${publisher}`;
  const connectionNotice = `Loading connects to ${publisher}'s official embed.`;
  const eventTitle =
    visual.kind === "no_approved_event_media" ? visual.title : "Verified publisher video";
  const eventLocation =
    visual.kind === "no_approved_event_media" ? visual.location : embed.publisher;

  return (
    <div className="event-detail-media">
      <MediaClassificationLabel evidenceClass={embed.evidenceClass} />

      {embedState === "loaded" ? (
        <div className={`event-detail-embed event-detail-embed--${embed.kind}`}>
          <iframe
            src={embed.embedUrl}
            title={embed.alt}
            loading="lazy"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setEmbedState("failed")}
          />
        </div>
      ) : embedState === "failed" ? (
        <div className="event-media-unavailable" role="status">
          <strong>Event media unavailable</strong>
          <p>{eventTitle}</p>
          <p>{eventLocation}</p>
          <a href={embed.sourceUrl} rel="noreferrer">
            Open original source
          </a>
        </div>
      ) : (
        <div className="event-media-activation">
          <span>Verified event media</span>
          <strong>{eventTitle}</strong>
          <p>{eventLocation}</p>
          <button type="button" onClick={() => setEmbedState("loaded")}>
            {actionLabel}
          </button>
          <small>{connectionNotice} No third-party frame loads before activation.</small>
        </div>
      )}

      <div className="event-detail-media-controls">
        <p>Verified event media · {embed.credit} · Official embed · Same-event match verified</p>
        <p>{embed.identifiablePeopleAssessment}</p>
        <p>{embed.privacyReview}</p>
        <p>{embed.safetyReview}</p>
        <a href={embed.sourceUrl} rel="noreferrer">
          View original on {publisher} →
        </a>
      </div>
    </div>
  );
}
