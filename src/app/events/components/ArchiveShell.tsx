import Link from "next/link";
import type { ReactNode } from "react";
import { getEventFollowingAvailability } from "@/lib/events/following";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { FooterSocialPlaceholders } from "../../components/FooterSocialPlaceholders";
import { HeaderAuthControl } from "../../components/HeaderAuthControl";

type ArchiveShellProps = {
  authReturnTo: string;
  children: ReactNode;
};

export async function ArchiveShell({ authReturnTo, children }: ArchiveShellProps) {
  const following = getEventFollowingAvailability();
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
            <Link href="/#about">About</Link>
            <Link href="/events" aria-current="page">
              Events
            </Link>
            <Link href="/#methodology">Methodology</Link>
            {following.enabled ? (
              <HeaderAuthControl signedIn={signedIn} returnTo={authReturnTo} />
            ) : null}
            <Link className="nav-action" href="/#lead">
              Submit a lead
            </Link>
          </nav>

          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              <Link href="/">Home</Link>
              <Link href="/#about">About</Link>
              <Link href="/events" aria-current="page">
                Events
              </Link>
              <Link href="/#methodology">Methodology</Link>
              {following.enabled ? (
                <HeaderAuthControl signedIn={signedIn} returnTo={authReturnTo} />
              ) : null}
              <Link className="nav-action" href="/#lead">
                Submit a lead
              </Link>
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

      <footer className="site-footer">
        <div className="page-shell">
          <div className="footer-grid">
            <div className="footer-identity">
              <span className="footer-brand">India Observed</span>
              <p>Independent, source-linked records of civic action across India.</p>
            </div>
            <div className="footer-explore">
              <h2>Explore</h2>
              <nav aria-label="Footer navigation">
                <Link href="/">Home</Link>
                <Link href="/events" aria-current="page">
                  Events
                </Link>
                <Link href="/#methodology">Methodology</Link>
                <Link href="/#coverage">Coverage</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/#lead">Submit a lead</Link>
              </nav>
            </div>
            <div className="footer-follow">
              <h2>Follow</h2>
              <FooterSocialPlaceholders />
            </div>
          </div>
          <div className="footer-trust-strip">
            <span>Sources linked</span>
            <span>Human review before publication</span>
            <span>Identities protected</span>
            <span>© 2026 India Observed</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
