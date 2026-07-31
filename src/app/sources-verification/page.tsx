import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";

export const metadata = {
  title: "Sources and verification",
  description: "How India Observed links sources and communicates verification limits.",
  alternates: { canonical: "/sources-verification" },
};

export default function SourcesVerificationPage() {
  return (
    <LaunchPolicyPage
      description="Public claims resolve to reviewed sources, with source roles and limitations kept visible."
      kicker="SOURCES & VERIFICATION"
      path="/sources-verification"
      presentation="standards"
      title="How evidence is connected"
    >
      <section>
        <h2>Source roles</h2>
        <p>
          Sources may establish occurrence, corroborate details, provide official context, record a
          response or document later developments. Repeated reporting is not treated as independent
          corroboration when it relies on the same underlying account.
        </p>
      </section>
      <section>
        <h2>Verification language</h2>
        <p>
          Records disclose when occurrence is verified but details remain disputed, attributed or
          unresolved. Public wording is narrower than private editorial notes.
        </p>
      </section>
    </LaunchPolicyPage>
  );
}
