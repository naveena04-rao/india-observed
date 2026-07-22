import "server-only";
import { z } from "zod";
import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import { getServerEnvironment } from "@/lib/env";

const developmentProjectRef = "czdsfqykhpwiijhxwbps";

export const eventSlugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export function findPublishedEvent(slug: string) {
  return reviewedEventsPreview.find(
    (event) => event.slug === slug && event.publicationStatus === "published",
  );
}

function projectRefFromUrl(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function getEventFollowingAvailability() {
  const env = getServerEnvironment();
  const configured = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const requested = env.EVENT_FOLLOWING_ENABLED === "true";
  const isProduction = env.VERCEL_ENV === "production";
  const projectRef = projectRefFromUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const productionReady =
    env.EVENT_FOLLOWING_PRODUCTION_READY === "true" && projectRef !== developmentProjectRef;

  return {
    enabled: configured && requested && (!isProduction || productionReady),
    isPreview: env.VERCEL_ENV === "preview",
  };
}
