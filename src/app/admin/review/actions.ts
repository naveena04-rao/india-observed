"use server";
import { revalidatePath } from "next/cache";
import { getEditorialAdminSession } from "@/lib/editorial/admin";
import { runDiscoveryScan } from "@/lib/discovery/orchestrator";

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

export async function createChangeSetAction(formData: FormData) {
  const supabase = await editor();
  const candidateId = required(formData, "candidateId");
  const { error } = await supabase.rpc("create_approved_change_set", {
    p_candidate_id: candidateId,
  });
  if (error) throw new Error("A PR-ready change set could not be created.");
  revalidatePath(`/admin/review/candidates/${candidateId}`);
}

export async function startManualDryRunAction() {
  const supabase = await editor();
  await runDiscoveryScan({
    supabase,
    trigger: "manual",
    dryRun: true,
    scheduledFor: null,
  });
  revalidatePath("/admin/review/scan-runs");
  revalidatePath("/admin/review/today");
}
