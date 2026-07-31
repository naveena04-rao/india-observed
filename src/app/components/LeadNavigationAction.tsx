"use client";

import type { MouseEvent } from "react";

export function LeadNavigationAction({ onLeadPage }: { onLeadPage: boolean }) {
  const href = onLeadPage ? "#lead-title" : "/submit-a-lead";

  function focusLeadForm(event: MouseEvent<HTMLAnchorElement>) {
    if (!onLeadPage) return;

    const titleField = document.getElementById("lead-title");
    if (!(titleField instanceof HTMLInputElement)) return;

    event.preventDefault();
    window.history.replaceState(null, "", href);
    titleField.scrollIntoView({ behavior: "smooth", block: "center" });
    titleField.focus({ preventScroll: true });
  }

  return (
    <a className="nav-action" href={href} onClick={focusLeadForm}>
      Submit a lead
    </a>
  );
}
