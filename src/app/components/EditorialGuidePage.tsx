import Link from "next/link";
import type { ReactNode } from "react";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";

export type StoryPrinciple = {
  marker: string;
  title: string;
  description: string;
};

export type StoryRow = {
  label: string;
  description: string;
};

export type StoryProcessStage = {
  number: string;
  shortTitle: string;
  title: string;
  description: readonly string[];
};

export function StoryHero({
  eyebrow,
  title,
  introduction,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
}) {
  return (
    <header className="editorial-hero story-hero">
      <div className="story-hero-copy">
        <p className="editorial-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="editorial-hero-introduction">{introduction}</p>
      </div>
    </header>
  );
}

export function StoryStatement({ children }: { children: ReactNode }) {
  return (
    <section className="editorial-section story-statement" aria-labelledby="story-statement-title">
      <h2 className="visually-hidden" id="story-statement-title">
        India Observed mission
      </h2>
      <p>{children}</p>
    </section>
  );
}

export function StorySection({
  id,
  title,
  tone = "plain",
  children,
}: {
  id: string;
  title: string;
  tone?: "plain" | "teal" | "warm";
  children: ReactNode;
}) {
  return (
    <section
      className={`editorial-section editorial-section--${tone}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="editorial-reading-column">
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function StorySplitSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="editorial-section story-split-section" aria-labelledby={`${id}-title`}>
      <div className="story-split-copy">
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function StoryPrinciples({
  items,
  label,
  title,
}: {
  items: readonly StoryPrinciple[];
  label: string;
  title: string;
}) {
  return (
    <section
      className="editorial-key-points story-principles"
      aria-labelledby="story-principles-title"
    >
      <h2 id="story-principles-title">{title}</h2>
      <div className="story-principles-list" aria-label={label}>
        {items.map((item) => (
          <article key={item.title}>
            <span aria-hidden="true">{item.marker}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StoryRows({
  items,
  label,
  variant = "standard",
}: {
  items: readonly StoryRow[];
  label: string;
  variant?: "standard" | "verification";
}) {
  return (
    <dl className={`editorial-rows editorial-rows--${variant}`} aria-label={label}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StoryProcess({ stages }: { stages: readonly StoryProcessStage[] }) {
  return (
    <section className="methodology-sequence story-process" aria-labelledby="story-process-title">
      <h2 className="visually-hidden" id="story-process-title">
        Four-stage review process
      </h2>

      <ol className="methodology-progress" aria-label="Four-stage review overview">
        {stages.map((stage) => (
          <li key={stage.number}>
            <span>{stage.number.padStart(2, "0")}</span>
            <strong>{stage.shortTitle}</strong>
          </li>
        ))}
      </ol>

      <ol className="methodology-steps">
        {stages.map((stage) => (
          <li key={stage.number}>
            <span className="methodology-step-number" aria-hidden="true">
              {stage.number.padStart(2, "0")}
            </span>
            <div>
              <h3>{stage.title}</h3>
              {stage.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StoryClosing({
  title,
  description,
  primaryLink,
  secondaryLink,
}: {
  title: string;
  description: string;
  primaryLink: { href: string; label: string };
  secondaryLink?: { href: string; label: string };
}) {
  return (
    <section className="editorial-closing" aria-labelledby="story-closing-title">
      <div>
        <h2 id="story-closing-title">{title}</h2>
        <p>{description}</p>
      </div>
      <nav aria-label={`${title} links`}>
        <Link className="button" href={primaryLink.href}>
          {primaryLink.label}
        </Link>
        {secondaryLink ? (
          <Link className="editorial-secondary-link" href={secondaryLink.href}>
            {secondaryLink.label} →
          </Link>
        ) : null}
      </nav>
    </section>
  );
}

export function StoryPage({
  eyebrow,
  title,
  introduction,
  path,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  path: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ArchiveShell authReturnTo={path} hideEditorialPolicyLink={path === "/methodology"}>
      <article className={`editorial-page page-shell${className ? ` ${className}` : ""}`}>
        <div className="editorial-page-inner">
          <StoryHero eyebrow={eyebrow} introduction={introduction} title={title} />
          <div className="editorial-page-content">{children}</div>
        </div>
      </article>
    </ArchiveShell>
  );
}
