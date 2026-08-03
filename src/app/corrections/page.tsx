import Link from "next/link";
import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";
import { getPublicContactEmail } from "@/lib/site";

export const metadata = {
  title: "Corrections",
  description: "India Observed corrections and clarification policy.",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  const contactEmail = getPublicContactEmail();
  return (
    <LaunchPolicyPage
      description="Consequential corrections remain visible and connected to the affected record."
      kicker="CORRECTIONS"
      path="/corrections"
      presentation="standards"
      title="Corrections remain part of the record"
    >
      <section>
        <h2>How corrections are handled</h2>
        <p>
          A correction records the earlier wording, corrected wording, reason, supporting source,
          date and review status. Clarifications do not silently erase the publication history.
        </p>
      </section>
      <section>
        <h2>Suggest a correction</h2>
        {contactEmail ? (
          <p>
            Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>, or use the guidance on the{" "}
            <Link href="/contact">Contact page</Link>. Do not submit private participant
            information.
          </p>
        ) : (
          <p role="status">
            The public corrections address has not yet been configured. Production launch remains
            blocked when contact configuration is required.
          </p>
        )}
      </section>
    </LaunchPolicyPage>
  );
}
