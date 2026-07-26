import { NextResponse, type NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/auth/returnPath";
import { hasUnexpectedBody, isSameOriginMutation } from "@/lib/http/sameOrigin";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request) || hasUnexpectedBody(request)) {
    return NextResponse.json({ error: "Request unavailable" }, { status: 400 });
  }

  const supabase = await createSessionSupabaseClient();
  if (supabase) await supabase.auth.signOut({ scope: "local" });

  const returnTo = safeReturnPath(request.nextUrl.searchParams.get("returnTo"));
  return NextResponse.redirect(new URL(returnTo, request.url), 303);
}
