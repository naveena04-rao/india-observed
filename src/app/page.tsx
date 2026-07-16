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
      <div className="utility-bar">
        <div className="page-shell utility-bar-inner">
          <span>Curated civic records from across India</span>
          <span>Updated through 15 July 2026</span>
        </div>
      </div>

      <header className="site-header">
        <div className="page-shell header-inner">
          <Link className="brand" href="/" aria-label="India Observed home">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="brand-copy">
              <strong>India Observed</strong>
              <small>A public record of civic action</small>
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

      <section className="hero-section">
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">Independent public-interest archive</p>
            <h1>Civic movements are often reported briefly and remembered poorly.</h1>
            <p className="hero-lede">
              India Observed creates structured, source-linked records of selected protests and
              civic movements across India—showing what is known, who said it and what remains
              uncertain.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#records">
                Explore the records
              </a>
              <a className="text-link" href="#methodology">
                How verification works <span aria-hidden="true">→</span>
              </a>
            </div>
            <p className="hero-disclaimer">
              Curated coverage. No live protest tracking. No ordinary participant identification.
            </p>
          </div>

          <aside className="repository-brief" aria-label="Repository summary">
            <p className="brief-label">Repository brief</p>
            <dl>
              <div>
                <dt>Reviewed events</dt>
                <dd>11</dd>
              </div>
              <div>
                <dt>States and UTs represented</dt>
                <dd>10</dd>
              </div>
              <div>
                <dt>Claim-level records</dt>
                <dd>89</dd>
              </div>
              <div>
                <dt>Original sources</dt>
                <dd>46</dd>
              </div>
            </dl>
            <p className="brief-note">
              Coverage is selective and should not be read as a complete map of civic activity.
            </p>
          </aside>
        </div>
      </section>

      <section className="search-band" aria-labelledby="search-heading">
        <div className="page-shell search-layout">
          <div>
            <p className="section-kicker muted-kicker">Search the archive</p>
            <h2 id="search-heading">Find a record by place, project or issue.</h2>
          </div>
          <form className="archive-search" role="search" action="#records">
            <label className="sr-only" htmlFor="archive-search-input">
              Search India Observed records
            </label>
            <input
              id="archive-search-input"
              name="q"
              placeholder="Event, district, organisation, project or issue"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
          <div className="topic-links" aria-label="Browse sample topics">
            <span>Browse:</span>
            <a href="#records">Land</a>
            <a href="#records">Environment</a>
            <a href="#records">Education</a>
            <a href="#records">Labour</a>
            <a href="#records">Agriculture</a>
          </div>
        </div>
      </section>

      <section className="records-section" id="records">
        <div className="page-shell">
          <div className="section-intro ruled-heading">
            <div>
              <p className="section-kicker">Selected records</p>
              <h2>Recent entries in the civic archive</h2>
            </div>
            <a className="text-link" href="#records">
              View all records <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="record-list">
            {featuredRecords.map((record) => (
              <article className="record-entry" key={record.id}>
                <div className="record-topline">
                  <span className="record-id">{record.id}</span>
                  <span className={`record-status ${record.statusTone}`}>{record.status}</span>
                </div>
                <div className="record-main">
                  <div className="record-title-block">
                    <p className="record-topic">{record.topic}</p>
                    <h3>{record.title}</h3>
                    <p className="record-place">{record.place}</p>
                  </div>
                  <div className="record-verification">
                    <span>{record.verification}</span>
                    <p>{record.note}</p>
                  </div>
                  <div className="record-review">
                    <span>Last reviewed</span>
                    <time dateTime="2026-07-15">{record.reviewed}</time>
                    <a href="#records" aria-label={`View record ${record.id}`}>
                      View record <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
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
            <span>No live tracking</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
