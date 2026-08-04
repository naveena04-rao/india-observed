/**
 * Version-controlled bootstrap localities for bounded discovery queries. These are not an
 * exhaustive district gazetteer. Editors expand the reviewed list in response to measured gaps.
 */
export const reviewedLocalitiesByState: Record<string, readonly string[]> = {
  "Andaman and Nicobar Islands": ["Port Blair", "South Andaman"],
  "Andhra Pradesh": ["Amaravati", "Visakhapatnam", "Vijayawada"],
  "Arunachal Pradesh": ["Itanagar", "Papum Pare"],
  Assam: ["Dispur", "Guwahati", "Dibrugarh"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur"],
  Chandigarh: ["Chandigarh"],
  Chhattisgarh: ["Raipur", "Bilaspur", "Bastar"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Silvassa"],
  Delhi: ["New Delhi", "Central Delhi", "North East Delhi"],
  Goa: ["Panaji", "North Goa", "South Goa"],
  Gujarat: ["Gandhinagar", "Ahmedabad", "Surat"],
  Haryana: ["Chandigarh", "Gurugram", "Faridabad"],
  "Himachal Pradesh": ["Shimla", "Kangra", "Mandi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mandya"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  Ladakh: ["Leh", "Kargil"],
  Lakshadweep: ["Kavaratti"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Chhatarpur", "Panna"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Manipur: ["Imphal", "Imphal West", "Churachandpur"],
  Meghalaya: ["Shillong", "East Khasi Hills"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Puri"],
  Puducherry: ["Puducherry", "Karaikal"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
  Sikkim: ["Gangtok", "East Sikkim"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  Telangana: ["Hyderabad", "Warangal", "Khammam"],
  Tripura: ["Agartala", "West Tripura"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Prayagraj", "Noida"],
  Uttarakhand: ["Dehradun", "Haridwar", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling"],
};

const containsReviewedPhrase = (value: string, phrase: string) => {
  const searchable = ` ${value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;
  const expected = ` ${phrase
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;
  return searchable.includes(expected);
};

export function detectReviewedState(value: string) {
  for (const [state, localities] of Object.entries(reviewedLocalitiesByState)) {
    if (containsReviewedPhrase(value, state)) return state;
    if (localities.some((locality) => containsReviewedPhrase(value, locality))) return state;
  }
  return null;
}

export function detectReviewedLocality(value: string) {
  for (const [state, localities] of Object.entries(reviewedLocalitiesByState)) {
    const locality = localities.find((item) => containsReviewedPhrase(value, item));
    if (locality) return { state, locality };
  }
  return null;
}

export function buildPriorityLocalities(input: {
  ongoingEventLocalities: readonly string[];
  weakCoverageStates: readonly string[];
  recentItemLocalities: readonly string[];
  dayNumber: number;
  limit?: number;
}) {
  const weakCoverageLocalities = input.weakCoverageStates.flatMap(
    (state) => reviewedLocalitiesByState[state] ?? [],
  );
  const ranked = [
    ...input.ongoingEventLocalities,
    ...weakCoverageLocalities,
    ...input.recentItemLocalities,
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  const unique = [...new Set(ranked)];
  const limit = Math.min(Math.max(input.limit ?? 12, 1), unique.length || 1);
  if (unique.length <= limit) return unique;
  const start = (input.dayNumber * limit) % unique.length;
  return Array.from({ length: limit }, (_, index) => unique[(start + index) % unique.length]!);
}
