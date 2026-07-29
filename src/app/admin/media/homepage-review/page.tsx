import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArchiveShell } from "@/app/events/components/ArchiveShell";
import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import { getMediaAdminSession } from "@/lib/media/admin";
import { getMediaLibraryAvailability } from "@/lib/media/config";
import { homepageMediaSections, homepageMediaSlugs } from "@/lib/media/homepage";
import { HomepageReviewMedia } from "./HomepageReviewMedia";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Homepage media review | India Observed",
  robots: { index: false, follow: false },
};

type MediaRow = {
  id: string;
  event_slug: string;
  media_type: "uploaded_event_image" | "publisher_video_embed" | "official_social_embed";
  status: "draft" | "approved" | "rejected" | "withdrawn";
  storage_path: string | null;
  media_url: string | null;
  source_url: string;
  publisher: string | null;
  creator: string | null;
  credit_line: string;
  rights_basis: string;
  alt_text: string;
};

type ReviewRow = {
  media_id: string;
  same_event_reasoning: string;
  privacy_notes: string;
  safety_notes: string;
};

export default async function HomepageMediaReviewPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  if (!getMediaLibraryAvailability().enabled) notFound();

  const session = await getMediaAdminSession();
  if (!session.user) redirect("/auth/sign-in?returnTo=%2Fadmin%2Fmedia%2Fhomepage-review");
  if (!session.admin || !session.supabase) notFound();

  const [{ data: mediaData, error: mediaError }, { data: reviewData, error: reviewError }] =
    await Promise.all([
      session.supabase
        .from("event_media")
        .select(
          "id,event_slug,media_type,status,storage_path,media_url,source_url,publisher,creator,credit_line,rights_basis,alt_text",
        )
        .in("event_slug", homepageMediaSlugs)
        .eq("status", "approved"),
      session.supabase
        .from("event_media_private_review")
        .select("media_id,same_event_reasoning,privacy_notes,safety_notes"),
    ]);
  if (mediaError || reviewError) throw new Error("Homepage media review could not be loaded.");

  const mediaBySlug = new Map(
    ((mediaData ?? []) as MediaRow[]).map((item) => [item.event_slug, item]),
  );
  const reviewByMediaId = new Map(
    ((reviewData ?? []) as ReviewRow[]).map((item) => [item.media_id, item]),
  );
  const eventBySlug = new Map(reviewedEventsPreview.map((event) => [event.slug, event]));

  return (
    <ArchiveShell authReturnTo="/admin/media/homepage-review">
      <main className="homepage-media-review page-shell">
        <header>
          <p className="section-kicker">PRIVATE PREVIEW REVIEW</p>
          <h1>Homepage media contact sheet</h1>
          <p>
            Nine exact-event visuals arranged in their live homepage groupings. This route is
            authenticated and unavailable in Production.
          </p>
          <nav aria-label="Review links">
            <Link href="/">Homepage</Link>
            <Link href="/admin/media">Media administration</Link>
          </nav>
        </header>

        {homepageMediaSections.map((section) => (
          <section aria-labelledby={`homepage-review-${section.id}`} key={section.id}>
            <h2 id={`homepage-review-${section.id}`}>{section.title}</h2>
            <div className="homepage-media-review-grid">
              {section.slugs.map((slug) => {
                const event = eventBySlug.get(slug);
                const media = mediaBySlug.get(slug);
                if (!event || !media) {
                  return (
                    <article className="homepage-media-review-card is-missing" key={slug}>
                      <strong>{event?.title ?? slug}</strong>
                      <p>Approved primary media missing.</p>
                    </article>
                  );
                }
                const review = reviewByMediaId.get(media.id);
                const publicUrl =
                  media.media_type === "uploaded_event_image" && media.storage_path
                    ? session
                        .supabase!.storage.from("event-media-public")
                        .getPublicUrl(media.storage_path).data.publicUrl
                    : null;
                return (
                  <article className="homepage-media-review-card" key={slug}>
                    <figure>
                      {publicUrl ? (
                        <HomepageReviewMedia
                          alt={media.alt_text}
                          kind="image"
                          publicUrl={publicUrl}
                        />
                      ) : media.media_url ? (
                        <HomepageReviewMedia
                          alt={media.alt_text}
                          embedUrl={media.media_url}
                          kind="embed"
                          publisher={media.publisher ?? "Approved publisher"}
                        />
                      ) : null}
                      <figcaption>
                        {media.credit_line} · <span>{media.status}</span>
                      </figcaption>
                    </figure>
                    <h3>{event.title}</h3>
                    <p className="homepage-review-slug">{slug}</p>
                    <dl>
                      <div>
                        <dt>Homepage section</dt>
                        <dd>{section.title}</dd>
                      </div>
                      <div>
                        <dt>Publisher/account</dt>
                        <dd>{media.publisher ?? "Not supplied"}</dd>
                      </div>
                      <div>
                        <dt>Photographer/creator</dt>
                        <dd>{media.creator ?? "Not named by publisher"}</dd>
                      </div>
                      <div>
                        <dt>Media type</dt>
                        <dd>{media.media_type.replaceAll("_", " ")}</dd>
                      </div>
                      <div>
                        <dt>Display basis</dt>
                        <dd>{media.rights_basis.replaceAll("_", " ")}</dd>
                      </div>
                    </dl>
                    <p>
                      <strong>Same-event review:</strong>{" "}
                      {review?.same_event_reasoning ?? "Private review missing."}
                    </p>
                    <p>
                      <strong>Privacy and safety:</strong>{" "}
                      {[review?.privacy_notes, review?.safety_notes].filter(Boolean).join(" ")}
                    </p>
                    <nav aria-label={`Links for ${event.title}`}>
                      <Link href={`/events/${slug}`}>Event page</Link>
                      <a href={media.source_url} rel="noreferrer">
                        Original source
                      </a>
                      <Link href={`/admin/media?event=${slug}`}>Admin record</Link>
                    </nav>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </ArchiveShell>
  );
}
