import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { getEditorialAdminSession } from "@/lib/editorial/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Clean up incorrect new events | India Observed",
  robots: { index: false, follow: false },
};

const incorrectNewEventTitles = [
  "DMK cadres protest Udhayanidhi Stalin's arrest",
  "DMK MPs protest in Parliament over the Cauvery water dispute",
  "Jharkhand students continue JPSC protest",
  "Students protest examination leaks in Madhya Pradesh",
  "Youth Congress protests outside Nitin Gadkari's Nagpur residence",
  "Organisations condemn the NSA detention of Pranab Doley",
  "AMUCO condemns blockades and counter-blockades and seeks financial relief",
  "Cauvery farmers' protest announced for 13 August",
  "VPP march on the Meghalaya Secretariat",
  "AISA expands anti-paper-leak movement",
  "Indian Medical Association plans to suspend services in Maharashtra",
  "Chowdry Ramzan invites leaders to join an August 5 protest",
  "NSA invoked against Pranab Doley after the Kaziranga hotel protest",
  "Supreme Court says states may close or withdraw FIRs against student protesters",
  "Supreme Court notice concerning regulation of the Jantar Mantar protest venue",
  "Fadnavis response to Delhi Police action during a NEET protest",
  "West Bengal CM orders action after violence during a NEET protest",
  "Kharge asks the Prime Minister to address Parliament over police action at a NEET protest",
  "Request for clarity on withdrawal of Maharashtra student-protest cases",
  "Tamil Nadu to withdraw cases against anti-NEET protesters",
  "Gujarat Police asked to withdraw FIRs against paper-leak protesters",
] as const;

const normalizedIncorrectTitles = new Set(
  incorrectNewEventTitles.map((title) => title.trim().toLocaleLowerCase()),
);

async function deleteIncorrectNewEventCandidates() {
  "use server";

  const session = await getEditorialAdminSession();
  if (!session.user || !session.editor || !session.supabase)
    throw new Error("Authorised editor required.");

  const { data: candidates, error: readError } = await session.supabase
    .from("editorial_candidates")
    .select("id,suggested_title,candidate_type")
    .eq("candidate_type", "new_event");
  if (readError) throw new Error("Incorrect new-event rows could not be loaded.");

  const matches = (candidates ?? []).filter((candidate) =>
    normalizedIncorrectTitles.has(String(candidate.suggested_title ?? "").trim().toLocaleLowerCase()),
  );
  const ids = matches.map((candidate) => candidate.id);

  if (ids.length) {
    const auditRows = matches.map((candidate) => ({
      actor_id: session.user!.id,
      action: "delete_incorrect_new_event_candidate",
      subject_type: "editorial_candidate",
      subject_id: candidate.id,
      safe_details: {
        title: candidate.suggested_title,
        reason: "Superseded by manual re-verification against current 2026 sources",
        scope: "private dashboard only",
      },
    }));

    const { error: auditError } = await session.supabase
      .from("compliance_audit_log")
      .insert(auditRows);
    if (auditError) throw new Error("The cleanup audit record could not be created.");

    const { error: deleteError } = await session.supabase
      .from("editorial_candidates")
      .delete()
      .in("id", ids);
    if (deleteError) throw new Error("Incorrect new-event rows could not be deleted.");
  }

  revalidatePath("/admin/review/today");
  revalidatePath("/admin/review/new-events");
  revalidatePath("/admin/review/cleanup-incorrect-new-events");
  redirect(`/admin/review/cleanup-incorrect-new-events?deleted=${ids.length}`);
}

export default async function CleanupIncorrectNewEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const session = await getEditorialAdminSession();
  if (!session.user)
    redirect(
      `/auth/sign-in?returnTo=${encodeURIComponent("/admin/review/cleanup-incorrect-new-events")}`,
    );
  if (!session.editor || !session.supabase) notFound();

  const { data: candidates, error } = await session.supabase
    .from("editorial_candidates")
    .select("id,suggested_title,candidate_type,review_status,discovery_time")
    .eq("candidate_type", "new_event")
    .order("discovery_time", { ascending: false });
  if (error) notFound();

  const matches = (candidates ?? []).filter((candidate) =>
    normalizedIncorrectTitles.has(String(candidate.suggested_title ?? "").trim().toLocaleLowerCase()),
  );
  const { deleted } = await searchParams;

  return (
    <ArchiveShell authReturnTo="/admin/review/cleanup-incorrect-new-events">
      <main className="editor-review page-shell">
        <p>
          <Link href="/admin/review/today">← Review dashboard</Link>
        </p>
        <header>
          <p className="section-kicker">Private dashboard maintenance</p>
          <h1>Remove incorrect new-event rows</h1>
          <p>
            This deletes only matching rows whose current candidate type is <code>new_event</code>.
            Planned events, updates, official responses, retained leads and public records are not
            changed.
          </p>
        </header>

        {deleted !== undefined ? (
          <p role="status">
            Deleted {Number(deleted) || 0} incorrect new-event candidate
            {(Number(deleted) || 0) === 1 ? "" : "s"}.
          </p>
        ) : null}

        <section>
          <h2>Rows currently matched: {matches.length}</h2>
          {matches.length ? (
            <ol>
              {matches.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.suggested_title} · {candidate.review_status}
                </li>
              ))}
            </ol>
          ) : (
            <p>No incorrect new-event rows currently match the verified cleanup list.</p>
          )}
        </section>

        {matches.length ? (
          <form action={deleteIncorrectNewEventCandidates}>
            <button type="submit">Delete {matches.length} incorrect new-event rows</button>
          </form>
        ) : null}
      </main>
    </ArchiveShell>
  );
}
