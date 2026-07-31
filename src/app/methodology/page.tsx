import {
  StoryClosing,
  StoryPage,
  StoryPrinciples,
  StoryProcess,
  StoryRows,
  StorySection,
  type StoryProcessStage,
  type StoryRow,
} from "@/app/components/EditorialGuidePage";
import { getReviewedEvents } from "@/lib/events/getReviewedEvents";

export const metadata = {
  title: "Methodology",
  description: "How India Observed finds, verifies, reviews and updates civic event records.",
  alternates: { canonical: "/methodology" },
};

const methodologyStages: readonly StoryProcessStage[] = [
  {
    number: "1",
    shortTitle: "Find",
    title: "Find the event",
    description: [
      "We begin with public reporting, official information or a credible public lead. There must be enough reliable information to establish that the event occurred.",
    ],
  },
  {
    number: "2",
    shortTitle: "Separate",
    title: "Separate the information",
    description: [
      "A report may mix confirmed details, participant claims, official responses and opinion. We separate them so readers can see what is established, what is attributed and what remains disputed.",
    ],
  },
  {
    number: "3",
    shortTitle: "Check",
    title: "Check the evidence",
    description: [
      "We compare sources and look for official notices, statements, photographs, videos and supporting documents. Important or disputed claims require stronger evidence than the basic occurrence of an event.",
    ],
  },
  {
    number: "4",
    shortTitle: "Review",
    title: "Review before publication",
    description: [
      "The record is checked for accuracy, source quality, privacy, safety, media attribution and avoidable harm. Automated tools may assist with organisation and checks, but publication remains a human editorial decision.",
    ],
  },
] as const;

const verificationDefinitions: Record<string, string> = {
  "Occurrence verified": "Reliable evidence establishes that the event took place.",
  "Outcome documented": "A reported response, decision or conclusion has supporting evidence.",
  "Occurrence verified — disputed details remain":
    "The event is established, but important claims or accounts are still contested.",
  "Disputed details remain":
    "The event is established, but important claims or accounts are still contested.",
};

const sourceCriteria = [
  {
    marker: "01",
    title: "Relevance",
    description: "The source directly addresses the event or claim under review.",
  },
  {
    marker: "02",
    title: "Direct knowledge",
    description: "The source is close enough to the facts to offer meaningful evidence.",
  },
  {
    marker: "03",
    title: "Independence",
    description: "The source relationship and possible interests are considered.",
  },
  {
    marker: "04",
    title: "Supporting evidence",
    description: "Documents or corroborating material strengthen consequential claims.",
  },
] as const;

export default async function MethodologyPage() {
  const reviewedEvents = await getReviewedEvents();
  const presentVerificationLabels = new Set(reviewedEvents.map((event) => event.eventVerification));
  const verificationRows: StoryRow[] = Object.entries(verificationDefinitions).flatMap(
    ([label, description]) =>
      presentVerificationLabels.has(label) ? [{ label, description }] : [],
  );

  return (
    <StoryPage
      className="editorial-page--methodology"
      eyebrow="METHODOLOGY"
      introduction="Every event passes through the same four-stage process before it appears publicly."
      path="/methodology"
      title="How an event becomes a record."
    >
      <StoryProcess stages={methodologyStages} />

      <StorySection id="verification-labels" title="How to read verification labels">
        <StoryRows
          items={verificationRows}
          label="Verification labels currently used by published event records"
          variant="verification"
        />
      </StorySection>

      <StorySection id="source-assessment" title="A source count is not a reliability score">
        <p>
          Readers can open every public source used in a record. Sources are judged by relevance,
          direct knowledge, independence and supporting evidence—not simply by how many links are
          available.
        </p>
      </StorySection>

      <StoryPrinciples
        items={sourceCriteria}
        label="Source assessment criteria"
        title="What we assess"
      />

      <StorySection
        id="privacy-and-media"
        title="Not every available detail is published"
        tone="warm"
      >
        <p>
          Names, close-up images, medical-distress scenes and sensitive locations may be withheld
          when disclosure creates unnecessary risk. Published media must depict the event, identify
          its source and carry visible credit.
        </p>
      </StorySection>

      <StorySection id="updates-and-corrections" title="Records remain open to stronger evidence">
        <p>
          Records can be revised when new evidence, responses or outcomes become available. The
          latest review date and meaningful corrections remain visible.
        </p>
      </StorySection>

      <StoryClosing
        description="Open a record and compare its summary with the evidence and sources shown alongside it."
        primaryLink={{ href: "/events", label: "Explore events" }}
        title="See the methodology in practice"
      />
    </StoryPage>
  );
}
