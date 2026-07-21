export type EventType =
  | "Multi-form civic protest"
  | "Demonstration"
  | "March"
  | "Civic campaign"
  | "Strike"
  | "Sit-in / Dharna"
  | "Sit-in"
  | "Shutdown"
  | "Rally"
  | "Hunger strike";

export type EventStatus = "Ongoing" | "Concluded" | "Outcome pending";

export type PrimaryTopic =
  | "Land & rehabilitation"
  | "Education"
  | "Agriculture & water"
  | "Trade & economic policy"
  | "Environment"
  | "Labour & employment"
  | "Civil rights & justice"
  | "Governance & transparency"
  | "Infrastructure & public services";

export type EventVisual =
  | {
      kind: "publisher_image";
      sourceUrl: string;
      imageUrl: string;
      alt: string;
      credit: string;
    }
  | {
      kind: "publisher_video";
      publisher: "NDTV";
      sourceUrl: string;
      embedUrl: string;
      thumbnailUrl: string;
      thumbnailSource: "og:image" | "twitter:image";
      alt: string;
      credit: string;
      duration?: string;
    }
  | {
      kind: "document_preview";
      sourceUrl: string;
      title: string;
      publisher: string;
      alt: string;
    }
  | {
      kind: "record_cover";
      title: string;
      location: string;
      dateLabel: string;
      alt: string;
    };

export type EventDetailMedia = {
  kind: "instagram_embed";
  platform: "Instagram";
  sourceUrl: string;
  embedUrl: string;
  alt: string;
  credit: string;
  previewOnly: true;
};

export type ReviewedEventPreview = {
  internalId: string;
  slug: string;
  title: string;
  eventType: EventType;
  eventStatus: EventStatus;
  primaryTopic: PrimaryTopic;
  topic: string;
  stateOrUnionTerritory: string;
  publicLocation: string;
  startDate: string | null;
  endDate: string | null;
  lastConfirmedActive: string | null;
  lastReviewed: string;
  summary: string;
  directedAt: string;
  eventVerification: string;
  approvedSourceCount: number;
  visual: EventVisual;
  detailMedia?: EventDetailMedia;
};

export type ArchiveSort = "latest" | "reviewed" | "oldest";

export type ArchiveFilters = {
  query: string;
  state: string;
  topic: string;
  eventType: string;
  status: string;
  sort: ArchiveSort;
};
