import type { EventPublicSource, ReviewedEventPreview } from "@/lib/events/types";

const noIncidents = (lastReviewed: string): ReviewedEventPreview["safety"] => ({
  assessment: "No safety incident identified in the reviewed source set",
  incidentCount: 0,
  highestClassification: "None identified",
  injuriesAndDeathsStatus: "No verified injuries or deaths identified",
  propertyDamageStatus: "No verified property damage identified",
  summary:
    "The reviewed sources used for this draft did not identify a safety or conflict incident. This is not a finding that no incident occurred.",
  lastReviewed,
});

const recordCover = (
  title: string,
  location: string,
  dateOrStatus: string,
  sourceCount: number,
  sourceHref: string,
): ReviewedEventPreview["visual"] => ({
  kind: "no_approved_event_media",
  evidenceClass: "no_approved_event_media",
  title,
  location,
  dateOrStatus,
  sourceCount,
  sourceHref,
});

export const verifiedScannerEventAdditions = [
  {
    internalId: "IO-CM-TN-0003",
    slug: "dmk-workers-protest-udhayanidhi-stalin-arrest",
    title: "DMK workers protest Udhayanidhi Stalin’s arrest in Tamil Nadu",
    eventType: "Demonstration",
    eventStatus: "Outcome pending",
    primaryTopic: "Civil rights & justice",
    topic: "Protests following the arrest of Leader of Opposition Udhayanidhi Stalin",
    stateOrUnionTerritory: "Tamil Nadu",
    publicLocation: "Tamil Nadu; individual protest locations remain under verification",
    startDate: "2026-08-04",
    endDate: null,
    lastConfirmedActive: "2026-08-04",
    lastReviewed: "2026-08-04",
    summary:
      "DMK workers held demonstrations in Tamil Nadu on 4 August 2026 following the arrest of Leader of Opposition Udhayanidhi Stalin. The current report directly establishes that protests followed the arrest. Individual city locations and whether actions continued beyond 4 August remain under verification.",
    directedAt: "Tamil Nadu Police; Tamil Nadu Government",
    eventVerification: "Occurrence verified — locations and outcome remain under review",
    publicationStatus: "candidate",
    publicLaunchStatus: "launchable",
    publishedAt: null,
    approvedSourceCount: 1,
    sources: [
      {
        publisher: "The Hindu",
        headline:
          "Udhayanidhi Stalin arrest: DMK protests and Tamil Nadu political developments — live updates",
        url: "https://www.thehindu.com/news/national/tamil-nadu/udhayanidhi-stalin-arrest-trisha-comment-dmk-protests-tvk-vijay-tamil-nadu-politics-live-updates-august-4-2026/article71304357.ece",
        publicationDate: "2026-08-04",
        sourceType: "News report",
        sourceRole: "Lead",
      },
    ],
    safety: noIncidents("2026-08-04"),
    safetyIncidents: [],
    visual: recordCover(
      "DMK workers’ protests",
      "Tamil Nadu",
      "4 August 2026",
      1,
      "https://www.thehindu.com/news/national/tamil-nadu/udhayanidhi-stalin-arrest-trisha-comment-dmk-protests-tvk-vijay-tamil-nadu-politics-live-updates-august-4-2026/article71304357.ece",
    ),
  },
  {
    internalId: "IO-CM-DL-0008",
    slug: "dmk-mps-parliament-mekedatu-protest",
    title: "DMK MPs protest outside Parliament against the proposed Mekedatu reservoir",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    primaryTopic: "Agriculture & water",
    topic: "Opposition to the proposed Mekedatu reservoir and its implications for Tamil Nadu",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "Parliament complex, New Delhi",
    startDate: "2026-07-20",
    endDate: "2026-07-20",
    lastConfirmedActive: "2026-07-20",
    lastReviewed: "2026-08-04",
    summary:
      "DMK MPs protested outside Parliament on 20 July 2026 against the proposed Mekedatu reservoir. Reports describe the MPs wearing green towels and urging the Union government to prevent construction. The occurrence and principal demand are corroborated; this record does not determine the underlying interstate water dispute.",
    directedAt: "Union Government; Union Ministry of Jal Shakti",
    eventVerification: "Occurrence and principal demand verified",
    publicationStatus: "candidate",
    publicLaunchStatus: "launchable",
    publishedAt: null,
    approvedSourceCount: 2,
    sources: [
      {
        publisher: "Asianet Newsable / ANI",
        headline: "Mekedatu dam: DMK MPs protest, urge Centre to stop construction",
        url: "https://newsable.asianetnews.com/amp/india/mekedatu-dam-dmk-mps-protest-urge-centre-to-stop-construction-articleshow-tksbo4e",
        publicationDate: "2026-07-20",
        sourceType: "News report",
        sourceRole: "Lead",
      },
      {
        publisher: "NDTV",
        headline: "Parliament Monsoon Session 2026 live updates",
        url: "https://www.ndtv.com/india-news/parliament-monsoon-session-2026-live-updates-lok-sabha-rajya-sabha-11798662/amp/1",
        publicationDate: "2026-07-20",
        sourceType: "Live news report",
        sourceRole: "Corroboration",
      },
    ],
    safety: noIncidents("2026-08-04"),
    safetyIncidents: [],
    visual: recordCover(
      "DMK MPs’ Mekedatu protest",
      "Parliament complex, New Delhi",
      "20 July 2026",
      2,
      "https://newsable.asianetnews.com/amp/india/mekedatu-dam-dmk-mps-protest-urge-centre-to-stop-construction-articleshow-tksbo4e",
    ),
  },
  {
    internalId: "IO-CM-JH-0002",
    slug: "jharkhand-students-jpsc-jssc-irregularities",
    title: "Jharkhand students protest alleged JPSC and JSSC examination irregularities",
    eventType: "Hunger strike",
    eventStatus: "Ongoing",
    primaryTopic: "Education",
    topic: "Alleged irregularities in JPSC and JSSC recruitment examinations",
    stateOrUnionTerritory: "Jharkhand",
    publicLocation: "Ranchi, Jharkhand; exact protest ground remains under verification",
    startDate: "2026-07-25",
    endDate: null,
    lastConfirmedActive: "2026-08-03",
    lastReviewed: "2026-08-04",
    summary:
      "JPSC and JSSC aspirants began a protest and hunger strike in Ranchi on 25 July 2026 over alleged recruitment-examination irregularities. Current reporting described the action as continuing on 3 August and recorded the students’ demands. The allegations remain attributed and the exact protest ground requires confirmation.",
    directedAt: "Jharkhand Government; JPSC; JSSC",
    eventVerification: "Ongoing occurrence and stated demands verified; allegations remain attributed",
    publicationStatus: "candidate",
    publicLaunchStatus: "launchable",
    publishedAt: null,
    approvedSourceCount: 2,
    sources: [
      {
        publisher: "Mint",
        headline:
          "Jharkhand protest: support extended to students over JPSC and JSSC examination allegations",
        url: "https://www.livemint.com/news/india/jharkhand-protest-cjp-extends-support-to-students-jpsc-jssc-exam-what-are-the-allegations-and-students-demands-11785725534278.html",
        publicationDate: "2026-08-03",
        sourceType: "News report",
        sourceRole: "Lead",
      },
      {
        publisher: "ANI",
        headline:
          "Jharkhand Congress working president sends refreshments to students protesting JPSC and JSSC CGL irregularities",
        url: "https://www.aninews.in/news/national/general-news/jharkhand-congress-working-president-sends-refreshments-to-students-protesting-against-jpsc-and-jssc-cgl-irregularities20260803110640/",
        publicationDate: "2026-08-03",
        sourceType: "News report",
        sourceRole: "Corroboration",
      },
    ],
    safety: noIncidents("2026-08-04"),
    safetyIncidents: [],
    visual: recordCover(
      "Jharkhand examination protest",
      "Ranchi, Jharkhand",
      "Ongoing",
      2,
      "https://www.livemint.com/news/india/jharkhand-protest-cjp-extends-support-to-students-jpsc-jssc-exam-what-are-the-allegations-and-students-demands-11785725534278.html",
    ),
  },
  {
    internalId: "IO-CM-MP-0003",
    slug: "madhya-pradesh-students-examination-leaks",
    title: "Students protest examination paper leaks across Madhya Pradesh",
    eventType: "Multi-form civic protest",
    eventStatus: "Outcome pending",
    primaryTopic: "Education",
    topic: "Examination paper leaks and demand for the Union Education Minister’s resignation",
    stateOrUnionTerritory: "Madhya Pradesh",
    publicLocation: "Multiple Madhya Pradesh locations, including Bhanwar Kuan, Indore",
    startDate: null,
    endDate: null,
    lastConfirmedActive: "2026-07-25",
    lastReviewed: "2026-08-04",
    summary:
      "Students held protests in multiple Madhya Pradesh locations in July 2026 over examination paper leaks and demanded Union Education Minister Dharmendra Pradhan’s resignation. Reporting identifies an action at Bhanwar Kuan in Indore and a later report says a 25-day Indore protest ended on 25 July. The dates and outcomes of other reported locations remain under review.",
    directedAt: "Union Ministry of Education; Madhya Pradesh Government",
    eventVerification: "Occurrence verified — statewide chronology and final outcome remain under review",
    publicationStatus: "candidate",
    publicLaunchStatus: "launchable",
    publishedAt: null,
    approvedSourceCount: 2,
    sources: [
      {
        publisher: "The News Mill",
        headline:
          "Students protest across Madhya Pradesh demanding Dharmendra Pradhan’s resignation over exam paper leaks",
        url: "https://thenewsmill.com/2026/07/students-protest-across-madhya-pradesh-demanding-dharmendra-pradhans-resignation-over-exam-paper-leaks/",
        publicationDate: "2026-07-24",
        sourceType: "News report",
        sourceRole: "Lead",
      },
      {
        publisher: "The Times of India",
        headline: "Indore students end 25-day NEET protest",
        url: "https://timesofindia.indiatimes.com/city/indore/sweets-songs-neem-leaves-indore-students-end-25-day-neet-protest/amp_articleshow/132633037.cms",
        publicationDate: "2026-07-25",
        sourceType: "Follow-up report",
        sourceRole: "Follow-up",
      },
    ],
    safety: noIncidents("2026-08-04"),
    safetyIncidents: [],
    visual: recordCover(
      "Madhya Pradesh examination protests",
      "Madhya Pradesh",
      "Outcome pending",
      2,
      "https://thenewsmill.com/2026/07/students-protest-across-madhya-pradesh-demanding-dharmendra-pradhans-resignation-over-exam-paper-leaks/",
    ),
  },
  {
    internalId: "IO-CM-MH-0011",
    slug: "youth-congress-nagpur-e20-gadkari-protest",
    title: "Youth Congress workers protest outside Nitin Gadkari’s Nagpur residence over E20 fuel",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    primaryTopic: "Trade & economic policy",
    topic: "Opposition to the E20 ethanol-blended petrol policy",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Outside Nitin Gadkari’s residence, Nagpur, Maharashtra",
    startDate: "2026-08-04",
    endDate: "2026-08-04",
    lastConfirmedActive: "2026-08-04",
    lastReviewed: "2026-08-04",
    summary:
      "Youth Congress workers protested outside Union Minister Nitin Gadkari’s Nagpur residence on 4 August 2026 over the E20 ethanol-blended petrol policy. The report directly establishes the demonstration and subsequent detentions. Broader claims about the policy’s effects remain attributed to protesters.",
    directedAt: "Union Ministry of Road Transport and Highways; Union Government",
    eventVerification: "Occurrence and detentions verified; policy claims remain attributed",
    publicationStatus: "candidate",
    publicLaunchStatus: "launchable",
    publishedAt: null,
    approvedSourceCount: 1,
    sources: [
      {
        publisher: "The Hindu",
        headline:
          "Youth Congress workers protest outside Gadkari’s house in Nagpur; several detained",
        url: "https://www.thehindu.com/news/national/maharashtra/youth-congress-workers-protest-outside-gadkaris-house-in-nagpur-several-detained/article71302011.ece",
        publicationDate: "2026-08-04",
        sourceType: "News report",
        sourceRole: "Lead",
      },
    ],
    safety: noIncidents("2026-08-04"),
    safetyIncidents: [],
    visual: recordCover(
      "Youth Congress E20 protest",
      "Nagpur, Maharashtra",
      "4 August 2026",
      1,
      "https://www.thehindu.com/news/national/maharashtra/youth-congress-workers-protest-outside-gadkaris-house-in-nagpur-several-detained/article71302011.ece",
    ),
  },
  {
    internalId: "IO-CM-AS-0004",
    slug: "kaziranga-indigenous-residents-luxury-hotel-protest",
    title: "Indigenous residents protest a proposed luxury hotel near Kaziranga National Park",
    eventType: "Multi-form civic protest",
    eventStatus: "Ongoing",
    primaryTopic: "Land & rehabilitation",
    topic: "Opposition to a proposed luxury hotel and claimed displacement risks near Kaziranga",
    stateOrUnionTerritory: "Assam",
    publicLocation: "Ingle Pathar near Kaziranga National Park, Golaghat district, Assam",
    startDate: "2026-06-28",
    endDate: null,
    lastConfirmedActive: "2026-07-25",
    lastReviewed: "2026-08-04",
    summary:
      "Indigenous residents and land-rights defenders protested at Ingle Pathar near Kaziranga National Park on 28 June 2026 against a proposed luxury hotel and claimed displacement risks. Reporting describes a continuing strike beginning on 13 July and later advocacy following the arrest of activist Pranab Doley. The arrest and any later detention measure are treated as responses to the underlying collective action, not as separate events.",
    directedAt: "Assam Government; Golaghat District Administration; project authorities",
    eventVerification: "Collective action and grievance verified; project and detention details remain attributed",
    publicationStatus: "candidate",
    publicLaunchStatus: "launchable",
    publishedAt: null,
    approvedSourceCount: 4,
    sources: [
      {
        publisher: "Scroll.in",
        headline: "Assam activist leading protests against Kaziranga luxury hotels arrested",
        url: "https://scroll.in/latest/1094228/assam-activist-leading-protests-against-kaziranga-luxury-hotels-arrested",
        publicationDate: "2026-07-13",
        sourceType: "News report",
        sourceRole: "Lead",
      },
      {
        publisher: "The Quint",
        headline:
          "Pranab Doley’s arrest and the protest over land and tribal rights near Kaziranga",
        url: "https://www.thequint.com/climate-change/pranab-doley-assam-kaziranga-activist-arrested-protest-democracy-tribal-rights",
        publicationDate: "2026-07-25",
        sourceType: "News report",
        sourceRole: "Corroboration",
      },
      {
        publisher: "IWGIA",
        headline: "IWGIA condemns targeting of Pranab Doley following land-rights advocacy",
        url: "https://www.iwgia.org/en/news/iwgia-condemns-targeting-of-pranab-doley-due-to-protesting-that-resulted-in-cancellation-of-43425-million-loan-adb-project-in-assam?lang=fr",
        publicationDate: "2026-07-16",
        sourceType: "Organisational statement",
        sourceRole: "Official response",
      },
      {
        publisher: "International Land Coalition",
        headline: "Statement on the arrest of Indigenous human-rights defender Pranab Doley",
        url: "https://www.landcoalition.org/en/latest/statement-on-the-arrest-of-indigenous-human-rights-defender-pranab-doley/",
        publicationDate: "2026-07-20",
        sourceType: "Organisational statement",
        sourceRole: "Official response",
      },
    ],
    safety: noIncidents("2026-08-04"),
    safetyIncidents: [],
    latestOfficialResponse:
      "IWGIA and the International Land Coalition condemned Pranab Doley’s arrest and called for his release. These statements are recorded as organisational responses to the land-rights protest.",
    visual: recordCover(
      "Kaziranga land-rights protest",
      "Golaghat district, Assam",
      "Ongoing",
      4,
      "https://scroll.in/latest/1094228/assam-activist-leading-protests-against-kaziranga-luxury-hotels-arrested",
    ),
  },
] as const satisfies readonly ReviewedEventPreview[];

const delhiStudentSources: readonly EventPublicSource[] = [
  {
    publisher: "The Indian Express",
    headline: "AISA president Neha and two activists complete a 23-day Jantar Mantar hunger strike",
    url: "https://indianexpress.com/article/political-pulse/aisa-neha-hunger-strike-jantar-mantar-dharmendra-pradhan-resignation-cjp-protest-10804842/",
    publicationDate: "2026-07-27",
    sourceType: "Follow-up report",
    sourceRole: "Follow-up",
  },
  {
    publisher: "ThePrint / PTI",
    headline: "Student agitation called off after government accepts demands",
    url: "https://theprint.in/india/cjp-calls-off-agitation-after-govt-accepts-all-demands-next-round-of-talks-after-4-weeks/2996816/",
    publicationDate: "2026-07-20",
    sourceType: "Outcome report",
    sourceRole: "Follow-up",
  },
  {
    publisher: "LiveLaw",
    headline: "Supreme Court hears pleas over police action during student protests",
    url: "https://www.livelaw.in/top-stories/police-action-during-cjp-student-protests-live-updates-from-supreme-court-543129",
    publicationDate: "2026-07-28",
    sourceType: "Court report",
    sourceRole: "Official response",
  },
  {
    publisher: "India Today",
    headline: "Supreme Court issues interim orders in pleas over action against student protesters",
    url: "https://www.indiatoday.in/india/law-news/story/case-made-out-of-high-powered-probe-sc-issues-interim-orders-on-pleas-against-action-on-student-protesters-2957888-2026-07-28",
    publicationDate: "2026-07-28",
    sourceType: "Court report",
    sourceRole: "Corroboration",
  },
];

const maharashtraStudentSources: readonly EventPublicSource[] = [
  {
    publisher: "The Indian Express",
    headline: "Mumbai Police continue summoning protesters after a case-withdrawal assurance",
    url: "https://indianexpress.com/article/cities/mumbai/despite-withdrawal-assurance-mumbai-police-keep-summoning-cjp-protesters-10806444/",
    publicationDate: "2026-07-28",
    sourceType: "Follow-up report",
    sourceRole: "Follow-up",
  },
  {
    publisher: "Akashvani News",
    headline: "Maharashtra Chief Minister directs withdrawal of cases with court permission",
    url: "https://newsonair.gov.in/maharashtra-cm-directs-withdrawal-of-cases-against-neet-protesters-with-permission-of-concerned-courts/",
    publicationDate: "2026-07-28",
    sourceType: "Official response report",
    sourceRole: "Official response",
  },
  {
    publisher: "The Times of India",
    headline: "Fadnavis defends Delhi Police action during the Jantar Mantar protest",
    url: "https://timesofindia.indiatimes.com/city/mumbai/fadnavis-defends-delhi-polices-action-says-elements-have-infiltrated-stir/articleshow/132539705.cms",
    publicationDate: "2026-07-21",
    sourceType: "Government response report",
    sourceRole: "Official response",
  },
  {
    publisher: "Associated Press",
    headline: "Report on the 20 July student protest and police action in New Delhi",
    url: "https://apnews.com/article/cbeb4773e89d67250f0bcad1670fcd38",
    publicationDate: "2026-07-20",
    sourceType: "News report",
    sourceRole: "Corroboration",
  },
];

export function applyVerifiedScannerEventPatches(
  events: readonly ReviewedEventPreview[],
): readonly ReviewedEventPreview[] {
  return events.map((event) => {
    if (event.internalId === "IO-CM-DL-0001") {
      const additions = delhiStudentSources.filter(
        (source) => !event.sources.some((existing) => existing.url === source.url),
      );
      return {
        ...event,
        lastReviewed: "2026-08-04",
        approvedSourceCount: event.sources.length + additions.length,
        sources: [...event.sources, ...additions],
        latestOfficialResponse:
          "On 28 July 2026, the Supreme Court issued interim directions in pleas concerning police action against student protesters, including release and no-coercive-action directions described in current court reporting.",
      };
    }

    if (event.internalId === "IO-CM-MH-0007") {
      const additions = maharashtraStudentSources.filter(
        (source) => !event.sources.some((existing) => existing.url === source.url),
      );
      return {
        ...event,
        eventStatus: "Outcome pending",
        lastConfirmedActive: "2026-07-28",
        lastReviewed: "2026-08-04",
        approvedSourceCount: event.sources.length + additions.length,
        sources: [...event.sources, ...additions],
        latestOfficialResponse:
          "Follow-up reporting said Mumbai Police continued issuing summons after an assurance that cases would be withdrawn. Akashvani reported a direction to seek withdrawal with permission from the concerned courts.",
      };
    }

    return event;
  });
}
