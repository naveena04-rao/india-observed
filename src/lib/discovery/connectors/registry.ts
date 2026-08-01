import "server-only";
import { fetchApprovedSource } from "../fetchSafety";
import type { ConnectorManifest, DiscoveryConnector } from "./types";

const webManifest = (id: string, label: string): ConnectorManifest => ({
  id,
  label,
  status: "available",
  productionEnabled: false,
  quotaOrCost: "No platform fee; publisher rules and infrastructure costs still apply.",
  accessNotes: "Editor-approved public HTTPS endpoint only; legal and robots review is mandatory.",
  geography: "Configured source coverage, including India state and district sources.",
  languages: "Original text retained; 13-language query dictionaries configured.",
  retryPolicy: "Two retries with backoff; source failures are isolated.",
  retainedData: "URL, title, times, brief excerpt, fingerprint and safe error summary.",
});
const gatedManifest = (
  id: string,
  label: string,
  status: "available" | "credential_required" | "unavailable",
  accessNotes: string,
  credential?: string,
): ConnectorManifest => ({
  id,
  label,
  status,
  productionEnabled: false,
  credential,
  quotaOrCost: "Provider-specific quota or commercial terms; not activated by this change.",
  accessNotes,
  geography: "Provider coverage; India relevance requires pipeline review.",
  languages: "Provider-dependent; original language must be retained.",
  retryPolicy: "Provider-aware backoff required before activation.",
  retainedData: "No data retained while disabled.",
});

export const connectorManifests: ConnectorManifest[] = [
  webManifest("rss-atom", "RSS and Atom"),
  webManifest("sitemap", "Approved sitemaps"),
  webManifest("approved-website", "Approved public websites"),
  webManifest("government-notice", "Government and district notices"),
  gatedManifest(
    "gdelt",
    "GDELT",
    "available",
    "Bounded free API adapter is implemented; production awaits legal and coverage review.",
  ),
  gatedManifest(
    "youtube",
    "YouTube Data API",
    "credential_required",
    "Official API and quota approval required.",
    "YOUTUBE_API_KEY",
  ),
  gatedManifest(
    "telegram",
    "Telegram TDLib",
    "credential_required",
    "Approved public channels only; no TDLib session is implemented.",
    "TELEGRAM_API_ID / TELEGRAM_API_HASH",
  ),
  gatedManifest(
    "bluesky",
    "Bluesky",
    "available",
    "Bounded public-search adapter is implemented; production awaits rate, moderation and terms review.",
  ),
  gatedManifest(
    "commercial-news",
    "Commercial news API",
    "credential_required",
    "A licensed provider must be selected.",
    "NEWS_API_KEY",
  ),
  gatedManifest(
    "x",
    "X API",
    "credential_required",
    "Official commercial API and policy approval required.",
    "X_BEARER_TOKEN",
  ),
  gatedManifest(
    "meta",
    "Meta official accounts",
    "credential_required",
    "No general discovery claim; approved official accounts only.",
    "META_ACCESS_TOKEN",
  ),
  gatedManifest(
    "google-fact-check",
    "Google Fact Check Tools API",
    "credential_required",
    "Fact-check search only.",
    "GOOGLE_FACT_CHECK_API_KEY",
  ),
];

export function getAvailableConnector(id: string): DiscoveryConnector | null {
  const manifest = connectorManifests.find((candidate) => candidate.id === id);
  if (!manifest || !["rss-atom", "sitemap", "approved-website", "government-notice"].includes(id))
    return null;
  return {
    manifest,
    fetch: ({ url, etag, lastModified }) => fetchApprovedSource(url, { etag, lastModified }),
  };
}
