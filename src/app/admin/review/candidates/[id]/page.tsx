import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { getEditorialAdminSession } from "@/lib/editorial/admin";
import {
  createChangeSetAction,
  reviewCandidateAction,
  reviewCandidateFieldAction,
} from "../../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Review candidate | India Observed",
  robots: { index: false, follow: false },
};

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getEditorialAdminSession();
  if (!session.user)
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/admin/review/candidates/${id}`)}`);
  if (!session.editor || !session.supabase) notFound();
  const [candidateResult, fieldResult, sourceResult, mediaResult, changeResult] = await Promise.all(
    [
      session.supabase.from("editorial_candidates").select("*").eq("id", id).single(),
      session.supabase
        .from("event_candidate_fields")
        .select("*")
        .eq("candidate_id", id)
        .order("field_key"),
      session.supabase
        .from("candidate_sources")
        .select(
          "publisher,headline,canonical_url,published_at,original_language,original_supporting_passage,translated_supporting_passage,reliability_tier,source_relationship,ownership_group",
        )
        .eq("candidate_id", id),
      session.supabase
        .from("candidate_media")
        .select(
          "media_type,source_page_url,publisher,creator,rights_display_status,privacy_concern,safety_concern,integrity_concern,review_status",
        )
        .eq("candidate_id", id),
      session.supabase
        .from("approved_change_sets")
        .select("id,status,created_at")
        .eq("candidate_id", id)
        .maybeSingle(),
    ],
  );
  if (
    candidateResult.error ||
    fieldResult.error ||
    sourceResult.error ||
    mediaResult.error ||
    changeResult.error
  )
    notFound();
  const candidate = candidateResult.data;
  const fields = fieldResult.data ?? [];
  return (
    <ArchiveShell authReturnTo={`/admin/review/candidates/${id}`}>
      <main className="editor-review page-shell">
        <p>
          <Link href="/admin/review/today">← Review queue</Link>
        </p>
        <header>
          <p className="section-kicker">{String(candidate.candidate_type).replaceAll("_", " ")}</p>
          <h1>{candidate.suggested_title ?? "Untitled candidate"}</h1>
          <p>{candidate.extraction_notes}</p>
        </header>
        <dl className="editor-review__metrics">
          <div>
            <dt>Status</dt>
            <dd>{String(candidate.review_status).replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt>Confidence</dt>
            <dd>
              {candidate.confidence === null ? "—" : `${Math.round(candidate.confidence * 100)}%`}
            </dd>
          </div>
          <div>
            <dt>Independent sources</dt>
            <dd>{candidate.independent_source_count}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{candidate.priority}</dd>
          </div>
        </dl>
        <section>
          <h2>Scanner match diagnostics</h2>
          <dl>
            <div>
              <dt>Suggested event</dt>
              <dd>{candidate.target_event_internal_id ?? candidate.target_event_slug ?? "None"}</dd>
            </div>
            <div>
              <dt>Source newer than latest review</dt>
              <dd>
                {candidate.source_is_newer_than_event === null
                  ? "Unknown"
                  : candidate.source_is_newer_than_event
                    ? "Yes"
                    : "No"}
              </dd>
            </div>
            <div>
              <dt>Matching signals</dt>
              <dd>{(candidate.matching_signals ?? []).join(" · ") || "None"}</dd>
            </div>
            <div>
              <dt>Conflicting signals</dt>
              <dd>{(candidate.conflicting_signals ?? []).join(" · ") || "None"}</dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>Field-by-field review</h2>
          {fields.length === 0 ? (
            <p className="editor-review__empty">
              No extracted fields. A change set cannot be created.
            </p>
          ) : (
            <div className="editor-review__cards">
              {fields.map((field) => (
                <form action={reviewCandidateFieldAction} key={field.id}>
                  <input type="hidden" name="fieldId" value={field.id} />
                  <input type="hidden" name="candidateId" value={id} />
                  <h3>{String(field.field_key).replaceAll("_", " ")}</h3>
                  <pre>{JSON.stringify(field.proposed_value, null, 2)}</pre>
                  <p>
                    <strong>Evidence:</strong>{" "}
                    {field.original_supporting_passage ?? "No passage retained"}
                  </p>
                  {field.translated_supporting_passage && (
                    <p>
                      <strong>Translation:</strong> {field.translated_supporting_passage}
                    </p>
                  )}
                  <p>
                    <a href={field.support_source_url} target="_blank" rel="noreferrer">
                      Open attributed source
                    </a>
                  </p>
                  <label>
                    Edited value
                    <textarea name="editedValue" rows={3} />
                  </label>
                  <label>
                    Reason
                    <textarea name="reason" rows={2} />
                  </label>
                  <p>
                    <button name="decision" value="approve">
                      Approve
                    </button>{" "}
                    <button name="decision" value="edit_and_approve">
                      Edit and approve
                    </button>{" "}
                    <button name="decision" value="reject">
                      Reject
                    </button>{" "}
                    <button name="decision" value="defer">
                      Defer
                    </button>
                  </p>
                  <small>Current: {field.review_status}</small>
                </form>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2>Sources and corroboration</h2>
          {(sourceResult.data ?? []).map((source) => (
            <article key={source.canonical_url}>
              <h3>{source.headline ?? source.publisher ?? "Source"}</h3>
              <p>{source.original_supporting_passage}</p>
              {source.translated_supporting_passage && (
                <p>{source.translated_supporting_passage}</p>
              )}
              <p>
                {source.source_relationship} · {source.reliability_tier ?? "unrated"} · ownership{" "}
                {source.ownership_group ?? "unresolved"}
              </p>
              <a href={source.canonical_url} target="_blank" rel="noreferrer">
                Open original source
              </a>
            </article>
          ))}
        </section>
        <section>
          <h2>Media evidence</h2>
          {(mediaResult.data ?? []).length === 0 ? (
            <p>No media candidates.</p>
          ) : (
            <pre>{JSON.stringify(mediaResult.data, null, 2)}</pre>
          )}
        </section>
        <section>
          <h2>Candidate decision</h2>
          <form action={reviewCandidateAction}>
            <input type="hidden" name="candidateId" value={id} />
            <label>
              Required reason for rejection or duplicate
              <textarea name="reason" rows={3} />
            </label>
            <p>
              <button name="decision" value="reject">
                Reject
              </button>{" "}
              <button name="decision" value="duplicate">
                Mark duplicate
              </button>{" "}
              <button name="decision" value="defer">
                Defer
              </button>{" "}
              <button name="decision" value="request_rescan">
                Request rescan
              </button>
            </p>
          </form>
          {candidate.review_status === "approved" && !changeResult.data && (
            <form action={createChangeSetAction}>
              <input type="hidden" name="candidateId" value={id} />
              <button>Create PR-ready change set</button>
            </form>
          )}
          {changeResult.data && (
            <p>
              Change set {changeResult.data.id}: {changeResult.data.status}. No GitHub write has
              occurred.
            </p>
          )}
        </section>
      </main>
    </ArchiveShell>
  );
}
