import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/env";
import { runDiscoveryScan } from "@/lib/discovery/orchestrator";
import { generateEditorialDigest } from "@/lib/editorial/digest";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
function authorised(request: Request, secret: string) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function runScheduledTask(request: Request, secret: string | undefined) {
  const env = getServerEnvironment();
  if (!secret || !authorised(request, secret))
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (env.DISCOVERY_SCHEDULER_ENABLED !== "true")
    return NextResponse.json({ error: "scheduler_disabled" }, { status: 503 });
  const supabase = createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  const task = new URL(request.url).searchParams.get("task") ?? "scan";
  if (task === "digest") {
    if (env.EDITORIAL_DIGEST_EMAIL_ENABLED !== "true")
      return NextResponse.json({ error: "digest_disabled" }, { status: 503 });
    const result = await generateEditorialDigest({
      supabase,
      digestDate: new Date().toISOString().slice(0, 10),
    });
    return NextResponse.json(result);
  }
  if (task !== "scan") return NextResponse.json({ error: "invalid_task" }, { status: 400 });
  const { data: settings, error: settingsError } = await supabase
    .from("discovery_schedule_settings")
    .select("scheduler_enabled,dry_run_only")
    .eq("singleton", true)
    .single();
  if (settingsError || !settings?.scheduler_enabled)
    return NextResponse.json({ error: "scheduler_disabled" }, { status: 503 });
  const result = await runDiscoveryScan({
    supabase,
    trigger: "scheduled",
    scheduledFor: new Date().toISOString().slice(0, 10),
    dryRun: settings.dry_run_only || env.DISCOVERY_DRY_RUN_ONLY === "true",
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return runScheduledTask(request, getServerEnvironment().DISCOVERY_SCHEDULER_SECRET);
}

export async function GET(request: Request) {
  return runScheduledTask(request, getServerEnvironment().CRON_SECRET);
}
