export type GroupableCandidate = {
  state: string | null;
  discovery_time: string;
};

export type ReviewCandidate = GroupableCandidate & {
  candidate_type: string;
  confidence: number | null;
};

export const eventCandidateTypes = new Set([
  "new_event",
  "event_update",
  "official_response",
  "outcome_status_change",
]);

export function partitionCandidateReviewRows<T extends ReviewCandidate>(candidates: readonly T[]) {
  const eventCandidates: T[] = [];
  const diagnostics: T[] = [];

  for (const candidate of candidates) {
    if (
      eventCandidateTypes.has(candidate.candidate_type) &&
      candidate.confidence !== null &&
      candidate.confidence >= 0.5
    )
      eventCandidates.push(candidate);
    else diagnostics.push(candidate);
  }

  return { eventCandidates, diagnostics };
}

export const unknownStateGroup = "Unknown / National";

export function groupCandidatesByState<T extends GroupableCandidate>(candidates: readonly T[]) {
  const groups = new Map<string, T[]>();

  for (const candidate of [...candidates].sort(
    (left, right) => Date.parse(right.discovery_time) - Date.parse(left.discovery_time),
  )) {
    const state = candidate.state?.trim() || unknownStateGroup;
    const group = groups.get(state) ?? [];
    group.push(candidate);
    groups.set(state, group);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === unknownStateGroup) return 1;
      if (right === unknownStateGroup) return -1;
      return left.localeCompare(right, "en-IN");
    })
    .map(([state, items]) => ({ state, items }));
}
