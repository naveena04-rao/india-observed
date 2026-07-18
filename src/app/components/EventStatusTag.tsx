import { eventStatuses, type EventStatus } from "../eventStatuses";

type EventStatusTagProps = {
  eventStatus: EventStatus;
};

export function EventStatusTag({ eventStatus }: EventStatusTagProps) {
  const { label, tone } = eventStatuses[eventStatus];

  return (
    <span
      className={`event-status-tag event-status-tag--${tone}`}
      aria-label={`Event status: ${label}`}
    >
      {label}
    </span>
  );
}
