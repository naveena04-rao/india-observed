import "server-only";
import type { DiscoveredLink } from "./freeConnectors";

export interface RecentPageAdapter {
  id: string;
  sourceKey: string;
  version: string;
  reviewed: boolean;
  parse(html: string, baseUrl: string): DiscoveredLink[];
}

// Adapters must be source-specific, version-controlled and legally reviewed. The registry is
// intentionally empty in version 1; unrestricted CSS-selector crawling is not provided.
export const recentPageAdapters: readonly RecentPageAdapter[] = [];

export function getReviewedRecentPageAdapter(id: string) {
  return recentPageAdapters.find((adapter) => adapter.id === id && adapter.reviewed) ?? null;
}
