import { LaunchPolicyPage } from "@/app/components/LaunchPolicyPage";

export const metadata = {
  title: "About",
  description: "About India Observed and its public-interest civic record.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LaunchPolicyPage
      description="India Observed maintains independent, source-linked records of protests and civic movements across India."
      kicker="ABOUT"
      path="/about"
      title="A public record built for verification"
    >
      <section>
        <h2>What we publish</h2>
        <p>
          Each event record separates established details, attributed claims, disputed accounts,
          official responses and unresolved questions. Publication is a human editorial decision.
        </p>
      </section>
      <section>
        <h2>What we do not publish</h2>
        <p>
          India Observed does not publish participant directories, live tactical locations,
          confidential-source identities or media that has not passed source, rights, privacy and
          safety review.
        </p>
      </section>
    </LaunchPolicyPage>
  );
}
