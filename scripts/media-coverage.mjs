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
  console.log(`Published reviewed records: ${slugs.length}`);
  console.log(`Approved exact-event media: ${approved.size}`);
  console.log(`Production-visible records: ${productionVisible.length}`);
  console.log(`Awaiting media: ${slugs.length - productionVisible.length}`);
  console.log(`Rejected media: ${reviewCounts.rejected}`);
  console.log(`Draft media: ${reviewCounts.draft}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Media coverage failed.");
  process.exitCode = 1;
}
