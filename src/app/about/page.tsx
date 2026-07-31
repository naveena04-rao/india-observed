import {
  EditorialCallout,
  EditorialFeatureGrid,
  EditorialGuidePage,
} from "@/app/components/EditorialGuidePage";

export const metadata = {
  title: "About India Observed",
  description:
    "Why India Observed documents protests and civic movements, and how its public records are designed.",
  alternates: { canonical: "/about" },
};

const summaryItems = [
  {
    title: "Source-linked",
    description: "Every published record links to the material used to review it.",
  },
  {
    title: "Human-reviewed",
    description: "Publication and correction decisions are made through editorial review.",
  },
  {
    title: "Safety-conscious",
    description:
      "Private identities and sensitive details are withheld when publication could cause harm.",
  },
] as const;

const recordFeatures = [
  {
    title: "What happened",
    description: "The date, place, event type and current status.",
  },
  {
    title: "What people are asking for",
    description: "The demands, concerns or grievances reported by participants and sources.",
  },
  {
    title: "What authorities or organisations said",
    description: "Relevant official responses and attributed statements.",
  },
  {
    title: "What remains unclear",
    description: "Disputed details, missing information and questions that still require evidence.",
  },
] as const;

export default function AboutPage() {
  return (
    <EditorialGuidePage
      introduction="India Observed documents protests, strikes, marches and other civic movements across India. Each record brings the event, claims, responses, sources and unresolved questions together in one place."
      kicker="ABOUT INDIA OBSERVED"
      path="/about"
      summaryItems={summaryItems}
      summaryLabel="India Observed editorial commitments"
      title="A public record of civic action"
    >
      <section>
        <h2>Why this exists</h2>
        <p>
          Public events are often reported in fragments. One source may describe what happened,
          another may carry an official response, and important questions may remain unresolved.
        </p>
        <p>
          India Observed organises that material into a clear record that can be checked, revisited
          and corrected.
        </p>
      </section>

      <section>
        <h2>What each record shows</h2>
        <EditorialFeatureGrid items={recordFeatures} label="Information shown in an event record" />
      </section>

      <section>
        <h2>What we do not publish</h2>
        <p>
          We do not publish participant directories, confidential-source identities, live tactical
          locations or private documents.
        </p>
        <p>
          Media is reviewed for source, event match, privacy, safety and attribution before it
          appears publicly.
        </p>
      </section>

      <section>
        <h2>A record can change</h2>
        <p>
          Records are updated when stronger evidence, an official response, a correction or a
          meaningful outcome becomes available.
        </p>
        <p>
          Earlier wording should not disappear silently. Important corrections and review dates
          should remain visible.
        </p>
      </section>

      <EditorialCallout
        links={[
          { href: "/events", label: "Explore events" },
          { href: "/methodology", label: "Read the methodology" },
        ]}
        title="See the record for yourself"
      >
        <p>
          Open any event to review its sources, verification status and latest editorial review.
        </p>
      </EditorialCallout>
    </EditorialGuidePage>
  );
}
