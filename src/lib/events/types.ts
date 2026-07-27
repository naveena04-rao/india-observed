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
  | "official_embed"
  | "cc_by"
  | "cc_by_sa"
  | "cc0"
  | "public_domain"
  | "owned_original";

export type MediaRightsMetadata = {
  evidenceClass: MediaEvidenceClass;
  rightsBasis: MediaRightsBasis;
  credit: string;
  rightsReviewedAt: string;
};

export type NoApprovedEventMediaVisual = {
  kind: "no_approved_event_media";
  evidenceClass: "no_approved_event_media";
  title: string;
  location: string;
  dateOrStatus: string;
  sourceCount: number;
  sourceHref: string;
};

export type PublisherVideoVisual = MediaRightsMetadata & {
  kind: "publisher_video";
  evidenceClass: "verified_event_media";
  rightsBasis: "official_embed" | "explicit_permission";
  publisher: string;
  sourceUrl: string;
  approvedSourceUrl: string;
  embedUrl: string;
  alt: string;
  duration?: string;
  sameEventVerified: true;
  privacyReview: string;
  safetyReview: string;
  identifiablePeopleAssessment: string;
};

export type EventVisual = PublisherVideoVisual | NoApprovedEventMediaVisual;

export type EventDetailMedia = MediaRightsMetadata & {
  kind: "social_embed";
  evidenceClass: "verified_event_media";
  rightsBasis: "official_embed";
  sameEventVerified: true;
  platform: "Instagram" | "Facebook";
  publisher: string;
  sourceUrl: string;
  approvedSourceUrl: string;
  embedUrl: string;
  alt: string;
  credit: string;
  privacyReview: string;
  safetyReview: string;
  identifiablePeopleAssessment: string;
  previewOnly?: true;
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
