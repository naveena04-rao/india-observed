"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type {
  OpenLicensedImageVisual,
  PublisherImageVisual,
  PublisherVideoVisual,
} from "../../../lib/events/types";

type ExternalMediaVisual = PublisherImageVisual | PublisherVideoVisual | OpenLicensedImageVisual;

export function ExternalMediaImage({
  visual,
  imageUrl,
  children,
  mediaHref,
}: {
  visual: ExternalMediaVisual;
  imageUrl: string;
  children?: ReactNode;
  mediaHref?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const fallbackLabel =
      visual.kind === "publisher_video"
        ? "Publisher thumbnail unavailable"
        : "Visual temporarily unavailable";

    return (
      <div className="event-record-fallback">
        <span>Record preview</span>
        <strong>{visual.fallbackRecord.title}</strong>
        <p>{visual.fallbackRecord.location}</p>
        <div className="external-media-fallback-message">
          <small>{fallbackLabel}</small>
          <a href={visual.sourceUrl} rel="noreferrer" target="_blank">
            Open original source
          </a>
        </div>
      </div>
    );
  }

  const image = (
    <>
      {/* Publisher thumbnails stay remote; licensed context files are reviewed local derivatives. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={visual.alt}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => setFailed(true)}
      />
      {children}
    </>
  );

  if (!mediaHref) return image;

  return mediaHref.startsWith("/") ? (
    <Link href={mediaHref} aria-label={`View event record: ${visual.alt}`}>
      {image}
    </Link>
  ) : (
    <a href={mediaHref} rel="noreferrer" target="_blank">
      {image}
    </a>
  );
}
