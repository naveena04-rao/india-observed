import type { LeadSubmissionInput, PublicLeadSubmissionInput } from "./validation";

type Proposal = LeadSubmissionInput["proposals"][number];

const proposal = (
  fieldKey: Proposal["fieldKey"],
  proposedValue: string,
  explanation = "",
  existingValueSnapshot = "",
): Proposal => ({ fieldKey, proposedValue, explanation, existingValueSnapshot });

function sourceSummary(input: PublicLeadSubmissionInput) {
  if (input.contributionType === "public-source") return input.sourceExplanation;
  if (input.contributionType === "correction") return input.correctionReason;
  if (input.contributionType === "official-response") return input.responseAddresses;
  return input.whatHappened;
}

export function mapPublicLeadSubmission(input: PublicLeadSubmissionInput): LeadSubmissionInput {
  const proposals: Proposal[] = [];

  if (input.contributionType === "new-event") {
    proposals.push(proposal("neutral_summary", input.whatHappened));
    proposals.push(proposal("general_location", input.location));
    proposals.push(proposal("event_type", input.eventType));
    if (input.eventDate)
      proposals.push(
        proposal(
          "start_date",
          input.eventDate,
          input.datePrecision === "approximate" ? "Reader described this date as approximate." : "",
        ),
      );
    if (input.datePrecision === "ongoing") proposals.push(proposal("lifecycle_status", "Ongoing"));
    if (input.publicParticipants)
      proposals.push(proposal("public_participants", input.publicParticipants));
    if (input.mainIssues) proposals.push(proposal("main_issue", input.mainIssues));
    if (input.authorityResponse)
      proposals.push(proposal("latest_official_response", input.authorityResponse));
    if (input.outcome) proposals.push(proposal("outcome_or_follow_up", input.outcome));
  }

  if (input.contributionType === "public-source" && input.sourceExplanation)
    proposals.push(proposal("editorial_mapping", input.sourceExplanation));

  if (input.contributionType === "correction")
    proposals.push(
      proposal(
        "correction_request",
        input.correctionReplacement,
        input.correctionReason,
        input.correctionIncorrect,
      ),
    );

  if (input.contributionType === "official-response") {
    const responseContext = [
      `Authority or organisation: ${input.authorityName}`,
      input.officialName ? `Official or public role: ${input.officialName}` : "",
      `Response date: ${input.responseDate}`,
      input.responseAddresses ? `Addresses: ${input.responseAddresses}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    proposals.push(proposal("latest_official_response", input.officialResponse, responseContext));
  }

  const sources = input.sourceLinks.map((url) => {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return {
      url,
      headline: `Submitted public source from ${host}`,
      publisher: host,
      sourceType:
        input.contributionType === "official-response"
          ? ("Official government source" as const)
          : ("Original media reporting" as const),
      sourceRole:
        input.contributionType === "official-response"
          ? ("Official response" as const)
          : input.contributionType === "new-event"
            ? ("Lead" as const)
            : ("Corroboration" as const),
      publicationDate: "",
      language: "",
      summary: sourceSummary(input),
      supportedFieldKey: "" as const,
    };
  });

  const media = [
    ...input.photoUrls.map((url) => ({ mediaType: "photo" as const, url })),
    ...input.videoUrls.map((url) => ({ mediaType: "video" as const, url })),
  ].map(({ mediaType, url }) => {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return {
      mediaType,
      url,
      caption: `Reader-submitted public ${mediaType} reference`,
      sourceOrCreator: host,
      publicationDate: "",
      depicts: sourceSummary(input) || "Public evidence related to this contribution.",
      privacySafetyNote: "Public URL submitted for human privacy and safety review.",
    };
  });

  return {
    submissionMode: input.submissionMode,
    contributionType: input.contributionType,
    relatedEventSlug: input.relatedEventSlug,
    relatedEventId: input.relatedEventId,
    proposals,
    sources,
    media,
    editorialNotes: input.editorialNotes,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    goodFaith: input.goodFaith,
    policyAcknowledgement: input.policyAcknowledgement,
    website: input.website,
    formStartedAt: input.formStartedAt,
  };
}
