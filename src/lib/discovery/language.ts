const scripts: Array<{ language: string; pattern: RegExp }> = [
  { language: "Bengali or Assamese", pattern: /[\u0980-\u09ff]/u },
  { language: "Gujarati", pattern: /[\u0a80-\u0aff]/u },
  { language: "Punjabi", pattern: /[\u0a00-\u0a7f]/u },
  { language: "Odia", pattern: /[\u0b00-\u0b7f]/u },
  { language: "Tamil", pattern: /[\u0b80-\u0bff]/u },
  { language: "Telugu", pattern: /[\u0c00-\u0c7f]/u },
  { language: "Kannada", pattern: /[\u0c80-\u0cff]/u },
  { language: "Malayalam", pattern: /[\u0d00-\u0d7f]/u },
  { language: "Urdu", pattern: /[\u0600-\u06ff]/u },
  { language: "Hindi or Marathi", pattern: /[\u0900-\u097f]/u },
];

export function detectLanguage(text: string) {
  const sample = text.slice(0, 20_000);
  for (const script of scripts) {
    const matches = sample.match(new RegExp(script.pattern.source, "gu"))?.length ?? 0;
    if (matches >= 3)
      return { language: script.language, confidence: Math.min(0.98, 0.6 + matches / 100) };
  }
  return { language: "English", confidence: /[a-z]{12}/i.test(sample) ? 0.75 : 0.35 };
}
