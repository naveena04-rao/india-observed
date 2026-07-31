import Link from "next/link";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Home" },
      { href: "/events", label: "Events" },
      { href: "/methodology", label: "Methodology" },
      { href: "/#coverage", label: "Coverage" },
      { href: "/#lead", label: "Submit a lead" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About India Observed" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Standards",
    links: [
      { href: "/editorial-policy", label: "Editorial policy" },
      { href: "/sources-verification", label: "Sources & verification" },
      { href: "/corrections", label: "Corrections" },
      { href: "/media-policy", label: "Media policy" },
    ],
  },
] as const;

export function PublicSiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="page-shell public-footer__inner">
        <div className="public-footer__primary">
          <div className="public-footer__identity">
            <Link className="public-footer__brand" href="/">
              India Observed
            </Link>
            <p>Independent, source-linked records of civic action across India.</p>
          </div>

          {footerGroups.map((group) => (
            <nav
              className="public-footer__group"
              aria-label={`${group.title} footer links`}
              key={group.title}
            >
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="public-footer__secondary">
          <div className="public-footer__accountability">
            <p>Sources linked · Human review before publication · Identities protected</p>
            <p>&copy; {currentYear} India Observed</p>
          </div>
          <nav aria-label="Legal footer links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/copyright">Copyright & takedown</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
