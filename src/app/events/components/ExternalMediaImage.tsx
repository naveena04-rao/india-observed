"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type {
  OpenLicensedImageVisual,
  PublisherImageVisual,
  PublisherVideoVisual,
} from "../../../lib/events/types";
import { EventEditorialIllustration } from "./EventEditorialIllustration";

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
    return (
      <div className="external-media-fallback">
        <EventEditorialIllustration visual={visual.fallbackIllustration} />
        <div className="external-media-fallback-message">
          <strong>Publisher thumbnail unavailable</strong>
          <a href={visual.sourceUrl} rel="noreferrer" target="_blank">
            Open the original source to view the media
          </a>
          <small>Fallback illustration — not event evidence</small>
        </div>
      </div>
    );
  }

  const image = (
    <>
      {/* External publisher media is loaded from its original URL and is never copied locally. */}
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
