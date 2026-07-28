import Link from "next/link";
import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";

export const metadata = {
  title: "Corrections",
  description: "India Observed corrections and clarification policy.",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  return (
    <LaunchPolicyPage
      description="Consequential corrections remain visible and connected to the affected record."
      kicker="CORRECTIONS"
      path="/corrections"
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
        <p>
          Use the verified public channel listed on the <Link href="/contact">Contact page</Link>.
          Do not submit private participant information.
        </p>
      </section>
    </LaunchPolicyPage>
  );
}
