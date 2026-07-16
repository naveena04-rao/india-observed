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
          <span>Sources linked. Identities protected. Corrections visible.</span>
        </div>
      </div>

      <section className="hero-section">
        <div className="page-shell hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">Featured record</p>
            <figure className="media-fallback">
              <div className="document-preview" aria-label="Document-style record preview">
                <span>{featuredRecords[0].id}</span>
                <strong>{featuredRecords[0].status}</strong>
                <small>Last reviewed {featuredRecords[0].reviewed}</small>
              </div>
              <figcaption>
                <dl>
                  <div>
                    <dt>Media type</dt>
                    <dd>No approved media</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>Not published</dd>
                  </div>
                  <div>
                    <dt>Caption</dt>
                    <dd>Typographic record preview</dd>
                  </div>
                  <div>
                    <dt>Verification</dt>
                    <dd>Awaiting rights and verification review</dd>
                  </div>
                </dl>
              </figcaption>
            </figure>
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

      <section className="archive-explore" id="records" aria-labelledby="archive-heading">
        <div className="page-shell">
          <div className="stream-heading">
            <p className="section-kicker">Explore the archive</p>
            <h2 id="archive-heading">Find the record you need</h2>
          </div>
          <div className="archive-columns">
            <nav aria-label="Browse records by issue">
              <h3>Browse by issue</h3>
              <a href="#records">Land</a>
              <a href="#records">Environment</a>
              <a href="#records">Education</a>
              <a href="#records">Labour</a>
              <a href="#records">Agriculture</a>
            </nav>
            <div>
              <h3>What the records contain</h3>
              <ul>
                <li>Timelines</li>
                <li>Claims</li>
                <li>Sources</li>
                <li>Responses</li>
                <li>Corrections</li>
              </ul>
            </div>
            <div className="recent-updates">
              <h3>Recently updated</h3>
              <p>No recent record changes have been published.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="verification-section" aria-labelledby="accounts-title">
        <div className="page-shell">
          <div className="section-intro ruled-heading">
            <div>
              <p className="section-kicker">On the record</p>
              <h2 id="accounts-title">Compare the accounts</h2>
            </div>
          </div>
          <div className="accounts-grid">
            <article>
              <span>On the record</span>
              <h3>Movement representatives said</h3>
              <p>No approved on-the-record statement is included in this homepage preview.</p>
            </article>
            <article>
              <span>On the record</span>
              <h3>Authorities said</h3>
              <p>No approved on-the-record statement is included in this homepage preview.</p>
            </article>
            <article>
              <span>Evidence review</span>
              <h3>Sources currently establish</h3>
              <p>
                {featuredRecords[0].verification}. {featuredRecords[0].note}.
              </p>
            </article>
          </div>
          <p className="attribution-note">
            Submitted statements remain attributed claims, not independently verified facts.
          </p>
          <div className="evidence-summary">
            <div className="section-intro compact-intro">
              <div>
                <p className="section-kicker">Evidence summary</p>
                <h2>What the reviewed record supports</h2>
              </div>
            </div>
            <div className="evidence-grid">
              <article>
                <span>Established</span>
                <p>{featuredRecords[0].verification}</p>
              </article>
              <article>
                <span>Disputed</span>
                <p>{featuredRecords[0].note}</p>
              </article>
              <article>
                <span>Still unknown</span>
                <p>
                  The homepage data does not identify which disputed details have since been
                  resolved.
                </p>
              </article>
            </div>
          </div>
          <div className="media-policy">
            <strong>Media standard</strong>
            <p>
              Images, video, documents and maps publish only after verification and rights review.
              Sensitive identities, faces, number plates, minors and precise locations are protected
              where necessary.
            </p>
          </div>
        </div>
      </section>

      <section className="verification-key" aria-label="Verification status definitions">
        <div className="page-shell verification-grid">
          {verificationLabels.map(([label, description]) => (
            <div className="verification-item" key={label}>
              <span>{label}</span>
              <p>{description}</p>
            </div>
          ))}
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
            <h2>Across India, event by event.</h2>
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
        <div className="page-shell open-questions">
          <div className="section-intro ruled-heading">
            <div>
              <p className="section-kicker">Open questions</p>
              <h2>Documentation still needed</h2>
            </div>
          </div>
          <ol>
            <li>
              <span>Documentation gap</span>
              <p>Which disputed details can additional public documentation resolve?</p>
            </li>
            <li>
              <span>Documentation gap</span>
              <p>Has the official response under review been documented in a publishable source?</p>
            </li>
            <li>
              <span>Documentation gap</span>
              <p>Is later outcome documentation available beyond the recorded same-day response?</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="correction-stream" id="corrections">
        <div className="page-shell">
          <div className="section-intro ruled-heading">
            <div>
              <p className="section-kicker">Recent corrections and clarifications</p>
              <h2>Changes remain visible</h2>
            </div>
          </div>
          <div className="correction-empty-state">
            <strong>No recent record changes have been published.</strong>
            <p>Corrections and clarifications will appear here after editorial review.</p>
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
