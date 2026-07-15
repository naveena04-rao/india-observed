import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnvironment } from "@/lib/env";

export function createServerSupabaseClient() {
  const env = getServerEnvironment();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
