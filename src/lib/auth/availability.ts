import "server-only";
import { getServerEnvironment } from "@/lib/env";
import { getEventFollowingAvailability } from "@/lib/events/following";
import { getMediaLibraryAvailability } from "@/lib/media/config";

function isEditorialAdminReturnPath(returnTo: string) {
  return returnTo === "/admin/review" || returnTo.startsWith("/admin/review/");
}

export function getAuthenticationAvailability(returnTo: string) {
  const env = getServerEnvironment();
  const configured = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const readerAuthenticationEnabled = getEventFollowingAvailability().enabled;
  const mediaAuthenticationEnabled =
    returnTo.startsWith("/admin/media") && getMediaLibraryAvailability().enabled;
  const editorialAuthenticationEnabled = configured && isEditorialAdminReturnPath(returnTo);

  return {
    enabled:
      readerAuthenticationEnabled || mediaAuthenticationEnabled || editorialAuthenticationEnabled,
  };
}
