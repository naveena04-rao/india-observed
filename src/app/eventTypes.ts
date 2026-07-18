export const eventTypes = {
  dharna: {
    label: "Dharna",
    definition:
      "A sustained protest at a fixed public or administrative location, commonly involving participants sitting or remaining there while pressing stated demands.",
  },
  strike: {
    label: "Strike",
    definition:
      "A coordinated refusal to work or provide normal services as a form of collective protest.",
  },
  sit_in: {
    label: "Sit-in",
    definition:
      "A protest in which participants occupy or remain at a particular place for a period of time. Use this where the event is not more specifically documented as a dharna.",
  },
  hunger_strike: {
    label: "Hunger strike",
    definition:
      "A protest in which one or more participants voluntarily abstain from food to press stated demands.",
  },
  rally: {
    label: "Rally",
    definition:
      "An organised public gathering, commonly involving speeches, collective demands or a show of support or opposition.",
  },
  march: {
    label: "March",
    definition:
      "An organised protest in which participants move together along a planned or publicly documented route.",
  },
  demonstration: {
    label: "Demonstration",
    definition:
      "An organised public gathering or action expressing opposition, support or a demand, where no more specific event form has been established.",
  },
  human_chain: {
    label: "Human chain",
    definition:
      "A symbolic public action in which participants stand together in a connected line or formation.",
  },
  satyagraha: {
    label: "Satyagraha",
    definition:
      "A form of nonviolent resistance explicitly identified by organisers or reliable sources as a satyagraha. Do not apply this label merely because an event is peaceful.",
  },
  shutdown: {
    label: "Shutdown",
    definition:
      "A coordinated closure or suspension of businesses, transport or services as a form of protest.",
  },
  protest: {
    label: "Protest",
    definition:
      "A fallback classification for verified collective public opposition, support or demands when the available evidence does not establish a more specific form.",
  },
} as const;

export type EventType = keyof typeof eventTypes;
