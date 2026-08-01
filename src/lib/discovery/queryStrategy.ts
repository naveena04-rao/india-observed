import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import { getReviewedTerms, updateTerms } from "./termConfiguration";
export { buildPriorityLocalities, reviewedLocalitiesByState } from "./geography";

export const indiaStatesAndTerritories = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const dailyQueryBudget = {
  rssAtom: "all approved feeds within each source rate limit",
  sitemaps: "all approved recent sitemaps with recursion and domain caps",
  governmentAdapters: "all enabled source-specific recent-page adapters",
  gdelt: 60,
  youtube: 100,
  bluesky: 500,
  telegram: 0,
} as const;

export const youtubeQuotaAllocation = [
  { priority: "ongoing_event_updates", maximumCalls: 45 },
  { priority: "high_priority_or_weak_coverage_states", maximumCalls: 25 },
  { priority: "official_responses", maximumCalls: 15 },
  { priority: "new_event_media", maximumCalls: 10 },
  { priority: "general_discovery", maximumCalls: 5 },
] as const;

export class QueryBudget {
  private used = new Map<string, number>();
  constructor(private readonly limits: Record<string, number>) {}
  take(connector: string, units = 1) {
    const used = this.used.get(connector) ?? 0;
    const limit = this.limits[connector] ?? 0;
    if (units < 1 || used + units > limit) return false;
    this.used.set(connector, used + units);
    return true;
  }
  snapshot() {
    return Object.fromEntries(
      Object.entries(this.limits).map(([connector, limit]) => [
        connector,
        { used: this.used.get(connector) ?? 0, limit },
      ]),
    );
  }
}

function orGroup(terms: readonly string[]) {
  return `(${terms
    .slice(0, 10)
    .map((term) => (term.includes(" ") ? `"${term}"` : term))
    .join(" OR ")})`;
}
export function buildGdeltQueryFamilies(input: {
  stateBatch: readonly string[];
  weakCoverageStates: readonly string[];
}) {
  const english = getReviewedTerms("English");
  const eventGroup = orGroup(english);
  const updates = orGroup(updateTerms);
  const national = `${eventGroup} India NEAR(12,${eventGroup},India) REPEAT(2,${eventGroup})`;
  const states = input.stateBatch
    .slice(0, 8)
    .map((state) => `${eventGroup} "${state}" NEAR(15,${eventGroup},"${state}")`);
  const weakCoverage = input.weakCoverageStates
    .slice(0, 5)
    .map((state) => `${eventGroup} "${state}" India`);
  const ongoing = reviewedEventsPreview
    .filter((event) => event.publicationStatus === "published" && event.eventStatus === "Ongoing")
    .slice(0, 25)
    .map((event) => `"${event.title}" (${updates} OR video OR photo)`);
  return { national: [national], states, weakCoverage, ongoing };
}

export function rotatingCoverageBatch<T>(values: readonly T[], dayNumber: number, size: number) {
  if (!values.length || size < 1) return [];
  return Array.from(
    { length: Math.min(size, values.length) },
    (_, index) => values[(dayNumber * size + index) % values.length]!,
  );
}
