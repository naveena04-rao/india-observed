import { eventTypes, type EventType } from "../eventTypes";

type EventTypeTagProps = {
  eventType: EventType;
};

export function EventTypeTag({ eventType }: EventTypeTagProps) {
  const { label, definition } = eventTypes[eventType];

  return (
    <span
      className="event-type-tag"
      aria-label={`Event type: ${label}. ${definition}`}
      title={definition}
    >
      {label}
    </span>
  );
}
