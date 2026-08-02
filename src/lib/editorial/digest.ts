import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function generateEditorialDigest(input: {
  supabase: SupabaseClient;
  digestDate: string;
}) {
  const start = `${input.digestDate}T00:00:00.000Z`;
  const [candidateResult, runResult] = await Promise.all([
    input.supabase
      .from("editorial_candidates")
      .select("candidate_type,priority,review_status,state")
      .gte("created_at", start),
    input.supabase
      .from("scan_runs")
      .select("id,status,success_count,failure_count,source_count")
      .gte("started_at", start)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (candidateResult.error || runResult.error) throw new Error("digest_query_failed");
  const candidates = candidateResult.data ?? [];
  const summary = {
    totalCandidates: candidates.length,
    newEvents: candidates.filter((item) => item.candidate_type === "new_event").length,
    updates: candidates.filter((item) =>
      ["event_update", "official_response", "new_source", "media_evidence"].includes(
        item.candidate_type,
      ),
    ).length,
    highPriority: candidates.filter((item) =>
      ["high", "urgent_editor_attention"].includes(item.priority),
    ).length,
    sourceFailures: runResult.data?.failure_count ?? 0,
    scanStatus: runResult.data?.status ?? "not_run",
  };
  const safeEmailSummary = [
    `India Observed editorial discovery digest for ${input.digestDate}`,
    `${summary.totalCandidates} private candidates (${summary.newEvents} possible new events, ${summary.updates} updates).`,
    `${summary.highPriority} high-priority candidates; ${summary.sourceFailures} source failures.`,
    "Open the private review dashboard for evidence and decisions. Nothing was published automatically.",
  ].join("\n");
  const { data, error } = await input.supabase
    .from("editorial_digests")
    .upsert(
      {
        digest_date: input.digestDate,
        scan_run_id: runResult.data?.id ?? null,
        dashboard_summary: summary,
        safe_email_summary: safeEmailSummary,
        email_status: "disabled",
        recipient_count: 0,
      },
      { onConflict: "digest_date" },
    )
    .select("id")
    .single();
  if (error || !data) throw new Error("digest_write_failed");
  return { digestId: data.id, summary, emailStatus: "disabled" as const };
}
