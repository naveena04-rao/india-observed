import "server-only";
import { getServerEnvironment } from "@/lib/env";

export const developmentSupabaseProjectRef = "czdsfqykhpwiijhxwbps";

export function projectRefFromSupabaseUrl(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function getMediaLibraryAvailability() {
  const env = getServerEnvironment();
  const configured = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const requested = env.MEDIA_LIBRARY_ENABLED === "true";
  const production = env.VERCEL_ENV === "production";
  const projectRef = projectRefFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const usesDedicatedProductionProject =
    !production || (Boolean(projectRef) && projectRef !== developmentSupabaseProjectRef);
  const enabled = configured && requested && usesDedicatedProductionProject;
  const required = production && env.MEDIA_REQUIRED_FOR_LAUNCH === "true";

  return {
    configured,
    enabled,
    projectRef,
    production,
    required,
    usesDedicatedProductionProject,
  };
}

export function assertMediaLibraryReady() {
  const availability = getMediaLibraryAvailability();
  if (availability.required && !availability.enabled) {
    throw new Error(
      "Production media library is required but is missing or points to the development project.",
    );
  }
  return availability;
}
