import { StoryPage } from "@/app/components/EditorialGuidePage";
import { LeadSubmissionForm } from "./LeadSubmissionForm";

export const metadata = {
  title: "Submit a lead | India Observed",
  description: "Privately submit information about a civic event for editorial review.",
  alternates: { canonical: "/submit-a-lead" },
};

type SubmitALeadPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const contributionTypes = ["new-lead", "public-source", "correction", "official-response"] as const;

export default async function SubmitALeadPage({ searchParams }: SubmitALeadPageProps) {
  const query = await searchParams;
  const event = typeof query.event === "string" ? query.event : "";
  const requestedType = typeof query.contribution === "string" ? query.contribution : "new-lead";
  const contributionType = contributionTypes.includes(
    requestedType as (typeof contributionTypes)[number],
  )
    ? (requestedType as (typeof contributionTypes)[number])
    : "new-lead";

  return (
    <StoryPage
      className="submit-lead-page"
      eyebrow="SUBMIT A LEAD"
      introduction="Share information about a protest, strike, march, public meeting, civic action, official response or related public-interest event for editorial review. Submission does not guarantee publication."
      path="/submit-a-lead"
      title="Submit a lead"
    >
      <section className="lead-safety-notice" aria-labelledby="lead-safety-title">
        <h2 id="lead-safety-title">Privacy and safety before you submit</h2>
        <ul>
          <li>Do not submit confidential-source identities or participant directories.</li>
          <li>Do not submit live tactical locations.</li>
          <li>Do not submit private documents without permission.</li>
          <li>Do not include information that could place someone at immediate risk.</li>
        </ul>
        <p>
          Submissions are reviewed and are not automatically published. Material may require
          verification before public use.
        </p>
      </section>

      <LeadSubmissionForm contributionType={contributionType} relatedEventSlug={event} />

      <section className="lead-next-steps" aria-labelledby="lead-next-title">
        <h2 id="lead-next-title">What happens next</h2>
        <p>
          Editors review submitted information privately, assess available sources and may contact
          you for clarification. A submission may remain unpublished when evidence, privacy, safety
          or editorial requirements are not met.
        </p>
      </section>
    </StoryPage>
  );
}
