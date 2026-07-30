"use client";

import { useState } from "react";
import type { ApprovedEventMedia, EventVisual as EventVisualData } from "../../../lib/events/types";
import {
  getPublicDisplayBasis,
  getPublicMediaCaption,
  getPublicMediaKind,
  getPublicSourceLinkLabel,
} from "../../../lib/media/presentation";
import { EventVisual } from "./EventVisual";

type EventDetailMediaProps = {
  visual: EventVisualData;
  approvedMedia?: ApprovedEventMedia;
};

export function EventDetailMedia({ visual, approvedMedia }: EventDetailMediaProps) {
  const [embedState, setEmbedState] = useState<"idle" | "loaded" | "failed">("idle");

  if (!approvedMedia) {
    return (
      <div className="event-detail-media">
        <EventVisual visual={visual} showClassification={false} />
      </div>
    );
  }

  if (approvedMedia.mediaType === "uploaded_event_image") {
    const isSourceDocument = approvedMedia.publicDisplayKind === "source_document_preview";
    return (
      <figure className="event-detail-media event-detail-approved-image">
        {isSourceDocument ? (
          <span className="source-document-preview-label">
            Source document preview — not an event photograph
          </span>
        ) : null}
        {/* Dynamic URLs are limited to the configured Supabase public-media bucket. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={approvedMedia.altText}
          src={approvedMedia.publicUrl}
          style={{ objectPosition: approvedMedia.focalPosition }}
        />
        <figcaption className="event-detail-media-controls">
          <p>
            {getPublicMediaCaption(approvedMedia)} ·{" "}
            <a href={approvedMedia.sourceUrl} rel="noreferrer">
              {getPublicSourceLinkLabel(approvedMedia)}
            </a>
          </p>
          <p>{getPublicDisplayBasis(approvedMedia)}</p>
          <p>Reviewed {new Date(approvedMedia.approvedAt).toLocaleDateString("en-IN")}</p>
          <p>Rights remain with the credited creator or publisher.</p>
          {approvedMedia.licenceUrl ? (
            <a href={approvedMedia.licenceUrl} rel="noreferrer">
              View licence →
            </a>
          ) : null}
        </figcaption>
      </figure>
    );
  }

  const publisher = approvedMedia.publisher ?? "approved publisher";
  const mediaKind = getPublicMediaKind(approvedMedia);
  const actionLabel =
    approvedMedia.mediaType === "official_social_embed"
      ? `Load official post from ${publisher}`
      : `Load video from ${publisher}`;
  const eventTitle = visual.title;
  const eventLocation = visual.location;

  return (
    <div className="event-detail-media">
      {embedState === "loaded" ? (
        <div className={`event-detail-embed event-detail-embed--${approvedMedia.mediaType}`}>
          <iframe
            src={approvedMedia.embedUrl}
            title={approvedMedia.altText}
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
          <a href={approvedMedia.sourceUrl} rel="noreferrer">
            Open original source
          </a>
        </div>
      ) : (
        <div className="event-media-activation">
          <span>{mediaKind === "Video" ? "Publisher-hosted video" : "Official social post"}</span>
          <strong>{eventTitle}</strong>
          <p>{eventLocation}</p>
          <button type="button" onClick={() => setEmbedState("loaded")}>
            {actionLabel}
          </button>
          <small>
            Loading connects to the publisher&apos;s official embed. No third-party frame loads
            before activation.
          </small>
        </div>
      )}

      <div className="event-detail-media-controls">
        <p>
          {getPublicMediaCaption(approvedMedia)} ·{" "}
          <a href={approvedMedia.sourceUrl} rel="noreferrer">
            {getPublicSourceLinkLabel(approvedMedia)}
          </a>
        </p>
        <p>{getPublicDisplayBasis(approvedMedia)}</p>
        <p>Reviewed {new Date(approvedMedia.approvedAt).toLocaleDateString("en-IN")}</p>
        <p>Rights remain with the credited creator or publisher.</p>
      </div>
    </div>
  );
}
