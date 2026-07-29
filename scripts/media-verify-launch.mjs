import { approvedMediaBySlug, publishedEventSlugs } from "./media-library.mjs";

try {
  const slugs = await publishedEventSlugs();
  const approved = await approvedMediaBySlug();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const contactEmail = process.env.PUBLIC_CONTACT_EMAIL ?? "";
  const productionVisible = slugs.filter((slug) => approved.has(slug));
  if (!/^https:\/\//.test(siteUrl)) {
    throw new Error("Launch blocked: NEXT_PUBLIC_SITE_URL must be an HTTPS public URL.");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    throw new Error("Launch blocked: PUBLIC_CONTACT_EMAIL is missing or invalid.");
  }
  if (productionVisible.length === 0) {
    throw new Error("Launch blocked: no published event has approved exact-event media.");
  }
  for (const slug of slugs) {
    console.log(`${slug}\t${approved.has(slug) ? "production_visible" : "awaiting_media"}`);
  }
  if (productionVisible.some((slug) => !approved.has(slug))) {
    throw new Error("Launch blocked: a Production-visible event lacks approved media.");
  }
  console.log(
    `Media launch verification passed for ${productionVisible.length} Production-visible events; no fallback is public.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Media launch verification failed.");
  process.exitCode = 1;
}
