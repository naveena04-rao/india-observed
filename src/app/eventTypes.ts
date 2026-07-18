export const eventTypes = {
  dharna: {
    label: "Dharna",
    definition:
      "A sustained protest at a fixed place where participants remain present while pressing stated demands.",
  },
  strike: {
    label: "Strike",
    definition:
      "A coordinated refusal to work or provide normal services as a form of collective protest.",
  },
  sit_in: {
    label: "Sit-in",
    definition:
      "A protest in which participants sit or remain at a particular place for a period of time.",
  },
  hunger_strike: {
    label: "Hunger strike",
    definition:
      "A protest in which one or more participants abstain from food to press stated demands.",
  },
  rally: {
    label: "Rally",
    definition:
      "An organised public gathering where people assemble to express support, opposition or demands.",
  },
  march: {
    label: "March",
    definition:
      "An organised protest in which participants move together from one place to another.",
  },
  demonstration: {
    label: "Demonstration",
    definition:
      "An organised public action or gathering expressing opposition, support or a demand.",
  },
  human_chain: {
    label: "Human chain",
    definition:
      "A symbolic public action in which participants stand together in a connected line or formation.",
  },
  satyagraha: {
    label: "Satyagraha",
    definition: "A form of nonviolent resistance used to press a demand or oppose an action.",
  },
  shutdown: {
    label: "Shutdown",
    definition:
      "A coordinated closure or suspension of businesses, transport or services as a form of protest.",
  },
  protest: {
    label: "Protest",
    definition: "A public expression of opposition, support or demands by an individual or group.",
  },
} as const;

export type EventType = keyof typeof eventTypes;
