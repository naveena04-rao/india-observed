import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/http/sameOrigin";
import { getReviewedEvents } from "@/lib/events/getReviewedEvents";
import { consumeLeadSubmissionAttempt } from "@/lib/leads/rateLimit";
import { mapPublicLeadSubmission } from "@/lib/leads/publicMapping";
import {
  fieldErrors,
  leadSubmissionSchema,
  MAX_LEAD_PAYLOAD_BYTES,
  normalisePhone,
  publicLeadSubmissionSchema,
} from "@/lib/leads/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const validationMessage = "Review the highlighted fields and submit again.";
const duplicateMessage = "This lead appears to have already been submitted.";
const rateLimitMessage = "Too many submission attempts were made. Please try again later.";
const storageMessage = "We could not submit this lead right now. Please try again later.";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ ok: false, message: validationMessage }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_LEAD_PAYLOAD_BYTES) {
    return NextResponse.json({ ok: false, message: validationMessage }, { status: 413 });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_LEAD_PAYLOAD_BYTES) throw new Error();
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, message: validationMessage }, { status: 400 });
  }

  const publicParsed = publicLeadSubmissionSchema.safeParse(body);
  if (!publicParsed.success) {
    return NextResponse.json(
      { ok: false, message: validationMessage, fieldErrors: fieldErrors(publicParsed.error) },
      { status: 400 },
    );
  }

  const publicLead = publicParsed.data;
  const mapped = leadSubmissionSchema.safeParse(mapPublicLeadSubmission(publicLead));
  if (!mapped.success) {
    return NextResponse.json({ ok: false, message: validationMessage }, { status: 400 });
  }
  const lead = mapped.data;
  if (lead.submissionMode === "existing-event") {
    const target = (await getReviewedEvents()).find(
      (event) => event.slug === lead.relatedEventSlug,
    );
    if (!target || target.internalId !== lead.relatedEventId) {
      return NextResponse.json({ ok: false, message: validationMessage }, { status: 400 });
    }
  }
  const elapsed = Date.now() - publicLead.formStartedAt;
  if (publicLead.website) {
    return NextResponse.json({ ok: true });
  }
  if (elapsed < 500 || elapsed > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ ok: false, message: rateLimitMessage }, { status: 429 });
  }
  if (!consumeLeadSubmissionAttempt(request)) {
    return NextResponse.json(
      { ok: false, message: rateLimitMessage },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: storageMessage }, { status: 503 });
  }

  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        submissionMode: lead.submissionMode,
        proposals: lead.proposals,
        sources: lead.sources,
        media: lead.media,
        editorialNotes: lead.editorialNotes,
        relatedEventSlug: lead.relatedEventSlug,
        relatedEventId: lead.relatedEventId,
        contributionType: lead.contributionType,
      }),
    )
    .digest("hex");

  let error: { code?: string } | null;
  try {
    ({ error } = await supabase.rpc("submit_structured_lead", {
      p_contact_email: lead.contactEmail,
      p_contact_phone: normalisePhone(lead.contactPhone),
      p_editorial_notes: lead.editorialNotes || null,
      p_media: lead.media,
      p_proposals: lead.proposals,
      p_related_event_slug: lead.relatedEventSlug || null,
      p_related_event_id: lead.relatedEventId || null,
      p_sources: lead.sources,
      p_submission_mode: lead.submissionMode,
      p_submission_fingerprint: fingerprint,
      p_contribution_type: lead.contributionType,
    }));
  } catch {
    return NextResponse.json({ ok: false, message: storageMessage }, { status: 503 });
  }

  if (error?.code === "23505") {
    return NextResponse.json({ ok: false, message: duplicateMessage }, { status: 409 });
  }
  if (error) {
    return NextResponse.json({ ok: false, message: storageMessage }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
