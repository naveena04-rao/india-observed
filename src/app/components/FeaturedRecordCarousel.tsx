"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ApprovedEventMedia, EventVisual as EventVisualData } from "../../lib/events/types";
import {
  getPublicMediaCaption,
  getPublicMediaKind,
  getPublicSourceLinkLabel,
} from "../../lib/media/presentation";
import { EventFollowControl } from "../events/components/EventFollowControl";
import { EventVisual } from "../events/components/EventVisual";
import { EventStatusTag } from "./EventStatusTag";
import { EventTypeTag } from "./EventTypeTag";
import { VerificationStatus } from "./VerificationStatus";
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
  approvedMedia?: ApprovedEventMedia;
  eventHref: string;
  slug: string;
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
  | "approvedMedia"
  | "eventHref"
  | "slug"
  | "verification"
>;

type FeaturedRecordCarouselProps = {
  followingEnabled: boolean;
  initiallySignedIn: boolean;
  records: readonly FeaturedRecord[];
  latestRecords: readonly LatestRecord[];
};

export function FeaturedRecordCarousel({
  followingEnabled,
  initiallySignedIn,
  records,
  latestRecords,
}: FeaturedRecordCarouselProps) {
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
  const approvedMedia = activeRecord.approvedMedia;
  const mayDisplaySourceEmbed =
    approvedMedia !== undefined && approvedMedia.mediaType !== "uploaded_event_image";

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
      <VerificationStatus status={activeRecord.verification} detail={activeRecord.note} />
      <EventFollowControl
        className="homepage-follow-control"
        enabled={followingEnabled}
        initiallySignedIn={initiallySignedIn}
        key={activeRecord.slug}
        slug={activeRecord.slug}
      />
      <Link className="featured-record-link" href={activeRecord.eventHref}>
        View full record →
      </Link>
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
            <figure className="featured-record-media">
              {mayDisplaySourceEmbed ? (
                <>
                  <div className="featured-record-video-frame">
                    {loadedMediaId === activeRecord.id ? (
                      <div className="publisher-video">
                        <iframe
                          src={approvedMedia.embedUrl}
                          title={`${approvedMedia.publisher ?? "Publisher"} media for ${activeRecord.title}`}
                          allow="fullscreen; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <div className="publisher-video-gate event-media-activation">
                        <span>
                          {getPublicMediaKind(approvedMedia) === "Video"
                            ? "Publisher-hosted video"
                            : "Official social post"}
                        </span>
                        <strong>{activeRecord.title}</strong>
                        <p>{activeRecord.place}</p>
                        <button type="button" onClick={() => setLoadedMediaId(activeRecord.id)}>
                          Load media from {approvedMedia.publisher ?? "the approved publisher"}
                        </button>
                        <small>
                          Loading connects to the publisher&apos;s official embed. No third-party
                          frame loads before activation.
                        </small>
                      </div>
                    )}
                  </div>
                  <figcaption className="featured-record-caption">
                    {getPublicMediaCaption(approvedMedia)} ·{" "}
                    <a href={approvedMedia.sourceUrl} target="_blank" rel="noreferrer">
                      {getPublicSourceLinkLabel(approvedMedia)}
                    </a>
                  </figcaption>
                </>
              ) : (
                <div className="featured-record-video-frame">
                  <EventVisual
                    approvedMedia={approvedMedia}
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
                  <h3 className="latest-entry-title">
                    <Link href={record.eventHref}>{record.title}</Link>
                  </h3>
                  <VerificationStatus compact status={record.verification} />
                  <div className="latest-entry-footer">
                    <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
                    <EventFollowControl
                      className="homepage-follow-control"
                      enabled={followingEnabled}
                      initiallySignedIn={initiallySignedIn}
                      slug={record.slug}
                    />
                  </div>
                  <Link className="latest-entry-record-link" href={record.eventHref}>
                    View full record →
                  </Link>
                </div>
                <EventVisual
                  approvedMedia={record.approvedMedia}
                  visual={record.visual}
                  eventHref={record.eventHref}
                  imageLinksToEvent
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
