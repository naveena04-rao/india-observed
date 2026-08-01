export const homepageMediaSections = [
  {
    id: "featured",
    title: "Featured",
    slugs: [
      "bidadi-farmers-land-acquisition",
      "manipur-government-employees-strike",
      "dharmasala-teacher-vacancy-protest",
    ],
  },
  {
    id: "latest",
    title: "Latest Records",
    slugs: [
      "bundelkhand-rehabilitation-compensation-protest",
      "education-accountability-jantar-mantar",
      "save-sgnp-human-chain-thane",
    ],
  },
  {
    id: "on-record",
    title: "ON RECORD",
    slugs: [
      "morbi-transmission-compensation-satyagraha",
      "dasiya-villagers-ethanol-plant",
      "kokrajhar-apdcl-land-allotment-protest",
    ],
  },
] as const;

export const homepageMediaSlugs = homepageMediaSections.flatMap((section) => section.slugs);

if (homepageMediaSlugs.length !== 9 || new Set(homepageMediaSlugs).size !== 9) {
  throw new Error("Homepage media review must contain exactly nine unique event slugs.");
}
