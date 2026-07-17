import Link from "next/link";
import { FeaturedRecordCarousel } from "./components/FeaturedRecordCarousel";

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
const latestRecords = [
  {
    id: "IO-CM-MP-0001",
    topic: "Land & rehabilitation",
    place: "Chhatarpur–Panna, Madhya Pradesh",
    title:
      "Project-affected communities resume protest over rehabilitation and compensation in Bundelkhand",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-DL-0001",
    topic: "Education",
    place: "Jantar Mantar, New Delhi",
    title: "Education accountability sit-in and hunger strike continues at Jantar Mantar",
    reviewed: "15 July 2026",
  },
  {
    id: "IO-CM-MH-0001",
    topic: "Environment",
    place: "Thane, Maharashtra",
    title: "Citizens form human chain in Thane under the Save SGNP campaign",
    reviewed: "15 July 2026",
  },
] as const;
const onRecord = {
  id: "IO-CM-GJ-0001",
  topic: "Land & rehabilitation",
  place: "Jetpar village, Morbi district, Gujarat",
  title:
    "Morbi farmers continue satyagraha over compensation for power-transmission infrastructure",
  context:
    "Farmers centred in Jetpar village began protesting on 7 June over compensation for agricultural land affected by power-transmission infrastructure. After an indefinite hunger strike and revised compensation guidelines announced on 4 July, they ended the fast on 7 July but continued the movement as a satyagraha, saying questions about land valuation, right-of-way compensation and implementation remained.",
  reviewed: "15 July 2026",
} as const;

const verificationLabels = [
  ["Reported", "A credible source has reported the claim."],
  ["Corroborated", "Independent evidence supports the claim."],
  ["Attributed", "The statement is clearly tied to its source."],
  ["Disputed", "Credible accounts materially disagree."],
  ["Corrected", "A material change has been publicly logged."],
] as const;

const processSteps = [
  ["1", "Find the event", "Identify credible public reporting and official information."],
  [
    "2",
    "Separate the claims",
    "Distinguish verified details, attributed statements and disputed information.",
  ],
  ["3", "Check the evidence", "Compare independent sources and supporting documents."],
  ["4", "Review before publication", "Apply accuracy, privacy, safety and correction checks."],
] as const;

export default function HomePage() {
  return (
    <main id="home">
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
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#events">Events</a>
            <a href="#methodology">Methodology</a>
            <a className="nav-action" href="#lead">
              Submit a lead
            </a>
          </nav>

          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#events">Events</a>
              <a href="#methodology">Methodology</a>
              <a className="nav-action" href="#lead">
                Submit a lead
              </a>
            </nav>
          </details>
        </div>
      </header>

      <div className="utility-bar">
        <div className="page-shell utility-bar-inner">
          <span>Sources linked. Identities protected. Corrections visible.</span>
        </div>
      </div>

      <FeaturedRecordCarousel records={featuredRecords} latestRecords={latestRecords} />

      <section className="on-record-section" aria-labelledby="on-record-title">
        <div className="page-shell">
          <h2 id="on-record-title">ON record</h2>

          <article className="on-record-context">
            <div className="on-record-meta">
              <span>{onRecord.id}</span>
              <span>{onRecord.topic}</span>
              <span>{onRecord.place}</span>
            </div>
            <h3>{onRecord.title}</h3>
            <p>{onRecord.context}</p>
            <time dateTime="2026-07-15">Reviewed {onRecord.reviewed}</time>
          </article>
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
          <div className="methodology-intro">
            <h2>Methodology</h2>
            <p className="methodology-subheading">How are records reviewed</p>
            <p className="methodology-description">
              Every record is reviewed before publication. We verify the event, separate claims from
              established facts, compare supporting sources and check for privacy or safety risks.
            </p>
          </div>

          <ol className="process-list" aria-label="Four-stage editorial process">
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
