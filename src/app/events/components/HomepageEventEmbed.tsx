"use client";

import { useState } from "react";
import type { ApprovedEventMedia } from "../../../lib/events/types";
import { getPublicMediaCaption, getPublicSourceLinkLabel } from "../../../lib/media/presentation";

export function HomepageEventEmbed({
  approvedMedia,
  variantClassName,
}: {
  approvedMedia: Extract<
    ApprovedEventMedia,
    { mediaType: "publisher_video_embed" | "official_social_embed" }
  >;
  variantClassName: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const publisher = approvedMedia.publisher ?? "Approved publisher";

  return (
    <figure className={`event-approved-embed ${variantClassName}`}>
      <div className="event-approved-embed__frame">
        {loaded ? (
          <iframe
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            src={approvedMedia.embedUrl}
            title={approvedMedia.altText}
          />
        ) : (
          <div className="event-approved-embed__gate">
            <span>
              {approvedMedia.mediaType === "publisher_video_embed"
                ? "Publisher-hosted video"
                : "Official source-linked post"}
            </span>
            <strong>{publisher}</strong>
            <button type="button" onClick={() => setLoaded(true)}>
              Load official media
            </button>
            <small>No third-party frame loads before activation.</small>
          </div>
        )}
      </div>
      <figcaption>
        <span>{getPublicMediaCaption(approvedMedia)} · </span>
        <a href={approvedMedia.sourceUrl} rel="noreferrer">
          {getPublicSourceLinkLabel(approvedMedia)}
        </a>
      </figcaption>
    </figure>
  );
}
