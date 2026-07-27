import type { MediaEvidenceClass } from "../../../lib/events/types";

const fullLabels: Record<MediaEvidenceClass, string> = {
  verified_event_media: "Verified event media",
  context_media: "Context photograph — does not depict this event",
  documentary_context: "Documentary context — does not depict this event",
};

const compactLabels: Record<MediaEvidenceClass, string> = {
  verified_event_media: "Event media",
  context_media: "Context photograph",
  documentary_context: "Documentary context",
};

export function mediaClassificationText(evidenceClass: MediaEvidenceClass) {
  return fullLabels[evidenceClass];
}

export function MediaClassificationLabel({
  compact = false,
  evidenceClass,
}: {
  compact?: boolean;
  evidenceClass: MediaEvidenceClass;
}) {
  const fullLabel = fullLabels[evidenceClass];

  return (
    <span
      className={`media-classification-label media-classification-label--${evidenceClass}`}
      aria-label={compact ? fullLabel : undefined}
    >
      {compact ? compactLabels[evidenceClass] : fullLabel}
    </span>
  );
}
