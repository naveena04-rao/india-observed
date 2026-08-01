import type { MediaEvidenceClass } from "../../../lib/events/types";

const noMediaLabel = "No approved event image available";

export function mediaClassificationText(evidenceClass: MediaEvidenceClass) {
  return evidenceClass === "no_approved_event_media" ? noMediaLabel : "";
}

export function MediaClassificationLabel({
  evidenceClass,
}: {
  compact?: boolean;
  evidenceClass: MediaEvidenceClass;
}) {
  if (evidenceClass === "verified_event_media") return null;

  return (
    <span className="media-classification-label media-classification-label--no_approved_event_media">
      {noMediaLabel}
    </span>
  );
}
