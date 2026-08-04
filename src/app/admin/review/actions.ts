"use server";
import { revalidatePath } from "next/cache";
import { getEditorialAdminSession } from "@/lib/editorial/admin";
import { runDiscoveryScan } from "@/lib/discovery/orchestrator";
import { twelveMonthVerificationLeads } from "@/data/twelveMonthVerification";

export type ManualDryRunActionState = {
  status: "idle" | "completed" | "incomplete" | "failed" | "already_running";
  message: string;
  runId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  queriesUsed: number;
  itemsDiscovered: number;
  candidatesCreated: number;
  failures: number;
};

export type FallbackDryRunActionState = ManualDryRunActionState & {
  connectorResults: Record<
    string,
    { sources: number; successes: number; failures: number; items: number; candidates: number }
  >;
};

async function editor() {
  const session = await getEditorialAdminSession();
  if (!session.user || !session.editor || !session.supabase)
    throw new Error("Authorised editor required.");
  return session.supabase;
}
function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

export async function reviewCandidateFieldAction(formData: FormData) {
  const supabase = await editor();
  const fieldId = required(formData, "fieldId");
  const candidateId = required(formData, "candidateId");
  const decision = required(formData, "decision");
  const edited = String(formData.get("editedValue") ?? "").trim();
  const { error } = await supabase.rpc("review_candidate_field", {
    p_field_id: fieldId,
    p_decision: decision,
    p_edited_value: decision === "edit_and_approve" ? { value: edited } : null,
    p_reason: String(formData.get("reason") ?? "").trim() || null,
  });
  if (error) throw new Error("Candidate field decision could not be saved.");
  revalidatePath(`/admin/review/candidates/${candidateId}`);
}

export async function reviewCandidateAction(formData: FormData) {
  const supabase = await editor();
  const candidateId = required(formData, "candidateId");
  const { error } = await supabase.rpc("review_editorial_candidate", {
    p_candidate_id: candidateId,
    p_decision: required(formData, "decision"),
    p_reason: String(formData.get("reason") ?? "").trim() || null,
  });
  if (error) throw new Error("Candidate decision could not be saved.");
  revalidatePath(`/admin/review/candidates/${candidateId}`);
  revalidatePath("/admin/review/today");
}

export async function reviewTwelveMonthVerificationLeadAction(formData: FormData) {
  const supabase = await editor();
  const leadRef = required(formData, "leadRef");
  const decision = required(formData, "decision");
  const note = String(formData.get("note") ?? "").trim();
  if (!twelveMonthVerificationLeads.some((lead) => lead.ref === leadRef))
    throw new Error("Verification lead not found.");
  if (!["approve_private_draft", "hold_for_evidence", "reject"].includes(decision))
    throw new Error("Verification decision not recognised.");
  if (decision !== "approve_private_draft" && note.length < 4)
    throw new Error("Add a short note before holding or rejecting a lead.");

  const { error } = await supabase.rpc("review_twelve_month_verification_lead", {
    p_lead_ref: leadRef,
    p_decision: decision,
    p_note: note || null,
  });
  if (error) throw new Error("The private verification decision could not be saved.");
  revalidatePath("/admin/review/verification");
}

export async function createChangeSetAction(formData: FormData) {
  const supabase = await editor();
  const candidateId = required(formData, "candidateId");
  const { error } = await supabase.rpc("create_approved_change_set", {
    p_candidate_id: candidateId,
  });
  if (error) throw new Error("A PR-ready change set could not be created.");
  revalidatePath(`/admin/review/candidates/${candidateId}`);
}

export async function startManualDryRunAction(
  previousState: ManualDryRunActionState,
  formData: FormData,
): Promise<ManualDryRunActionState> {
  void previousState;
  void formData;
  const startedAt = new Date().toISOString();
  try {
    const supabase = await editor();
    const result = await runDiscoveryScan({
      supabase,
      trigger: "manual_gdelt_dry_run",
      dryRun: true,
      scheduledFor: null,
    });
    const completedAt = new Date().toISOString();
    revalidatePath("/admin/review/scan-runs");
    revalidatePath("/admin/review/today");
    return {
      status: result.status,
      message:
        result.status === "completed"
          ? "The GDELT metadata dry scan completed. Private review candidates are ready."
          : (result.safeFailureSummary ??
            "The GDELT metadata dry scan stopped safely before every item could be processed."),
      runId: result.runId,
      startedAt,
      completedAt,
      queriesUsed: result.queriesUsed,
      itemsDiscovered: result.itemsFetched,
      candidatesCreated: result.candidates,
      failures: result.failures,
    };
  } catch (error) {
    const alreadyRunning = error instanceof Error && error.message === "dry_scan_already_running";
    const alreadyUsed = error instanceof Error && error.message === "dry_scan_already_used";
    return {
      status: alreadyRunning ? "already_running" : "failed",
      message: alreadyRunning
        ? "A dry scan is already running."
        : alreadyUsed
          ? "The approved one-time GDELT dry scan has already been used."
          : "The dry scan could not be started safely. No public records were changed.",
      runId: null,
      startedAt,
      completedAt: new Date().toISOString(),
      queriesUsed: 0,
      itemsDiscovered: 0,
      candidatesCreated: 0,
      failures: 1,
    };
  }
}

export async function startFallbackDryRunAction(
  previousState: FallbackDryRunActionState,
  formData: FormData,
): Promise<FallbackDryRunActionState> {
  void previousState;
  void formData;
  const startedAt = new Date().toISOString();
  try {
    const supabase = await editor();
    const result = await runDiscoveryScan({
      supabase,
      trigger: "manual_fallback_dry_run",
      dryRun: true,
      scheduledFor: null,
    });
    revalidatePath("/admin/review/scan-runs");
    revalidatePath("/admin/review/today");
    return {
      status: result.status,
      message:
        result.status === "completed"
          ? "The fallback metadata dry scan completed. Private review candidates are ready."
          : (result.safeFailureSummary ??
            "The fallback dry scan completed with isolated connector failures."),
      runId: result.runId,
      startedAt,
      completedAt: new Date().toISOString(),
      queriesUsed: result.youtubeCalls + result.blueskyCalls,
      itemsDiscovered: result.itemsFetched,
      candidatesCreated: result.candidates,
      failures: result.failures,
      connectorResults: result.connectorResults,
    };
  } catch (error) {
    const alreadyRunning = error instanceof Error && error.message === "dry_scan_already_running";
    return {
      status: alreadyRunning ? "already_running" : "failed",
      message: alreadyRunning
        ? "A dry scan is already running."
        : "No approved non-GDELT source is available. No scan run or public change was created.",
      runId: null,
      startedAt,
      completedAt: new Date().toISOString(),
      queriesUsed: 0,
      itemsDiscovered: 0,
      candidatesCreated: 0,
      failures: alreadyRunning ? 0 : 1,
      connectorResults: {},
    };
  }
}

export async function startPibRssDryRunAction(
  previousState: ManualDryRunActionState,
  formData: FormData,
): Promise<ManualDryRunActionState> {
  void previousState;
  void formData;
  const startedAt = new Date().toISOString();
  try {
    const supabase = await editor();
    const result = await runDiscoveryScan({
      supabase,
      trigger: "manual_pib_rss_dry_run",
      dryRun: true,
      scheduledFor: null,
    });
    const completedAt = new Date().toISOString();
    revalidatePath("/admin/review/scan-runs");
    revalidatePath("/admin/review/today");
    return {
      status: result.status,
      message:
        result.status === "completed"
          ? "The one-time PIB RSS metadata dry scan completed. Private review candidates are ready."
          : (result.safeFailureSummary ??
            "The PIB RSS dry scan stopped safely. No public records were changed."),
      runId: result.runId,
      startedAt,
      completedAt,
      queriesUsed: 0,
      itemsDiscovered: result.itemsFetched,
      candidatesCreated: result.candidates,
      failures: result.failures,
    };
  } catch (error) {
    const alreadyRunning = error instanceof Error && error.message === "dry_scan_already_running";
    const alreadyUsed = error instanceof Error && error.message === "dry_scan_already_used";
    return {
      status: alreadyRunning ? "already_running" : "failed",
      message: alreadyRunning
        ? "A PIB RSS dry scan is already running."
        : alreadyUsed
          ? "The approved one-time PIB RSS dry scan has already been used."
          : "The PIB RSS dry scan could not be started safely. No public records were changed.",
      runId: null,
      startedAt,
      completedAt: new Date().toISOString(),
      queriesUsed: 0,
      itemsDiscovered: 0,
      candidatesCreated: 0,
      failures: alreadyRunning ? 0 : 1,
    };
  }
}

export async function startDailyScannerDryRunAction(
  previousState: ManualDryRunActionState,
  formData: FormData,
): Promise<ManualDryRunActionState> {
  void previousState;
  void formData;
  const startedAt = new Date().toISOString();
  try {
    const supabase = await editor();
    const result = await runDiscoveryScan({
      supabase,
      trigger: "manual_daily_scanner_dry_run",
      dryRun: true,
      scheduledFor: null,
    });
    revalidatePath("/admin/review/scan-runs");
    revalidatePath("/admin/review/today");
    return {
      status: result.status,
      message:
        result.status === "completed"
          ? "The daily-scanner readiness run completed. Private review candidates are ready."
          : (result.safeFailureSummary ??
            "The readiness run stopped safely. No public records were changed."),
      runId: result.runId,
      startedAt,
      completedAt: new Date().toISOString(),
      queriesUsed: 0,
      itemsDiscovered: result.itemsFetched,
      candidatesCreated: result.candidates,
      failures: result.failures,
    };
  } catch (error) {
    const alreadyRunning = error instanceof Error && error.message === "dry_scan_already_running";
    return {
      status: alreadyRunning ? "already_running" : "failed",
      message: alreadyRunning
        ? "A daily-scanner readiness run is already active."
        : "The readiness run could not be started safely. No public records were changed.",
      runId: null,
      startedAt,
      completedAt: new Date().toISOString(),
      queriesUsed: 0,
      itemsDiscovered: 0,
      candidatesCreated: 0,
      failures: alreadyRunning ? 0 : 1,
    };
  }
}
