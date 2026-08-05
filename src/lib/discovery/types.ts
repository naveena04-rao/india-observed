export const candidateTypes = [
  "new_event",
  "possible_planned_event",
  "event_update",
  "official_response",
  "outcome_status_change",
  "new_source",
  "media_evidence",
  "duplicate",
  "irrelevant",
  "manual_review",
  "processing_failed",
] as const;

export type CandidateType = (typeof candidateTypes)[number];

export type DiscoveryClassification = {
  candidateType: CandidateType;
  targetEventSlug: string | null;
  state: string | null;
  confidence: number;
  priority: "low" | "normal" | "high" | "urgent_editor_attention";
  reason: string;
  targetEventInternalId: string | null;
  matchingSignals: string[];
  conflictingSignals: string[];
  sourceIsNewerThanEvent: boolean | null;
  actionType: string | null;
  districtOrRegion: string | null;
  eventDate: string | null;
  plannedDate: string | null;
  affectedGroup: string | null;
  demand: string | null;
  authorityResponse: string | null;
  dictionaryMatches: string[];
  detectedLanguage: string;
  civicRelevanceScore: number;
};

export type SafeFetchedSource = {
  finalUrl: string;
  contentType: string;
  body: string;
  bytesRead: number;
  etag: string | null;
  lastModified: string | null;
  notModified: boolean;
  statusCode?: number;
  discoveryMetadata?: {
    publisher?: string | null;
    publishedAt?: string | null;
    detectedLanguage?: string | null;
    stateHint?: string | null;
    queryFamily?: string | null;
    queryIndex?: number;
    metadataOnly?: boolean;
    feedSummary?: string | null;
    connector?: string | null;
    headline?: string | null;
    enrichedExcerpt?: string | null;
    enrichmentFetchedAt?: string | null;
  };
};
