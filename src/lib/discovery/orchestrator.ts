import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processFetchedSource } from "./pipeline";
import { createEventClusterKey, representsSameEvent } from "./clustering";
import { QueryBudget } from "./queryStrategy";
import { discoverSourceItems, enrichSourceItem, type ScannerSource } from "./sourceDiscovery";
import { SafeSourceFetchError } from "./fetchSafety";
import { isCredibleEventCandidate, rankPreliminaryReviewItems } from "./ranking";
import type { SafeFetchedSource } from "./types";

export const manualDryRunLimits = {
  maximumSources: 20,
  maximumItemsPerSource: 20,
  maximumFetchedItems: 300,
  maximumCandidates: 100,
  maximumGdeltSearches: 60,
  maximumYoutubeSearches: 50,
  maximumBlueskyRequests: 100,
} as const;

export const pibRssDryRunLimits = {
  maximumSources: 1,
  maximumItemsPerSource: 20,
  maximumFetchedItems: 20,
  maximumCandidates: 15,
  timeWindowHours: 72,
} as const;

export const dailyScannerLimits = {
  maximumSources: 30,
  maximumItemsPerSource: 50,
  maximumFetchedItems: 800,
  maximumIndiaGatedItems: 300,
  maximumPreliminaryCivicMatches: 120,
  maximumEnrichments: 40,
  maximumStoredItems: 150,
  maximumCandidates: 60,
  maximumRuntimeMs: 500_000,
  timeWindowHours: 96,
} as const;

function safeError(error: unknown, source: ScannerSource) {
  const code =
    error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)
      ? "source_timeout"
      : error instanceof Error
        ? error.message
        : "discovery_error";
  const gdeltSummaries: Record<string, string> = {
    source_http_400: "GDELT rejected the query syntax. No items were stored.",
    source_http_403: "GDELT refused the request. No items were stored.",
    source_http_429: "GDELT returned HTTP 429 (rate limited). No items were stored.",
    source_http_500: "GDELT returned a server error. No items were stored.",
    source_http_502: "GDELT returned a server error. No items were stored.",
    source_http_503: "GDELT returned a server error. No items were stored.",
    source_http_504: "GDELT returned a server error. No items were stored.",
    source_content_type: "GDELT returned an unexpected response type. No items were stored.",
    gdelt_response_parsing_failed: "The GDELT response could not be parsed. No items were stored.",
    gdelt_response_validation_failed:
      "The GDELT response did not match the expected metadata shape. No items were stored.",
    source_timeout: "The GDELT request timed out. No items were stored.",
  };
  const retryAfterMs =
    error instanceof SafeSourceFetchError && error.diagnostics.statusCode === 429
      ? Math.max(error.diagnostics.retryAfterMs ?? 60_000, 60_000)
      : null;
  return {
    code: code.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80),
    summary:
      source.scan_method === "gdelt" && gdeltSummaries[code]
        ? gdeltSummaries[code]
        : "Source scan failed without stopping the remaining run.",
    cooldownUntil: retryAfterMs ? new Date(Date.now() + retryAfterMs).toISOString() : null,
  };
}

const fallbackSourcePriority: Record<string, number> = {
  rss: 0,
  atom: 0,
  sitemap: 1,
  html_list: 2,
  youtube_api: 3,
  bluesky_api: 4,
};

async function persistCandidate(input: {
  supabase: SupabaseClient;
  runId: string;
  source: ScannerSource;
  fetched: SafeFetchedSource;
  processed?: ReturnType<typeof processFetchedSource>;
}) {
  const processed = input.processed ?? processFetchedSource(input.fetched);
  const manualReview =
    processed.safetyFlags.possibleChild ||
    processed.safetyFlags.possibleVictimOrWitness ||
    processed.safetyFlags.liveTacticalLocation ||
    processed.safetyFlags.reputationalRisk;
  const normalizedTitleFingerprint = createHash("sha256")
    .update(
      processed.title
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim(),
    )
    .digest("hex");
  const { data: exactDuplicate } = await input.supabase
    .from("discovered_items")
    .select("id")
    .eq("content_fingerprint", processed.fingerprint)
    .maybeSingle();
  const { data: canonicalDuplicate } = exactDuplicate
    ? { data: null }
    : await input.supabase
        .from("discovered_items")
        .select("id")
        .eq("canonical_url", processed.canonicalUrl)
        .limit(1)
        .maybeSingle();
  const { data: titleDuplicate } =
    exactDuplicate || canonicalDuplicate
      ? { data: null }
      : await input.supabase
          .from("discovered_items")
          .select("id")
          .eq("normalized_title_fingerprint", normalizedTitleFingerprint)
          .limit(1)
          .maybeSingle();
  const publisher = input.fetched.discoveryMetadata?.publisher ?? input.source.name;
  const publishedAt = input.fetched.discoveryMetadata?.publishedAt ?? null;
  const { data: recentItems } =
    exactDuplicate || canonicalDuplicate || titleDuplicate
      ? { data: null }
      : await input.supabase
          .from("discovered_items")
          .select("id,title,published_at,source_metadata")
          .order("created_at", { ascending: false })
          .limit(100);
  const publisherTimeDuplicate = (recentItems ?? []).find((item) => {
    const metadata = item.source_metadata as { publisher?: string } | null;
    return metadata?.publisher === publisher && item.published_at === publishedAt;
  });
  const currentClusterSignals = {
    title: processed.title,
    canonicalUrl: processed.canonicalUrl,
    state: processed.classification.state,
    district: processed.classification.districtOrRegion,
    eventDate: processed.classification.eventDate ?? publishedAt,
    actionType: processed.classification.actionType,
    affectedGroup: processed.classification.affectedGroup,
    demand: processed.classification.demand,
  };
  const syndicatedDuplicate = (recentItems ?? []).find((item) => {
    const metadata = item.source_metadata as Record<string, unknown> | null;
    return representsSameEvent(currentClusterSignals, {
      title: item.title,
      canonicalUrl: String(metadata?.canonicalUrl ?? ""),
      state: typeof metadata?.stateHint === "string" ? metadata.stateHint : null,
      district: typeof metadata?.districtOrRegion === "string" ? metadata.districtOrRegion : null,
      eventDate:
        typeof metadata?.eventDate === "string" ? metadata.eventDate : (item.published_at ?? null),
      actionType: typeof metadata?.actionType === "string" ? metadata.actionType : null,
      affectedGroup: typeof metadata?.affectedGroup === "string" ? metadata.affectedGroup : null,
      demand: typeof metadata?.demand === "string" ? metadata.demand : null,
    });
  });
  const duplicate =
    exactDuplicate ??
    canonicalDuplicate ??
    titleDuplicate ??
    publisherTimeDuplicate ??
    syndicatedDuplicate;
  if (duplicate) {
    const { error } = await input.supabase.from("discovery_duplicate_observations").upsert(
      {
        scan_run_id: input.runId,
        source_id: input.source.id,
        existing_item_id: duplicate.id,
        observed_url: processed.canonicalUrl,
        grouping_reason: exactDuplicate
          ? "content_hash"
          : canonicalDuplicate
            ? "canonical_url"
            : titleDuplicate
              ? "normalized_title"
              : publisherTimeDuplicate
                ? "source_family"
                : "syndicated_copy",
      },
      { onConflict: "scan_run_id,observed_url", ignoreDuplicates: true },
    );
    if (error) throw new Error("duplicate_observation_write_failed");
    const { data: clusteredCandidate } = await input.supabase
      .from("editorial_candidates")
      .select("id")
      .eq("discovered_item_id", duplicate.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (clusteredCandidate?.id) {
      const { error: clusteredSourceError } = await input.supabase.from("candidate_sources").upsert(
        {
          candidate_id: clusteredCandidate.id,
          source_url: input.fetched.finalUrl,
          canonical_url: processed.canonicalUrl,
          publisher,
          headline: processed.title,
          published_at: publishedAt,
          reliability_tier: input.source.reliability_tier,
          evidence_summary: input.fetched.discoveryMetadata?.feedSummary ?? null,
          original_language: processed.originalLanguage,
          original_supporting_passage: null,
          translated_supporting_passage: null,
          source_family: new URL(processed.canonicalUrl).hostname,
          ownership_group: null,
          independence_key: new URL(processed.canonicalUrl).hostname,
          source_relationship:
            input.source.reliability_tier === "primary" ? "official" : "independent",
          content_fingerprint: processed.fingerprint,
        },
        { onConflict: "candidate_id,canonical_url", ignoreDuplicates: true },
      );
      if (clusteredSourceError) throw new Error("candidate_cluster_source_write_failed");
      const { data: clusterSources } = await input.supabase
        .from("candidate_sources")
        .select("independence_key")
        .eq("candidate_id", clusteredCandidate.id);
      const independentCount = new Set(
        (clusterSources ?? []).map((source) => source.independence_key),
      ).size;
      await input.supabase
        .from("editorial_candidates")
        .update({
          independent_source_count: independentCount,
          corroboration_status:
            independentCount >= 2 ? "multiple_independent_sources" : "syndicated_only",
        })
        .eq("id", clusteredCandidate.id);
    }
    return { stored: false, eventCandidate: false, clustered: Boolean(clusteredCandidate?.id) };
  }
  const { data: item, error: itemError } = await input.supabase
    .from("discovered_items")
    .upsert(
      {
        source_id: input.source.id,
        first_scan_run_id: input.runId,
        source_url: input.fetched.finalUrl,
        canonical_url: processed.canonicalUrl,
        title: processed.title,
        original_language: processed.originalLanguage,
        original_text: input.fetched.discoveryMetadata?.metadataOnly
          ? null
          : processed.originalText.slice(0, 32000),
        published_at: input.fetched.discoveryMetadata?.publishedAt ?? null,
        translated_text: null,
        language_confidence: processed.languageConfidence,
        source_metadata: {
          bytesRead: input.fetched.bytesRead,
          safetyFlags: processed.safetyFlags,
          pipelineTrace: processed.pipelineTrace,
          publisher: input.fetched.discoveryMetadata?.publisher ?? input.source.name,
          feedDetectedLanguage: input.fetched.discoveryMetadata?.detectedLanguage ?? null,
          stateHint: input.fetched.discoveryMetadata?.stateHint ?? null,
          queryFamily: input.fetched.discoveryMetadata?.queryFamily ?? null,
          queryIndex: input.fetched.discoveryMetadata?.queryIndex ?? null,
          collectionBoundary: input.fetched.discoveryMetadata?.metadataOnly
            ? "metadata_and_canonical_link_only"
            : "approved_source",
          feedSummary: input.fetched.discoveryMetadata?.feedSummary ?? null,
          connector: input.fetched.discoveryMetadata?.connector ?? input.source.scan_method,
          sourceId: input.source.id,
          collectedAt: new Date().toISOString(),
          suggestedEventId: processed.classification.targetEventInternalId,
          matchingSignals: processed.classification.matchingSignals,
          conflictingSignals: processed.classification.conflictingSignals,
          sourceIsNewerThanEvent: processed.classification.sourceIsNewerThanEvent,
          classificationReason: processed.classification.reason,
          actionType: processed.classification.actionType,
          districtOrRegion: processed.classification.districtOrRegion,
          eventDate: processed.classification.eventDate,
          plannedDate: processed.classification.plannedDate,
          affectedGroup: processed.classification.affectedGroup,
          demand: processed.classification.demand,
          authorityResponse: processed.classification.authorityResponse,
          dictionaryMatches: processed.classification.dictionaryMatches,
          detectedLanguage: processed.classification.detectedLanguage,
          civicRelevanceScore: processed.classification.civicRelevanceScore,
          canonicalUrl: processed.canonicalUrl,
          clusterKey: createEventClusterKey(currentClusterSignals),
          enrichedExcerpt: input.fetched.discoveryMetadata?.enrichedExcerpt ?? null,
          enrichmentFetchedAt: input.fetched.discoveryMetadata?.enrichmentFetchedAt ?? null,
        },
        content_fingerprint: processed.fingerprint,
        normalized_title_fingerprint: normalizedTitleFingerprint,
        pipeline_stage: "candidate_created",
        processing_status: manualReview ? "manual_review" : "classified",
      },
      { onConflict: "content_fingerprint", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (itemError) throw new Error("discovered_item_write_failed");
  if (!item) return { stored: false, eventCandidate: false, clustered: false };
  const classification = processed.classification;
  const candidateType =
    classification.candidateType === "media_evidence" &&
    input.source.connector_config.status === "approved_metadata_only"
      ? classification.targetEventSlug
        ? "event_update"
        : "irrelevant"
      : classification.candidateType;
  // Safety flags require human review and elevated priority, but they must not erase a credible
  // event classification. Non-event safety rows remain irrelevant and stay in diagnostics.
  const persistedCandidateType = candidateType;
  const { data: candidate, error: candidateError } = await input.supabase
    .from("editorial_candidates")
    .insert({
      discovered_item_id: item.id,
      candidate_type: persistedCandidateType,
      target_event_slug: classification.targetEventSlug,
      target_event_internal_id: classification.targetEventInternalId,
      suggested_title: processed.title,
      state: classification.state,
      priority:
        processed.safetyFlags.possibleChild || processed.safetyFlags.liveTacticalLocation
          ? "urgent_editor_attention"
          : classification.priority,
      confidence: classification.confidence,
      classification_method: "deterministic",
      extraction_notes: classification.reason,
      matching_signals: classification.matchingSignals,
      conflicting_signals: classification.conflictingSignals,
      source_is_newer_than_event: classification.sourceIsNewerThanEvent,
      action_type: classification.actionType,
      event_date: classification.eventDate,
      planned_date: classification.plannedDate,
      affected_group: classification.affectedGroup,
      demand: classification.demand,
      authority_response: classification.authorityResponse,
      dictionary_matches: classification.dictionaryMatches,
      detected_language: classification.detectedLanguage,
    })
    .select("id")
    .single();
  if (candidateError) throw new Error("candidate_write_failed");
  const { error: candidateSourceError } = await input.supabase.from("candidate_sources").insert({
    candidate_id: candidate.id,
    source_url: input.fetched.finalUrl,
    canonical_url: processed.canonicalUrl,
    publisher,
    headline: processed.title,
    published_at: publishedAt,
    reliability_tier: input.source.reliability_tier,
    evidence_summary: input.fetched.discoveryMetadata?.feedSummary ?? null,
    original_language: processed.originalLanguage,
    original_supporting_passage: null,
    translated_supporting_passage: null,
    source_family: new URL(processed.canonicalUrl).hostname,
    ownership_group: null,
    independence_key: new URL(processed.canonicalUrl).hostname,
    source_relationship: input.source.reliability_tier === "primary" ? "official" : "independent",
    content_fingerprint: processed.fingerprint,
  });
  if (candidateSourceError) throw new Error("candidate_source_write_failed");
  return {
    stored: true,
    clustered: false,
    eventCandidate: isCredibleEventCandidate({
      ...classification,
      candidateType: persistedCandidateType,
    }),
  };
}

export async function runDiscoveryScan(input: {
  supabase: SupabaseClient;
  trigger:
    | "manual"
    | "manual_gdelt_dry_run"
    | "manual_fallback_dry_run"
    | "manual_pib_rss_dry_run"
    | "manual_daily_scanner_dry_run"
    | "scheduled"
    | "retry";
  requestedBy?: string | null;
  scheduledFor?: string | null;
  dryRun?: boolean;
}) {
  const dryRun = input.dryRun ?? true;
  const controlledManualDryRun =
    [
      "manual",
      "manual_gdelt_dry_run",
      "manual_fallback_dry_run",
      "manual_pib_rss_dry_run",
      "manual_daily_scanner_dry_run",
    ].includes(input.trigger) && dryRun;
  const controlledGdeltRun = input.trigger === "manual_gdelt_dry_run" && dryRun;
  const controlledFallbackRun = input.trigger === "manual_fallback_dry_run" && dryRun;
  const controlledPibRssRun = input.trigger === "manual_pib_rss_dry_run" && dryRun;
  const controlledDailyScannerRun = input.trigger === "manual_daily_scanner_dry_run" && dryRun;
  const scheduledRun = input.trigger === "scheduled";
  const activeLimits = controlledPibRssRun
    ? pibRssDryRunLimits
    : controlledDailyScannerRun || scheduledRun
      ? dailyScannerLimits
      : manualDryRunLimits;
  const day = input.scheduledFor ?? new Date().toISOString().slice(0, 10);
  const idempotencyKey = `${input.trigger}:${day}:discovery-v4`;
  const { data: runId, error: startError } = controlledGdeltRun
    ? await input.supabase.rpc("claim_manual_gdelt_dry_run", {
        p_idempotency_key: idempotencyKey,
      })
    : controlledFallbackRun
      ? await input.supabase.rpc("claim_manual_fallback_dry_run", {
          p_idempotency_key: idempotencyKey,
        })
      : controlledPibRssRun
        ? await input.supabase.rpc("claim_manual_pib_rss_dry_run", {
            p_idempotency_key: idempotencyKey,
          })
        : controlledDailyScannerRun
          ? await input.supabase.rpc("claim_manual_daily_scanner_dry_run", {
              p_idempotency_key: idempotencyKey,
            })
          : await input.supabase.rpc("start_scan_run", {
              p_trigger_type: input.trigger,
              p_idempotency_key: idempotencyKey,
              p_scheduled_for: input.scheduledFor ?? null,
              p_dry_run: dryRun,
            });
  if (startError) {
    if (startError.message.includes("dry_scan_already_running"))
      throw new Error("dry_scan_already_running");
    if (startError.message.includes("dry_scan_already_used"))
      throw new Error("dry_scan_already_used");
    throw new Error("scan_run_start_failed");
  }
  if (!runId) throw new Error("scan_run_start_failed");
  let sourceQuery = input.supabase
    .from("scan_sources")
    .select(
      "id,name,base_url,scan_url,scan_method,scan_frequency,state,reliability_tier,failure_count,compliance_registry_id,last_etag,last_modified_header,connector_config,daily_request_limit,manual_dry_run_only,manual_run_consumed_at,cooldown_until,compliance_registry!inner(production_enabled,legal_review_status,review_expires_at)",
    )
    .eq("compliance_registry.production_enabled", true)
    .order("name");
  sourceQuery = controlledGdeltRun
    ? sourceQuery
        .eq("enabled", false)
        .eq("manual_dry_run_only", true)
        .eq("scan_method", "gdelt")
        .is("manual_run_consumed_at", null)
        .eq("compliance_registry.legal_review_status", "approved_for_controlled_metadata_dry_run")
    : controlledPibRssRun
      ? sourceQuery
          .eq("name", "Press Information Bureau RSS")
          .eq("enabled", false)
          .eq("manual_dry_run_only", true)
          .eq("scan_method", "rss")
          .is("manual_run_consumed_at", null)
          .eq("compliance_registry.legal_review_status", "approved_for_controlled_metadata_dry_run")
      : sourceQuery.eq("enabled", true);
  if (controlledFallbackRun) sourceQuery = sourceQuery.neq("scan_method", "gdelt");
  if (controlledDailyScannerRun || scheduledRun)
    sourceQuery = sourceQuery.eq("scan_frequency", "daily");
  const { data, error } = await sourceQuery;
  if (error) throw new Error("scan_source_query_failed");
  const eligibleSources = ((data ?? []) as unknown as ScannerSource[])
    .filter(
      (source) => !source.cooldown_until || new Date(source.cooldown_until).getTime() <= Date.now(),
    )
    .sort(
      (left, right) =>
        (fallbackSourcePriority[left.scan_method] ?? 99) -
          (fallbackSourcePriority[right.scan_method] ?? 99) || left.name.localeCompare(right.name),
    );
  const sources =
    controlledManualDryRun || scheduledRun
      ? eligibleSources.slice(0, activeLimits.maximumSources)
      : eligibleSources;
  if ((controlledDailyScannerRun || scheduledRun) && sources.length === 0) {
    await input.supabase
      .from("scan_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_summary: "no_approved_source",
      })
      .eq("id", runId);
    throw new Error("no_approved_source");
  }
  const budget = new QueryBudget({
    gdelt:
      controlledFallbackRun || controlledPibRssRun
        ? 0
        : controlledManualDryRun
          ? manualDryRunLimits.maximumGdeltSearches
          : 60,
    youtube: controlledFallbackRun ? manualDryRunLimits.maximumYoutubeSearches : 0,
    bluesky: controlledFallbackRun ? manualDryRunLimits.maximumBlueskyRequests : 0,
  });
  let successes = 0;
  let failures = 0;
  let candidates = 0;
  let itemsFetched = 0;
  let itemsRetained = 0;
  let itemsPassingIndiaGate = 0;
  let itemsPassingPreliminaryCivicFilter = 0;
  let processingFailures = 0;
  let enrichmentFetches = 0;
  let enrichmentAttempts = 0;
  let enrichmentFailures = 0;
  const enrichmentDiagnostics: Record<
    string,
    { attempts: number; successes: number; failures: number }
  > = {};
  let candidateClusters = 0;
  const deadline =
    Date.now() +
    (controlledDailyScannerRun || scheduledRun ? dailyScannerLimits.maximumRuntimeMs : 10 * 60_000);
  const safeFailureSummaries: string[] = [];
  const connectorResults: Record<
    string,
    { sources: number; successes: number; failures: number; items: number; candidates: number }
  > = {};
  let limitReached:
    "fetched_item_limit" | "stored_item_limit" | "candidate_limit" | "runtime_limit" | null = null;
  const fetchedForRanking: Array<{
    source: ScannerSource;
    fetched: SafeFetchedSource;
    processed: ReturnType<typeof processFetchedSource>;
  }> = [];
  const sourceJobs = new Map<string, string>();
  const sourceStoredCounts = new Map<string, number>();
  await input.supabase
    .from("scan_runs")
    .update({ status: "running", source_count: sources.length })
    .eq("id", runId);

  for (const source of sources) {
    if (Date.now() >= deadline) {
      limitReached = "runtime_limit";
      break;
    }
    const connector = (connectorResults[source.scan_method] ??= {
      sources: 0,
      successes: 0,
      failures: 0,
      items: 0,
      candidates: 0,
    });
    connector.sources += 1;
    const boundedRun = controlledManualDryRun || scheduledRun;
    const { data: job } = await input.supabase
      .from("scan_jobs")
      .update({ status: "running", attempt_count: 1, started_at: new Date().toISOString() })
      .eq("scan_run_id", runId)
      .eq("source_id", source.id)
      .select("id")
      .single();
    if (job?.id) sourceJobs.set(source.id, job.id);
    try {
      const perSourceMaximum = boundedRun
        ? Math.min(
            activeLimits.maximumItemsPerSource,
            Math.max(1, Math.floor(activeLimits.maximumFetchedItems / Math.max(sources.length, 1))),
          )
        : undefined;
      const discovered = await discoverSourceItems({
        source,
        supabase: input.supabase,
        budget,
        maximumItems: perSourceMaximum,
      });
      itemsFetched += discovered.items.length;
      connector.items += discovered.items.length;
      for (const fetched of discovered.items) {
        fetchedForRanking.push({ source, fetched, processed: processFetchedSource(fetched) });
      }
      successes += 1;
      connector.successes += 1;
      await input.supabase
        .from("scan_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_discovered: 0,
          request_count: discovered.requestCount,
        })
        .eq("id", job?.id);
      await input.supabase
        .from("scan_sources")
        .update({
          last_attempted_scan: new Date().toISOString(),
          last_successful_scan: new Date().toISOString(),
          failure_count: 0,
          last_error_code: null,
          last_error_summary: null,
          last_etag: discovered.etag,
          last_modified_header: discovered.lastModified,
          last_http_status: discovered.statusCode,
          last_content_type: discovered.contentType,
          last_item_count: discovered.items.length,
        })
        .eq("id", source.id);
    } catch (error) {
      failures += 1;
      connector.failures += 1;
      const safe = safeError(error, source);
      const failureCount = source.failure_count + 1;
      const cooldownUntil =
        safe.cooldownUntil ??
        (failureCount >= 3 ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null);
      safeFailureSummaries.push(safe.summary);
      await input.supabase
        .from("scan_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_code: safe.code,
          safe_error_summary: safe.summary,
        })
        .eq("id", job?.id);
      await input.supabase
        .from("scan_sources")
        .update({
          last_attempted_scan: new Date().toISOString(),
          last_error_code: safe.code,
          last_error_summary: safe.summary,
          failure_count: failureCount,
          last_http_status: safe.code.match(/^source_http_(\d{3})$/)?.[1]
            ? Number(safe.code.slice(-3))
            : null,
          ...(failureCount >= 3 ? { enabled: false, scan_frequency: "manual" } : {}),
          ...(cooldownUntil ? { cooldown_until: cooldownUntil } : {}),
        })
        .eq("id", source.id);
    }
  }
  const initiallyRankedItems = rankPreliminaryReviewItems(
    fetchedForRanking.map((item) => ({
      value: item,
      classification: item.processed.classification,
      publishedAt: item.fetched.discoveryMetadata?.publishedAt ?? null,
    })),
  );
  const boundedItems: typeof initiallyRankedItems = [];
  let gatedCount = 0;
  let preliminaryCount = 0;
  for (const item of initiallyRankedItems) {
    if (item.indiaGatePassed) {
      if (gatedCount >= dailyScannerLimits.maximumIndiaGatedItems) continue;
      gatedCount += 1;
    }
    if (item.preliminaryCivicPassed) {
      if (preliminaryCount >= dailyScannerLimits.maximumPreliminaryCivicMatches) continue;
      preliminaryCount += 1;
    }
    boundedItems.push(item);
  }
  const enrichmentDomainCounts = new Map<string, number>();
  const enrichmentRobotsDecisions = new Map<string, boolean>();
  for (const ranked of boundedItems) {
    if (
      !ranked.preliminaryCivicPassed ||
      enrichmentFetches >= dailyScannerLimits.maximumEnrichments ||
      Date.now() >= deadline
    )
      continue;
    const enrichmentDomain = new URL(ranked.value.fetched.finalUrl).hostname;
    const domainDiagnostics = (enrichmentDiagnostics[enrichmentDomain] ??= {
      attempts: 0,
      successes: 0,
      failures: 0,
    });
    try {
      const enriched = await enrichSourceItem({
        source: ranked.value.source,
        item: ranked.value.fetched,
        domainRequestCounts: enrichmentDomainCounts,
        robotsDecisions: enrichmentRobotsDecisions,
      });
      if (enriched.fetched) {
        enrichmentAttempts += 1;
        enrichmentFetches += 1;
        domainDiagnostics.attempts += 1;
        domainDiagnostics.successes += 1;
      }
      ranked.value.fetched = enriched.item;
      ranked.value.processed = processFetchedSource(enriched.item);
    } catch {
      enrichmentAttempts += 1;
      enrichmentFailures += 1;
      domainDiagnostics.attempts += 1;
      domainDiagnostics.failures += 1;
      processingFailures += 1;
    }
  }
  const rankedItems = rankPreliminaryReviewItems(
    boundedItems.map((item) => ({
      value: item.value,
      classification: item.value.processed.classification,
      publishedAt: item.publishedAt,
    })),
  );
  itemsPassingIndiaGate = Math.min(
    rankedItems.filter((item) => item.indiaGatePassed).length,
    dailyScannerLimits.maximumIndiaGatedItems,
  );
  itemsPassingPreliminaryCivicFilter = Math.min(
    rankedItems.filter((item) => item.preliminaryCivicPassed).length,
    dailyScannerLimits.maximumPreliminaryCivicMatches,
  );
  let candidateLimitSkipped = 0;
  const storedLimit =
    "maximumStoredItems" in activeLimits
      ? activeLimits.maximumStoredItems
      : activeLimits.maximumCandidates;
  for (const ranked of rankedItems) {
    if (Date.now() >= deadline) {
      limitReached = "runtime_limit";
      break;
    }
    if (itemsRetained >= storedLimit) {
      limitReached = "stored_item_limit";
      break;
    }
    if (ranked.preliminaryCivicPassed && candidates >= activeLimits.maximumCandidates) {
      candidateLimitSkipped += 1;
      continue;
    }
    const { source, fetched, processed } = ranked.value;
    let persisted: Awaited<ReturnType<typeof persistCandidate>>;
    try {
      persisted = await persistCandidate({
        supabase: input.supabase,
        runId,
        source,
        fetched,
        processed,
      });
    } catch {
      processingFailures += 1;
      continue;
    }
    if (!persisted) continue;
    if (persisted.clustered) candidateClusters += 1;
    if (!persisted.stored) continue;
    itemsRetained += 1;
    sourceStoredCounts.set(source.id, (sourceStoredCounts.get(source.id) ?? 0) + 1);
    if (persisted.eventCandidate) {
      candidates += 1;
      connectorResults[source.scan_method]!.candidates += 1;
    }
  }
  if (!limitReached && candidateLimitSkipped) limitReached = "candidate_limit";
  for (const source of sources) {
    const jobId = sourceJobs.get(source.id);
    if (!jobId) continue;
    await input.supabase
      .from("scan_jobs")
      .update({ items_discovered: sourceStoredCounts.get(source.id) ?? 0 })
      .eq("id", jobId)
      .eq("status", "completed");
  }
  if (controlledManualDryRun && eligibleSources.length > sources.length)
    await input.supabase
      .from("scan_jobs")
      .update({ status: "skipped", completed_at: new Date().toISOString() })
      .eq("scan_run_id", runId)
      .eq("status", "queued");
  if (limitReached)
    await input.supabase
      .from("scan_jobs")
      .update({ status: "skipped", completed_at: new Date().toISOString() })
      .eq("scan_run_id", runId)
      .eq("status", "queued");
  const status: "completed" | "incomplete" | "failed" =
    limitReached || (controlledManualDryRun && eligibleSources.length > sources.length)
      ? "incomplete"
      : failures && !successes
        ? "failed"
        : failures || processingFailures
          ? "incomplete"
          : "completed";
  const { count: duplicateCount } = await input.supabase
    .from("discovery_duplicate_observations")
    .select("id", { count: "exact", head: true })
    .eq("scan_run_id", runId);
  const { data: candidateCounts } = await input.supabase
    .from("editorial_candidates")
    .select("candidate_type,discovered_items!inner(first_scan_run_id)")
    .eq("discovered_items.first_scan_run_id", runId);
  const countType = (type: string) =>
    (candidateCounts ?? []).filter((candidate) => candidate.candidate_type === type).length;
  const quotaUsage = {
    ...budget.snapshot(),
    connectorResults,
    controlledManualDryRun,
    itemsFetched,
    itemsPassingIndiaGate,
    itemsPassingPreliminaryCivicFilter,
    processingFailures,
    enrichmentAttempts,
    enrichmentFetches,
    enrichmentFailures,
    enrichmentDiagnostics,
    candidateClusters,
    itemsRetained,
    limits: controlledManualDryRun ? activeLimits : null,
    limitReached,
  };
  await input.supabase
    .from("scan_runs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      success_count: successes,
      failure_count: failures,
      new_event_candidate_count: countType("new_event"),
      update_candidate_count: countType("event_update"),
      official_response_candidate_count: countType("official_response"),
      duplicate_candidate_count: duplicateCount ?? 0,
      quota_usage: quotaUsage,
      error_summary: limitReached,
    })
    .eq("id", runId);
  if ((controlledGdeltRun || controlledPibRssRun) && sources.length)
    await input.supabase
      .from("scan_sources")
      .update({ manual_run_consumed_at: new Date().toISOString() })
      .in(
        "id",
        sources.map((source) => source.id),
      );
  return {
    runId,
    status,
    sourceCount: sources.length,
    successes,
    failures,
    candidates,
    itemsFetched,
    itemsPassingIndiaGate,
    itemsPassingPreliminaryCivicFilter,
    processingFailures,
    enrichmentAttempts,
    enrichmentFetches,
    enrichmentFailures,
    enrichmentDiagnostics,
    candidateClusters,
    queriesUsed: budget.snapshot().gdelt?.used ?? 0,
    youtubeCalls: budget.snapshot().youtube?.used ?? 0,
    blueskyCalls: budget.snapshot().bluesky?.used ?? 0,
    limitReached,
    quotaUsage,
    safeFailureSummary: safeFailureSummaries[0] ?? null,
    connectorResults,
    fingerprint: createHash("sha256").update(idempotencyKey).digest("hex"),
  };
}
