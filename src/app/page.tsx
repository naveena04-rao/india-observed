import Link from "next/link";

const featuredRecords = [
  {
    id: "IO-CM-KA-0002",
    status: "Ongoing",
    statusTone: "status-ongoing",
    title: "Bidadi farmers oppose township land acquisition",
    place: "Bengaluru South, Karnataka",
    topic: "Land and rehabilitation",
    verification: "Occurrence verified",
    note: "Some details remain disputed",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-MN-0001",
    status: "Ongoing",
    statusTone: "status-ongoing",
    title: "Manipur government employees continue cease-work strike",
    place: "Manipur",
    topic: "Labour and employment",
    verification: "Occurrence verified",
    note: "Official response under review",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-OD-0001",
    status: "Concluded",
    statusTone: "status-concluded",
    title: "Dharmasala students protest teacher vacancies",
    place: "Jajpur, Odisha",
    topic: "Education",
    verification: "Outcome documented",
    note: "Same-day institutional response recorded",
    reviewed: "15 July 2026",
  },
] as const;

const verificationLabels = [
  ["Reported", "A credible source has reported the claim."],
  ["Corroborated", "Independent evidence supports the claim."],
  ["Attributed", "The statement is clearly tied to its source."],
  ["Disputed", "Credible accounts materially disagree."],
  ["Corrected", "A material change has been publicly logged."],
] as const;

const processSteps = [
  ["01", "Discover", "Search national, regional, local-language, community and official sources."],
  [
    "02",
    "Separate claims",
    "Break an event into occurrence, dates, demands, responses and allegations.",
  ],
  ["03", "Verify", "Check source independence, primary records and conflicting accounts."],
  ["04", "Human review", "Apply publication, privacy, safety and correction gates before release."],
] as const;

export default function HomePage() {
  return (
    <main>
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
            <a href="#records">Explore records</a>
            <a href="#methodology">Methodology</a>
            <a href="#corrections">Corrections</a>
            <a className="nav-action" href="#lead">
              Submit a lead
            </a>
          </nav>

          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              <a href="#records">Explore records</a>
              <a href="#methodology">Methodology</a>
              <a href="#corrections">Corrections</a>
              <a href="#lead">Submit a lead</a>
            </nav>
          </details>
        </div>
      </header>

      <div className="utility-bar">
        <div className="page-shell utility-bar-inner">
          <span>Claims linked · Private participants unnamed · Corrections visible</span>
        </div>
      </div>

      <section className="hero-section">
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">Featured record</p>
            <p className="featured-meta">
              {featuredRecords[0].topic} · {featuredRecords[0].place}
            </p>
            <h1>{featuredRecords[0].title}</h1>
            <p className="hero-lede">
              A source-linked timeline of the movement, official responses, disputed claims and what
              remains unresolved.
            </p>
            <a className="text-link" href="#records">
              View the full record <span aria-hidden="true">→</span>
            </a>
          </div>

          <aside className="repository-brief latest-column" aria-label="Latest records">
            <p className="brief-label">Latest records</p>
            {featuredRecords.slice(1).map((record) => (
              <article className="latest-entry" key={record.id}>
                <p className="record-topic">{record.topic}</p>
                <p className="latest-location">{record.place}</p>
                <h2>{record.title}</h2>
                <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
              </article>
            ))}
            <a className="text-link" href="#records">
              View all records <span aria-hidden="true">→</span>
            </a>
          </aside>
        </div>
      </section>

      <section className="search-band latest-stream" aria-labelledby="latest-heading">
        <div className="page-shell">
          <div className="stream-heading">
            <p className="section-kicker muted-kicker">Latest records</p>
            <h2 id="latest-heading">Recently reviewed in the archive</h2>
          </div>
          <div className="stream-grid">
            {featuredRecords.map((record) => (
              <article key={record.id}>
                <p className="record-topic">{record.topic}</p>
                <h3>{record.title}</h3>
                <p>{record.place}</p>
                <time dateTime="2026-07-15">Reviewed {record.reviewed}</time>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="records-section" id="records">
        <div className="page-shell">
          <div className="section-intro ruled-heading">
            <div>
              <p className="section-kicker">Browse by issue</p>
              <h2>Follow civic movements by subject</h2>
            </div>
          </div>
          <div className="issue-links" aria-label="Browse records by issue">
            <a href="#records">Land and rehabilitation</a>
            <a href="#records">Labour and employment</a>
            <a href="#records">Education</a>
            <a href="#records">Environment</a>
            <a href="#records">Agriculture</a>
          </div>
        </div>
      </section>

      <section className="verification-section" aria-labelledby="verification-title">
        <div className="page-shell">
          <div className="section-intro compact-intro">
            <div>
              <p className="section-kicker">Evidence language</p>
              <h2 id="verification-title">The record shows degrees of certainty.</h2>
            </div>
            <p>
              Verification labels are applied to individual claims. They are not blanket scores for
              an entire movement.
            </p>
          </div>

          <div className="verification-grid">
            {verificationLabels.map(([label, description]) => (
              <div className="verification-item" key={label}>
                <span>{label}</span>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="methodology-section" id="methodology">
        <div className="page-shell methodology-layout">
          <div className="methodology-heading">
            <p className="section-kicker light-kicker">Methodology</p>
            <h2>Broad discovery. Conservative publication.</h2>
            <p>
              Every record is built to preserve evidence, uncertainty and correction history—not to
              reward speed, outrage or virality.
            </p>
            <a className="button button-light" href="#methodology">
              Read the methodology
            </a>
          </div>

          <ol className="process-list">
            {processSteps.map(([number, title, description]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="coverage-section">
        <div className="page-shell coverage-grid">
          <div>
            <p className="section-kicker">Coverage</p>
            <h2>India-wide in scope. Selective by design.</h2>
            <p>
              The repository currently includes records from Assam, Chandigarh, Delhi, Gujarat,
              Karnataka, Madhya Pradesh, Maharashtra, Manipur, Odisha and Uttar Pradesh.
            </p>
          </div>
          <div className="coverage-ledger" aria-label="Coverage notes">
            <div>
              <strong>10</strong>
              <span>states and Union Territories represented</span>
            </div>
            <div>
              <strong>6</strong>
              <span>primary issue areas currently documented</span>
            </div>
            <div>
              <strong>0</strong>
              <span>live locations or participant directories published</span>
            </div>
          </div>
        </div>
      </section>

      <section className="participation-section">
        <div className="page-shell participation-grid">
          <div className="lead-panel" id="lead">
            <p className="section-kicker light-kicker">Contribute</p>
            <h2>Know of an undercovered civic event?</h2>
            <p>
              Share a public source link, approximate date and broad location. Do not submit private
              documents, participant lists or tactical information.
            </p>
            <a className="button button-light" href="#lead">
              Submit a public lead
            </a>
          </div>

          <div className="corrections-panel" id="corrections">
            <p className="section-kicker">Corrections</p>
            <h2>A public record should be correctable.</h2>
            <p>
              Material changes are logged with the earlier wording, revised wording, evidence and
              date. Consequential records are not silently rewritten.
            </p>
            <a className="text-link" href="#corrections">
              View the correction process <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-grid">
          <div>
            <span className="footer-brand">India Observed</span>
            <p>A curated, source-linked public record of civic action across India.</p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#records">Explore records</a>
            <a href="#methodology">Methodology</a>
            <a href="#corrections">Corrections</a>
            <a href="#lead">Submit a lead</a>
          </nav>
          <div className="footer-meta">
            <span>Curated coverage</span>
            <span>Human approval required</span>
            <span>Human review before publication</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
