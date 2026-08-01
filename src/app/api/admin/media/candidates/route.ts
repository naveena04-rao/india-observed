import { NextResponse } from "next/server";
import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import { getMediaAdminSession } from "@/lib/media/admin";
import { fetchSourceMediaCandidates } from "@/lib/media/sourceCandidates";
import { sourceBelongsToEvent } from "@/lib/media/validation";

export async function POST(request: Request) {
  const { admin, user } = await getMediaAdminSession();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as {
    eventSlug?: unknown;
    sourceUrl?: unknown;
  } | null;
  if (typeof body?.eventSlug !== "string" || typeof body.sourceUrl !== "string") {
    return NextResponse.json({ error: "Event and source are required." }, { status: 400 });
  }
  const event = reviewedEventsPreview.find(
    (candidate) => candidate.slug === body.eventSlug && candidate.publicationStatus === "published",
  );
  if (!event || !sourceBelongsToEvent(event, body.sourceUrl)) {
    return NextResponse.json(
      { error: "The selected source does not belong to this event." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await fetchSourceMediaCandidates(body.sourceUrl));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Source metadata could not be read." },
      { status: 422 },
    );
  }
}
