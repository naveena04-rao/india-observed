const contactPatterns = [
  { kind: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: "phone", pattern: /(?<!\d)(?:\+91[-\s]?)?[6-9]\d{9}(?!\d)/g },
];

export function redactUnnecessaryContactDetails(text: string) {
  return contactPatterns.reduce(
    (value, entry) => value.replace(entry.pattern, `[redacted ${entry.kind}]`),
    text,
  );
}

export function detectSafetyFlags(text: string) {
  const value = text.toLowerCase();
  return {
    possibleChild: /\b(child|children|minor|school student|under-18)\b/.test(value),
    possibleVictimOrWitness: /\b(victim|witness|whistleblower|survivor)\b/.test(value),
    liveTacticalLocation: /\b(live location|assemble now|meet at|police position)\b/.test(value),
    reputationalRisk: /\b(accused|alleged|corrupt|fraud|criminal|misconduct)\b/.test(value),
  };
}

export function limitSupportingPassage(text: string) {
  return redactUnnecessaryContactDetails(text).replace(/\s+/g, " ").trim().slice(0, 600);
}
