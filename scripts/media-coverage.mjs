import { approvedMediaBySlug, publishedEventSlugs } from "./media-library.mjs";

try {
  const slugs = await publishedEventSlugs();
  const approved = await approvedMediaBySlug();
  for (const slug of slugs) {
    const item = approved.get(slug);
    console.log(`${slug}\t${item ? `approved:${item.media_type}` : "awaiting_media"}`);
  }
  console.log(
    `Published events: ${slugs.length}; approved media: ${approved.size}; awaiting media: ${
      slugs.length - approved.size
    }`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Media coverage failed.");
  process.exitCode = 1;
}
