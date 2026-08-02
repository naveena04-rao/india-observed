export interface SemanticMatch {
  eventSlug: string | null;
  score: number;
  method: "deterministic" | "provider";
}

export interface SemanticMatcher {
  readonly name: string;
  match(text: string): Promise<SemanticMatch>;
}

export class DeterministicSemanticMatcher implements SemanticMatcher {
  readonly name = "deterministic-token-overlap";
  constructor(private readonly matchFn: (text: string) => SemanticMatch) {}
  async match(text: string) {
    return this.matchFn(text);
  }
}

export function createSemanticMatcher(fallback: SemanticMatcher) {
  // A reviewed provider can implement this interface later. The default is local and deterministic.
  return fallback;
}
