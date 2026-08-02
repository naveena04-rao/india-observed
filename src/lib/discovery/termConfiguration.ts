import keywordData from "@/../data/discovery-keywords.json";

export type TermOverride = {
  language: string;
  term: string;
  action: "add" | "disable";
  reviewed: boolean;
};
export function getReviewedTerms(
  language: keyof typeof keywordData.languages,
  overrides: TermOverride[] = [],
) {
  const terms = new Set(keywordData.languages[language].map((term) => term.toLocaleLowerCase()));
  for (const override of overrides) {
    if (!override.reviewed || override.language !== language) continue;
    if (override.action === "disable") terms.delete(override.term.toLocaleLowerCase());
    else terms.add(override.term.toLocaleLowerCase());
  }
  return [...terms];
}
export const updateTerms = keywordData.updates;
export const dictionaryVersion = keywordData.version;
