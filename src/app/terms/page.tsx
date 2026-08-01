import Link from "next/link";
import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";

export const metadata = {
  title: "Terms of use",
  description: "Terms governing use of India Observed public records.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LaunchPolicyPage
      description="India Observed provides public-interest records with visible evidence and limitations."
      kicker="TERMS OF USE"
      path="/terms"
      title="Use records with their context intact"
    >
      <section>
        <h2>No endorsement or legal conclusion</h2>
        <p>
          Inclusion records a reviewed civic event; it does not endorse a movement, authority,
          allegation or claim, and it is not legal advice.
        </p>
      </section>
      <section>
        <h2>Sources and third-party media</h2>
        <p>
          Linked reporting and official embeds remain subject to their publishers&apos; terms. India
          Observed credit and source links do not grant downstream reuse rights.
        </p>
      </section>
      <section>
        <h2>Requests</h2>
        <p>
          Corrections, privacy concerns and rights requests may be submitted through the{" "}
          <Link href="/contact">Contact page</Link>.
        </p>
      </section>
    </LaunchPolicyPage>
  );
}
