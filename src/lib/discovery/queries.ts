export const discoveryLanguages = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Assamese",
  "Urdu",
] as const;

export const queryFamilies = {
  protest: ["protest", "strike", "march", "rally", "dharna", "demonstration", "bandh"],
  response: ["official response", "court order", "administration said", "settlement"],
  consequence: ["detained", "released", "injured", "concluded", "withdrawn"],
  evidence: ["video", "photograph", "footage", "livestream", "fact check"],
} as const;

export const multilingualEventTerms: Record<
  (typeof discoveryLanguages)[number],
  readonly string[]
> = {
  English: queryFamilies.protest,
  Hindi: ["विरोध", "हड़ताल", "रैली", "धरना", "प्रदर्शन"],
  Bengali: ["প্রতিবাদ", "ধর্মঘট", "মিছিল", "সমাবেশ", "বিক্ষোভ"],
  Marathi: ["निषेध", "संप", "मोर्चा", "सभा", "धरणे"],
  Tamil: ["போராட்டம்", "வேலைநிறுத்தம்", "பேரணி", "ஆர்ப்பாட்டம்"],
  Telugu: ["నిరసన", "సమ్మె", "ర్యాలీ", "ధర్నా"],
  Kannada: ["ಪ್ರತಿಭಟನೆ", "ಮುಷ್ಕರ", "ರ್ಯಾಲಿ", "ಧರಣಿ"],
  Malayalam: ["പ്രതിഷേധം", "പണിമുടക്ക്", "റാലി", "ധർണ"],
  Gujarati: ["વિરોધ", "હડતાળ", "રેલી", "ધરણા"],
  Punjabi: ["ਵਿਰੋਧ", "ਹੜਤਾਲ", "ਰੈਲੀ", "ਧਰਨਾ"],
  Odia: ["ପ୍ରତିବାଦ", "ଧର୍ମଘଟ", "ଶୋଭାଯାତ୍ରା", "ଧାରଣା"],
  Assamese: ["প্ৰতিবাদ", "ধৰ্মঘট", "সমদল", "ধৰ্ণা"],
  Urdu: ["احتجاج", "ہڑتال", "ریلی", "دھرنا", "مظاہرہ"],
};
