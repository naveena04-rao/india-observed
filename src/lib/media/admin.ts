import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export async function getMediaAdminSession() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) return { admin: false, supabase: null, user: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { admin: false, supabase, user: null };

  const { data, error } = await supabase.rpc("is_media_admin");
  return {
    admin: !error && data === true,
    supabase,
    user,
  };
}

export function isProcessedWebp(bytes: Uint8Array) {
  if (bytes.byteLength < 12 || bytes.byteLength > 10 * 1024 * 1024) return false;
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

export function containsLocationMetadata(bytes: Uint8Array) {
  const decoded = new TextDecoder("latin1").decode(bytes);
  return /\b(?:Exif|GPSLatitude|GPSLongitude|GPSInfo|xmpmeta)\b/i.test(decoded);
}

export async function verifyStagedWebp(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionSupabaseClient>>>,
  path: string,
) {
  const { data, error } = await supabase.storage.from("event-media-staging").download(path);
  if (error || !data) throw new Error("Staged image could not be read.");
  const bytes = new Uint8Array(await data.arrayBuffer());
  if (!isProcessedWebp(bytes)) throw new Error("Staged image is not a valid processed WebP.");
  if (containsLocationMetadata(bytes)) {
    throw new Error("Staged image still contains EXIF or location metadata.");
  }
  return { bytes, blob: data };
}
