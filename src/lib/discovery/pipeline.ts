import "server-only";
import { createHash } from "node:crypto";
import { classifyDiscoveredItem } from "./classification";
import { extractSafeText } from "./fetchSafety";
import { detectLanguage } from "./language";
import {
  detectSafetyFlags,
  limitSupportingPassage,
  redactUnnecessaryContactDetails,
} from "./privacy";
import type { SafeFetchedSource } from "./types";

export const pipelineStages = [
  "fetch",
  "normalize",
  "language-detect",
  "translate-if-configured",
  "canonicalize",
  "deduplicate",
  "extract-entities",
  "resolve-geography",
  "classify",
  "match-event",
  "extract-fields",
  "corroborate",
  "match-media",
  "score-confidence",
  "create-candidate",
] as const;

function canonicalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()])
    if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  return url.toString();
}

export function processFetchedSource(source: SafeFetchedSource) {
  const originalText = redactUnnecessaryContactDetails(extractSafeText(source.body));
  const language = detectLanguage(originalText);
  const canonicalUrl = canonicalizeUrl(source.finalUrl);
  const title = originalText.slice(0, 240) || canonicalUrl;
  const fingerprint = createHash("sha256")
    .update(`${canonicalUrl}\n${originalText.slice(0, 50_000)}`)
    .digest("hex");
  return {
    canonicalUrl,
    title,
    originalText,
    supportingPassage: limitSupportingPassage(originalText),
    translatedText: null,
    originalLanguage: language.language,
    languageConfidence: language.confidence,
    fingerprint,
    safetyFlags: detectSafetyFlags(originalText),
    classification: classifyDiscoveredItem({ title, text: originalText, sourceUrl: canonicalUrl }),
    pipelineTrace: pipelineStages,
  };
}

export function countIndependentSources(
  sources: Array<{
    ownershipGroup?: string | null;
    independenceKey?: string | null;
    canonicalUrl: string;
  }>,
) {
  return new Set(
    sources.map(
      (source) =>
        source.independenceKey ?? source.ownershipGroup ?? new URL(source.canonicalUrl).hostname,
    ),
  ).size;
}

export function corroborationStatus(input: {
  independentCount: number;
  hasOfficialSource: boolean;
  hasConflict: boolean;
  totalSources: number;
}) {
  if (input.hasConflict) return "conflicting_sources";
  if (input.hasOfficialSource) return "official_source_supported";
  if (input.independentCount >= 2) return "multiple_independent_sources";
  if (input.totalSources > 1) return "syndicated_only";
  return "one_source_uncorroborated";
}
