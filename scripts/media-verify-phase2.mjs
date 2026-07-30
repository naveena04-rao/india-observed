import { approvedMediaBySlug, publishedEventSlugs } from "./media-library.mjs";

const homepagePhase1Slugs = new Set([
  "bidadi-farmers-land-acquisition",
  "manipur-government-employees-strike",
  "dharmasala-teacher-vacancy-protest",
  "bundelkhand-rehabilitation-compensation-protest",
  "education-accountability-jantar-mantar",
  "save-sgnp-human-chain-thane",
  "morbi-transmission-compensation-satyagraha",
  "dasiya-villagers-ethanol-plant",
  "kokrajhar-apdcl-land-allotment-protest",
]);

try {
  const published = await publishedEventSlugs();
  const phase2 = published.filter((slug) => !homepagePhase1Slugs.has(slug));
  const approved = await approvedMediaBySlug();
  const missing = phase2.filter((slug) => !approved.has(slug));

  if (published.length !== 50 || phase2.length !== 41) {
    throw new Error(
      `Unexpected coverage totals: ${published.length} published, ${phase2.length} Phase 2.`,
    );
  }
  if (missing.length) throw new Error(`Phase 2 media missing: ${missing.join(", ")}.`);

  console.log("Phase 2 media verification passed: 41 of 41 records approved.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Phase 2 media verification failed.");
  process.exitCode = 1;
}
