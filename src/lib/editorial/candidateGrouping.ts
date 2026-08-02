export type GroupableCandidate = {
  state: string | null;
  discovery_time: string;
};

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
