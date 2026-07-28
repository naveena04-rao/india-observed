import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";

export const metadata = {
  title: "Methodology",
  description: "How India Observed finds, verifies and reviews civic event records.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <LaunchPolicyPage
      description="Every record is reviewed before publication, with claims separated from established facts."
      kicker="METHODOLOGY"
      path="/methodology"
      title="How records are reviewed"
    >
      <section>
        <h2>1. Find the event</h2>
        <p>We identify credible public reporting and official information.</p>
      </section>
      <section>
        <h2>2. Separate the claims</h2>
        <p>We distinguish verified details, attributed statements and disputed information.</p>
      </section>
      <section>
        <h2>3. Check the evidence</h2>
        <p>We compare independent sources, primary records and supporting documents.</p>
      </section>
      <section>
        <h2>4. Review before publication</h2>
        <p>We apply accuracy, privacy, safety, media-rights and correction checks.</p>
      </section>
    </LaunchPolicyPage>
  );
}
