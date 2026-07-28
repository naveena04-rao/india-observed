import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { getAuthenticationOrigin } from "@/lib/auth/origin";
import { safeReturnPath } from "@/lib/auth/returnPath";
import { getEventFollowingAvailability } from "@/lib/events/following";
import { getMediaLibraryAvailability } from "@/lib/media/config";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email().max(254);

async function requestMagicLink(formData: FormData) {
  "use server";

  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? ""));
  const email = emailSchema.safeParse(formData.get("email"));
  const { enabled } = getEventFollowingAvailability();
  const mediaAuthenticationEnabled =
    returnTo.startsWith("/admin/media") && getMediaLibraryAvailability().enabled;
  const origin = await getAuthenticationOrigin();
  const supabase =
    enabled || mediaAuthenticationEnabled ? await createSessionSupabaseClient() : null;

  if (!email.success) {
    redirect(`/auth/sign-in?invalid=1&returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!supabase || !origin) {
    redirect(`/auth/sign-in?unavailable=1&returnTo=${encodeURIComponent(returnTo)}`);
  }

  await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/confirm?returnTo=${encodeURIComponent(returnTo)}`,
    },
  });

  // The same neutral response is used whether or not an account already exists or delivery fails.
  redirect(`/auth/sign-in?sent=1&returnTo=${encodeURIComponent(returnTo)}`);
}

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const returnTo = safeReturnPath(typeof query.returnTo === "string" ? query.returnTo : undefined);
  const sent = query.sent === "1";
  const invalid = query.invalid === "1";
  const unavailable = query.unavailable === "1";
  const invalidLink = query.status === "invalid-link";
  const { enabled } = getEventFollowingAvailability();
  const mediaAuthenticationEnabled =
    returnTo.startsWith("/admin/media") && getMediaLibraryAvailability().enabled;
  const authenticationEnabled = enabled || mediaAuthenticationEnabled;

  return (
    <ArchiveShell authReturnTo={returnTo}>
      <section className="auth-page page-shell" aria-labelledby="sign-in-heading">
        <div className="auth-panel">
          <p className="section-kicker">READER ACCOUNT</p>
          <h1 id="sign-in-heading">Sign in</h1>
          <p>Sign in to follow event records. Your identity will not be displayed publicly.</p>
          <p>Following does not indicate endorsement.</p>

          {sent ? (
            <div className="auth-status" role="status">
              <h2>Check your email</h2>
              <p>
                If the address can receive a sign-in link, use that link to continue. You can close
                this page safely.
              </p>
            </div>
          ) : authenticationEnabled ? (
            <form action={requestMagicLink} className="auth-form">
              <input type="hidden" name="returnTo" value={returnTo} />
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
              />
              {invalid ? <p className="form-error">Enter a valid email address.</p> : null}
              {invalidLink ? (
                <p className="form-error">That sign-in link is invalid or has expired.</p>
              ) : null}
              <button type="submit">Email me a sign-in link</button>
            </form>
          ) : (
            <p className="auth-status" role="status">
              Sign-in is temporarily unavailable.
            </p>
          )}

          {unavailable ? (
            <p className="form-error" role="alert">
              Sign-in is temporarily unavailable.
            </p>
          ) : null}
          <p className="auth-privacy-link">
            <Link href="/privacy">Read how follower information is handled</Link>
          </p>
        </div>
      </section>
    </ArchiveShell>
  );
}
