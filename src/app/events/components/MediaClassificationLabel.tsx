import type { MediaEvidenceClass } from "../../../lib/events/types";

const fullLabels: Record<MediaEvidenceClass, string> = {
  verified_event_media: "Verified event media",
  no_approved_event_media: "No approved event image available",
};

const compactLabels: Record<MediaEvidenceClass, string> = {
  verified_event_media: "Verified event media",
  no_approved_event_media: "No approved event image available",
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
