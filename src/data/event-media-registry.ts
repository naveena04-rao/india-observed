import type {
  EventStatus,
  EventType,
  EventVisual,
  NoApprovedEventMediaVisual,
  PrimaryTopic,
} from "../lib/events/types";

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
};

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

/**
 * The static reviewed snapshot contains only truthful fallbacks. Approved public media is loaded
 * server-side from the protected Supabase media library and merged onto these records at request
 * time. This prevents draft or withdrawn media from entering a client bundle.
 */
export function createEventMediaRegistry<const T extends readonly EventMediaRegistrySource[]>(
  events: T,
): Record<T[number]["slug"], EventMediaRegistryEntry> {
  return Object.fromEntries(
    events.map((event) => [
      event.slug,
      {
        visual: createNoApprovedMediaVisual(event),
      },
    ]),
  ) as Record<T[number]["slug"], EventMediaRegistryEntry>;
}
