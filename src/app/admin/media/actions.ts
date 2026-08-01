"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getMediaAdminSession, verifyStagedWebp } from "@/lib/media/admin";

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

async function requireAdmin() {
  const session = await getMediaAdminSession();
  if (!session.user) throw new Error("Authentication required.");
  if (!session.admin || !session.supabase) throw new Error("Media administrator access required.");
  return session.supabase;
}

function revalidateMediaPages(eventSlug: string) {
  revalidateTag("event-media", "max");
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${eventSlug}`);
  revalidatePath("/admin/media");
}

export async function reviewMediaAction(formData: FormData) {
  const supabase = await requireAdmin();
  const mediaId = required(formData, "mediaId");
  const eventSlug = required(formData, "eventSlug");
  const { error: mediaError } = await supabase.rpc("update_event_media_review", {
    p_media_id: mediaId,
    p_same_event_verified: formData.get("sameEventVerified") === "on",
    p_privacy_reviewed: formData.get("privacyReviewed") === "on",
    p_safety_reviewed: formData.get("safetyReviewed") === "on",
    p_integrity_reviewed: formData.get("integrityReviewed") === "on",
  });
  if (mediaError) throw new Error("Review gates could not be updated.");

  const { error: reviewError } = await supabase
    .from("event_media_private_review")
    .update({
      same_event_reasoning: required(formData, "sameEventReasoning"),
      privacy_notes: required(formData, "privacyNotes"),
      safety_notes: required(formData, "safetyNotes"),
      integrity_notes: required(formData, "integrityNotes"),
      review_notes: String(formData.get("reviewNotes") ?? "").trim() || null,
      permission_evidence: String(formData.get("permissionEvidence") ?? "").trim() || null,
    })
    .eq("media_id", mediaId);
  if (reviewError) throw new Error("Private review notes could not be updated.");

  revalidatePath(`/admin/media?event=${encodeURIComponent(eventSlug)}`);
}

export async function approveMediaAction(formData: FormData) {
  const supabase = await requireAdmin();
  const mediaId = required(formData, "mediaId");
  const eventSlug = required(formData, "eventSlug");
  const { data: media, error } = await supabase
    .from("event_media")
    .select("id,event_slug,media_type,status,storage_path")
    .eq("id", mediaId)
    .single();
  if (error || !media || media.status !== "draft" || media.event_slug !== eventSlug) {
    throw new Error("Draft media unavailable.");
  }

  let publicPath: string | null = null;
  let uploadedPublicObject = false;
  if (media.media_type === "uploaded_event_image") {
    if (!media.storage_path) throw new Error("Staged image path is missing.");
    const verified = await verifyStagedWebp(supabase, media.storage_path);
    publicPath = `${eventSlug}/${mediaId}/primary.webp`;
    const { error: uploadError } = await supabase.storage
      .from("event-media-public")
      .upload(publicPath, verified.blob, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: false,
      });
    if (uploadError) throw new Error("Approved derivative could not be written.");
    uploadedPublicObject = true;
  }

  const { data: approval, error: approvalError } = await supabase.rpc("approve_event_media", {
    p_media_id: mediaId,
    p_public_storage_path: publicPath,
  });
  if (approvalError) {
    if (uploadedPublicObject && publicPath) {
      await supabase.storage.from("event-media-public").remove([publicPath]);
    }
    throw new Error("Approval gates did not pass.");
  }

  if (media.storage_path && media.media_type === "uploaded_event_image") {
    await supabase.storage.from("event-media-staging").remove([media.storage_path]);
  }
  const replacedPath = Array.isArray(approval)
    ? (approval[0]?.replaced_storage_path as string | null | undefined)
    : null;
  if (replacedPath) await supabase.storage.from("event-media-public").remove([replacedPath]);

  revalidateMediaPages(eventSlug);
}

export async function rejectMediaAction(formData: FormData) {
  const supabase = await requireAdmin();
  const mediaId = required(formData, "mediaId");
  const eventSlug = required(formData, "eventSlug");
  const reason = required(formData, "reason");
  const { data: media } = await supabase
    .from("event_media")
    .select("storage_path,media_type")
    .eq("id", mediaId)
    .single();
  const { error } = await supabase.rpc("reject_event_media", {
    p_media_id: mediaId,
    p_reason: reason,
  });
  if (error) throw new Error("Draft media could not be rejected.");
  if (media?.media_type === "uploaded_event_image" && media.storage_path) {
    await supabase.storage.from("event-media-staging").remove([media.storage_path]);
  }
  revalidatePath(`/admin/media?event=${encodeURIComponent(eventSlug)}`);
}

export async function withdrawMediaAction(formData: FormData) {
  const supabase = await requireAdmin();
  const mediaId = required(formData, "mediaId");
  const eventSlug = required(formData, "eventSlug");
  const reason = required(formData, "reason");
  const { data: priorPath, error } = await supabase.rpc("withdraw_event_media", {
    p_media_id: mediaId,
    p_reason: reason,
  });
  if (error) throw new Error("Approved media could not be withdrawn.");
  if (typeof priorPath === "string" && priorPath) {
    await supabase.storage.from("event-media-public").remove([priorPath]);
  }
  revalidateMediaPages(eventSlug);
}
