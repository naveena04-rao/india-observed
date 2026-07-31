import {
  EditorialCallout,
  EditorialFeatureGrid,
  EditorialGuidePage,
  MethodologyStep,
  type EditorialGuideItem,
} from "@/app/components/EditorialGuidePage";
import { getReviewedEvents } from "@/lib/events/getReviewedEvents";

export const metadata = {
  title: "Methodology",
  description: "How India Observed finds, verifies, reviews and updates civic event records.",
  alternates: { canonical: "/methodology" },
};

const summaryItems = [
  {
    title: "Find",
    description: "Identify a publicly reported civic event.",
  },
  {
    title: "Separate",
    description: "Distinguish facts, claims, responses and disputed details.",
  },
  {
    title: "Check",
    description: "Compare sources and supporting evidence.",
  },
  {
    title: "Review",
    description: "Assess accuracy, privacy, safety and media use.",
  },
] as const;

const verificationDefinitions: Record<string, string> = {
  "Occurrence verified — disputed details remain":
    "Reliable evidence establishes that the event took place, while important claims or accounts remain contested or unresolved.",
};

export default async function MethodologyPage() {
  const reviewedEvents = await getReviewedEvents();
  const presentVerificationLabels = new Set(reviewedEvents.map((event) => event.eventVerification));
  const verificationItems: EditorialGuideItem[] = Object.entries(verificationDefinitions).flatMap(
    ([title, description]) =>
      presentVerificationLabels.has(title) ? [{ title, description }] : [],
  );

  return (
    <EditorialGuidePage
      introduction="Every record passes through the same basic process: find the event, separate the claims, check the evidence and review the risks before publication."
      kicker="OUR METHODOLOGY"
      path="/methodology"
      summaryItems={summaryItems}
      summaryLabel="Four-stage editorial review summary"
      title="How an event becomes a public record"
    >
      <section aria-labelledby="methodology-steps-title">
        <h2 className="visually-hidden" id="methodology-steps-title">
          Four methodology steps
        </h2>
        <ol className="editorial-methodology-steps">
          <MethodologyStep number="1" title="Find the event">
            <p>We begin with public reporting, official information or a credible public lead.</p>
            <p>
              The first question is simple: is there enough reliable information to establish that
              the event occurred?
            </p>
          </MethodologyStep>
          <MethodologyStep number="2" title="Separate the information">
            <p>
              A source may contain confirmed details, participant claims, official responses and
              opinion in the same report.
            </p>
            <p>
              We separate them so readers can see what is established, what is attributed and what
              remains disputed.
            </p>
          </MethodologyStep>
          <MethodologyStep number="3" title="Check the evidence">
            <p>
              We compare sources and look for primary records, official notices, statements,
              photographs, videos and supporting documents.
            </p>
            <p>
              A single source may establish that an event occurred, but stronger or disputed claims
              require additional support.
            </p>
          </MethodologyStep>
          <MethodologyStep number="4" title="Review before publication">
            <p>
              Before publication, the record is checked for accuracy, source quality, privacy,
              safety, media attribution and avoidable harm.
            </p>
            <p>
              Publication is a human editorial decision. Automated tools may assist with
              organisation and checks, but they do not make the final decision.
            </p>
          </MethodologyStep>
        </ol>
      </section>

      <section>
        <h2>What verification labels mean</h2>
        <EditorialFeatureGrid
          items={verificationItems}
          label="Verification labels currently used by published event records"
        />
      </section>

      <section>
        <h2>How sources are used</h2>
        <p>Sources are linked so readers can inspect the underlying reporting and documents.</p>
        <p>
          The number of sources does not by itself determine reliability. Relevance, independence,
          direct knowledge and supporting evidence matter more.
        </p>
      </section>

      <section>
        <h2>Privacy, safety and media</h2>
        <p>Public-interest reporting does not require publishing every available detail.</p>
        <p>
          We may withhold names, close-up images, medical-distress scenes or sensitive locations
          when disclosure creates an unnecessary risk.
        </p>
        <p>Event media must match the event, identify its source and carry visible credit.</p>
      </section>

      <section>
        <h2>Updates and corrections</h2>
        <p>Records can be revised when new evidence, responses or outcomes become available.</p>
        <p>The latest review date and meaningful corrections should remain visible to readers.</p>
      </section>

      <EditorialCallout
        links={[
          { href: "/events", label: "Explore reviewed events" },
          { href: "/editorial-policy", label: "Read the editorial policy" },
        ]}
        title="Continue exploring"
      >
        <p>Review the published records or read the policy that governs editorial decisions.</p>
      </EditorialCallout>
    </EditorialGuidePage>
  );
}
