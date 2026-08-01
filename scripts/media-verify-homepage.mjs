import { readFile } from "node:fs/promises";
import { approvedMediaBySlug } from "./media-library.mjs";

const homepageSlugs = [
  "bidadi-farmers-land-acquisition",
  "manipur-government-employees-strike",
  "dharmasala-teacher-vacancy-protest",
  "bundelkhand-rehabilitation-compensation-protest",
  "education-accountability-jantar-mantar",
  "save-sgnp-human-chain-thane",
  "morbi-transmission-compensation-satyagraha",
  "dasiya-villagers-ethanol-plant",
  "kokrajhar-apdcl-land-allotment-protest",
];

try {
  if (homepageSlugs.length !== 9 || new Set(homepageSlugs).size !== 9) {
    throw new Error("Homepage verification requires exactly nine unique event definitions.");
  }

  const approved = await approvedMediaBySlug();
  const missing = homepageSlugs.filter((slug) => !approved.has(slug));
  if (missing.length) throw new Error(`Homepage media missing: ${missing.join(", ")}`);

  for (const slug of homepageSlugs) {
    const item = approved.get(slug);
    for (const gate of [
      "same_event_verified",
      "privacy_reviewed",
      "safety_reviewed",
      "integrity_reviewed",
      "approved_source_verified",
    ]) {
      if (item[gate] !== true) throw new Error(`${slug} failed ${gate}.`);
    }
    if (!item.source_url?.startsWith("https://")) throw new Error(`${slug} has no source URL.`);
    if (!item.credit_line?.trim()) throw new Error(`${slug} has no visible credit.`);
    if (item.media_type === "uploaded_event_image" && !item.storage_path?.startsWith(`${slug}/`)) {
      throw new Error(`${slug} does not use the approved Phase 1 Storage path.`);
    }
  }

  const [homepage, carousel, eventVisual, detailMedia] = await Promise.all([
    readFile("src/app/page.tsx", "utf8"),
    readFile("src/app/components/FeaturedRecordCarousel.tsx", "utf8"),
    readFile("src/app/events/components/EventVisual.tsx", "utf8"),
    readFile("src/app/events/components/EventDetailMedia.tsx", "utf8"),
  ]);
  if (!carousel.includes("loadedMediaId === activeRecord.id")) {
    throw new Error("Featured publisher embeds are not click-to-load.");
  }
  if (
    !eventVisual.includes("approvedMedia.publicUrl") ||
    !homepage.includes("homepage-on-record")
  ) {
    throw new Error("Homepage approved-media rendering is incomplete.");
  }
  if (!detailMedia.includes("approvedMedia.publicUrl")) {
    throw new Error("Detail approved-media rendering is incomplete.");
  }

  console.log("Homepage media verification passed: 9 positions, 9 approved exact-event visuals.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Homepage media verification failed.");
  process.exitCode = 1;
}
