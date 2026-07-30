import { NextResponse } from "next/server";
import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import { getMediaAdminSession } from "@/lib/media/admin";
import {
  acceptedOriginalImageTypes,
  mediaDraftSchema,
  sourceBelongsToEvent,
  uploadLimitBytes,
} from "@/lib/media/validation";

export async function POST(request: Request) {
  const { admin, supabase, user } = await getMediaAdminSession();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!admin || !supabase) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = mediaDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Media draft is incomplete.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const draft = parsed.data;
  const event = reviewedEventsPreview.find(
    (candidate) =>
      candidate.slug === draft.eventSlug && candidate.publicationStatus === "published",
  );
  if (!event) return NextResponse.json({ error: "Published event unavailable." }, { status: 400 });
  if (!sourceBelongsToEvent(event, draft.sourceUrl)) {
    return NextResponse.json(
      { error: "The selected source does not belong to this event." },
      { status: 400 },
    );
  }
  const approvedSource = event.sources.find((source) => source.url === draft.sourceUrl);
  if (!approvedSource) {
    return NextResponse.json({ error: "Approved source unavailable." }, { status: 400 });
  }

  if (draft.mediaType === "uploaded_event_image") {
    const originalType = String(body?.originalType ?? "");
    const originalSize = Number(body?.originalSize ?? 0);
    if (!acceptedOriginalImageTypes.has(originalType) || originalSize <= 0) {
      return NextResponse.json({ error: "JPEG, PNG or WebP is required." }, { status: 400 });
    }
    if (originalSize > uploadLimitBytes) {
      return NextResponse.json({ error: "Original image exceeds 10 MB." }, { status: 400 });
    }
    if (!draft.originalFilename || !draft.originalSha256) {
      return NextResponse.json(
        { error: "Processed uploads require an original filename and SHA-256 digest." },
        { status: 400 },
      );
    }
  }

  const id = crypto.randomUUID();
  const stagingPath =
    draft.mediaType === "uploaded_event_image" ? `${draft.eventSlug}/${id}/upload.webp` : null;
  const { error: mediaError } = await supabase.from("event_media").insert({
    id,
    event_slug: draft.eventSlug,
    media_type: draft.mediaType,
    public_display_kind:
      draft.mediaType === "uploaded_event_image"
        ? "photograph"
        : draft.mediaType === "publisher_video_embed"
          ? "video"
          : "post",
    status: "draft",
    storage_path: stagingPath,
    source_url: draft.sourceUrl,
    media_url: draft.mediaUrl ?? null,
    publisher:
      draft.mediaType === "uploaded_event_image" ? approvedSource.publisher : draft.publisher,
    creator: draft.creator ?? null,
    rights_holder: draft.rightsHolder ?? null,
    credit_line: draft.creditLine,
    rights_basis: draft.rightsBasis,
    licence_name: draft.licenceName ?? null,
    licence_url: draft.licenceUrl ?? null,
    permission_reference: draft.permissionReference ?? null,
    alt_text: draft.altText,
    focal_position: draft.focalPosition,
    same_event_verified: draft.sameEventVerified,
    privacy_reviewed: draft.privacyReviewed,
    safety_reviewed: draft.safetyReviewed,
    integrity_reviewed: draft.integrityReviewed,
    approved_source_verified: true,
    uploaded_by: user.id,
    replaces_media_id: draft.replacesMediaId ?? null,
    replacement_reason: draft.replacementReason ?? null,
    source_page_verified: draft.sourcePageVerified,
    reporting_purpose_confirmed: draft.reportingPurposeConfirmed,
    reduced_resolution_confirmed: draft.reducedResolutionConfirmed,
    no_gallery_reuse_confirmed: draft.noGalleryReuseConfirmed,
    no_unrelated_commercial_reuse_confirmed: draft.noUnrelatedCommercialReuseConfirmed,
    takedown_process_confirmed: draft.takedownProcessConfirmed,
    owner_acceptance: draft.ownerAcceptance,
    rights_reviewed_at: draft.rightsReviewedAt ?? null,
  });
  if (mediaError) {
    const duplicate =
      mediaError.code === "23505" ? "This media URL or file is already registered." : null;
    return NextResponse.json(
      { error: duplicate ?? "Media draft could not be created." },
      { status: 400 },
    );
  }

  const { error: reviewError } = await supabase.from("event_media_private_review").insert({
    media_id: id,
    permission_evidence: draft.permissionEvidence ?? null,
    review_notes: draft.reviewNotes ?? null,
    same_event_reasoning: draft.sameEventReasoning,
    privacy_notes: draft.privacyNotes,
    safety_notes: draft.safetyNotes,
    integrity_notes: draft.integrityNotes,
    original_filename: draft.originalFilename ?? null,
    original_sha256: draft.originalSha256 ?? null,
    original_media_url: draft.originalMediaUrl ?? null,
    staging_path: stagingPath,
    crop_resize_disclosure: draft.cropResizeDisclosure ?? null,
  });
  if (reviewError) {
    await supabase.rpc("reject_event_media", {
      p_media_id: id,
      p_reason: "Private review metadata could not be stored.",
    });
    return NextResponse.json(
      { error: "Private review metadata could not be stored." },
      { status: 400 },
    );
  }

  return NextResponse.json({ id, stagingPath });
}
