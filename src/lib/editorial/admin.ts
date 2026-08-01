import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export async function getEditorialAdminSession() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) return { editor: false, supabase: null, user: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { editor: false, supabase, user: null };

  const { data, error } = await supabase.rpc("is_authorised_editor");
  return { editor: !error && data === true, supabase, user };
}
