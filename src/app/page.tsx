import Link from "next/link";

const principles = [
  {
    label: "Evidence first",
    text: "Every public record separates verified occurrence from attributed, disputed, or unconfirmed details.",
  },
  {
    label: "Privacy by default",
    text: "No live tracking, tactical locations, or ordinary participant directories.",
  },
  {
    label: "Transparent corrections",
    text: "Material changes are logged rather than silently overwritten.",
  },
] as const;

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <Link className="wordmark" href="/">
          India Observed
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#principles">Principles</a>
          <a href="#status">Project status</a>
        </nav>
      </header>

      <section className="hero" id="about">
        <p className="eyebrow">Public-interest evidence repository</p>
        <h1>Protests and civic movements, documented with context.</h1>
        <p className="lede">
          India Observed is a curated, source-linked repository for understanding public civic
          events across India. It is designed for verification and historical context—not live
          tracking.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#status">
            View the pilot status
          </a>
          <a className="button secondary" href="#principles">
            Read the core principles
          </a>
        </div>
      </section>

      <section className="scope-note" aria-label="Scope note">
        <strong>Curated coverage:</strong> the pilot does not claim to capture every event in India.
        A missing state or district should never be interpreted as having no civic activity.
      </section>

      <section className="principles" id="principles">
        <div className="section-heading">
          <p className="eyebrow">How the repository works</p>
          <h2>Broad discovery. Conservative publication.</h2>
        </div>
        <div className="card-grid">
          {principles.map((principle) => (
            <article className="principle-card" key={principle.label}>
              <h3>{principle.label}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="status-panel" id="status">
        <div>
          <p className="eyebrow">Engineering foundation</p>
          <h2>Week 1 prototype</h2>
          <p>
            The current build establishes the application shell, database contract, automated
            checks, security boundaries, and editorial handover. Event browsing and evidence pages
            will be implemented in reviewed increments.
          </p>
        </div>
        <dl>
          <div>
            <dt>Reviewed event records</dt>
            <dd>11</dd>
          </div>
          <div>
            <dt>States / UTs represented</dt>
            <dd>10</dd>
          </div>
          <div>
            <dt>Publication control</dt>
            <dd>Human approval</dd>
          </div>
        </dl>
      </section>

      <footer>
        <p>India Observed · Curated, evidence-led, and privacy-preserving.</p>
      </footer>
    </main>
  );
}
