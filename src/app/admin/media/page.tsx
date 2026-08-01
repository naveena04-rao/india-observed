import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import { getMediaAdminSession } from "@/lib/media/admin";
import { getMediaLibraryAvailability } from "@/lib/media/config";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { AdminMediaForm } from "./AdminMediaForm";
import {
  approveMediaAction,
  rejectMediaAction,
  reviewMediaAction,
  withdrawMediaAction,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media administration | India Observed",
  robots: { index: false, follow: false },
};

type AdminMediaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type MediaRow = {
  id: string;
  event_slug: string;
  media_type: string;
  status: "draft" | "approved" | "rejected" | "withdrawn";
  source_url: string;
  publisher: string | null;
  creator: string | null;
  credit_line: string;
  rights_basis: string;
  same_event_verified: boolean;
  privacy_reviewed: boolean;
  safety_reviewed: boolean;
  integrity_reviewed: boolean;
  approved_source_verified: boolean;
  replaces_media_id: string | null;
  replacement_reason: string | null;
  approved_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
};

type ReviewRow = {
  media_id: string;
  permission_evidence: string | null;
  review_notes: string | null;
  same_event_reasoning: string;
  privacy_notes: string;
  safety_notes: string;
  integrity_notes: string;
  rejection_reason: string | null;
  original_filename: string | null;
  original_sha256: string | null;
};

export default async function AdminMediaPage({ searchParams }: AdminMediaPageProps) {
  if (!getMediaLibraryAvailability().enabled) {
    return (
      <ArchiveShell authReturnTo="/admin/media">
        <section className="admin-media-page page-shell">
          <p className="section-kicker">MEDIA ADMINISTRATION</p>
          <h1>Media library unavailable</h1>
          <p>
            The administrator interface is fail-closed until the dedicated media database is
            configured.
          </p>
        </section>
      </ArchiveShell>
    );
  }

  const session = await getMediaAdminSession();
  if (!session.user) redirect("/auth/sign-in?returnTo=%2Fadmin%2Fmedia");
  if (!session.admin || !session.supabase) notFound();

  const query = await searchParams;
  const requestedSlug = typeof query.event === "string" ? query.event : "";
  const selectedEvent =
    reviewedEventsPreview.find(
      (event) => event.slug === requestedSlug && event.publicationStatus === "published",
    ) ?? reviewedEventsPreview[0];
  if (!selectedEvent) notFound();

  const [{ data: mediaData, error: mediaError }, { data: reviewData, error: reviewError }] =
    await Promise.all([
      session.supabase
        .from("event_media")
        .select(
          "id,event_slug,media_type,status,source_url,publisher,creator,credit_line,rights_basis,same_event_verified,privacy_reviewed,safety_reviewed,integrity_reviewed,approved_source_verified,replaces_media_id,replacement_reason,approved_at,withdrawn_at,created_at",
        )
        .order("created_at", { ascending: false }),
      session.supabase
        .from("event_media_private_review")
        .select(
          "media_id,permission_evidence,review_notes,same_event_reasoning,privacy_notes,safety_notes,integrity_notes,rejection_reason,original_filename,original_sha256",
        ),
    ]);
  if (mediaError || reviewError) throw new Error("Media administration data could not be loaded.");

  const media = (mediaData ?? []) as MediaRow[];
  const reviewByMediaId = new Map(
    ((reviewData ?? []) as ReviewRow[]).map((review) => [review.media_id, review]),
  );
  const selectedMedia = media.filter((item) => item.event_slug === selectedEvent.slug);
  const approvedOptions = selectedMedia
    .filter((item) => item.status === "approved")
    .map((item) => ({
      id: item.id,
      label: `${item.media_type} approved ${item.approved_at ?? ""}`,
    }));
  const approvedCount = media.filter((item) => item.status === "approved").length;
  const draftCount = media.filter((item) => item.status === "draft").length;
  const rejectedOrWithdrawnCount = media.filter(
    (item) => item.status === "rejected" || item.status === "withdrawn",
  ).length;
  const approvedSlugs = new Set(
    media.filter((item) => item.status === "approved").map((item) => item.event_slug),
  );

  return (
    <ArchiveShell authReturnTo={`/admin/media?event=${selectedEvent.slug}`}>
      <section className="admin-media-page page-shell">
        <header className="admin-media-header">
          <div>
            <p className="section-kicker">MEDIA ADMINISTRATION</p>
            <h1>Event media library</h1>
            <p>
              Private review workspace. Permission evidence and reviewer notes must never be copied
              into public-facing fields.
            </p>
          </div>
          <form action="/auth/sign-out" method="post">
            <input type="hidden" name="returnTo" value="/" />
            <button type="submit">Log out</button>
          </form>
        </header>

        <dl className="admin-media-summary">
          <div>
            <dt>Published events</dt>
            <dd>50</dd>
          </div>
          <div>
            <dt>Approved media</dt>
            <dd>{approvedCount}</dd>
          </div>
          <div>
            <dt>Awaiting media</dt>
            <dd>{50 - approvedSlugs.size}</dd>
          </div>
          <div>
            <dt>Draft review</dt>
            <dd>{draftCount}</dd>
          </div>
          <div>
            <dt>Rejected/withdrawn</dt>
            <dd>{rejectedOrWithdrawnCount}</dd>
          </div>
        </dl>

        <div className="admin-media-layout">
          <aside className="admin-event-selector">
            <h2>Published events</h2>
            <ol>
              {reviewedEventsPreview.map((event) => {
                const eventItems = media.filter((item) => item.event_slug === event.slug);
                return (
                  <li key={event.slug}>
                    <Link
                      aria-current={event.slug === selectedEvent.slug ? "page" : undefined}
                      href={`/admin/media?event=${event.slug}`}
                    >
                      <span>{event.title}</span>
                      <small>
                        {eventItems.filter((item) => item.status === "approved").length} approved ·{" "}
                        {eventItems.filter((item) => item.status === "draft").length} draft
                      </small>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="admin-media-workspace">
            <section className="admin-selected-event">
              <p className="section-kicker">SELECTED EVENT</p>
              <h2>{selectedEvent.title}</h2>
              <dl>
                <div>
                  <dt>Slug</dt>
                  <dd>{selectedEvent.slug}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{selectedEvent.publicLocation}</dd>
                </div>
                <div>
                  <dt>Date/status</dt>
                  <dd>
                    {selectedEvent.startDate ?? "Date under verification"} ·{" "}
                    {selectedEvent.eventStatus}
                  </dd>
                </div>
              </dl>
              <h3>Approved public sources</h3>
              <ol className="admin-event-sources">
                {selectedEvent.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} rel="noreferrer">
                      {source.publisher} — {source.headline}
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <AdminMediaForm
              approvedOptions={approvedOptions}
              eventSlug={selectedEvent.slug}
              sources={selectedEvent.sources}
            />

            <section className="admin-media-history">
              <h2>Review and replacement history</h2>
              {selectedMedia.length === 0 ? (
                <p>No media has been submitted for this event.</p>
              ) : (
                selectedMedia.map((item) => {
                  const review = reviewByMediaId.get(item.id);
                  return (
                    <article key={item.id}>
                      <header>
                        <strong>{item.media_type.replaceAll("_", " ")}</strong>
                        <span>{item.status}</span>
                      </header>
                      <p>{item.credit_line}</p>
                      <p>
                        Source:{" "}
                        <a href={item.source_url} rel="noreferrer">
                          {item.source_url}
                        </a>
                      </p>
                      <p>Rights basis: {item.rights_basis.replaceAll("_", " ")}</p>
                      {review?.original_filename ? (
                        <p>
                          Original file: {review.original_filename} · SHA-256 recorded privately
                        </p>
                      ) : null}
                      {item.replaces_media_id ? (
                        <p>
                          Replaces {item.replaces_media_id}: {item.replacement_reason}
                        </p>
                      ) : null}
                      {review?.rejection_reason ? (
                        <p>Withdrawal/rejection reason: {review.rejection_reason}</p>
                      ) : null}

                      {item.status === "draft" && review ? (
                        <>
                          <form action={reviewMediaAction} className="admin-review-form">
                            <input type="hidden" name="mediaId" value={item.id} />
                            <input type="hidden" name="eventSlug" value={selectedEvent.slug} />
                            <div className="admin-review-checks">
                              <label>
                                <input
                                  defaultChecked={item.same_event_verified}
                                  name="sameEventVerified"
                                  type="checkbox"
                                />{" "}
                                Exact event verified
                              </label>
                              <label>
                                <input
                                  defaultChecked={item.privacy_reviewed}
                                  name="privacyReviewed"
                                  type="checkbox"
                                />{" "}
                                Privacy reviewed
                              </label>
                              <label>
                                <input
                                  defaultChecked={item.safety_reviewed}
                                  name="safetyReviewed"
                                  type="checkbox"
                                />{" "}
                                Safety reviewed
                              </label>
                              <label>
                                <input
                                  defaultChecked={item.integrity_reviewed}
                                  name="integrityReviewed"
                                  type="checkbox"
                                />{" "}
                                Integrity reviewed
                              </label>
                            </div>
                            <label>
                              Same-event reasoning
                              <textarea
                                defaultValue={review.same_event_reasoning}
                                name="sameEventReasoning"
                                required
                              />
                            </label>
                            <label>
                              Privacy notes
                              <textarea
                                defaultValue={review.privacy_notes}
                                name="privacyNotes"
                                required
                              />
                            </label>
                            <label>
                              Safety notes
                              <textarea
                                defaultValue={review.safety_notes}
                                name="safetyNotes"
                                required
                              />
                            </label>
                            <label>
                              Integrity notes
                              <textarea
                                defaultValue={review.integrity_notes}
                                name="integrityNotes"
                                required
                              />
                            </label>
                            <label>
                              Permission evidence
                              <textarea
                                defaultValue={review.permission_evidence ?? ""}
                                name="permissionEvidence"
                              />
                            </label>
                            <label>
                              Private review notes
                              <textarea
                                defaultValue={review.review_notes ?? ""}
                                name="reviewNotes"
                              />
                            </label>
                            <button type="submit">Save review</button>
                          </form>
                          <div className="admin-media-decisions">
                            <form action={approveMediaAction}>
                              <input type="hidden" name="mediaId" value={item.id} />
                              <input type="hidden" name="eventSlug" value={selectedEvent.slug} />
                              <button type="submit">Approve media</button>
                            </form>
                            <form action={rejectMediaAction}>
                              <input type="hidden" name="mediaId" value={item.id} />
                              <input type="hidden" name="eventSlug" value={selectedEvent.slug} />
                              <label>
                                Rejection reason
                                <input name="reason" required minLength={8} />
                              </label>
                              <button type="submit">Reject draft</button>
                            </form>
                          </div>
                        </>
                      ) : null}

                      {item.status === "approved" ? (
                        <form action={withdrawMediaAction} className="admin-media-withdraw">
                          <input type="hidden" name="mediaId" value={item.id} />
                          <input type="hidden" name="eventSlug" value={selectedEvent.slug} />
                          <label>
                            Withdrawal reason
                            <input name="reason" required minLength={8} />
                          </label>
                          <button type="submit">Withdraw approved media</button>
                        </form>
                      ) : null}
                    </article>
                  );
                })
              )}
            </section>
          </div>
        </div>
      </section>
    </ArchiveShell>
  );
}
