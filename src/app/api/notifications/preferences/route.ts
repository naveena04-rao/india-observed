import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginMutation } from "@/lib/http/sameOrigin";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const preferenceSchema = z.object({
  eventSlug: z.string().min(1).max(180).nullable(),
  frequency: z.enum(["immediate", "daily_digest", "weekly_digest", "in_app_only", "none"]),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  globalOptOut: z.boolean(),
});

export async function GET() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("event_slug,delivery_frequency,email_enabled,in_app_enabled,global_opt_out,updated_at")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  return NextResponse.json(
    { preferences: data ?? [] },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request))
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const parsed = preferenceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_preference" }, { status: 400 });
  const supabase = await createSessionSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const { error } = await supabase.rpc("set_notification_preference", {
    p_event_slug: parsed.data.eventSlug,
    p_delivery_frequency: parsed.data.frequency,
    p_email_enabled: parsed.data.emailEnabled,
    p_in_app_enabled: parsed.data.inAppEnabled,
    p_global_opt_out: parsed.data.globalOptOut,
  });
  if (error) return NextResponse.json({ error: "preference_not_saved" }, { status: 400 });
  return NextResponse.json({ saved: true }, { headers: { "cache-control": "no-store" } });
}
