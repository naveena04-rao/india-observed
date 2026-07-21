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

export type EventPublicationStatus = "published" | "candidate";

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

export type EventSourceRole =
  | "Lead"
  | "Corroboration"
  | "Follow-up"
  | "Official context"
  | "Official response"
  | "Historical context"
  | "Alternate access";

export type EventPublicSource = {
  publisher: string;
  headline: string;
  url: string;
  publicationDate: string | null;
  sourceType: string;
  sourceRole: EventSourceRole;
  reporter?: string;
  independenceNote?: string;
};

export type EventSafetySummary = {
  assessment: string;
  incidentCount: number;
  highestClassification: string;
  injuriesAndDeathsStatus: string;
  propertyDamageStatus: string;
  summary: string;
  lastReviewed: string;
};

export type EventSafetyIncident = {
  date: string;
  publicLocation: string;
  category: string;
  reportedActors: string;
  publicWording: string;
  policeOrStateForce: string;
  protesterOrOtherForce: string;
  injuriesStatus: string;
  deathsStatus: string;
  propertyDamage: string;
  arrestsOrDetentions: string;
  verificationStatus: string;
  competingAccounts?: string;
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
  publicationStatus: EventPublicationStatus;
  publishedAt: string | null;
  approvedSourceCount: number;
  sources: readonly EventPublicSource[];
  safety: EventSafetySummary;
  safetyIncidents: readonly EventSafetyIncident[];
  latestOfficialResponse?: string;
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
