import type { ApprovedEventMedia, MediaRightsBasis } from "@/lib/events/types";

const publicDisplayBasis: Record<MediaRightsBasis, string> = {
  explicit_permission: "Displayed with documented permission.",
  official_reuse_terms: "Displayed under the publisher's stated reuse terms.",
  official_embed: "Displayed using the publisher's official embed.",
  cc_by: "Displayed under a Creative Commons Attribution licence.",
  cc_by_sa: "Displayed under a Creative Commons Attribution-ShareAlike licence.",
  cc0: "Displayed under a CC0 public-domain dedication.",
  public_domain: "Displayed as public-domain media.",
  owned_original: "Published by India Observed with creator credit.",
  editorial_fair_dealing_current_events:
    "Displayed with source attribution for reporting on this event.",
};

export function getPublicMediaKind(
  media: ApprovedEventMedia,
): "Photo" | "Video" | "Post" | "Source document" {
  if (media.publicDisplayKind === "source_document_preview") return "Source document";
  if (media.mediaType === "uploaded_event_image") return "Photo";
  return media.mediaType === "publisher_video_embed" ? "Video" : "Post";
}

export function getPublicMediaCredit(media: ApprovedEventMedia): string {
  if (media.mediaType === "uploaded_event_image") {
    return media.creator ?? media.publisher ?? media.rightsHolder ?? "Credited source";
  }

  return media.publisher ?? media.creator ?? media.rightsHolder ?? "Credited source";
}

export function getPublicMediaCaption(media: ApprovedEventMedia): string {
  return `${getPublicMediaKind(media)}: ${getPublicMediaCredit(media)}`;
}

export function getPublicSourceLinkLabel(media: ApprovedEventMedia): string {
  if (media.mediaType !== "uploaded_event_image") return "View original";
  if (media.publicDisplayKind === "source_document_preview") return "View original source";
  if (media.creator && media.publisher && media.creator !== media.publisher) {
    return `Source: ${media.publisher}`;
  }
  return "View original source";
}

export function getPublicDisplayBasis(media: ApprovedEventMedia): string {
  return media.licenceName
    ? `Licence: ${media.licenceName}`
    : publicDisplayBasis[media.rightsBasis];
}
