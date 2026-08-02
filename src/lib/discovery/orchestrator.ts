import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processFetchedSource } from "./pipeline";
import { QueryBudget } from "./queryStrategy";
import { discoverSourceItems, type ScannerSource } from "./sourceDiscovery";
import type { SafeFetchedSource } from "./types";

export const manualDryRunLimits = {
  maximumSources: 20,
  maximumItemsPerSource: 20,
  maximumFetchedItems: 300,
  maximumCandidates: 100,
  maximumGdeltSearches: 60,
} as const;

function safeError(error: unknown) {
  const code = error instanceof Error ? error.message : "discovery_error";
  return {
    code: code.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80),
    summary: "Source scan failed without stopping the remaining run.",
  };
}

async function persistCandidate(input: {
  supabase: SupabaseClient;
  runId: string;
  source: ScannerSource;
  fetched: SafeFetchedSource;
}) {
  const processed = processFetchedSource(input.fetched);
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
  const { data: titleDuplicate } = exactDuplicate
    ? { data: null }
    : await input.supabase
        .from("discovered_items")
        .select("id")
        .eq("normalized_title_fingerprint", normalizedTitleFingerprint)
        .limit(1)
        .maybeSingle();
  const duplicate = exactDuplicate ?? titleDuplicate;
  if (duplicate) {
    const { error } = await input.supabase.from("discovery_duplicate_observations").upsert(
      {
        scan_run_id: input.runId,
        source_id: input.source.id,
        existing_item_id: duplicate.id,
        observed_url: processed.canonicalUrl,
        grouping_reason: exactDuplicate ? "content_hash" : "normalized_title",
      },
      { onConflict: "scan_run_id,observed_url", ignoreDuplicates: true },
    );
    if (error) throw new Error("duplicate_observation_write_failed");
    return false;
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
          detectedLanguage: input.fetched.discoveryMetadata?.detectedLanguage ?? null,
          stateHint: input.fetched.discoveryMetadata?.stateHint ?? null,
          queryFamily: input.fetched.discoveryMetadata?.queryFamily ?? null,
          queryIndex: input.fetched.discoveryMetadata?.queryIndex ?? null,
          collectionBoundary: input.fetched.discoveryMetadata?.metadataOnly
            ? "metadata_and_canonical_link_only"
            : "approved_source",
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
  if (!item) return false;
  const classification = processed.classification;
  const { error: candidateError } = await input.supabase.from("editorial_candidates").insert({
    discovered_item_id: item.id,
    candidate_type: manualReview ? "manual_review" : classification.candidateType,
    target_event_slug: classification.targetEventSlug,
    suggested_title: processed.title,
    state: classification.state ?? input.fetched.discoveryMetadata?.stateHint ?? input.source.state,
    priority:
      processed.safetyFlags.possibleChild || processed.safetyFlags.liveTacticalLocation
        ? "urgent_editor_attention"
        : classification.priority,
    confidence: classification.confidence,
    classification_method: "deterministic",
    extraction_notes: classification.reason,
  });
  if (candidateError) throw new Error("candidate_write_failed");
  return true;
}

export async function runDiscoveryScan(input: {
  supabase: SupabaseClient;
  trigger: "manual" | "manual_gdelt_dry_run" | "scheduled" | "retry";
  requestedBy?: string | null;
  scheduledFor?: string | null;
  dryRun?: boolean;
}) {
  const dryRun = input.dryRun ?? true;
  const controlledManualDryRun =
    ["manual", "manual_gdelt_dry_run"].includes(input.trigger) && dryRun;
  const controlledGdeltRun = input.trigger === "manual_gdelt_dry_run" && dryRun;
  const day = input.scheduledFor ?? new Date().toISOString().slice(0, 10);
  const idempotencyKey = `${input.trigger}:${day}:discovery-v1`;
  const { data: runId, error: startError } = await input.supabase.rpc("start_scan_run", {
    p_trigger_type: input.trigger,
    p_idempotency_key: idempotencyKey,
    p_scheduled_for: input.scheduledFor ?? null,
    p_dry_run: dryRun,
  });
  if (startError || !runId) throw new Error("scan_run_start_failed");
  let sourceQuery = input.supabase
    .from("scan_sources")
    .select(
      "id,name,scan_url,scan_method,state,compliance_registry_id,last_etag,last_modified_header,connector_config,daily_request_limit,manual_dry_run_only,manual_run_consumed_at,compliance_registry!inner(production_enabled,legal_review_status,review_expires_at)",
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
    : sourceQuery.eq("enabled", true);
  const { data, error } = await sourceQuery;
  if (error) throw new Error("scan_source_query_failed");
  const eligibleSources = (data ?? []) as unknown as ScannerSource[];
  const sources = controlledManualDryRun
    ? eligibleSources.slice(0, manualDryRunLimits.maximumSources)
    : eligibleSources;
  const budget = new QueryBudget({
    gdelt: controlledManualDryRun ? manualDryRunLimits.maximumGdeltSearches : 60,
    youtube: controlledManualDryRun ? 0 : 100,
    bluesky: controlledManualDryRun ? 0 : 500,
  });
  let successes = 0;
  let failures = 0;
  let candidates = 0;
  let itemsFetched = 0;
  let limitReached: "fetched_item_limit" | "candidate_limit" | null = null;
  await input.supabase
    .from("scan_runs")
    .update({ status: "running", source_count: sources.length })
    .eq("id", runId);

  for (const source of sources) {
    const remainingFetchedItems = controlledManualDryRun
      ? manualDryRunLimits.maximumFetchedItems - itemsFetched
      : undefined;
    if (remainingFetchedItems !== undefined && remainingFetchedItems <= 0) {
      limitReached = "fetched_item_limit";
      break;
    }
    const { data: job } = await input.supabase
      .from("scan_jobs")
      .update({ status: "running", attempt_count: 1, started_at: new Date().toISOString() })
      .eq("scan_run_id", runId)
      .eq("source_id", source.id)
      .select("id")
      .single();
    try {
      const discovered = await discoverSourceItems({
        source,
        supabase: input.supabase,
        budget,
        maximumItems: controlledManualDryRun
          ? controlledGdeltRun
            ? remainingFetchedItems
            : Math.min(manualDryRunLimits.maximumItemsPerSource, remainingFetchedItems!)
          : undefined,
      });
      itemsFetched += discovered.items.length;
      let itemCount = 0;
      for (const fetched of discovered.items) {
        if (
          controlledManualDryRun &&
          candidates + itemCount >= manualDryRunLimits.maximumCandidates
        ) {
          limitReached = "candidate_limit";
          break;
        }
        if (await persistCandidate({ supabase: input.supabase, runId, source, fetched }))
          itemCount += 1;
      }
      candidates += itemCount;
      successes += 1;
      await input.supabase
        .from("scan_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_discovered: itemCount,
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
        })
        .eq("id", source.id);
      if (controlledManualDryRun && itemsFetched >= manualDryRunLimits.maximumFetchedItems)
        limitReached = "fetched_item_limit";
      if (limitReached) break;
    } catch (error) {
      failures += 1;
      const safe = safeError(error);
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
        })
        .eq("id", source.id);
    }
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
  const status =
    limitReached || (controlledManualDryRun && eligibleSources.length > sources.length)
      ? "incomplete"
      : failures && !successes
        ? "failed"
        : failures
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
    controlledManualDryRun,
    itemsFetched,
    limits: controlledManualDryRun ? manualDryRunLimits : null,
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
  if (controlledGdeltRun && sources.length)
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
    limitReached,
    quotaUsage,
    fingerprint: createHash("sha256").update(idempotencyKey).digest("hex"),
  };
}
