"use client";

import { useCallback, useEffect, useState } from "react";

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

  const selectRecord = useCallback(
    (index: number) => setActiveIndex((index + records.length) % records.length),
    [records.length],
  );

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
      6000,
    );
    return () => window.clearInterval(timer);
  }, [hasFocus, isHovered, isVisible, prefersReducedMotion, records.length]);

  if (records.length === 0) return null;

  const activeRecord = records[activeIndex]!;
  const inactiveRecords = records
    .map((record, index) => ({ record, index }))
    .filter(({ index }) => index !== activeIndex);

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
          <p className="featured-meta">
            {activeRecord.topic} · {activeRecord.place}
          </p>
          <h1>{activeRecord.title}</h1>
          <div className="featured-evidence" aria-label="Record evidence summary">
            <span>{activeRecord.verification}</span>
            <span>{activeRecord.note}</span>
          </div>
          <div className="carousel-controls">
            <button
              type="button"
              onClick={() => selectRecord(activeIndex - 1)}
              aria-label="Show previous featured record"
            >
              Previous
            </button>
            <div className="carousel-indicators" aria-label="Select a featured record">
              {records.map((record, index) => (
                <button
                  type="button"
                  className={index === activeIndex ? "is-active" : undefined}
                  key={record.id}
                  onClick={() => selectRecord(index)}
                  aria-label={"Show featured record " + (index + 1) + ": " + record.title}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => selectRecord(activeIndex + 1)}
              aria-label="Show next featured record"
            >
              Next
            </button>
          </div>
          <p className="visually-hidden" aria-live="polite">
            Featured record {activeIndex + 1} of {records.length}
          </p>
        </div>

        <aside className="repository-brief latest-column" aria-label="Latest records">
          <p className="brief-label">Latest records</p>
          {inactiveRecords.map(({ record, index }) => (
            <button
              className="latest-entry latest-entry-button"
              type="button"
              key={record.id}
              onClick={() => selectRecord(index)}
              aria-label={"Feature record " + record.id + ": " + record.title}
            >
              <span className="record-topic">{record.topic}</span>
              <span className="latest-location">{record.place}</span>
              <strong>{record.title}</strong>
              <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
