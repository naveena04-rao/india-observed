import type { ReviewedEventPreview } from "@/lib/events/types";

export const eventFieldDefinitions = [
  {
    key: "title",
    label: "Event title",
    category: "Core event details",
    dbColumn: "events.title",
    displayField: "title",
    type: "text",
  },
  {
    key: "event_type",
    label: "Event type",
    category: "Core event details",
    dbColumn: "events.event_type",
    displayField: "eventType",
    type: "event-type",
  },
  {
    key: "main_issue",
    label: "Issue or subject",
    category: "Issue and topic",
    dbColumn: "events.main_issue",
    displayField: "topic",
    type: "textarea",
  },
  {
    key: "primary_topic",
    label: "Primary topic",
    category: "Issue and topic",
    dbColumn: "events.primary_topic",
    displayField: "primaryTopic",
    type: "primary-topic",
  },
  {
    key: "state_name",
    label: "State or union territory",
    category: "Location",
    dbColumn: "events.state_name",
    displayField: "stateOrUnionTerritory",
    type: "text",
  },
  {
    key: "general_location",
    label: "Public location",
    category: "Location",
    dbColumn: "events.general_location",
    displayField: "publicLocation",
    type: "text",
  },
  {
    key: "start_date",
    label: "Start date",
    category: "Dates and status",
    dbColumn: "events.start_date",
    displayField: "startDate",
    type: "date",
  },
  {
    key: "end_date",
    label: "End date",
    category: "Dates and status",
    dbColumn: "events.end_date",
    displayField: "endDate",
    type: "date",
  },
  {
    key: "lifecycle_status",
    label: "Event status",
    category: "Dates and status",
    dbColumn: "events.lifecycle_status",
    displayField: "eventStatus",
    type: "event-status",
  },
  {
    key: "neutral_summary",
    label: "Record summary",
    category: "Summary",
    dbColumn: "events.neutral_summary",
    displayField: "summary",
    type: "textarea",
  },
  {
    key: "directed_at",
    label: "Directed at",
    category: "People and organisations",
    dbColumn: "event_organisations + organisations",
    displayField: "directedAt",
    type: "textarea",
  },
  {
    key: "latest_official_response",
    label: "Latest official response",
    category: "Official response",
    dbColumn: "events.latest_official_response",
    displayField: "latestOfficialResponse",
    type: "textarea",
  },
] as const;

export type EventFieldKey = (typeof eventFieldDefinitions)[number]["key"];
export const eventFieldKeys = eventFieldDefinitions.map(({ key }) => key) as EventFieldKey[];

export const internalOnlyEventKeys = [
  "id",
  "internal_id",
  "verification_status",
  "event_verification",
  "publication_status",
  "published_at",
  "last_reviewed",
  "internal_notes",
  "lead_discovery_channel",
  "coverage_profile",
  "reviewer_id",
  "moderator_id",
  "safety_assessment",
] as const;

export function currentEventValues(event: ReviewedEventPreview): Record<EventFieldKey, string> {
  return Object.fromEntries(
    eventFieldDefinitions.map((field) => {
      const value = event[field.displayField as keyof ReviewedEventPreview];
      return [field.key, typeof value === "string" ? value : ""];
    }),
  ) as Record<EventFieldKey, string>;
}
