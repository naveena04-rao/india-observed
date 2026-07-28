import Link from "next/link";
import type { ReactNode } from "react";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";

export function LaunchPolicyPage({
  kicker,
  title,
  description,
  children,
  path,
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  path: string;
}) {
  return (
    <ArchiveShell authReturnTo={path}>
      <article className="privacy-page launch-policy-page page-shell">
        <header>
          <p className="section-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
        <p className="privacy-back-link">
          <Link href="/events">Return to Events</Link>
        </p>
      </article>
    </ArchiveShell>
  );
}
