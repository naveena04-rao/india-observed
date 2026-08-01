import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const developmentProjectRef = "czdsfqykhpwiijhxwbps";

export async function publishedEventSlugs() {
  const snapshot = await readFile(resolve("src/data/reviewed-events-preview.ts"), "utf8");
  const slugs = [
    ...snapshot.matchAll(/internalId:\s*"IO-CM-[A-Z]{2,3}-\d{4}"\s*,\s*slug:\s*"([a-z0-9-]+)"/g),
  ].map((match) => match[1]);
  if (slugs.length !== 50 || new Set(slugs).size !== 50) {
    throw new Error("The reviewed snapshot does not contain exactly 50 unique event slugs.");
  }
  return slugs;
}

export function mediaEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const enabled = process.env.MEDIA_LIBRARY_ENABLED === "true";
  let projectRef = "";
  try {
    projectRef = new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    projectRef = "";
  }
  if (!url || !anonKey || !enabled || !projectRef) {
    throw new Error(
      "Media library environment is incomplete; configure the Supabase URL, anonymous key and MEDIA_LIBRARY_ENABLED=true.",
    );
  }
  if (process.env.VERCEL_ENV === "production" && projectRef === developmentProjectRef) {
    throw new Error(
      "Production media verification refuses the India Observed development project.",
    );
  }
  return { anonKey, projectRef, url };
}

export async function approvedMediaBySlug() {
  const { anonKey, url } = mediaEnvironment();
  const endpoint = new URL("/rest/v1/rpc/get_public_event_media", url);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_event_slug: null }),
  });
  if (!response.ok) throw new Error(`Public media RPC returned HTTP ${response.status}.`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Public media RPC returned an invalid response.");
  return new Map(rows.map((row) => [row.event_slug, row]));
}

export async function mediaReviewCounts() {
  const { anonKey, url } = mediaEnvironment();
  const endpoint = new URL("/rest/v1/rpc/get_public_event_media_coverage", url);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) throw new Error(`Media coverage RPC returned HTTP ${response.status}.`);
  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) throw new Error("Media coverage RPC returned an invalid response.");
  return {
    approved: Number(row.approved_media),
    rejected: Number(row.rejected_media),
    draft: Number(row.draft_media),
  };
}
