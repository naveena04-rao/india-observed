import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatEventDate, formatEventDateRange } from "../../../lib/events/archive";
import {
  getReviewedEvents,
  isCandidatePreviewEnabled,
} from "../../../lib/events/getReviewedEvents";
import { getEventFollowingAvailability } from "../../../lib/events/following";
import { createSessionSupabaseClient } from "../../../lib/supabase/server";
import { ArchiveShell } from "../components/ArchiveShell";
import { EventDetailMedia } from "../components/EventDetailMedia";
import { EventFollowControl } from "../components/EventFollowControl";
import { EventSafety } from "../components/EventSafety";
import { EventSources } from "../components/EventSources";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

async function findEvent(slug: string) {
  const events = await getReviewedEvents();
  return events.find((event) => event.slug === slug);
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await findEvent(slug);
  return event
    ? {
        title: event.title,
        description: event.summary,
        alternates: { canonical: `/events/${event.slug}` },
        openGraph: {
          type: "article",
          title: event.title,
          description: event.summary,
          url: `/events/${event.slug}`,
          images:
            event.approvedMedia?.mediaType === "uploaded_event_image"
              ? [event.approvedMedia.publicUrl]
              : ["/opengraph-image"],
        },
        twitter: {
          card: "summary_large_image",
          title: event.title,
          description: event.summary,
          images:
            event.approvedMedia?.mediaType === "uploaded_event_image"
              ? [event.approvedMedia.publicUrl]
              : ["/opengraph-image"],
        },
      }
    : { title: "Event record unavailable | India Observed" };
}

export default async function EventRecordPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) notFound();
  const candidatePreviewEnabled = isCandidatePreviewEnabled();
  const showCandidateNotice = candidatePreviewEnabled && event.publicationStatus === "candidate";
  const following = getEventFollowingAvailability();
  const followingEnabled = following.enabled && event.publicationStatus === "published";
  const supabase = followingEnabled ? await createSessionSupabaseClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <ArchiveShell authReturnTo={`/events/${event.slug}`}>
      <article className="event-record-page">
        <div className="page-shell event-record-layout">
          {showCandidateNotice ? (
            <p className="preview-notice" role="note">
              This reviewed candidate record is shown for editorial Preview and is not publicly
              published.
            </p>
          ) : null}

          <header className="event-record-header">
            <div className="event-tags">
              <span className="event-type-tag">{event.eventType}</span>
              <span className="event-status-tag event-archive-status">{event.eventStatus}</span>
            </div>
            <h1>{event.title}</h1>
            <p className="event-record-location">
              {event.publicLocation} · {event.stateOrUnionTerritory}
            </p>
            <p className="event-record-topic">{event.topic}</p>
            {event.publicationStatus === "published" ? (
              <EventFollowControl
                className="event-page-follow-control"
                enabled={followingEnabled}
                initiallySignedIn={Boolean(user)}
                slug={event.slug}
              />
            ) : null}
          </header>

          <div className="event-record-visual">
            <EventDetailMedia approvedMedia={event.approvedMedia} visual={event.visual} />
          </div>

          <dl className="event-record-facts">
            <div>
              <dt>Event date</dt>
              <dd>{formatEventDateRange(event)}</dd>
            </div>
            <div>
              <dt>Last reviewed</dt>
              <dd>{formatEventDate(event.lastReviewed)}</dd>
            </div>
            <div>
              <dt>Directed at</dt>
              <dd>{event.directedAt}</dd>
            </div>
            <div>
              <dt>Event verification</dt>
              <dd>{event.eventVerification}</dd>
            </div>
          </dl>

          <section className="event-record-summary" aria-labelledby="record-summary-heading">
            <h2 id="record-summary-heading">Record summary</h2>
            <p>{event.summary}</p>
            <p className="event-record-source-count">
              {event.approvedSourceCount} public{" "}
              {event.approvedSourceCount === 1 ? "source" : "sources"}
            </p>
          </section>

          <EventSafety event={event} />

          <EventSources sources={event.sources} />

          <section className="event-record-actions" aria-labelledby="record-actions-heading">
            <h2 id="record-actions-heading">Contribute to this record</h2>
            <div>
              {["Add a public source", "Suggest a correction", "Submit an official response"].map(
                (label) => (
                  <button key={label} type="button" disabled>
                    <span>{label}</span>
                    <small>Available after public launch</small>
                  </button>
                ),
              )}
            </div>
          </section>
        </div>
      </article>
    </ArchiveShell>
  );
}
