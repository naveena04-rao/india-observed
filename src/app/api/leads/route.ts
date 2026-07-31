import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/http/sameOrigin";
import { consumeLeadSubmissionAttempt } from "@/lib/leads/rateLimit";
import {
  fieldErrors,
  leadSubmissionSchema,
  MAX_LEAD_PAYLOAD_BYTES,
  normalisePhone,
} from "@/lib/leads/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const failureMessage =
  "We could not submit this lead. Review the highlighted fields and try again.";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_LEAD_PAYLOAD_BYTES) {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 413 });
  }
  if (!consumeLeadSubmissionAttempt(request)) {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 429 });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_LEAD_PAYLOAD_BYTES) throw new Error();
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 400 });
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: failureMessage, fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const lead = parsed.data;
  const elapsed = Date.now() - lead.formStartedAt;
  if (lead.website) {
    return NextResponse.json({ ok: true });
  }
  if (elapsed < 1500 || elapsed > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 429 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 503 });
  }

  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        title: lead.title,
        description: lead.description,
        location: lead.location,
        eventDate: lead.eventDate,
        contactEmail: lead.contactEmail,
        sourceLinks: lead.sourceLinks,
      }),
    )
    .digest("hex");

  let error: { code?: string } | null;
  try {
    ({ error } = await supabase.rpc("submit_lead", {
      p_additional_context: lead.additionalContext || null,
      p_contact_email: lead.contactEmail,
      p_contact_phone: normalisePhone(lead.contactPhone),
      p_date_precision: lead.datePrecision,
      p_description: lead.description,
      p_event_date: lead.eventDate || null,
      p_location: lead.location,
      p_source_links: lead.sourceLinks,
      p_submission_fingerprint: fingerprint,
      p_title: lead.title,
    }));
  } catch {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 503 });
  }

  if (error && error.code !== "23505") {
    return NextResponse.json({ ok: false, message: failureMessage }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
