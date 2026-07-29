import Link from "next/link";
import { EventStatusTag } from "./components/EventStatusTag";
import { EventTypeTag } from "./components/EventTypeTag";
import { FooterSocialPlaceholders } from "./components/FooterSocialPlaceholders";
import { FeaturedRecordCarousel, type FeaturedRecord } from "./components/FeaturedRecordCarousel";
import { HeaderAuthControl } from "./components/HeaderAuthControl";
import { EventFollowControl } from "./events/components/EventFollowControl";
import { EventVisual } from "./events/components/EventVisual";
import type { EventStatus } from "./eventStatuses";
import { eventTypes, type EventType } from "./eventTypes";
import { getEventFollowingAvailability } from "../lib/events/following";
import { getReviewedEvents, isCandidatePreviewEnabled } from "../lib/events/getReviewedEvents";
import type {
  ApprovedEventMedia,
  EventVisual as EventVisualData,
  ReviewedEventPreview,
} from "../lib/events/types";
import { createSessionSupabaseClient } from "../lib/supabase/server";

type HomepageVisual = {
  approvedMedia?: ApprovedEventMedia;
  eventHref: string;
  slug: string;
  visual: EventVisualData;
};

function getHomepageVisual(
  homepageVisualsByInternalId: ReadonlyMap<string, HomepageVisual>,
  internalId: string,
) {
  const homepageVisual = homepageVisualsByInternalId.get(internalId);
  if (!homepageVisual) throw new Error(`Missing reviewed visual for homepage record ${internalId}`);
  return homepageVisual;
}

function createHomepageVisualMap(
  events: Awaited<ReturnType<typeof getReviewedEvents>>,
): Map<string, HomepageVisual> {
  return new Map(
    events.map(({ approvedMedia, internalId, slug, visual }) => [
      internalId,
      { approvedMedia, eventHref: `/events/${slug}`, slug, visual },
    ]),
  );
}

const homepageEventTypes: Record<ReviewedEventPreview["eventType"], EventType> = {
  "Multi-form civic protest": "protest",
  Demonstration: "demonstration",
  March: "march",
  "Civic campaign": "protest",
  Strike: "strike",
  "Sit-in / Dharna": "dharna",
  "Sit-in": "sit_in",
  Shutdown: "shutdown",
  Rally: "rally",
  "Hunger strike": "hunger_strike",
};

const homepageEventStatuses: Record<ReviewedEventPreview["eventStatus"], EventStatus> = {
  Ongoing: "ongoing",
  Concluded: "concluded",
  "Outcome pending": "outcome_pending",
};

function formatHomepageDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function createMediaReadyFeaturedRecord(event: ReviewedEventPreview): FeaturedRecord {
  if (!event.approvedMedia) throw new Error(`Missing approved media for ${event.slug}`);
  return {
    id: event.internalId,
    eventType: homepageEventTypes[event.eventType],
    eventStatus: homepageEventStatuses[event.eventStatus],
    directedAt: event.directedAt,
    title: event.title,
    place: event.publicLocation.includes(event.stateOrUnionTerritory)
      ? event.publicLocation
      : `${event.publicLocation}, ${event.stateOrUnionTerritory}`,
    topic: event.primaryTopic,
    description: event.summary,
    verification: event.eventVerification,
    note: "Exact-event media approved",
    reviewed: formatHomepageDate(event.lastReviewed),
    media: {
      format:
        event.approvedMedia.mediaType === "publisher_video_embed"
          ? "Publisher-hosted video"
          : "Official source-linked post",
      sourceProvenance: event.approvedMedia.publisher ?? "Approved source",
      eventVerification: "Exact event verified",
      publicationRightsStatus: "Official source embed",
    },
    visual: event.visual,
    approvedMedia: event.approvedMedia,
    eventHref: `/events/${event.slug}`,
    slug: event.slug,
  };
}

function getApprovedHomepageMediaDisclosure(
  approvedMedia: ApprovedEventMedia | undefined,
  fallback: FeaturedRecord["media"],
): FeaturedRecord["media"] {
  if (!approvedMedia) return fallback;
  return {
    format:
      approvedMedia.mediaType === "uploaded_event_image"
        ? "Exact-event source photograph"
        : approvedMedia.mediaType === "publisher_video_embed"
          ? "Publisher-hosted video"
          : "Official source-linked post",
    sourceProvenance: approvedMedia.publisher ?? "Approved source",
    eventVerification: "Exact event verified",
    publicationRightsStatus:
      approvedMedia.rightsBasis === "official_embed"
        ? "Official source embed"
        : "Reviewed editorial current-events display",
  };
}

const featuredRecords = [
  {
    id: "IO-CM-KA-0002",
    eventType: "protest",
    eventStatus: "ongoing",
    directedAt: "State government — Karnataka",
    title: "Bidadi farmers oppose township land acquisition",
    place: "Bengaluru South, Karnataka",
    topic: "Land and rehabilitation",
    description:
      "Farmers and villagers near Bidadi oppose land acquisition for the proposed township, citing risks to agricultural land and livelihoods.",
    verification: "Occurrence verified",
    note: "Some details remain disputed",
    reviewed: "15 July 2026",
    media: {
      format: "Text record",
      sourceProvenance: "Reviewed record sources; no approved event visual",
      eventVerification: "Event confirmed",
      publicationRightsStatus: "Text fallback · No visual media published",
    },
  },
  {
    id: "IO-CM-MN-0001",
    eventType: "strike",
    eventStatus: "ongoing",
    directedAt: "State government — Manipur",
    title: "Manipur government employees continue cease-work strike",
    place: "Manipur",
    topic: "Labour and employment",
    description:
      "The statewide cease-work strike centres on a seven-point charter covering retirement age, allowances, pensions and employment conditions.",
    verification: "Occurrence verified",
    note: "Official response under review",
    reviewed: "15 July 2026",
    media: {
      format: "Text record",
      sourceProvenance: "Reviewed record sources; no visual asset selected",
      eventVerification: "Event confirmed",
      publicationRightsStatus: "Text fallback · No visual media published",
    },
  },
  {
    id: "IO-CM-OD-0001",
    eventType: "protest",
    eventStatus: "concluded",
    directedAt: "District education authorities — Jajpur",
    title: "Dharmasala students protest teacher vacancies",
    place: "Jajpur, Odisha",
    topic: "Education",
    description:
      "Students protested after staffing fell to 11 teachers for more than 400 pupils; two teachers were deputed to the school that day.",
    verification: "Outcome documented",
    note: "Same-day institutional response recorded",
    reviewed: "15 July 2026",
    media: {
      format: "Text record",
      sourceProvenance: "Reviewed record sources; no visual asset selected",
      eventVerification: "Event and outcome confirmed",
      publicationRightsStatus: "Text fallback · No visual media published",
    },
  },
] as const;

const latestRecords = [
  {
    id: "IO-CM-MP-0001",
    eventType: "protest",
    eventStatus: "ongoing",
    topic: "Land & rehabilitation",
    place: "Chhatarpur–Panna, Madhya Pradesh",
    title:
      "Project-affected communities resume protest over rehabilitation and compensation in Bundelkhand",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-DL-0001",
    eventType: "sit_in",
    eventStatus: "ongoing",
    topic: "Education",
    place: "Jantar Mantar, New Delhi",
    title: "Education accountability sit-in and hunger strike continues at Jantar Mantar",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-MH-0001",
    eventType: "human_chain",
    eventStatus: "concluded",
    topic: "Environment",
    place: "Thane, Maharashtra",
    title: "Citizens form human chain in Thane under the Save SGNP campaign",
    reviewed: "15 July 2026",
  },
] as const;

type OnRecord = {
  id: string;
  eventType: EventType;
  eventStatus: EventStatus;
  topic: string;
  place: string;
  title: string;
  context: string;
  reviewed: string;
};

const onRecords = [
  {
    id: "IO-CM-GJ-0001",
    eventType: "satyagraha",
    eventStatus: "ongoing",
    topic: "Land & rehabilitation",
    place: "Jetpar village, Morbi district, Gujarat",
    title:
      "Morbi farmers continue satyagraha over compensation for power-transmission infrastructure",
    context:
      "Farmers centred in Jetpar village began protesting on 7 June over compensation for agricultural land affected by power-transmission infrastructure. After an indefinite hunger strike and revised compensation guidelines announced on 4 July, they ended the fast on 7 July but continued the movement as a satyagraha, saying questions about land valuation, right-of-way compensation and implementation remained.",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-UP-0001",
    eventType: "demonstration",
    eventStatus: "ongoing",
    topic: "Environment",
    place: "Dasiya village, Rudhauli police-station area, Bhanpur tehsil, Basti, Uttar Pradesh",
    title: "Dasiya villagers protest construction of an ethanol plant in Basti district",
    context:
      "Residents of Dasiya and nearby villages have opposed an ethanol plant under construction in Basti district. A memorandum submitted in June raised concerns about nearby settlements and government schools, while a larger demonstration was announced and held on 14 July under substantial police deployment. Protesters called for the factory to be stopped and raised concerns about water use, environmental and health effects, and the circumstances in which land was obtained.",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-AS-0001",
    eventType: "demonstration",
    eventStatus: "concluded",
    topic: "Land & rehabilitation",
    place: "Malgaon area near the Kokrajhar district border, Assam",
    title:
      "Bodo residents protest proposed APDCL land allotment and resettlement plan in Kokrajhar",
    context:
      "Hundreds of Bodo residents gathered at Malgaon on 12 July 2026 to oppose a proposed land allotment to Assam Power Distribution Company Limited and the proposed rehabilitation of 93 families evicted from Kaimari. Protesters demanded protection of land they described as part of a Tribal Belt and Block and called for the allotment and resettlement proposal to be withdrawn. The demonstration is supported by regional video reporting and local community coverage.",
    reviewed: "15 July 2026",
  },
] as const satisfies readonly OnRecord[];

const processSteps = [
  ["1", "Find the event", "Identify credible public reporting and official information."],
  [
    "2",
    "Separate the claims",
    "Distinguish verified details, attributed statements and disputed information.",
  ],
  ["3", "Check the evidence", "Compare independent sources and supporting documents."],
  ["4", "Review before publication", "Apply accuracy, privacy, safety and correction checks."],
] as const;

export default async function HomePage() {
  const reviewedEvents = await getReviewedEvents();
  const candidatePreviewEnabled = isCandidatePreviewEnabled();
  const mediaReadyEvents = reviewedEvents.filter((event) => event.approvedMedia);
  const homepageVisualsByInternalId = createHomepageVisualMap(reviewedEvents);
  const featuredRecordsWithVisuals = candidatePreviewEnabled
    ? featuredRecords.map((record) => {
        const homepageVisual = getHomepageVisual(homepageVisualsByInternalId, record.id);
        return {
          ...record,
          ...homepageVisual,
          media: getApprovedHomepageMediaDisclosure(homepageVisual.approvedMedia, record.media),
        };
      })
    : mediaReadyEvents.slice(0, 1).map(createMediaReadyFeaturedRecord);
  const featuredSlugs = new Set(featuredRecordsWithVisuals.map((record) => record.slug));
  const latestRecordsWithVisuals = candidatePreviewEnabled
    ? latestRecords.map((record) => ({
        ...record,
        ...getHomepageVisual(homepageVisualsByInternalId, record.id),
      }))
    : mediaReadyEvents
        .filter((event) => !featuredSlugs.has(event.slug))
        .slice(0, 3)
        .map(createMediaReadyFeaturedRecord);
  const coverageStates = new Set(reviewedEvents.map((event) => event.stateOrUnionTerritory)).size;
  const coverageSources = reviewedEvents.reduce(
    (total, event) => total + event.approvedSourceCount,
    0,
  );
  const following = getEventFollowingAvailability();
  const supabase = following.enabled ? await createSessionSupabaseClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const initiallySignedIn = Boolean(user);

  return (
    <main id="home">
      <header className="site-header">
        <div className="page-shell header-inner">
          <Link className="brand" href="/" aria-label="India Observed home">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="brand-copy">
              <strong>India Observed</strong>
              <small>Independent records of protests and civic movements across India.</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#home">Home</a>
            <Link href="/about">About</Link>
            <Link href="/events">Events</Link>
            <Link href="/methodology">Methodology</Link>
            {following.enabled ? (
              <HeaderAuthControl signedIn={initiallySignedIn} returnTo="/" />
            ) : null}
            <a className="nav-action" href="#lead">
              Submit a lead
            </a>
          </nav>

          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              <a href="#home">Home</a>
              <Link href="/about">About</Link>
              <Link href="/events">Events</Link>
              <Link href="/methodology">Methodology</Link>
              {following.enabled ? (
                <HeaderAuthControl signedIn={initiallySignedIn} returnTo="/" />
              ) : null}
              <a className="nav-action" href="#lead">
                Submit a lead
              </a>
            </nav>
          </details>
        </div>
      </header>

      <div className="utility-bar">
        <div className="page-shell utility-bar-inner">
          <span>Sources linked. Identities protected. Corrections visible.</span>
        </div>
      </div>

      <FeaturedRecordCarousel
        followingEnabled={following.enabled}
        initiallySignedIn={initiallySignedIn}
        records={featuredRecordsWithVisuals}
        latestRecords={latestRecordsWithVisuals}
      />

      <section className="on-record-section" aria-labelledby="on-record-title">
        <div className="page-shell">
          <h2 id="on-record-title">ON RECORD</h2>

          <div className="on-record-list">
            {onRecords.flatMap((record) => {
              const homepageVisual = homepageVisualsByInternalId.get(record.id);
              if (!homepageVisual) return [];
              const { approvedMedia, eventHref, slug, visual } = homepageVisual;

              return (
                <article className="on-record-context" key={record.id}>
                  <div className="on-record-copy">
                    <div className="on-record-meta">
                      <div className="event-tags">
                        <EventTypeTag eventType={record.eventType} />
                        <EventStatusTag eventStatus={record.eventStatus} />
                      </div>
                      <span>{record.topic}</span>
                      <span>{record.place}</span>
                    </div>
                    <h3>{record.title}</h3>
                    <p>{record.context}</p>
                    <div className="on-record-footer">
                      <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
                      <EventFollowControl
                        className="homepage-follow-control"
                        enabled={following.enabled}
                        initiallySignedIn={initiallySignedIn}
                        slug={slug}
                      />
                    </div>
                  </div>
                  <EventVisual
                    approvedMedia={approvedMedia}
                    visual={visual}
                    eventHref={eventHref}
                    variant="homepage-on-record"
                  />
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="methodology-section" id="methodology">
        <div className="page-shell methodology-layout">
          <div className="methodology-intro">
            <h2>Methodology</h2>
            <p className="methodology-subheading">How are records reviewed</p>
            <p className="methodology-description">
              Every record is reviewed before publication. We verify the event, separate claims from
              established facts, compare supporting sources and check for privacy or safety risks.
            </p>
          </div>

          <ol className="process-list" aria-label="Four-stage editorial process">
            {processSteps.map(([number, title, description]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>

          <details className="event-type-guide">
            <summary>Event type definitions</summary>
            <dl>
              {Object.entries(eventTypes).map(([key, { label, definition }]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      </section>

      <section className="coverage-section" id="coverage">
        <div className="page-shell coverage-grid">
          <div>
            <h2 className="coverage-heading">COVERAGE</h2>
            <p className="coverage-subheading">Across India, event by event.</p>
            <p className="coverage-description">
              The public media-ready repository currently contains event records from{" "}
              {coverageStates} states and Union Territories, supported by source-linked
              documentation.
            </p>
          </div>
          <div className="coverage-ledger" aria-label="Coverage notes">
            <div>
              <strong>{coverageStates}</strong>
              <span>states and Union Territories represented</span>
            </div>
            <div>
              <strong>{reviewedEvents.length}</strong>
              <span>reviewed event records</span>
            </div>
            <div>
              <strong>{coverageSources}</strong>
              <span>source records linked to reviewed events</span>
            </div>
          </div>
        </div>
      </section>

      <section className="participation-section" aria-labelledby="contribute-title">
        <div className="page-shell participation-grid">
          <div className="lead-panel" id="lead">
            <h2 id="contribute-title" className="contribute-heading">
              CONTRIBUTE
            </h2>
            <p className="contribute-subheading">Want to report a public event?</p>
            <p className="contribute-description">
              Share a public source link, approximate date and broad location. Do not submit private
              documents, participant lists or tactical information.
            </p>
            <a className="button button-light" href="#lead">
              Submit a public lead
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell">
          <div className="footer-grid">
            <div className="footer-identity">
              <span className="footer-brand">India Observed</span>
              <p>Independent, source-linked records of civic action across India.</p>
            </div>
            <div className="footer-explore">
              <h2>Explore</h2>
              <nav aria-label="Footer navigation">
                <a href="#home">Home</a>
                <Link href="/events">Events</Link>
                <Link href="/methodology">Methodology</Link>
                <a href="#coverage">Coverage</a>
                <Link href="/editorial-policy">Editorial policy</Link>
                <Link href="/sources-verification">Sources & verification</Link>
                <Link href="/corrections">Corrections</Link>
                <Link href="/media-policy">Media policy</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/copyright">Copyright & takedown</Link>
                <a href="#lead">Submit a lead</a>
              </nav>
            </div>
            <div className="footer-follow">
              <h2>Follow</h2>
              <FooterSocialPlaceholders />
            </div>
          </div>
          <div className="footer-trust-strip">
            <span>Sources linked</span>
            <span>Human review before publication</span>
            <span>Identities protected</span>
            <span>© 2026 India Observed</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
