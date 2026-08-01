import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPrivateLeadDiscoveryInputs(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("lead_submissions")
    .select(
      "id,title,description,location,event_date,date_precision,source_links,additional_context,status,created_at,submission_mode,related_event_id,related_event_slug,contribution_type,media_type",
    )
    .in("status", ["pending_review", "under_review"])
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) throw new Error("private_lead_discovery_unavailable");
  // The query deliberately excludes contact_email and contact_phone.
  return data ?? [];
}
