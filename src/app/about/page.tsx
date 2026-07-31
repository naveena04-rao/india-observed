import {
  StoryClosing,
  StoryPage,
  StoryPrinciples,
  StoryRows,
  StorySection,
} from "@/app/components/EditorialGuidePage";

export const metadata = {
  title: "About India Observed",
  description:
    "Why India Observed documents protests and civic movements, and how its public records are designed.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    marker: "01",
    title: "Source-linked",
    description: "Every record shows the reporting and documents used to review it.",
  },
  {
    marker: "02",
    title: "Human-reviewed",
    description: "Publication, updates and corrections are editorial decisions.",
  },
  {
    marker: "03",
    title: "Safety-conscious",
    description:
      "Sensitive identities and details are withheld when publishing them could cause harm.",
  },
] as const;

const recordRows = [
  {
    label: "Event",
    description:
      "When and where it happened, what form it took and whether it is ongoing or concluded.",
  },
  {
    label: "Demands and concerns",
    description: "What participants, organisations or affected communities say they are seeking.",
  },
  {
    label: "Responses",
    description: "Relevant statements, actions or decisions from authorities and organisations.",
  },
  {
    label: "Open questions",
    description: "Details that remain disputed, incomplete or unsupported by available evidence.",
  },
] as const;

export default function AboutPage() {
  return (
    <StoryPage
      className="editorial-page--about"
      eyebrow="ABOUT INDIA OBSERVED"
      introduction="India Observed brings protests, strikes, marches and other civic movements into one clear, source-linked public record. Public events are often reported in fragments. India Observed brings those fragments together into a record people can inspect."
      path="/about"
      title="Civic events, clearly documented."
    >
      <StorySection id="why-india-observed-exists" title="Why India Observed exists">
        <p>
          Reporting about a public event may be spread across articles, videos, statements and
          social posts. India Observed organises that material so readers can understand what
          happened, what people are asking for, how authorities responded and what remains
          unresolved.
        </p>

        <h3>What stays private</h3>
        <p>
          India Observed does not publish confidential-source identities, participant directories,
          live tactical locations or private documents. Images and videos are reviewed for event
          match, attribution, privacy and safety before they appear publicly.
        </p>

        <h3>A public record is not static</h3>
        <p>
          Records may change when stronger evidence, an official response, a correction or a
          meaningful outcome becomes available. Review dates and important corrections remain
          visible so readers can understand what changed.
        </p>
      </StorySection>

      <StoryPrinciples
        items={principles}
        label="India Observed editorial commitments"
        title="Core principles"
      />

      <StorySection id="what-records-contain" title="What a record contains">
        <StoryRows items={recordRows} label="Information shown in an event record" />
      </StorySection>

      <StoryClosing
        description="Open any event to inspect its sources, current status and latest review."
        primaryLink={{ href: "/events", label: "Explore events" }}
        secondaryLink={{ href: "/methodology", label: "How records are reviewed" }}
        title="Explore the record"
      />
    </StoryPage>
  );
}
