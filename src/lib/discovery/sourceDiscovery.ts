import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerEnvironment } from "@/lib/env";
import { fetchApprovedSource } from "./fetchSafety";
import { getPrivateLeadDiscoveryInputs } from "./leadInputs";
import { buildManualGdeltDryRunQueries, QueryBudget } from "./queryStrategy";
import {
  fetchBlueskyCandidates,
  fetchGdeltCandidates,
  fetchSitemapCandidates,
  fetchYoutubeCandidates,
  parseFeed,
} from "./connectors/freeConnectors";
import { getReviewedRecentPageAdapter } from "./connectors/recentPageAdapters";
import type { SafeFetchedSource } from "./types";

export type ScannerSource = {
  id: string;
  name: string;
  scan_url: string;
  scan_method: string;
  state: string | null;
  compliance_registry_id: string | null;
  last_etag: string | null;
  last_modified_header: string | null;
  connector_config: Record<string, unknown>;
  daily_request_limit: number;
};
type DiscoveryResult = {
  items: SafeFetchedSource[];
  etag: string | null;
  lastModified: string | null;
  requestCount: number;
};
const virtualItem = (
  url: string,
  title: string | null,
  discoveryMetadata?: SafeFetchedSource["discoveryMetadata"],
): SafeFetchedSource => ({
  finalUrl: url,
  contentType: "text/plain",
  body: title ?? new URL(url).pathname.replaceAll("/", " "),
  bytesRead: 0,
  etag: null,
  lastModified: null,
  notModified: false,
  discoveryMetadata,
});
const configString = (source: ScannerSource, key: string) =>
  typeof source.connector_config[key] === "string" ? String(source.connector_config[key]) : null;

export async function discoverSourceItems(input: {
  source: ScannerSource;
  supabase: SupabaseClient;
  budget: QueryBudget;
  maximumItems?: number;
}): Promise<DiscoveryResult> {
  const { source } = input;
  const maximumItems = Math.max(0, input.maximumItems ?? Number.MAX_SAFE_INTEGER);
  if (["rss", "atom"].includes(source.scan_method)) {
    const response = await fetchApprovedSource(source.scan_url, {
      etag: source.last_etag,
      lastModified: source.last_modified_header,
    });
    if (response.notModified)
      return {
        items: [],
        etag: response.etag,
        lastModified: response.lastModified,
        requestCount: 1,
      };
    return {
      items: parseFeed(response.body, response.finalUrl)
        .slice(0, Math.min(source.daily_request_limit * 50, maximumItems))
        .map((item) => virtualItem(item.url, item.title)),
      etag: response.etag,
      lastModified: response.lastModified,
      requestCount: 1,
    };
  }
  if (source.scan_method === "sitemap") {
    const items = await fetchSitemapCandidates({
      url: source.scan_url,
      modifiedAfter: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      maximumChildSitemaps: Math.min(source.daily_request_limit - 1, 8),
    });
    return {
      items: items.slice(0, maximumItems).map((item) => virtualItem(item.url, item.title)),
      etag: null,
      lastModified: null,
      requestCount: Math.min(source.daily_request_limit, 9),
    };
  }
  if (source.scan_method === "html_list") {
    const adapter = getReviewedRecentPageAdapter(configString(source, "adapterId") ?? "");
    if (!adapter) throw new Error("reviewed_source_adapter_required");
    const response = await fetchApprovedSource(source.scan_url, {
      etag: source.last_etag,
      lastModified: source.last_modified_header,
    });
    return {
      items: adapter
        .parse(response.body, response.finalUrl)
        .slice(0, maximumItems)
        .map((item) => virtualItem(item.url, item.title)),
      etag: response.etag,
      lastModified: response.lastModified,
      requestCount: 1,
    };
  }
  if (source.scan_method === "gdelt") {
    const plannedQueries =
      configString(source, "queryMode") === "manual_civic_metadata"
        ? buildManualGdeltDryRunQueries()
        : [
            {
              query: configString(source, "query") ?? "",
              stateHint: source.state,
              languageHint: null,
              family: "national" as const,
            },
          ];
    if (!plannedQueries[0]?.query) throw new Error("gdelt_query_required");
    const items: SafeFetchedSource[] = [];
    const seen = new Set<string>();
    let requestCount = 0;
    for (const [queryIndex, planned] of plannedQueries.entries()) {
      if (items.length >= maximumItems) break;
      if (!input.budget.take("gdelt")) break;
      requestCount += 1;
      const results = await fetchGdeltCandidates({
        query: planned.query,
        domain: configString(source, "domain") ?? undefined,
        minutes: 2880,
        maxRecords: Math.min(20, maximumItems - items.length),
      });
      for (const item of results) {
        if (items.length >= maximumItems || seen.has(item.url)) continue;
        seen.add(item.url);
        items.push(
          virtualItem(item.url, item.title, {
            publisher: item.publisher,
            publishedAt: item.publishedAt,
            detectedLanguage: item.language ?? planned.languageHint,
            stateHint: planned.stateHint,
            queryFamily: planned.family,
            queryIndex,
            metadataOnly: true,
          }),
        );
      }
    }
    return {
      items,
      etag: null,
      lastModified: null,
      requestCount,
    };
  }
  if (source.scan_method === "youtube_api") {
    if (!input.budget.take("youtube")) throw new Error("youtube_daily_quota_reached");
    const key = getServerEnvironment().YOUTUBE_API_KEY;
    if (!key) throw new Error("youtube_credentials_required");
    const query = configString(source, "query");
    if (!query) throw new Error("youtube_query_required");
    const items = await fetchYoutubeCandidates({
      apiKey: key,
      query,
      publishedAfter: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      relevanceLanguage: configString(source, "relevanceLanguage") ?? "en",
    });
    return {
      items: items.slice(0, maximumItems).map((item) => virtualItem(item.url, item.title)),
      etag: null,
      lastModified: null,
      requestCount: 1,
    };
  }
  if (source.scan_method === "bluesky_api") {
    if (!input.budget.take("bluesky")) throw new Error("bluesky_daily_quota_reached");
    const query = configString(source, "query");
    if (!query) throw new Error("bluesky_query_required");
    const items = await fetchBlueskyCandidates({ query });
    return {
      items: items.slice(0, maximumItems).map((item) => virtualItem(item.url, item.title)),
      etag: null,
      lastModified: null,
      requestCount: 1,
    };
  }
  if (source.scan_method === "lead_submission") {
    const leads = await getPrivateLeadDiscoveryInputs(input.supabase);
    return {
      items: leads
        .slice(0, maximumItems)
        .map((lead) =>
          virtualItem(
            `https://india-observed.invalid/private-lead/${lead.id}`,
            `${lead.title} ${lead.description} ${lead.location}`,
          ),
        ),
      etag: null,
      lastModified: null,
      requestCount: 0,
    };
  }
  if (source.scan_method === "telegram_tdlib") throw new Error("telegram_connector_disabled");
  throw new Error("connector_unavailable");
}
