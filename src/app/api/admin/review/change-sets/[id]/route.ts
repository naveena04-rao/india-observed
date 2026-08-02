import { NextResponse } from "next/server";
import { getEditorialAdminSession } from "@/lib/editorial/admin";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getEditorialAdminSession();
  if (!session.user)
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  if (!session.editor || !session.supabase)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data, error } = await session.supabase
    .from("approved_change_sets")
    .select(
      "id,candidate_id,target_event_slug,change_kind,approved_values,source_references,content_fingerprint,created_at,status",
    )
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(
    {
      schemaVersion: 1,
      publicationMode: "human_reviewed_pull_request",
      autonomousWrite: false,
      changeSet: data,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
