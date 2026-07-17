"use client";

import { useEffect, useState } from "react";

export type MediaReviewStatus =
  "candidate" | "provenance_confirmed" | "event_match_confirmed" | "corroborated" | "rejected";

export type MediaRightsStatus =
  | "original_source_display"
  | "permission_requested"
  | "permission_granted"
  | "permission_denied"
  | "reuse_restricted";

export type MediaPublicationStatus =
  | "published_source_embed"
  | "published_source_link"
  | "published_with_permission"
  | "withheld_privacy"
  | "withheld_safety"
  | "rejected_verification"
  | "removed_or_corrected";

type MediaReviewGates = {
  authenticity: boolean;
  eventMatch: boolean;
  integrity: boolean;
  privacy: boolean;
  safety: boolean;
  humanEditorialApproval: boolean;
};

type PublisherVideoMedia = {
  kind: "publisher_video";
  format: string;
  sourceName: string;
  sourceUrl: string;
  embedUrl: string;
  sourceProvenance: string;
  eventVerification: string;
  publicationRightsStatus: string;
  caption: string;
  reviewStatus: MediaReviewStatus;
  rightsStatus: MediaRightsStatus;
  publicationStatus: MediaPublicationStatus;
  gates: MediaReviewGates;
  internalWithholdingReason?: string;
};

type TextRecordMedia = {
  kind: "text_record";
  format: string;
  sourceProvenance: string;
  eventVerification: string;
  publicationRightsStatus: string;
};

export type FeaturedRecordMedia = PublisherVideoMedia | TextRecordMedia;

export type FeaturedRecord = {
  id: string;
  status: string;
  statusTone: string;
  title: string;
  place: string;
  topic: string;
  verification: string;
  note: string;
  reviewed: string;
  media: FeaturedRecordMedia;
};

type LatestRecord = Pick<FeaturedRecord, "id" | "title" | "place" | "topic" | "reviewed">;

type FeaturedRecordCarouselProps = {
  records: readonly FeaturedRecord[];
  latestRecords: readonly LatestRecord[];
};

export function FeaturedRecordCarousel({ records, latestRecords }: FeaturedRecordCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasFocus, setHasFocus] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [loadedMediaId, setLoadedMediaId] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (records.length < 2 || hasFocus || !isVisible || prefersReducedMotion) return;
    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % records.length),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [hasFocus, isVisible, prefersReducedMotion, records.length]);

  if (records.length === 0) return null;

  const activeRecord = records[activeIndex]!;
  const activeMedia = activeRecord.media;
  // Rights approval controls reuse, but can never override authenticity, event-match,
  // integrity, privacy, safety or human-editorial gates. Auto-publication remains disabled.
  const mayDisplaySourceEmbed =
    activeMedia.kind === "publisher_video" &&
    activeMedia.publicationStatus === "published_source_embed" &&
    activeMedia.reviewStatus !== "candidate" &&
    activeMedia.reviewStatus !== "rejected" &&
    Object.values(activeMedia.gates).every(Boolean);

  const mediaStatusGrid = (
    <dl className="media-status-grid">
      <div>
        <dt>Media format</dt>
        <dd>{activeMedia.format}</dd>
      </div>
      <div>
        <dt>Source &amp; provenance</dt>
        <dd>
          {activeMedia.kind === "publisher_video" ? (
            <a href={activeMedia.sourceUrl} target="_blank" rel="noreferrer">
              {activeMedia.sourceProvenance}
            </a>
          ) : (
            activeMedia.sourceProvenance
          )}
        </dd>
      </div>
      <div>
        <dt>Event verification</dt>
        <dd>{activeMedia.eventVerification}</dd>
      </div>
      <div>
        <dt>Publication &amp; rights status</dt>
        <dd>{activeMedia.publicationRightsStatus}</dd>
      </div>
    </dl>
  );

  const carouselPosition = (
    <>
      <ol className="carousel-indicators" aria-label="Featured record position">
        {records.map((record, index) => (
          <li
            className={index === activeIndex ? "is-active" : undefined}
            key={record.id}
            aria-current={index === activeIndex ? "true" : undefined}
          >
            <span className="visually-hidden">Record {index + 1}</span>
          </li>
        ))}
      </ol>
      <p className="visually-hidden">
        Featured record {activeIndex + 1} of {records.length}
      </p>
    </>
  );

  const featuredRecordCopy = (includeIndicators: boolean) => (
    <div className="featured-record-copy">
      <p className="featured-meta">
        {activeRecord.topic} · {activeRecord.place}
      </p>
      <h1>{activeRecord.title}</h1>
      <div className="featured-evidence" aria-label="Record evidence summary">
        <span>{activeRecord.verification}</span>
        <span>{activeRecord.note}</span>
      </div>
      {includeIndicators ? carouselPosition : null}
    </div>
  );

  return (
    <section
      className="hero-section featured-carousel"
      id="about"
      aria-label="Featured civic records"
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
    >
      <div className="page-shell hero-grid">
        <div className="hero-copy featured-slide featured-slide--media" key={activeRecord.id}>
          <aside className="featured-record-disclosure" aria-label="Media disclosure">
            <p className="section-kicker">Featured record</p>
            {mediaStatusGrid}
          </aside>
          <div className="featured-record-content">
            {featuredRecordCopy(false)}
            <figure
              className={[
                "featured-record-media",
                mayDisplaySourceEmbed ? "" : "featured-record-media--empty",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {mayDisplaySourceEmbed ? (
                <>
                  <div className="featured-record-video-frame">
                    {loadedMediaId === activeRecord.id ? (
                      <div className="publisher-video">
                        <iframe
                          src={activeMedia.embedUrl}
                          title={`NDTV video for ${activeRecord.title}`}
                          allow="fullscreen; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <div className="publisher-video-gate">
                        <span>Official publisher video</span>
                        <strong>NDTV · 2:49</strong>
                        <button type="button" onClick={() => setLoadedMediaId(activeRecord.id)}>
                          Load video from NDTV
                        </button>
                        <small>Loading connects to the publisher&apos;s video player.</small>
                      </div>
                    )}
                  </div>
                  {loadedMediaId === activeRecord.id ? (
                    <figcaption className="featured-record-caption">
                      {activeMedia.caption} Credit: {activeMedia.sourceName}.{" "}
                      <a href={activeMedia.sourceUrl} target="_blank" rel="noreferrer">
                        View the original publisher page
                      </a>
                      .
                    </figcaption>
                  ) : null}
                </>
              ) : (
                <div className="featured-record-media-empty" aria-hidden="true" />
              )}
              {carouselPosition}
            </figure>
          </div>
        </div>

        <aside className="latest-records-row" id="events" aria-label="Latest records">
          <h2 className="brief-label">Latest records</h2>
          <div className="latest-records-grid">
            {latestRecords.map((record) => (
              <article className="latest-entry latest-entry-preview" key={record.id}>
                <span className="record-topic">{record.topic}</span>
                <span className="latest-location">{record.place}</span>
                <strong>{record.title}</strong>
                <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
