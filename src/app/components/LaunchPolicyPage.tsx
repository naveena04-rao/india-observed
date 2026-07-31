import Link from "next/link";
import type { ReactNode } from "react";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { StoryPage } from "@/app/components/EditorialGuidePage";

export function LaunchPolicyPage({
  kicker,
  title,
  description,
  children,
  path,
  presentation = "launch",
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  path: string;
  presentation?: "launch" | "standards";
}) {
  if (presentation === "standards") {
    return (
      <StoryPage
        className="editorial-page--standards"
        eyebrow={kicker}
        introduction={description}
        path={path}
        title={title}
      >
        {children}
        <p className="standards-back-link">
          <Link href="/events">Return to Events</Link>
        </p>
      </StoryPage>
    );
  }

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
