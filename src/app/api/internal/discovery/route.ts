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

export async function POST(request: Request) {
  const env = getServerEnvironment();
  if (!env.DISCOVERY_SCHEDULER_SECRET || !authorised(request, env.DISCOVERY_SCHEDULER_SECRET))
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!env.DISCOVERY_SCHEDULER_ENABLED)
    return NextResponse.json({ error: "scheduler_disabled" }, { status: 503 });
  const supabase = createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  const task = new URL(request.url).searchParams.get("task") ?? "scan";
  if (task === "digest") {
    const result = await generateEditorialDigest({
      supabase,
      digestDate: new Date().toISOString().slice(0, 10),
    });
    return NextResponse.json(result);
  }
  if (task !== "scan") return NextResponse.json({ error: "invalid_task" }, { status: 400 });
  const result = await runDiscoveryScan({
    supabase,
    trigger: "scheduled",
    scheduledFor: new Date().toISOString().slice(0, 10),
    dryRun: env.DISCOVERY_DRY_RUN_ONLY === "true",
  });
  return NextResponse.json(result);
}
