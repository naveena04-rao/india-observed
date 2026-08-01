import Link from "next/link";
import type { ReactNode } from "react";
import { getEventFollowingAvailability } from "@/lib/events/following";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { PublicSiteFooter } from "../../components/PublicSiteFooter";
import { HeaderAuthControl } from "../../components/HeaderAuthControl";
import { LeadNavigationAction } from "../../components/LeadNavigationAction";

type ArchiveShellProps = {
  authReturnTo: string;
  children: ReactNode;
};

export async function ArchiveShell({ authReturnTo, children }: ArchiveShellProps) {
  const following = getEventFollowingAvailability();
  const onLeadPage = authReturnTo === "/submit-a-lead";
  const supabase = following.enabled ? await createSessionSupabaseClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const signedIn = Boolean(user);

  return (
    <main className="events-site" id="events-top">
      <header className="site-header">
        <div className="page-shell header-inner">
          <Link className="brand" href="/" aria-label="India Observed home">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="brand-copy">
              <strong>India Observed</strong>
              <small>Independent records of protests and civic movements across India.</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/events" aria-current="page">
              Events
            </Link>
            <Link href="/methodology">Methodology</Link>
            {following.enabled ? (
              <HeaderAuthControl signedIn={signedIn} returnTo={authReturnTo} />
            ) : null}
            <LeadNavigationAction onLeadPage={onLeadPage} />
          </nav>

          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/events" aria-current="page">
                Events
              </Link>
              <Link href="/methodology">Methodology</Link>
              {following.enabled ? (
                <HeaderAuthControl signedIn={signedIn} returnTo={authReturnTo} />
              ) : null}
              <LeadNavigationAction onLeadPage={onLeadPage} />
            </nav>
          </details>
        </div>
      </header>

      <div className="utility-bar">
        <div className="page-shell utility-bar-inner">
          <span>Sources linked. Identities protected. Corrections visible.</span>
        </div>
      </div>

      {children}

      <PublicSiteFooter />
    </main>
  );
}
