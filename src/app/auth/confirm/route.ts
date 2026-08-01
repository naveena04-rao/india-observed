import { NextResponse, type NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/auth/returnPath";
import { getEventFollowingAvailability } from "@/lib/events/following";
import { getMediaLibraryAvailability } from "@/lib/media/config";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get("returnTo"));
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const { enabled } = getEventFollowingAvailability();
  const mediaAuthenticationEnabled =
    returnTo.startsWith("/admin/media") && getMediaLibraryAvailability().enabled;
  const supabase =
    enabled || mediaAuthenticationEnabled ? await createSessionSupabaseClient() : null;

  if (supabase && tokenHash && type === "email") {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (!error) return NextResponse.redirect(new URL(returnTo, request.url));
  }

  const signIn = new URL("/auth/sign-in", request.url);
  signIn.searchParams.set("status", "invalid-link");
  signIn.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(signIn);
}
