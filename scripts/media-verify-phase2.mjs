import { readFile } from "node:fs/promises";
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
  const manifest = JSON.parse(await readFile("data/event-media-phase2.json", "utf8"));
  const manifestSlugs = new Set(manifest.treatments.map((item) => item.eventSlug));
  const unsafe = manifest.treatments.filter(
    (item) =>
      !item.sameEventVerified ||
      !item.privacyReviewed ||
      !item.safetyReviewed ||
      !item.integrityReviewed ||
      !item.approvedSourceVerified ||
      !item.sameEventReasoning ||
      !item.sourceUrl ||
      !item.creditLine,
  );
  const documentExceptions = manifest.treatments.filter(
    (item) => item.publicDisplayKind === "source_document_preview",
  );

  if (published.length !== 50 || phase2.length !== 41) {
    throw new Error(
      `Unexpected coverage totals: ${published.length} published, ${phase2.length} Phase 2.`,
    );
  }
  if (manifest.treatments.length !== 39 || manifestSlugs.size !== 39 || unsafe.length) {
    throw new Error("The Phase 2 manifest does not contain 39 complete, uniquely reviewed rows.");
  }
  if (
    documentExceptions.length !== 1 ||
    documentExceptions[0].eventSlug !== "kolli-hills-land-patta-protest"
  ) {
    throw new Error("Kolli Hills must be the only source-document exception.");
  }
  if (missing.length) throw new Error(`Phase 2 media missing: ${missing.join(", ")}.`);

  console.log(
    "Phase 2 media verification passed: 41 of 41 records approved; 39 new reviewed treatments are complete.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Phase 2 media verification failed.");
  process.exitCode = 1;
}
