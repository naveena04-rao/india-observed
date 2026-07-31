import { z } from "zod";

export const MAX_LEAD_PAYLOAD_BYTES = 32 * 1024;
export const MAX_SOURCE_LINKS = 10;
export const contributionTypes = [
  "new-lead",
  "public-source",
  "correction",
  "official-response",
] as const;
export const leadMediaTypes = ["none", "photo", "video", "photo-and-video"] as const;

const trimmed = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum, `Enter at least ${minimum} characters.`)
    .max(maximum, `Enter no more than ${maximum} characters.`);

const sourceUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Use an HTTP or HTTPS link.");

const phone = z
  .string()
  .trim()
  .max(30)
  .refine((value) => value === "" || /^\+?[()\d\s-]+$/.test(value), "Enter a valid phone number.")
  .refine((value) => {
    if (!value) return true;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15 && (value.match(/\+/g)?.length ?? 0) <= 1;
  }, "Enter a phone number containing 7 to 15 digits.");

export const leadSubmissionSchema = z
  .object({
    title: trimmed(5, 160),
    description: trimmed(40, 5000),
    location: trimmed(2, 200),
    datePrecision: z.enum(["exact", "approximate", "ongoing"]),
    eventDate: z.string().trim().max(10),
    sourceLinks: z
      .array(sourceUrl)
      .max(MAX_SOURCE_LINKS, `Add no more than ${MAX_SOURCE_LINKS} source links.`),
    mediaType: z.enum(leadMediaTypes),
    relatedEventSlug: z
      .string()
      .trim()
      .max(120)
      .refine(
        (value) => value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
        "Invalid related event.",
      ),
    contributionType: z.enum(contributionTypes),
    additionalContext: z.string().trim().max(3000, "Enter no more than 3000 characters."),
    contactEmail: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, "Enter no more than 254 characters.")
      .email("Enter a valid email address."),
    contactPhone: phone,
    goodFaith: z.literal(true, { error: "Confirm that the submission is made in good faith." }),
    policyAcknowledgement: z.literal(true, { error: "Confirm that you have read the policies." }),
    website: z.string().max(200).default(""),
    formStartedAt: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    if (value.datePrecision !== "ongoing" && !/^\d{4}-\d{2}-\d{2}$/.test(value.eventDate)) {
      context.addIssue({
        code: "custom",
        path: ["eventDate"],
        message: "Enter a date or mark the event as ongoing.",
      });
    }
    if (value.eventDate && !Number.isFinite(Date.parse(`${value.eventDate}T00:00:00Z`))) {
      context.addIssue({ code: "custom", path: ["eventDate"], message: "Enter a valid date." });
    }
  });

export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;

export function normalisePhone(value: string) {
  return value.trim().replace(/\s+/g, " ") || null;
}

export function fieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(
    Object.entries(flattened)
      .filter(([, messages]) => messages?.[0])
      .map(([field, messages]) => [field, messages?.[0] ?? "Review this field."]),
  );
}
