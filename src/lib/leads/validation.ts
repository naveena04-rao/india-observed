import { z } from "zod";
import { eventFieldKeys } from "./eventFieldMap";

export const MAX_LEAD_PAYLOAD_BYTES = 64 * 1024;
export const MAX_PROPOSALS = 20;
export const MAX_SOURCES = 10;
export const MAX_MEDIA = 6;
export const contributionTypes = [
  "new-event",
  "public-source",
  "correction",
  "official-response",
] as const;
export const eventTypes = [
  "Multi-form civic protest",
  "Demonstration",
  "March",
  "Civic campaign",
  "Strike",
  "Sit-in / Dharna",
  "Sit-in",
  "Shutdown",
  "Rally",
  "Hunger strike",
] as const;
export const eventStatuses = ["Ongoing", "Concluded", "Outcome pending"] as const;
export const primaryTopics = [
  "Land & rehabilitation",
  "Education",
  "Agriculture & water",
  "Trade & economic policy",
  "Environment",
  "Labour & employment",
  "Civil rights & justice",
  "Governance & transparency",
  "Infrastructure & public services",
] as const;
export const sourceRoles = [
  "Lead",
  "Corroboration",
  "Follow-up",
  "Official context",
  "Official response",
  "Historical context",
  "Alternate access",
] as const;
export const sourceTypes = [
  "Original media reporting",
  "Follow-up media reporting",
  "Digital news video",
  "Official government source",
  "Organiser statement",
  "Social media lead",
] as const;

const text = (max: number) => z.string().trim().max(max);
const requiredText = (min: number, max: number) =>
  text(max).min(min, `Enter at least ${min} characters.`);
const httpUrl = text(2048)
  .url()
  .refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use an HTTP or HTTPS link.",
  );
const phone = text(30)
  .refine((value) => !value || /^\+?[()\d\s-]+$/.test(value), "Enter a valid phone number.")
  .refine(
    (value) =>
      !value || (value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15),
    "Enter a phone number containing 7 to 15 digits.",
  );
const optionalDate = text(10).refine(
  (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
  "Enter a valid date.",
);
const fieldKey = z.enum(
  eventFieldKeys as [(typeof eventFieldKeys)[number], ...typeof eventFieldKeys],
);

export const proposalSchema = z
  .object({
    fieldKey,
    proposedValue: requiredText(1, 5000),
    existingValueSnapshot: text(5000),
    explanation: text(2000),
  })
  .superRefine((proposal, context) => {
    const controlledValues =
      proposal.fieldKey === "event_type"
        ? eventTypes
        : proposal.fieldKey === "lifecycle_status"
          ? eventStatuses
          : proposal.fieldKey === "primary_topic"
            ? primaryTopics
            : null;
    if (
      controlledValues &&
      !(controlledValues as readonly string[]).includes(proposal.proposedValue)
    )
      context.addIssue({
        code: "custom",
        path: ["proposedValue"],
        message: "Select a listed value.",
      });
    if (
      ["start_date", "end_date"].includes(proposal.fieldKey) &&
      !/^\d{4}-\d{2}-\d{2}$/.test(proposal.proposedValue)
    )
      context.addIssue({ code: "custom", path: ["proposedValue"], message: "Enter a valid date." });
  });
export const sourceSchema = z.object({
  url: httpUrl,
  headline: requiredText(2, 500),
  publisher: requiredText(2, 300),
  sourceType: z.enum(sourceTypes),
  sourceRole: z.enum(sourceRoles),
  publicationDate: optionalDate,
  language: text(80),
  summary: text(1500),
  supportedFieldKey: fieldKey.or(z.literal("")),
});
export const mediaSchema = z.object({
  mediaType: z.enum(["photo", "video"]),
  url: httpUrl,
  caption: requiredText(2, 500),
  sourceOrCreator: requiredText(2, 300),
  publicationDate: optionalDate,
  depicts: requiredText(2, 1000),
  privacySafetyNote: text(1500),
});

export const leadSubmissionSchema = z
  .object({
    submissionMode: z.enum(["new-event", "existing-event"]),
    contributionType: z.enum(contributionTypes),
    relatedEventSlug: text(120).refine(
      (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Invalid related event.",
    ),
    relatedEventId: text(24).refine(
      (value) => !value || /^IO-CM-[A-Z]{2,3}-[0-9]{4}$/.test(value),
      "Invalid related event.",
    ),
    proposals: z.array(proposalSchema).max(MAX_PROPOSALS),
    sources: z.array(sourceSchema).max(MAX_SOURCES),
    media: z.array(mediaSchema).max(MAX_MEDIA),
    editorialNotes: text(3000),
    contactEmail: text(254).toLowerCase().email("Enter a valid email address."),
    contactPhone: phone,
    goodFaith: z.literal(true, { error: "Confirm that the submission is made in good faith." }),
    policyAcknowledgement: z.literal(true, { error: "Confirm that you have read the policies." }),
    website: text(200).default(""),
    formStartedAt: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    const existing = value.submissionMode === "existing-event";
    if (existing !== Boolean(value.relatedEventSlug && value.relatedEventId))
      context.addIssue({
        code: "custom",
        path: ["relatedEventSlug"],
        message: "Select a valid target event.",
      });
    if (
      (!existing && value.contributionType !== "new-event") ||
      (existing && value.contributionType === "new-event")
    )
      context.addIssue({
        code: "custom",
        path: ["contributionType"],
        message: "Invalid contribution type.",
      });
    if (
      ["new-event", "correction", "official-response"].includes(value.contributionType) &&
      value.proposals.length === 0
    )
      context.addIssue({
        code: "custom",
        path: ["proposals"],
        message: "Add at least one proposed event field.",
      });
    if (
      ["public-source", "official-response"].includes(value.contributionType) &&
      value.sources.length === 0
    )
      context.addIssue({
        code: "custom",
        path: ["sources"],
        message: "Add at least one public source.",
      });
    if (
      value.contributionType === "official-response" &&
      !value.proposals.some((proposal) => proposal.fieldKey === "latest_official_response")
    )
      context.addIssue({
        code: "custom",
        path: ["proposals"],
        message: "Propose the official response wording.",
      });
  });

export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;
export function normalisePhone(value: string) {
  return value.trim().replace(/\s+/g, " ") || null;
}
export function fieldErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
  );
}
