import type {
  EventDetailMedia,
  EventStatus,
  EventType,
  EventVisual,
  NoApprovedEventMediaVisual,
  PrimaryTopic,
  PublisherVideoVisual,
} from "../lib/events/types";

const rightsReviewedAt = "2026-07-27";

export type EventMediaRegistrySource = {
  slug: string;
  title: string;
  eventType: EventType;
  eventStatus: EventStatus;
  primaryTopic: PrimaryTopic;
  publicLocation: string;
  approvedSourceCount: number;
  sources: readonly { url: string }[];
};

export type EventMediaRegistryEntry = {
  visual: EventVisual;
  detailMedia?: EventDetailMedia;
};

type VerifiedPublisherVideoConfig = PublisherVideoVisual;

/**
 * Only the Jamia video survives the current source-only review:
 * - the video depicts the same 28 April 2026 event;
 * - NDTV is an approved source for that record;
 * - the official publisher embed is the display mechanism.
 *
 * Previously configured NDTV videos for Jantar Mantar, Bidadi, Delhi NEET and Jaipur NEET are
 * intentionally absent. The Jantar video predates the recorded event, while the other three do
 * not belong to their event's approved source set.
 */
const verifiedPublisherVideos = {
  "jamia-yuva-kumbh-campus-protest": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/jamia-protests-rss-event-sparks-protests-at-jamia-university-in-delhi-1091649",
    approvedSourceUrl:
      "https://www.ndtv.com/education/jamia-students-protest-rss-yuva-kumbh-event-on-campus-heavy-police-deployed-11419540",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1091649&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    alt: "NDTV video report showing the 28 April 2026 Jamia campus protest.",
    credit: "Video: NDTV",
    duration: "2:13",
    sameEventVerified: true,
    privacyReview:
      "Public campus protest footage; no participant directory or identity extraction is provided.",
    safetyReview:
      "Click-to-load only; no live tactical location or sensitive operational detail is exposed.",
    identifiablePeopleAssessment:
      "Participants are visible in publisher footage of a public protest; the official embed preserves publisher context.",
    rightsReviewedAt,
  },
} as const satisfies Record<string, VerifiedPublisherVideoConfig>;

const morbiInstagramSource = "https://www.instagram.com/p/DadCC4NFo-C/";
const saveSgnpInstagramSource = "https://www.instagram.com/reel/DacYWWktqjL/";
const dasiyaFacebookSource =
  "https://www.facebook.com/LiveTimesNewsChannel/videos/uttarpradesh-%E0%A4%AC%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%80-%E0%A4%AE%E0%A5%87%E0%A4%82-%E0%A4%8F%E0%A4%A5%E0%A5%87%E0%A4%A8%E0%A5%89%E0%A4%B2-%E0%A4%AB%E0%A5%88%E0%A4%95%E0%A5%8D%E0%A4%9F%E0%A5%8D%E0%A4%B0%E0%A5%80-%E0%A4%95%E0%A5%87-%E0%A4%96%E0%A4%BF%E0%A4%B2%E0%A4%BE%E0%A4%AB-%E0%A4%9C%E0%A4%A8-%E0%A4%86%E0%A4%82%E0%A4%A6%E0%A5%8B%E0%A4%B2%E0%A4%A8-%E0%A4%B9%E0%A4%9C%E0%A4%BE%E0%A4%B0%E0%A5%8B%E0%A4%82-%E0%A4%97%E0%A5%8D%E0%A4%B0%E0%A4%BE%E0%A4%AE%E0%A5%80%E0%A4%A3%E0%A5%8B%E0%A4%82-%E0%A4%A8%E0%A5%87-%E0%A4%95%E0%A4%BF/2065530604339052/";

function instagramEmbed(sourceUrl: string) {
  return `${sourceUrl}embed/`;
}

function facebookVideoEmbed(sourceUrl: string) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    sourceUrl,
  )}&show_text=false&width=960`;
}

/**
 * These official platform posts are themselves approved event sources. They remain click-to-load,
 * never supply archive thumbnails, and never cause an iframe or tracker request before activation.
 */
const sourceSocialEmbeds = {
  "save-sgnp-human-chain-thane": {
    kind: "social_embed",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    platform: "Instagram",
    publisher: "ScienceKriti / Save SGNP campaign contributors",
    sourceUrl: saveSgnpInstagramSource,
    approvedSourceUrl: saveSgnpInstagramSource,
    embedUrl: instagramEmbed(saveSgnpInstagramSource),
    alt: "Official Instagram post documenting the 5 July 2026 Save SGNP human chain in Thane.",
    credit: "Official Save SGNP event post on Instagram",
    sameEventVerified: true,
    privacyReview:
      "The post documents a public human chain and may show identifiable adults and children; it remains Preview-only for editorial review.",
    safetyReview:
      "No live location is disclosed; the post is click-to-load and remains excluded from Production.",
    identifiablePeopleAssessment:
      "Ordinary participants, including possible minors, may be identifiable; Preview-only treatment is retained.",
    rightsReviewedAt,
    previewOnly: true,
  },
  "morbi-transmission-compensation-satyagraha": {
    kind: "social_embed",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    platform: "Instagram",
    publisher: "The Wire",
    sourceUrl: morbiInstagramSource,
    approvedSourceUrl: morbiInstagramSource,
    embedUrl: instagramEmbed(morbiInstagramSource),
    alt: "The Wire Instagram post about the Morbi farmers' compensation fast.",
    credit: "Official post: The Wire on Instagram",
    sameEventVerified: true,
    privacyReview:
      "Publisher-framed event coverage; no participant identity is extracted or indexed by India Observed.",
    safetyReview:
      "Click-to-load publisher post; no live tactical information or vulnerable precise location is added.",
    identifiablePeopleAssessment:
      "Any people remain within the publisher's original event-reporting context.",
    rightsReviewedAt,
  },
  "dasiya-villagers-ethanol-plant": {
    kind: "social_embed",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    platform: "Facebook",
    publisher: "Live Times",
    sourceUrl: dasiyaFacebookSource,
    approvedSourceUrl: dasiyaFacebookSource,
    embedUrl: facebookVideoEmbed(dasiyaFacebookSource),
    alt: "Live Times video from the public movement against the Dasiya ethanol factory.",
    credit: "Official event video: Live Times on Facebook",
    sameEventVerified: true,
    privacyReview:
      "Wide public-action footage is preferred; India Observed does not identify or catalogue ordinary participants.",
    safetyReview:
      "Click-to-load official video; no live tactical or vulnerable location detail is added.",
    identifiablePeopleAssessment:
      "Participants may be visible in a wide public protest scene; no close portrait is used as a static thumbnail.",
    rightsReviewedAt,
  },
} as const satisfies Record<string, EventDetailMedia>;

function createNoApprovedMediaVisual(event: EventMediaRegistrySource): NoApprovedEventMediaVisual {
  return {
    kind: "no_approved_event_media",
    evidenceClass: "no_approved_event_media",
    title: event.title,
    location: event.publicLocation,
    dateOrStatus: event.eventStatus,
    sourceCount: event.approvedSourceCount,
    sourceHref: `/events/${event.slug}#event-sources`,
  };
}

function assertApprovedSourceMembership(
  event: EventMediaRegistrySource,
  item: PublisherVideoVisual | EventDetailMedia,
) {
  if (!event.sources.some((source) => source.url === item.approvedSourceUrl)) {
    throw new Error(`Media does not belong to an approved source for ${event.slug}`);
  }
  if (item.sameEventVerified !== true) {
    throw new Error(`Media lacks same-event verification for ${event.slug}`);
  }
  if (
    !item.sourceUrl.startsWith("https://") ||
    !item.embedUrl.startsWith("https://") ||
    !item.credit ||
    !item.rightsReviewedAt ||
    !item.privacyReview ||
    !item.safetyReview ||
    !item.identifiablePeopleAssessment
  ) {
    throw new Error(`Media review metadata is incomplete for ${event.slug}`);
  }
}

export function createEventMediaRegistry<const T extends readonly EventMediaRegistrySource[]>(
  events: T,
): Record<T[number]["slug"], EventMediaRegistryEntry> {
  const eventSlugs = new Set(events.map((event) => event.slug));

  for (const configuredSlug of [
    ...Object.keys(verifiedPublisherVideos),
    ...Object.keys(sourceSocialEmbeds),
  ]) {
    if (!eventSlugs.has(configuredSlug)) {
      throw new Error(`Media registry contains unknown event slug: ${configuredSlug}`);
    }
  }

  const entries = events.map((event) => {
    const publisherVideo = verifiedPublisherVideos[
      event.slug as keyof typeof verifiedPublisherVideos
    ] as PublisherVideoVisual | undefined;
    const detailMedia = sourceSocialEmbeds[event.slug as keyof typeof sourceSocialEmbeds] as
      EventDetailMedia | undefined;

    if (publisherVideo) assertApprovedSourceMembership(event, publisherVideo);
    if (detailMedia) assertApprovedSourceMembership(event, detailMedia);

    const entry: EventMediaRegistryEntry = {
      visual: publisherVideo ?? createNoApprovedMediaVisual(event),
      ...(detailMedia ? { detailMedia } : {}),
    };

    return [event.slug, entry] as const;
  });

  if (entries.length !== events.length) {
    throw new Error("Media registry does not cover every reviewed event");
  }

  return Object.fromEntries(entries) as Record<T[number]["slug"], EventMediaRegistryEntry>;
}
