import { getServerEnvironment } from "@/lib/env";

const localSiteUrl = "http://localhost:3000";

export function getPublicSiteUrl() {
  const env = getServerEnvironment();
  return new URL(env.NEXT_PUBLIC_SITE_URL || localSiteUrl);
}

export function getPublicContactEmail() {
  return getServerEnvironment().PUBLIC_CONTACT_EMAIL || null;
}

export function assertProductionLaunchConfiguration() {
  const env = getServerEnvironment();
  if (env.VERCEL_ENV !== "production") return;

  const missing = [
    !env.NEXT_PUBLIC_SITE_URL ? "NEXT_PUBLIC_SITE_URL" : null,
    !env.PUBLIC_CONTACT_EMAIL ? "PUBLIC_CONTACT_EMAIL" : null,
    env.MEDIA_REQUIRED_FOR_LAUNCH === "true" && env.MEDIA_LIBRARY_ENABLED !== "true"
      ? "MEDIA_LIBRARY_ENABLED=true"
      : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Production launch configuration is incomplete: ${missing.join(", ")}`);
  }
}
