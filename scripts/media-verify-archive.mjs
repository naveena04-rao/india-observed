import { readFile } from "node:fs/promises";
import { approvedMediaBySlug, publishedEventSlugs } from "./media-library.mjs";

try {
  const slugs = await publishedEventSlugs();
  const approved = await approvedMediaBySlug();
  const missing = slugs.filter((slug) => !approved.has(slug));
  const embedsWithoutPreview = [...approved.entries()]
    .filter(
      ([, item]) =>
        item.media_type !== "uploaded_event_image" &&
        (!item.preview_storage_path || !item.preview_alt_text),
    )
    .map(([slug]) => slug);
  const wrongEvent = [...approved.entries()]
    .filter(([slug, item]) => item.event_slug !== slug)
    .map(([slug]) => slug);
  const missingCreditOrSource = [...approved.entries()]
    .filter(([, item]) => !item.credit_line || !item.source_url)
    .map(([slug]) => slug);
  const [archivePreviewSource, eventVisualSource] = await Promise.all([
    readFile("src/app/events/components/ArchiveMediaPreview.tsx", "utf8"),
    readFile("src/app/events/components/EventVisual.tsx", "utf8"),
  ]);

  if (approved.size !== 50 || missing.length) {
    throw new Error(`Archive media missing: ${missing.join(", ") || "unexpected row count"}.`);
  }
  if (embedsWithoutPreview.length) {
    throw new Error(`Approved embeds lack archive previews: ${embedsWithoutPreview.join(", ")}.`);
  }
  if (wrongEvent.length) {
    throw new Error(`Archive media is attached to the wrong event: ${wrongEvent.join(", ")}.`);
  }
  if (missingCreditOrSource.length) {
    throw new Error(`Archive media lacks credit or source: ${missingCreditOrSource.join(", ")}.`);
  }
  if (/<iframe\b/i.test(archivePreviewSource)) {
    throw new Error("The archive preview component must not load an iframe.");
  }
  if (
    !eventVisualSource.includes("<ArchiveMediaPreview") ||
    !eventVisualSource.includes("approvedMedia.publicUrl")
  ) {
    throw new Error("Archive rows do not render approved static and embed-preview treatments.");
  }

  console.log(
    "Archive media verification passed: 50 visible treatments, no fallback and no archive iframe.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Archive media verification failed.");
  process.exitCode = 1;
}
