import { z } from "zod";
import type { ReviewedEventPreview } from "@/lib/events/types";

export const approvedMediaTypes = [
  "uploaded_event_image",
  "publisher_video_embed",
  "official_social_embed",
] as const;

export const mediaRightsBases = [
  "owned_original",
  "explicit_permission",
  "official_embed",
  "official_reuse_terms",
  "cc0",
  "public_domain",
  "cc_by",
  "cc_by_sa",
  "editorial_fair_dealing_current_events",
] as const;

export const redistributableRightsBases = mediaRightsBases.filter(
  (basis) => basis !== "official_embed",
);

export const allowedEmbedHosts = new Set(["www.ndtv.com", "www.instagram.com", "www.facebook.com"]);

export const mediaDraftSchema = z
  .object({
    eventSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    mediaType: z.enum(approvedMediaTypes),
    sourceUrl: z.string().url(),
    mediaUrl: z.string().url().optional(),
    publisher: z.string().trim().max(200).optional(),
    creator: z.string().trim().max(200).optional(),
    rightsHolder: z.string().trim().max(200).optional(),
    creditLine: z.string().trim().min(3).max(500),
    rightsBasis: z.enum(mediaRightsBases),
    licenceName: z.string().trim().max(200).optional(),
    licenceUrl: z.string().url().optional(),
    permissionReference: z.string().trim().max(500).optional(),
    altText: z.string().trim().min(8).max(500),
    focalPosition: z
      .string()
      .regex(/^(?:left|center|right|top|bottom|\d{1,3}%)(?: (?:top|center|bottom|\d{1,3}%))?$/),
    sameEventVerified: z.boolean(),
    privacyReviewed: z.boolean(),
    safetyReviewed: z.boolean(),
    integrityReviewed: z.boolean(),
    sameEventReasoning: z.string().trim().min(12).max(4000),
    privacyNotes: z.string().trim().min(8).max(4000),
    safetyNotes: z.string().trim().min(8).max(4000),
    integrityNotes: z.string().trim().min(8).max(4000),
    permissionEvidence: z.string().trim().max(4000).optional(),
    reviewNotes: z.string().trim().max(4000).optional(),
    originalFilename: z.string().trim().max(255).optional(),
    originalSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    originalMediaUrl: z.string().url().optional(),
    replacesMediaId: z.string().uuid().optional(),
    replacementReason: z.string().trim().min(8).max(1000).optional(),
    cropResizeDisclosure: z.string().trim().min(12).max(1000).optional(),
    sourcePageVerified: z.boolean().default(false),
    reportingPurposeConfirmed: z.boolean().default(false),
    reducedResolutionConfirmed: z.boolean().default(false),
    noGalleryReuseConfirmed: z.boolean().default(false),
    noUnrelatedCommercialReuseConfirmed: z.boolean().default(false),
    takedownProcessConfirmed: z.boolean().default(false),
    ownerAcceptance: z.boolean().default(false),
    rightsReviewedAt: z.iso.date().optional(),
  })
  .superRefine((draft, context) => {
    const isUpload = draft.mediaType === "uploaded_event_image";
    if (
      isUpload &&
      !(redistributableRightsBases as readonly string[]).includes(draft.rightsBasis)
    ) {
      context.addIssue({
        code: "custom",
        message: "Uploaded files require a redistributable rights basis.",
        path: ["rightsBasis"],
      });
    }
    if (!isUpload && draft.rightsBasis !== "official_embed") {
      context.addIssue({
        code: "custom",
        message: "Publisher and social embeds require the official_embed rights basis.",
        path: ["rightsBasis"],
      });
    }
    if (!isUpload && !draft.mediaUrl) {
      context.addIssue({
        code: "custom",
        message: "Official embeds require a structured media URL.",
        path: ["mediaUrl"],
      });
    }
    if (!isUpload && !draft.publisher) {
      context.addIssue({
        code: "custom",
        message: "Official embeds require a publisher or account.",
        path: ["publisher"],
      });
    }
    if (!isUpload && !draft.originalMediaUrl) {
      context.addIssue({
        code: "custom",
        message: "Official embeds require the original media URL.",
        path: ["originalMediaUrl"],
      });
    }
    if (draft.rightsBasis === "explicit_permission" && !draft.permissionReference) {
      context.addIssue({
        code: "custom",
        message: "Explicit permission requires a reference.",
        path: ["permissionReference"],
      });
    }
    if (
      ["official_reuse_terms", "cc0", "public_domain", "cc_by", "cc_by_sa"].includes(
        draft.rightsBasis,
      ) &&
      (!draft.licenceName || !draft.licenceUrl)
    ) {
      context.addIssue({
        code: "custom",
        message: "This rights basis requires a licence name and URL.",
        path: ["licenceUrl"],
      });
    }
    if (draft.mediaUrl) {
      const url = new URL(draft.mediaUrl);
      if (!allowedEmbedHosts.has(url.hostname)) {
        context.addIssue({
          code: "custom",
          message: "The embed host is not approved.",
          path: ["mediaUrl"],
        });
      }
    }
    if (draft.replacesMediaId && !draft.replacementReason) {
      context.addIssue({
        code: "custom",
        message: "Replacing approved media requires a reason.",
        path: ["replacementReason"],
      });
    }
    if (draft.rightsBasis === "editorial_fair_dealing_current_events") {
      const requiredChecks = [
        ["sourcePageVerified", draft.sourcePageVerified],
        ["reportingPurposeConfirmed", draft.reportingPurposeConfirmed],
        ["reducedResolutionConfirmed", draft.reducedResolutionConfirmed],
        ["noGalleryReuseConfirmed", draft.noGalleryReuseConfirmed],
        ["noUnrelatedCommercialReuseConfirmed", draft.noUnrelatedCommercialReuseConfirmed],
        ["takedownProcessConfirmed", draft.takedownProcessConfirmed],
        ["ownerAcceptance", draft.ownerAcceptance],
      ] as const;
      for (const [path, passed] of requiredChecks) {
        if (!passed) {
          context.addIssue({
            code: "custom",
            message: "Every editorial fair-dealing control requires individual confirmation.",
            path: [path],
          });
        }
      }
      if (!draft.rightsReviewedAt) {
        context.addIssue({
          code: "custom",
          message: "Editorial fair-dealing decisions require a review date.",
          path: ["rightsReviewedAt"],
        });
      }
      if (!draft.originalMediaUrl || !draft.cropResizeDisclosure) {
        context.addIssue({
          code: "custom",
          message: "Source-image provenance and processing disclosure are required.",
          path: ["originalMediaUrl"],
        });
      }
    }
  });

export function sourceBelongsToEvent(event: ReviewedEventPreview, sourceUrl: string) {
  return event.sources.some((source) => source.url === sourceUrl);
}

export const uploadLimitBytes = 10 * 1024 * 1024;
export const acceptedOriginalImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
