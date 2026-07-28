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

export type MediaEvidenceClass = "verified_event_media" | "no_approved_event_media";

export type MediaRightsBasis =
  | "explicit_permission"
  | "official_reuse_terms"
  | "official_embed"
  | "cc_by"
  | "cc_by_sa"
  | "cc0"
  | "public_domain"
  | "owned_original";

export type ApprovedMediaType =
  "uploaded_event_image" | "publisher_video_embed" | "official_social_embed";

type ApprovedEventMediaBase = {
  eventSlug: string;
  mediaType: ApprovedMediaType;
  sourceUrl: string;
  publisher: string | null;
  creator: string | null;
  rightsHolder: string | null;
  creditLine: string;
  rightsBasis: MediaRightsBasis;
  licenceName: string | null;
  licenceUrl: string | null;
  altText: string;
  focalPosition: string;
  approvedAt: string;
};

export type ApprovedUploadedEventImage = ApprovedEventMediaBase & {
  mediaType: "uploaded_event_image";
  publicUrl: string;
};

export type ApprovedEventEmbed = ApprovedEventMediaBase & {
  mediaType: "publisher_video_embed" | "official_social_embed";
  embedUrl: string;
};

export type ApprovedEventMedia = ApprovedUploadedEventImage | ApprovedEventEmbed;

export type NoApprovedEventMediaVisual = {
  kind: "no_approved_event_media";
  evidenceClass: "no_approved_event_media";
  title: string;
  location: string;
  dateOrStatus: string;
  sourceCount: number;
  sourceHref: string;
};

export type EventVisual = NoApprovedEventMediaVisual;

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
  approvedMedia?: ApprovedEventMedia;
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
