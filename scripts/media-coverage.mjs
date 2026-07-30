import { approvedMediaBySlug, mediaReviewCounts, publishedEventSlugs } from "./media-library.mjs";

try {
  const slugs = await publishedEventSlugs();
  const approved = await approvedMediaBySlug();
  const reviewCounts = await mediaReviewCounts();
  const productionVisible = slugs.filter((slug) => approved.has(slug));
  for (const slug of slugs) {
    const item = approved.get(slug);
    console.log(`${slug}\t${item ? `approved:${item.media_type}` : "awaiting_media"}`);
  }
  console.log(`Published events: ${slugs.length}`);
  console.log(`Approved media: ${approved.size}`);
  console.log(`Awaiting media: ${slugs.length - productionVisible.length}`);
  console.log(`Rejected candidates: ${reviewCounts.rejected}`);
  console.log(`Draft candidates: ${reviewCounts.draft}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Media coverage failed.");
  process.exitCode = 1;
}
