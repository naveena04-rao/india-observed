"use client";

import { useState } from "react";

type HomepageReviewMediaProps =
  | { kind: "image"; alt: string; publicUrl: string }
  | { kind: "embed"; alt: string; embedUrl: string; publisher: string };

export function HomepageReviewMedia(props: HomepageReviewMediaProps) {
  const [loaded, setLoaded] = useState(false);

  if (props.kind === "image") {
    return (
      // Dynamic URLs are limited to the configured Supabase public-media bucket.
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={props.alt} src={props.publicUrl} />
    );
  }
  if (!loaded) {
    return (
      <div className="homepage-review-embed-gate">
        <span>Verified event media</span>
        <strong>{props.publisher}</strong>
        <button type="button" onClick={() => setLoaded(true)}>
          Load official embed
        </button>
        <small>No third-party frame loads before activation.</small>
      </div>
    );
  }
  return (
    <iframe
      allow="encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      src={props.embedUrl}
      title={props.alt}
    />
  );
}
