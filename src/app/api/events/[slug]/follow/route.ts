import { NextResponse, type NextRequest } from "next/server";
import {
  eventSlugSchema,
  findPublishedEvent,
  getEventFollowingAvailability,
} from "@/lib/events/following";
import { hasUnexpectedBody, isSameOriginMutation } from "@/lib/http/sameOrigin";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };
type FollowSummary = { follower_count: number | string; following: boolean };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function availableSlug(context: RouteContext) {
  const { slug } = await context.params;
  const parsed = eventSlugSchema.safeParse(slug);
  if (!parsed.success) return null;
  return findPublishedEvent(parsed.data)?.slug ?? null;
}

function publicSummary(data: FollowSummary | null) {
  if (!data) return null;
  const count = Number(data.follower_count);
  if (!Number.isSafeInteger(count) || count < 0) return null;
  return { count, following: data.following === true };
}

async function sessionClient() {
  const { enabled } = getEventFollowingAvailability();
  return enabled ? createSessionSupabaseClient() : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const slug = await availableSlug(context);
  if (!slug) return json({ error: "Event unavailable" }, 404);

  const supabase = await sessionClient();
  if (!supabase) return json({ error: "Following is temporarily unavailable" }, 503);

  const { data, error } = await supabase
    .rpc("get_event_follow_summary", { p_event_slug: slug })
    .single<FollowSummary>();
  const summary = error ? null : publicSummary(data);
  return summary ? json(summary) : json({ error: "Following is temporarily unavailable" }, 503);
}

async function mutate(request: NextRequest, context: RouteContext, action: "follow" | "unfollow") {
  const slug = await availableSlug(context);
  if (!slug) return json({ error: "Event unavailable" }, 404);
  if (!isSameOriginMutation(request) || hasUnexpectedBody(request)) {
    return json({ error: "Request unavailable" }, 400);
  }

  const supabase = await sessionClient();
  if (!supabase) return json({ error: "Following is temporarily unavailable" }, 503);

  // The authenticated identity is verified again here; no browser-supplied user ID is accepted.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Authentication required" }, 401);

  const functionName = action === "follow" ? "follow_event" : "unfollow_event";
  const { data, error } = await supabase
    .rpc(functionName, { p_event_slug: slug })
    .single<FollowSummary>();
  const summary = error ? null : publicSummary(data);
  return summary ? json(summary) : json({ error: "Following is temporarily unavailable" }, 503);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return mutate(request, context, "follow");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return mutate(request, context, "unfollow");
}
