import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getServerEnvironment();
  if (env.SUPABASE_CONNECTION_CHECK_ENABLED !== "true") {
    return NextResponse.json({ ok: true, configured: false, checked: false });
  }

  const client = createServerSupabaseClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, configured: false, checked: false, error: "Supabase credentials missing" },
      { status: 503 },
    );
  }

  const { error } = await client.from("events").select("id", { count: "exact", head: true });
  if (error) {
    return NextResponse.json(
      { ok: false, configured: true, checked: true, error: "Database query failed" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, configured: true, checked: true });
}
