import type {
  EditorialIllustrationVisual,
  EventDetailMedia,
  EventStatus,
  EventType,
  EventVisual,
  PrimaryTopic,
  PublisherVideoVisual,
} from "../lib/events/types";

const rightsReviewedAt = "2026-07-26";

export type EventMediaRegistrySource = {
  slug: string;
  title: string;
  eventType: EventType;
  eventStatus: EventStatus;
  primaryTopic: PrimaryTopic;
  publicLocation: string;
};

export type EventMediaRegistryEntry = {
  visual: EventVisual;
  detailMedia?: EventDetailMedia;
};

type VerifiedPublisherVideoConfig = Omit<PublisherVideoVisual, "fallbackIllustration">;

const verifiedPublisherVideos = {
  "education-accountability-jantar-mantar": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/from-online-movement-to-street-protest-cjp-gathers-at-jantar-mantar-1109578",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1109578&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://c.ndtvimg.com/2026-06/ihl87sqg_image_160x120_06_June_26.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report from the Jantar Mantar education protest.",
    credit: "Video: NDTV",
    rightsReviewedAt,
  },
  "bidadi-farmers-land-acquisition": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/protests-in-karnataka-s-bidadi-after-government-proposes-to-cut-trees-for-ai-city-project-1120270",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1120270&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://c.ndtvimg.com/2026-06/t9gf8cms_bidadi_160x120_30_June_26.png?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail showing a protest scene reported in Bidadi, Karnataka.",
    credit: "Video: NDTV",
    duration: "2:49",
    rightsReviewedAt,
  },
  "jamia-yuva-kumbh-campus-protest": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/jamia-protests-rss-event-sparks-protests-at-jamia-university-in-delhi-1091649",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1091649&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://drop.ndtv.com/video/images/vod/medium/2026-04/1091649_maxresdefault.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report on the Jamia campus protest in New Delhi.",
    credit: "Video: NDTV",
    rightsReviewedAt,
  },
  "delhi-neet-paper-leak-protests": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/neet-exam-leak-protesters-intensify-attack-on-nta-after-neet-exam-cancellation-1098156",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1098156&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://drop.ndtv.com/video/images/vod/medium/2026-05/1098156_maxresdefault.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report on NEET-UG accountability protests in Delhi.",
    credit: "Video: NDTV",
    rightsReviewedAt,
  },
  "jaipur-neet-irregularities-march": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/neet-paper-leak-row-protests-in-jaipur-water-cannons-used-to-disperse-crowds-1102287",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1102287&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://c.ndtvimg.com/2026-05/f1fjibmo_neet-protest_160x120_21_May_26.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report on the Jaipur NEET-UG accountability march.",
    credit: "Video: NDTV",
    rightsReviewedAt,
  },
} as const satisfies Record<string, VerifiedPublisherVideoConfig>;

const previewDetailMedia = {
  "save-sgnp-human-chain-thane": {
    kind: "instagram_embed",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    platform: "Instagram",
    publisher: "Instagram",
    sourceUrl: "https://www.instagram.com/reel/DacYWWktqjL/",
    embedUrl: "https://www.instagram.com/reel/DacYWWktqjL/embed/",
    alt: "Official Instagram post associated with the Save SGNP human-chain event in Thane.",
    credit: "Official post: man_of_the_forest_ and musefoundationwts on Instagram",
    rightsReviewedAt,
    previewOnly: true,
  },
} as const satisfies Record<string, EventDetailMedia>;

function createEditorialIllustration(event: EventMediaRegistrySource): EditorialIllustrationVisual {
  return {
    kind: "editorial_illustration",
    evidenceClass: "editorial_illustration",
    rightsBasis: "owned_original",
    slug: event.slug,
    title: event.title,
    location: event.publicLocation,
    dateLabel: event.eventStatus,
    eventType: event.eventType,
    primaryTopic: event.primaryTopic,
    status: event.eventStatus,
    alt: `India Observed abstract editorial illustration for ${event.title}. It does not depict the event.`,
    credit: "Illustration: India Observed",
    rightsReviewedAt,
  };
}

function assertCompleteRightsMetadata(entry: EventMediaRegistryEntry, slug: string) {
  const media = [entry.visual, entry.detailMedia].filter(Boolean) as Array<
    EventVisual | EventDetailMedia
  >;

  for (const item of media) {
    if (!item.credit || !item.rightsReviewedAt || !item.evidenceClass || !item.rightsBasis) {
      throw new Error(`Incomplete media rights metadata for ${slug}`);
    }

    if (item.evidenceClass === "editorial_illustration" && item.rightsBasis !== "owned_original") {
      throw new Error(`Editorial illustration has an invalid rights basis for ${slug}`);
    }

    if ("sourceUrl" in item && !item.sourceUrl.startsWith("https://")) {
      throw new Error(`External media source is not HTTPS for ${slug}`);
    }

    if (
      item.kind === "open_licensed_image" &&
      (!item.creator ||
        !item.attributionText ||
        !item.licenseName ||
        !item.licenseUrl.startsWith("https://") ||
        (item.creatorUrl !== undefined && !item.creatorUrl.startsWith("https://")))
    ) {
      throw new Error(`Open-licensed media lacks attribution or licence metadata for ${slug}`);
    }

    if (
      item.kind === "publisher_image" &&
      (!item.publisher || !item.attributionText || !item.sourceUrl)
    ) {
      throw new Error(`Publisher media lacks attribution metadata for ${slug}`);
    }
  }
}

export function createEventMediaRegistry<const T extends readonly EventMediaRegistrySource[]>(
  events: T,
): Record<T[number]["slug"], EventMediaRegistryEntry> {
  const eventSlugs = new Set(events.map((event) => event.slug));

  for (const configuredSlug of [
    ...Object.keys(verifiedPublisherVideos),
    ...Object.keys(previewDetailMedia),
  ]) {
    if (!eventSlugs.has(configuredSlug)) {
      throw new Error(`Media registry contains unknown event slug: ${configuredSlug}`);
    }
  }

  const entries = events.map((event) => {
    const fallbackIllustration = createEditorialIllustration(event);
    const publisherVideo = verifiedPublisherVideos[
      event.slug as keyof typeof verifiedPublisherVideos
    ] as VerifiedPublisherVideoConfig | undefined;
    const detailMedia = previewDetailMedia[event.slug as keyof typeof previewDetailMedia] as
      EventDetailMedia | undefined;
    const entry: EventMediaRegistryEntry = {
      visual: publisherVideo ? { ...publisherVideo, fallbackIllustration } : fallbackIllustration,
      ...(detailMedia ? { detailMedia } : {}),
    };

    assertCompleteRightsMetadata(entry, event.slug);
    return [event.slug, entry] as const;
  });

  if (entries.length !== events.length) {
    throw new Error("Media registry does not cover every reviewed event");
  }

  return Object.fromEntries(entries) as Record<T[number]["slug"], EventMediaRegistryEntry>;
}
