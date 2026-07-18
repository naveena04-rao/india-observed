export const eventStatuses = {
  announced: { label: "Upcoming", tone: "upcoming" },
  ongoing: { label: "Ongoing", tone: "ongoing" },
  paused: { label: "Paused", tone: "paused" },
  concluded: { label: "Completed", tone: "completed" },
  unresolved: { label: "Unresolved", tone: "unresolved" },
  outcome_pending: { label: "Outcome pending", tone: "outcome-pending" },
  unknown: { label: "Status unclear", tone: "unknown" },
} as const;

export type EventStatus = keyof typeof eventStatuses;
