import Link from "next/link";
import type { ReactNode } from "react";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";

export type EditorialGuideItem = {
  title: string;
  description: string;
};

export function EditorialSummaryStrip({
  items,
  label,
}: {
  items: readonly EditorialGuideItem[];
  label: string;
}) {
  return (
    <dl className="editorial-summary-strip" aria-label={label}>
      {items.map((item) => (
        <div key={item.title}>
          <dt>{item.title}</dt>
          <dd>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EditorialFeatureGrid({
  items,
  label,
}: {
  items: readonly EditorialGuideItem[];
  label: string;
}) {
  return (
    <dl className="editorial-feature-grid" aria-label={label}>
      {items.map((item) => (
        <div key={item.title}>
          <dt>{item.title}</dt>
          <dd>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MethodologyStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="editorial-methodology-step">
      <span aria-hidden="true">{number}</span>
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    </li>
  );
}

export function EditorialCallout({
  title,
  children,
  links,
}: {
  title: string;
  children: ReactNode;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <aside className="editorial-callout" aria-labelledby="editorial-callout-title">
      <h2 id="editorial-callout-title">{title}</h2>
      {children}
      <nav aria-label={`${title} links`}>
        {links.map((link) => (
          <Link className="button" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function EditorialGuidePage({
  kicker,
  title,
  introduction,
  path,
  summaryLabel,
  summaryItems,
  children,
}: {
  kicker: string;
  title: string;
  introduction: string;
  path: string;
  summaryLabel: string;
  summaryItems: readonly EditorialGuideItem[];
  children: ReactNode;
}) {
  return (
    <ArchiveShell authReturnTo={path}>
      <article className="editorial-guide-page page-shell">
        <header className="editorial-guide-hero">
          <div className="editorial-guide-heading">
            <p className="section-kicker">{kicker}</p>
            <h1>{title}</h1>
            <p className="editorial-guide-introduction">{introduction}</p>
          </div>
          <EditorialSummaryStrip items={summaryItems} label={summaryLabel} />
        </header>
        <div className="editorial-guide-body">{children}</div>
      </article>
    </ArchiveShell>
  );
}
