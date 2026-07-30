"use client";

import { useState } from "react";
import Link from "next/link";
import type { ApprovedEventEmbed } from "../../../lib/events/types";
import { getPublicMediaCaption, getPublicSourceLinkLabel } from "../../../lib/media/presentation";

export function ArchiveMediaPreview({
  approvedMedia,
  eventHref,
  showCaption,
  variantClassName,
}: {
  approvedMedia: ApprovedEventEmbed;
  eventHref: string;
  showCaption: boolean;
  variantClassName: string;
}) {
  const [unavailable, setUnavailable] = useState(false);

  if (!approvedMedia.previewImageUrl || !approvedMedia.previewAltText || unavailable) {
    return (
      <figure className={`event-archive-media-unavailable ${variantClassName}`}>
        <div>
          <strong>Event media unavailable</strong>
          <a href={approvedMedia.sourceUrl} rel="noreferrer">
            {getPublicSourceLinkLabel(approvedMedia)}
          </a>
        </div>
      </figure>
    );
  }

  return (
    <figure className={`event-approved-image event-approved-embed-preview ${variantClassName}`}>
      <Link href={eventHref} aria-label={`View event: ${approvedMedia.previewAltText}`}>
        {/* URLs are limited to independently reviewed WebP derivatives in the public bucket. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={approvedMedia.previewAltText}
          src={approvedMedia.previewImageUrl}
          style={{ objectPosition: approvedMedia.previewFocalPosition ?? "50% 50%" }}
          onError={() => setUnavailable(true)}
        />
      </Link>
      {showCaption ? (
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
