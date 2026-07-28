import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";

export const metadata = {
  title: "Editorial policy",
  description: "India Observed editorial publication and attribution principles.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <LaunchPolicyPage
      description="Publication requires human review, source-linked evidence and careful attribution."
      kicker="EDITORIAL POLICY"
      path="/editorial-policy"
      title="Evidence before certainty"
    >
      <section>
        <h2>Attribution</h2>
        <p>
          Statements from movements, authorities and institutions remain clearly attributed unless
          independent evidence establishes the underlying fact.
        </p>
      </section>
      <section>
        <h2>Disputed and unresolved information</h2>
        <p>
          Competing accounts remain visible as competing accounts. Absence of evidence is not
          presented as proof that an incident did not occur.
        </p>
      </section>
      <section>
        <h2>Publication control</h2>
        <p>Automated discovery or submission can never publish or approve a record.</p>
      </section>
    </LaunchPolicyPage>
  );
}
