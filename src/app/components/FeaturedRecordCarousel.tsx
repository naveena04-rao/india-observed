"use client";

import { useEffect, useState } from "react";
import type { EventVisual as EventVisualData } from "../../lib/events/types";
import { EventVisual } from "../events/components/EventVisual";
import { EventStatusTag } from "./EventStatusTag";
import { EventTypeTag } from "./EventTypeTag";
import type { EventStatus } from "../eventStatuses";
import type { EventType } from "../eventTypes";

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
  format: string;
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
  format: string;
  sourceProvenance: string;
  eventVerification: string;
  publicationRightsStatus: string;
};

export type FeaturedRecordMedia = PublisherVideoMedia | TextRecordMedia;

export type FeaturedRecord = {
  id: string;
  eventType: EventType;
  eventStatus: EventStatus;
  directedAt: string;
  title: string;
  place: string;
  topic: string;
  description: string;
  verification: string;
  note: string;
  reviewed: string;
  media: FeaturedRecordMedia;
  visual: EventVisualData;
  eventHref: string;
};

type LatestRecord = Pick<
  FeaturedRecord,
  | "id"
  | "eventType"
  | "eventStatus"
  | "title"
  | "place"
  | "topic"
  | "reviewed"
  | "visual"
  | "eventHref"
>;

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
  const activeVisual = activeRecord.visual;
  // Rights approval controls reuse, but can never override authenticity, event-match,
  // integrity, privacy, safety or human-editorial gates. Auto-publication remains disabled.
  const mayDisplaySourceEmbed =
    activeVisual.kind === "publisher_video" &&
    "publicationStatus" in activeMedia &&
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
        <dt>Directed at</dt>
        <dd>{activeRecord.directedAt}</dd>
      </div>
      <div>
        <dt>Event verification</dt>
        <dd>{activeMedia.eventVerification}</dd>
      </div>
      <div className="media-status-grid-empty" aria-hidden="true">
        <dt />
        <dd />
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
        <span className="event-tags">
          <EventTypeTag eventType={activeRecord.eventType} />
          <EventStatusTag eventStatus={activeRecord.eventStatus} />
        </span>
        <span>
          {activeRecord.topic} · {activeRecord.place}
        </span>
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
            <div className="featured-record-context">
              <p className="brief-label">Event context</p>
              <p>{activeRecord.description}</p>
            </div>
          </aside>
          <div className="featured-record-content">
            {featuredRecordCopy(false)}
            <figure
              className={[
                "featured-record-media",
                activeVisual.kind === "record_cover" ? "featured-record-media--cover" : "",
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
                          src={activeVisual.embedUrl}
                          title={`${activeVisual.publisher} video for ${activeRecord.title}`}
                          allow="fullscreen; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <div className="publisher-video-gate">
                        {/* Publisher metadata URL is rendered directly; the image is not reused locally. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeVisual.thumbnailUrl} alt={activeVisual.alt} />
                        <div className="publisher-video-gate-content">
                          <span>Official publisher video</span>
                          <strong>NDTV · 2:49</strong>
                          <button type="button" onClick={() => setLoadedMediaId(activeRecord.id)}>
                            Load video from NDTV
                          </button>
                          <small>Loading connects to the publisher&apos;s video player.</small>
                        </div>
                      </div>
                    )}
                  </div>
                  {loadedMediaId === activeRecord.id ? (
                    <figcaption className="featured-record-caption">
                      {activeMedia.caption} Credit: {activeVisual.publisher}.{" "}
                      <a href={activeVisual.sourceUrl} target="_blank" rel="noreferrer">
                        View the original publisher page
                      </a>
                      .
                    </figcaption>
                  ) : null}
                </>
              ) : (
                <div className="featured-record-video-frame">
                  <EventVisual
                    visual={activeVisual}
                    eventHref={activeRecord.eventHref}
                    variant="homepage-featured"
                  />
                </div>
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
                <div className="latest-entry-copy">
                  <div className="event-tags">
                    <EventTypeTag eventType={record.eventType} />
                    <EventStatusTag eventStatus={record.eventStatus} />
                  </div>
                  <span className="record-topic">{record.topic}</span>
                  <span className="latest-location">{record.place}</span>
                  <strong>{record.title}</strong>
                  <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
                </div>
                <EventVisual
                  visual={record.visual}
                  eventHref={record.eventHref}
                  variant="homepage-latest"
                />
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
