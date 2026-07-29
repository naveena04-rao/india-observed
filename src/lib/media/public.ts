import "server-only";
import { unstable_cache } from "next/cache";
import type { ApprovedEventMedia, ReviewedEventPreview } from "@/lib/events/types";
import { assertMediaLibraryReady } from "@/lib/media/config";
import { createAnonymousSupabaseClient } from "@/lib/supabase/server";

type PublicMediaRow = {
  event_slug: string;
  media_type: ApprovedEventMedia["mediaType"];
  storage_path: string | null;
  media_url: string | null;
  source_url: string;
  publisher: string | null;
  creator: string | null;
  rights_holder: string | null;
  credit_line: string;
  rights_basis: ApprovedEventMedia["rightsBasis"];
  licence_name: string | null;
  licence_url: string | null;
  alt_text: string;
  focal_position: string | null;
  approved_at: string;
  same_event_verified: boolean;
  privacy_reviewed: boolean;
  safety_reviewed: boolean;
  integrity_reviewed: boolean;
  approved_source_verified: boolean;
};

const loadPublicMediaRows = unstable_cache(
  async (): Promise<PublicMediaRow[]> => {
    const availability = assertMediaLibraryReady();
    if (!availability.enabled) return [];

    const supabase = createAnonymousSupabaseClient();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("get_public_event_media", {
      p_event_slug: null,
    });

    if (error) {
      if (availability.required) throw new Error("Approved event media could not be loaded.");
      return [];
    }
    return (data ?? []) as PublicMediaRow[];
  },
  ["approved-event-media-v1"],
  { revalidate: 300, tags: ["event-media"] },
);

export async function loadApprovedEventMedia(
  events: readonly ReviewedEventPreview[],
): Promise<Map<string, ApprovedEventMedia>> {
  const eventBySlug = new Map(events.map((event) => [event.slug, event]));
  const rows = await loadPublicMediaRows();
  const approved = new Map<string, ApprovedEventMedia>();
  const supabase = createAnonymousSupabaseClient();

  for (const row of rows) {
    const event = eventBySlug.get(row.event_slug);
    if (!event || event.publicationStatus !== "published") continue;
    if (
      !row.same_event_verified ||
      !row.privacy_reviewed ||
      !row.safety_reviewed ||
      !row.integrity_reviewed ||
      !row.approved_source_verified
    ) {
      continue;
    }
    if (approved.has(row.event_slug)) continue;

    const common = {
      eventSlug: row.event_slug,
      mediaType: row.media_type,
      sourceUrl: row.source_url,
      publisher: row.publisher,
      creator: row.creator,
      rightsHolder: row.rights_holder,
      creditLine: row.credit_line,
      rightsBasis: row.rights_basis,
      licenceName: row.licence_name,
      licenceUrl: row.licence_url,
      altText: row.alt_text,
      focalPosition: row.focal_position ?? "50% 50%",
      approvedAt: row.approved_at,
    };

    if (row.media_type === "uploaded_event_image" && row.storage_path && supabase) {
      const { data } = supabase.storage.from("event-media-public").getPublicUrl(row.storage_path);
      approved.set(row.event_slug, {
        ...common,
        mediaType: "uploaded_event_image",
        publicUrl: data.publicUrl,
      });
    } else if (row.media_type !== "uploaded_event_image" && row.media_url?.startsWith("https://")) {
      approved.set(row.event_slug, {
        ...common,
        mediaType: row.media_type,
        embedUrl: row.media_url,
      });
    }
  }

  return approved;
}
