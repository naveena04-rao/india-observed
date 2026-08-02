"use server";
import { revalidatePath } from "next/cache";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export async function saveGlobalNotificationPreferenceAction(formData: FormData) {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) throw new Error("Notification preferences are unavailable.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const optedOut = formData.get("globalOptOut") === "on";
  const { error } = await supabase.rpc("set_notification_preference", {
    p_event_slug: null,
    p_delivery_frequency: optedOut ? "none" : "in_app_only",
    p_email_enabled: false,
    p_in_app_enabled: !optedOut,
    p_global_opt_out: optedOut,
  });
  if (error) throw new Error("Notification preference could not be saved.");
  revalidatePath("/notifications");
}
