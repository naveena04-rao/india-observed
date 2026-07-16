"use client";

import { useEffect, useState } from "react";

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
};

type FeaturedRecordCarouselProps = { records: readonly FeaturedRecord[] };

export function FeaturedRecordCarousel({ records }: FeaturedRecordCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
    if (records.length < 2 || isHovered || hasFocus || !isVisible || prefersReducedMotion) return;
    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % records.length),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [hasFocus, isHovered, isVisible, prefersReducedMotion, records.length]);

  if (records.length === 0) return null;

  const activeRecord = records[activeIndex]!;

  return (
    <section
      className="hero-section featured-carousel"
      aria-label="Featured civic records"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
    >
      <div className="page-shell hero-grid">
        <div className="hero-copy featured-slide" key={activeRecord.id}>
          <p className="section-kicker">Featured record</p>
          <figure className="media-fallback">
            <div className="document-preview" aria-label="Document-style record preview">
              <span>{activeRecord.id}</span>
              <strong className={activeRecord.statusTone}>{activeRecord.status}</strong>
              <small>Last reviewed {activeRecord.reviewed}</small>
            </div>
            <figcaption>
              <dl>
                <div>
                  <dt>Media type</dt>
                  <dd>No approved media</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>Not published</dd>
                </div>
                <div>
                  <dt>Caption</dt>
                  <dd>Typographic record preview</dd>
                </div>
                <div>
                  <dt>Verification</dt>
                  <dd>Awaiting rights and verification review</dd>
                </div>
              </dl>
            </figcaption>
          </figure>
          <div className="featured-record-copy">
            <p className="featured-meta">
              {activeRecord.topic} · {activeRecord.place}
            </p>
            <h1>{activeRecord.title}</h1>
            <div className="featured-evidence" aria-label="Record evidence summary">
              <span>{activeRecord.verification}</span>
              <span>{activeRecord.note}</span>
            </div>
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
          </div>
        </div>

        <aside className="latest-records-row" aria-label="Latest records">
          <h2 className="brief-label">Latest records</h2>
          <div className="latest-records-grid">
            {records.map((record, index) => (
              <button
                className={
                  "latest-entry latest-entry-button" + (index === activeIndex ? " is-active" : "")
                }
                type="button"
                key={record.id}
                onClick={() => setActiveIndex(index)}
                aria-label={
                  (index === activeIndex ? "Currently featured: " : "Feature record: ") +
                  record.id +
                  ": " +
                  record.title
                }
                aria-current={index === activeIndex ? "true" : undefined}
              >
                {index === activeIndex && (
                  <span className="current-record">Currently featured</span>
                )}
                <span className="record-topic">{record.topic}</span>
                <span className="latest-location">{record.place}</span>
                <strong>{record.title}</strong>
                <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
