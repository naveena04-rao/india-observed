import "server-only";

import { createEventMediaRegistry, type EventMediaRegistryEntry } from "./event-media-registry";
import { reviewedEventEvidenceByInternalId } from "./reviewed-event-evidence-preview";
import type { ReviewedEventPreview } from "../lib/events/types";

/**
 * Public-safe snapshot generated from the canonical reviewed workbook at
 * C:\Users\navee\Documents\IndiaObserved\tasks\India_Observed_Master_Tracker.xlsx
 * Workbook SHA-256:
 * 76958985A005AFE9EF332F657959FFB039334E7B97D0205D3FC82C5DDD249262
 *
 * Snapshot totals after the 3 August 2026 status verification:
 * 50 events
 * 263 claims
 * 173 sources
 * 197 organisations
 * 2 corrections
 * 12 safety incidents
 *
 * The static snapshot contains only truthful media fallbacks. Approved exact-event media is loaded
 * server-side from the protected media library and never changes these reviewed event facts.
 */

const reviewedEventRecords = [
  {
    internalId: "IO-CM-MP-0001",
    slug: "bundelkhand-rehabilitation-compensation-protest",
    title:
      "Project-affected communities resume protest over rehabilitation and compensation in Bundelkhand",
    eventType: "Multi-form civic protest",
    eventStatus: "Outcome pending",
    topic:
      "Rehabilitation, compensation and displacement linked to the Ken–Betwa Link Project and other development projects",
    stateOrUnionTerritory: "Madhya Pradesh",
    publicLocation: "Chhatarpur–Panna project-affected area",
    startDate: "2026-07-04",
    endDate: null,
    lastConfirmedActive: "2026-07-19",
    lastReviewed: "2026-08-03",
    summary:
      "Project-affected tribal and farming communities resumed a protest in early July 2026 in the Chhatarpur–Panna area of Madhya Pradesh. Reported forms of protest include a symbolic Chita Andolan, Jal Satyagraha, hunger strike and Mitti Satyagraha. Participants have publicly raised concerns about compensation, rehabilitation and displacement. The occurrence and principal demands are corroborated; allegations about water access, compensation irregularities and the full implementation of relief measures remain attributed or under review. Authorities dispersed this protest phase on 19 July, but no reliable final outcome for the wider rehabilitation and compensation dispute has been established.",
    directedAt:
      "Chhatarpur and Panna district administrations; Madhya Pradesh Government; Ken–Betwa Link Project authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 7,
  },
  {
    internalId: "IO-CM-DL-0001",
    slug: "education-accountability-jantar-mantar",
    title: "Education accountability sit-in and hunger strike at Jantar Mantar",
    eventType: "Multi-form civic protest",
    eventStatus: "Concluded",
    topic:
      "Alleged examination irregularities, paper leaks and demand for education-system accountability",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "Jantar Mantar, New Delhi",
    startDate: "2026-06-20",
    endDate: "2026-07-25",
    lastConfirmedActive: "2026-07-25",
    lastReviewed: "2026-08-03",
    summary:
      "A sit-in organised by the Cockroach Janta Party continued at Jantar Mantar in New Delhi through July 2026, with participants demanding accountability over alleged examination irregularities and the resignation of Union Education Minister Dharmendra Pradhan. Education reformer Sonam Wangchuk joined through an indefinite hunger strike from 28 June. Police removed him from the site and transferred him to hospital on 18 July, and a 20 July march towards Parliament encountered police baton charges and tear gas. The movement called off its protests on 25 July after the education minister resigned and organisers said the government had accepted their demands. The occurrence, conclusion and principal demands are corroborated; responsibility for the earlier escalation and injury totals remain disputed or attributed.",
    directedAt: "Union Ministry of Education; Government of India",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
    latestOfficialResponse:
      "The education minister resigned on 25 July, after which organisers said the government had accepted their demands and called off the protests.",
  },
  {
    internalId: "IO-CM-KA-0001",
    slug: "mandya-farmers-krs-irrigation-water",
    title: "Mandya farmers intensify protest demanding release of KRS irrigation water",
    eventType: "Demonstration",
    eventStatus: "Outcome pending",
    topic: "Immediate release of canal water from the KRS reservoir for standing crops",
    stateOrUnionTerritory: "Karnataka",
    publicLocation: "Mandya, Karnataka",
    startDate: "2026-07-13",
    endDate: null,
    lastConfirmedActive: "2026-07-14",
    lastReviewed: "2026-08-03",
    summary:
      "Farmers and supporting organisations protested in Mandya on 13 July 2026, demanding the immediate release of water from the Krishnaraja Sagar reservoir into irrigation canals. Independent reports documented a demonstration near the deputy commissioner's office and a blockade of the old Mysuru–Bengaluru highway. Protesters said standing crops were drying because of the delay and opposed additional diversion of Cauvery water while irrigation needs remained unmet. The occurrence and stated demands are corroborated; crop-loss severity remains attributed to protesters. No reliable final outcome or continued activity after 14 July has been established.",
    directedAt: "Mandya District Administration; Karnataka Government; Cauvery water authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-CH-0001",
    slug: "bku-rajewal-chandigarh-trade-rally",
    title: "BKU-Rajewal holds Chandigarh motorcycle rally over proposed India–US trade agreement",
    eventType: "March",
    eventStatus: "Concluded",
    topic:
      "Opposition to the proposed India–US trade agreement and concerns affecting Punjab agriculture",
    stateOrUnionTerritory: "Chandigarh",
    publicLocation: "Mohali–Chandigarh rally route",
    startDate: "2026-07-13",
    endDate: "2026-07-13",
    lastConfirmedActive: "2026-07-13",
    lastReviewed: "2026-07-15",
    summary:
      "The Bharatiya Kisan Union (Rajewal) held a motorcycle and vehicle rally from Mohali to Chandigarh on 13 July 2026. Participants called for rejection of the proposed India–US trade agreement, arguing that greater agricultural imports could disadvantage small farmers and allied sectors. Organisers also raised Punjab-specific concerns including groundwater quality, land acquisition and natural resources. Independent reports documented the route, traffic restrictions and submission of memorandums; predictions about the trade agreement's effects remain attributed to organisers.",
    directedAt: "Government of India; Punjab Government; Chandigarh Administration and Police",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-MH-0001",
    slug: "save-sgnp-human-chain-thane",
    title: "Citizens form human chain in Thane under the Save SGNP campaign",
    eventType: "Civic campaign",
    eventStatus: "Concluded",
    topic: "Protection of forests and eco-sensitive areas surrounding Sanjay Gandhi National Park",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Thane, Maharashtra",
    startDate: "2026-07-05",
    endDate: "2026-07-05",
    lastConfirmedActive: "2026-07-05",
    lastReviewed: "2026-07-15",
    summary:
      "Residents, trekkers, environmentalists and other supporters gathered in Thane on 5 July 2026 as part of the Save SGNP campaign. Reports documented a protest and human chain opposing infrastructure and construction proposals near Sanjay Gandhi National Park and surrounding forest areas. One stated demand was to stop a proposed man-made biodiversity park in an area protesters described as already ecologically sensitive. The occurrence is corroborated; campaign claims about exact attendance and the precise area at risk remain attributed pending official land and project records.",
    directedAt: "Thane Municipal Corporation; Maharashtra forest and environment authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-KA-0002",
    slug: "bidadi-farmers-land-acquisition",
    title:
      "Bidadi farmers continue protest against land acquisition for Greater Bengaluru Integrated Township",
    eventType: "Multi-form civic protest",
    eventStatus: "Outcome pending",
    topic:
      "Land acquisition, agricultural livelihoods, compensation, consent and environmental concerns linked to the Greater Bengaluru Integrated Township",
    stateOrUnionTerritory: "Karnataka",
    publicLocation: "Bidadi region, Bengaluru South",
    startDate: null,
    endDate: null,
    lastConfirmedActive: "2026-07-15",
    lastReviewed: "2026-08-03",
    summary:
      "Farmers and agricultural communities around Bidadi have conducted a sustained movement opposing land acquisition for the proposed Greater Bengaluru Integrated Township. The movement includes village meetings, marches, an Appiko tree-hugging action and resistance to land-survey activity. Protesters say the project threatens agricultural livelihoods and has proceeded without adequate consent or consultation. The Karnataka government describes the township as a planned urban-development and employment project and has offered compensation options. The protest's occurrence and the first-phase acquisition notification are corroborated; claims concerning consent levels, the fertility and extent of affected farmland, environmental loss and responsibility for violence during survey operations remain attributed or disputed. A government review was announced, but no reliable final outcome or continued activity after 15 July has been established.",
    directedAt:
      "Karnataka Government; Greater Bengaluru Development Authority; Bengaluru South District Administration",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 8,
  },
  {
    internalId: "IO-CM-GJ-0001",
    slug: "morbi-transmission-compensation-satyagraha",
    title:
      "Morbi farmers continue satyagraha over compensation for power-transmission infrastructure",
    eventType: "Multi-form civic protest",
    eventStatus: "Ongoing",
    topic:
      "Compensation and agricultural-land impacts linked to high-voltage transmission towers and right-of-way corridors",
    stateOrUnionTerritory: "Gujarat",
    publicLocation: "Jetpar village, Morbi district",
    startDate: "2026-06-07",
    endDate: null,
    lastConfirmedActive: "2026-07-14",
    lastReviewed: "2026-08-03",
    summary:
      "Farmers centred in Jetpar village, Morbi, conducted a multi-phase movement against the compensation terms for agricultural land affected by a high-voltage power-transmission project. The movement included demonstrations, symbolic head-shaving and an indefinite hunger strike that began on 17 June. After the Gujarat government issued revised compensation guidelines on 4 July, the farmers ended the fast but said the agitation would continue as a satyagraha because questions remained about land valuation, right-of-way compensation and implementation. The movement and government response are independently corroborated; claims about land becoming uncultivable and the exact number of affected farmers remain attributed.",
    directedAt:
      "Gujarat Government; Morbi District Administration; Halvad Transmission Ltd; Adani Energy Solutions Ltd",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-UP-0001",
    slug: "dasiya-villagers-ethanol-plant",
    title: "Dasiya villagers protest construction of an ethanol plant in Basti district",
    eventType: "Demonstration",
    eventStatus: "Outcome pending",
    topic:
      "Environmental, water, health and land-consent concerns relating to a proposed ethanol plant",
    stateOrUnionTerritory: "Uttar Pradesh",
    publicLocation: "Dasiya village, Basti district",
    startDate: "2026-06-23",
    endDate: null,
    lastConfirmedActive: "2026-07-14",
    lastReviewed: "2026-08-03",
    summary:
      "Residents of Dasiya and nearby villages have opposed an ethanol plant under construction in Basti district. A memorandum submitted in June raised concerns about nearby settlements and government schools, while a larger demonstration was announced and held on 14 July under substantial police deployment. Protesters called for the factory to be stopped and raised concerns about water use, environmental and health effects, and the circumstances in which land was obtained. The occurrence and stated opposition are corroborated through local-language reporting and public field material; allegations that residents were misled about the project and specific impact estimates remain attributed. No reliable final outcome or continued activity after 14 July has been established.",
    directedAt:
      "Basti District Administration; Uttar Pradesh Pollution Control and industrial authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-AS-0001",
    slug: "kokrajhar-apdcl-land-allotment-protest",
    title:
      "Bodo residents protest proposed APDCL land allotment and resettlement plan in Kokrajhar",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic: "Protection of Tribal Belt and Block land from proposed allotment and resettlement",
    stateOrUnionTerritory: "Assam",
    publicLocation: "Malgaon area, Kokrajhar district",
    startDate: "2026-07-12",
    endDate: "2026-07-12",
    lastConfirmedActive: "2026-07-12",
    lastReviewed: "2026-07-15",
    summary:
      "Hundreds of Bodo residents gathered at Malgaon on 12 July 2026 to oppose a proposed land allotment to Assam Power Distribution Company Limited and the proposed rehabilitation of 93 families evicted from Kaimari. Protesters demanded protection of land they described as part of a Tribal Belt and Block and called for the allotment and resettlement proposal to be withdrawn. The demonstration is supported by regional video reporting and local community coverage. The legal status and exact acreage of the land, the government's decision-making record and the rights of all affected communities require official documents and careful follow-up.",
    directedAt:
      "Assam Government; Bodoland Territorial Council; Assam Power Distribution Company Limited",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-MN-0001",
    slug: "manipur-government-employees-strike",
    title:
      "Manipur government employees continue indefinite cease-work strike over pay and service conditions",
    eventType: "Strike",
    eventStatus: "Outcome pending",
    topic:
      "Dearness allowance, pension, retirement age, contractual employment and weekly-holiday demands",
    stateOrUnionTerritory: "Manipur",
    publicLocation: "Government offices across Manipur",
    startDate: "2026-07-01",
    endDate: null,
    lastConfirmedActive: "2026-07-15",
    lastReviewed: "2026-08-03",
    summary:
      "The Manipur Government Services Federation launched an indefinite cease-work strike on 1 July 2026 over a multi-point charter concerning dearness allowance, pension arrangements, retirement age, contractual appointments and weekly holidays. Reporting from regional and state-level outlets documented significant disruption to routine administrative work. The government restored Saturday as a holiday and introduced a five-day work week, but the federation said the strike would continue because other demands remained unresolved. The occurrence, duration and partial government response are corroborated; estimates of financial loss and the precise participation level remain attributed. No reliable final outcome or continued activity after 15 July has been established.",
    directedAt: "Manipur Government; Chief Minister and Chief Secretary of Manipur",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 5,
  },
  {
    internalId: "IO-CM-OD-0001",
    slug: "dharmasala-teacher-vacancy-protest",
    title: "Dharmasala high-school students stage dharna over teacher vacancies",
    eventType: "Sit-in / Dharna",
    eventStatus: "Concluded",
    topic: "Teacher shortages affecting a rural government school's academic functioning",
    stateOrUnionTerritory: "Odisha",
    publicLocation: "Dharmasala block, Jajpur district",
    startDate: "2026-07-10",
    endDate: "2026-07-10",
    lastConfirmedActive: "2026-07-10",
    lastReviewed: "2026-07-15",
    summary:
      "Students of Dharmasala Baneepeetha High School in Jajpur district locked the school gate and staged a dharna on 10 July 2026, demanding immediate appointment of teachers. Independent local reports agreed that several posts were vacant and that students said the shortage was affecting their studies, although the reports differed on the precise number of teachers and students. District education officials responded the same day by deputing two teachers, after which the students withdrew the protest. The event, demand and immediate response are corroborated; remaining staffing vacancies require follow-up.",
    directedAt: "Jajpur District Education Office; Odisha School and Mass Education Department",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-UK-0001",
    slug: "bhaniyawala-rishikesh-tree-felling-protest",
    title: "Residents protest tree felling for Bhaniyawala–Rishikesh highway widening",
    eventType: "Multi-form civic protest",
    eventStatus: "Outcome pending",
    topic:
      "Tree felling, forest and wildlife-corridor impacts linked to the Bhaniyawala–Jollygrant–Rishikesh road-widening project",
    stateOrUnionTerritory: "Uttarakhand",
    publicLocation: "Bhaniyawala–Rishikesh stretch, Dehradun district",
    startDate: "2026-07-08",
    endDate: "2026-07-19",
    lastConfirmedActive: "2026-07-19",
    lastReviewed: "2026-08-03",
    summary:
      "Residents and environmental activists in Dehradun district organised protests against tree felling for the Bhaniyawala–Jollygrant–Rishikesh highway-widening project. Documented actions included a demonstration at the NHAI office, tree-hugging and sit-ins along the road stretch. Tree felling later resumed under police deployment, and media reported arrests and an FIR against unidentified protesters. On 19 July, the chief minister ordered an immediate halt to tree felling and directed officials to consult stakeholders. The occurrence, protest methods and interim halt are corroborated; the project's final configuration and the precise number of trees affected remain unresolved.",
    directedAt:
      "National Highways Authority of India; Uttarakhand Forest Department; Uttarakhand Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 6,
  },
  {
    internalId: "IO-CM-HR-0001",
    slug: "haryana-rabi-procurement-protests",
    title: "Haryana farmers protest biometric and other new Rabi procurement requirements",
    eventType: "Multi-form civic protest",
    eventStatus: "Outcome pending",
    topic:
      "Biometric verification, portal rules and access to government wheat and mustard procurement",
    stateOrUnionTerritory: "Haryana",
    publicLocation: "Multiple districts, Haryana",
    startDate: "2026-04-05",
    endDate: "2026-04-20",
    lastConfirmedActive: "2026-04-20",
    lastReviewed: "2026-07-17",
    summary:
      "Farmer organisations in Haryana staged coordinated protests in April 2026 against biometric verification and other new Rabi procurement procedures. Actions included market sit-ins, road blockades and an indefinite protest in Jind. The state defended the system as a transparency and anti-irregularity measure. The occurrence and policy dispute are corroborated; the final resolution was not located in the reviewed sources.",
    directedAt:
      "Haryana Government; Food, Civil Supplies and Consumer Affairs Department; market committees",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-HR-0002",
    slug: "manesar-industrial-workers-protest",
    title: "Manesar industrial workers protest wages and working conditions",
    eventType: "Multi-form civic protest",
    eventStatus: "Concluded",
    topic: "Minimum wages, rising living costs and industrial working conditions",
    stateOrUnionTerritory: "Haryana",
    publicLocation: "IMT Manesar, Gurugram",
    startDate: "2026-04-07",
    endDate: "2026-04-10",
    lastConfirmedActive: "2026-04-10",
    lastReviewed: "2026-07-17",
    summary:
      "Industrial workers in Manesar protested in April 2026 for higher wages and improved working conditions amid rising living costs. Work stoppages and street demonstrations affected several units, and clashes were reported on 9 April. Haryana then announced a substantial minimum-wage revision. The protest and wage response are corroborated; responsibility for violence remains attributed.",
    directedAt: "Haryana Government; Gurugram Police; labour department; industrial employers",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-UP-0002",
    slug: "noida-factory-workers-protest",
    title: "Noida factory workers protest wages, hours and overtime conditions",
    eventType: "Multi-form civic protest",
    eventStatus: "Concluded",
    topic: "Wage increases, fixed working hours, overtime payments and factory labour conditions",
    stateOrUnionTerritory: "Uttar Pradesh",
    publicLocation: "Noida, Gautam Buddha Nagar",
    startDate: "2026-04-08",
    endDate: "2026-04-14",
    lastConfirmedActive: "2026-04-14",
    lastReviewed: "2026-07-17",
    summary:
      "Factory workers in Noida protested in April 2026 seeking higher wages, regulated working hours and improved overtime payments. The protests escalated into clashes on 13 April, and police used tear gas. Uttar Pradesh subsequently announced a minimum-wage increase. The occurrence and policy response are corroborated; responsibility for violence remains disputed.",
    directedAt:
      "Uttar Pradesh Government; Gautam Buddha Nagar Police; labour department; industrial employers",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-DL-0002",
    slug: "jamia-yuva-kumbh-campus-protest",
    title: "Jamia students protest an RSS-linked Yuva Kumbh event on campus",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic:
      "Campus autonomy, ideological events and allegations concerning treatment of protesting students",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "Jamia Millia Islamia, New Delhi",
    startDate: "2026-04-28",
    endDate: "2026-04-28",
    lastConfirmedActive: "2026-04-28",
    lastReviewed: "2026-07-17",
    summary:
      "Students at Jamia Millia Islamia protested on 28 April 2026 against an RSS-linked Yuva Kumbh programme on campus. Police and CRPF personnel were deployed, and students and the university issued conflicting accounts about the removal of protesters and alleged injuries. The protest and deployment are corroborated; injury totals and force allegations remain disputed.",
    directedAt: "Jamia Millia Islamia administration; Delhi Police; CRPF",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-KL-0001",
    slug: "kerala-hospitality-lpg-shutdown",
    title: "Kerala hotels, restaurants and bakeries shut over commercial LPG prices",
    eventType: "Strike",
    eventStatus: "Concluded",
    topic: "Commercial LPG price increases and operating costs for hospitality businesses",
    stateOrUnionTerritory: "Kerala",
    publicLocation: "Kerala, statewide",
    startDate: "2026-05-06",
    endDate: "2026-05-06",
    lastConfirmedActive: "2026-05-06",
    lastReviewed: "2026-07-17",
    summary:
      "Hotels, restaurants, bakeries and allied hospitality businesses across Kerala observed a 24-hour shutdown on 6 May 2026 over a sharp increase in commercial LPG prices. Organisers also held marches and dharnas at petroleum-company and central-government offices. The shutdown and public impact are independently documented.",
    directedAt: "Union petroleum authorities; Indian Oil Corporation; Kerala Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-PB-0001",
    slug: "punjab-transport-workers-gate-rallies",
    title: "Punjab Roadways, PUNBUS and PRTC contract workers hold gate rallies",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic: "Regularisation, release of jailed colleagues and opposition to transport privatisation",
    stateOrUnionTerritory: "Punjab",
    publicLocation: "Punjab, statewide",
    startDate: "2026-05-15",
    endDate: "2026-05-15",
    lastConfirmedActive: "2026-05-15",
    lastReviewed: "2026-07-17",
    summary:
      "Contract workers of Punjab Roadways, PUNBUS and PRTC held gate rallies at depots across Punjab on 15 May 2026. Their demands included release of jailed colleagues, regularisation and opposition to the kilometre scheme. The rallies are corroborated; legal and employment-status claims remain attributed.",
    directedAt: "Punjab Transport Department; Punjab Government; public transport corporations",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-DL-0003",
    slug: "delhi-neet-paper-leak-protests",
    title: "Student organisations protest the alleged NEET-UG paper leak in Delhi",
    eventType: "Multi-form civic protest",
    eventStatus: "Outcome pending",
    topic:
      "Alleged NEET-UG paper leak, examination cancellation and accountability of the testing system",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "New Delhi",
    startDate: "2026-05-13",
    endDate: "2026-05-15",
    lastConfirmedActive: "2026-05-15",
    lastReviewed: "2026-07-17",
    summary:
      "Student organisations protested in Delhi from 13 to 15 May 2026 over the cancellation of NEET-UG following allegations of a paper leak. Demonstrations occurred outside the National Testing Agency, the Education Minister's residence and at Jantar Mantar. The protests are corroborated; criminal responsibility and the scale of the leak remain subject to investigation.",
    directedAt:
      "National Testing Agency; Union Ministry of Education; Delhi Police; investigating agencies",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-TS-0001",
    slug: "hyderabad-neet-paper-leak-protests",
    title: "Student groups protest the alleged NEET-UG paper leak in Hyderabad",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic:
      "Examination integrity, alleged NEET-UG paper leak and accountability of education authorities",
    stateOrUnionTerritory: "Telangana",
    publicLocation: "Hyderabad, Telangana",
    startDate: "2026-05-13",
    endDate: "2026-05-14",
    lastConfirmedActive: "2026-05-14",
    lastReviewed: "2026-07-17",
    summary:
      "Student organisations in Hyderabad staged protests on 13 and 14 May 2026 over the alleged NEET-UG paper leak and cancellation. Separate groups demonstrated at Lok Bhavan, RTC Crossroads and other sites. The occurrence and demands are independently documented; responsibility for the leak remains under investigation.",
    directedAt: "Telangana Police; National Testing Agency; Union Ministry of Education",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-RJ-0001",
    slug: "jaipur-neet-irregularities-march",
    title: "Congress workers protest alleged NEET irregularities in Jaipur",
    eventType: "March",
    eventStatus: "Concluded",
    topic: "Alleged NEET-UG irregularities and accountability of education authorities",
    stateOrUnionTerritory: "Rajasthan",
    publicLocation: "Jaipur, Rajasthan",
    startDate: "2026-05-21",
    endDate: "2026-05-21",
    lastConfirmedActive: "2026-05-21",
    lastReviewed: "2026-07-17",
    summary:
      "Congress workers marched in Jaipur on 21 May 2026 over alleged irregularities in NEET-UG. Police stopped the march at barricades, used water cannons and detained participants. The protest and police response are independently documented; injury reports and claims about the examination leak remain attributed.",
    directedAt: "Rajasthan Police; Union Ministry of Education; National Testing Agency",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-DL-0004",
    slug: "delhi-ncr-transport-strike",
    title: "Delhi-NCR taxi, auto and transport unions hold three-day strike",
    eventType: "Strike",
    eventStatus: "Concluded",
    topic: "Fuel prices, stagnant fares, app-aggregator commissions and transport operating costs",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "Delhi-NCR",
    startDate: "2026-05-21",
    endDate: "2026-05-23",
    lastConfirmedActive: "2026-05-23",
    lastReviewed: "2026-07-17",
    summary:
      "Taxi, auto-rickshaw and commercial transport unions in Delhi-NCR began a three-day strike on 21 May 2026 over rising fuel costs, unchanged fares and other operating expenses. Participation and disruption varied across services. The strike and union demands are independently documented.",
    directedAt:
      "Delhi Government; transport departments; app-based mobility companies; Union petroleum authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-DL-0005",
    slug: "bharat-tiwari-justice-rights-assembly",
    title: "Bharat Tiwari family and supporters hold justice-rights assembly at Jantar Mantar",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic:
      "Independent investigation and accountability in the Bharat Bhushan Tiwari police-encounter case",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "Jantar Mantar, New Delhi",
    startDate: "2026-07-17",
    endDate: "2026-07-17",
    lastConfirmedActive: "2026-07-17",
    lastReviewed: "2026-07-18",
    summary:
      "The family and supporters of Bharat Bhushan Tiwari held a justice-rights assembly at Jantar Mantar in New Delhi on 17 July 2026. Independent post-event reports documented the gathering, tributes, slogans and a memorandum addressed to the President and Prime Minister. Organisers and family members called for an impartial investigation and legal action against officers found responsible. The protest's occurrence and principal demands are corroborated; accounts of the 17 June encounter, crowd estimates and individual culpability remain disputed or attributed.",
    directedAt:
      "Bihar Government; Bihar Police; Bharat Bhushan Tiwari Judicial Inquiry Commission; Government of India",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 6,
  },
  {
    internalId: "IO-CM-PB-0002",
    slug: "punjab-farmers-lok-bhavan-msp-water",
    title: "Punjab farmers march towards Lok Bhavan over MSP, river-water and federal demands",
    eventType: "March",
    eventStatus: "Concluded",
    topic: "Legal guarantee for MSP, Punjab river-water rights and state-federal policy demands",
    stateOrUnionTerritory: "Punjab",
    publicLocation: "SAS Nagar–Chandigarh area, Punjab",
    startDate: "2026-05-15",
    endDate: "2026-05-15",
    lastConfirmedActive: "2026-05-15",
    lastReviewed: "2026-07-21",
    summary:
      "Farmer organisations marched from Mohali towards Punjab Lok Bhavan on 15 May 2026 to press a multi-part charter that included a legal guarantee for minimum support prices, protection of Punjab's river-water interests and objections to provisions affecting the state under the Punjab Reorganisation framework. Police used barricades, water cannon and tear gas near Chandigarh. The occurrence and principal demands are corroborated; participation figures and responsibility for any confrontation remain attributed.",
    directedAt: "Punjab Government; Chandigarh Administration; Chandigarh Police",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-RJ-0002",
    slug: "hanumangarh-wheat-procurement-pilibanga",
    title: "Hanumangarh farmers protest wheat procurement and block rail traffic at Pilibanga",
    eventType: "Multi-form civic protest",
    eventStatus: "Concluded",
    topic: "Wheat procurement, purchase limits and access to government procurement centres",
    stateOrUnionTerritory: "Rajasthan",
    publicLocation: "Pilibanga, Hanumangarh district, Rajasthan",
    startDate: "2026-05-29",
    endDate: "2026-05-30",
    lastConfirmedActive: "2026-05-30",
    lastReviewed: "2026-07-21",
    summary:
      "Farmers in Hanumangarh district held a sit-in and later blocked a railway track near Pilibanga on 29–30 May 2026 over wheat procurement. Participants said purchase limits and procurement practices were preventing eligible produce from being bought at government centres. Authorities engaged with representatives and rail movement was restored. The occurrence and demands are independently corroborated; quantities of unsold grain and the number of participants remain attributed.",
    directedAt:
      "Rajasthan Food and Civil Supplies authorities; Food Corporation of India; Hanumangarh District Administration; Railway authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-MH-0002",
    slug: "maharashtra-scheme-workers-azad-maidan",
    title:
      "Maharashtra scheme workers hold three-day Azad Maidan protest over pay and regularisation",
    eventType: "Sit-in",
    eventStatus: "Concluded",
    topic:
      "Delayed remuneration, regularisation and social-security demands of Anganwadi, ASHA, NHM and other scheme workers",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Mumbai, Maharashtra",
    startDate: "2026-06-01",
    endDate: "2026-06-03",
    lastConfirmedActive: "2026-06-03",
    lastReviewed: "2026-08-03",
    summary:
      "Anganwadi, ASHA, National Health Mission and other government-scheme workers held a three-day protest at Azad Maidan from 1 to 3 June 2026. Their demands included release of delayed remuneration, regularisation, improved honoraria and social-security protections. The protest ended after representatives received an assurance of a meeting with the state government. The occurrence and broad demands are corroborated; worker totals and arrears estimates remain organiser or media figures.",
    directedAt:
      "Maharashtra Government; Women and Child Development Department; Public Health Department",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-MH-0003",
    slug: "gadchiroli-land-acquisition-airport-industrial",
    title:
      "Gadchiroli farmers protest land acquisition for proposed airport and industrial projects",
    eventType: "Multi-form civic protest",
    eventStatus: "Concluded",
    topic:
      "Land acquisition, consent and compensation for proposed airport and industrial projects",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Gadchiroli district, Maharashtra",
    startDate: "2026-06-04",
    endDate: "2026-06-06",
    lastConfirmedActive: "2026-06-06",
    lastReviewed: "2026-08-03",
    summary:
      "Farmers and village residents marched and held a sit-in in Gadchiroli in early June 2026 against land acquisition for a proposed airport and industrial projects. Participants raised concerns about consent, compensation, agricultural livelihoods and protections under the Panchayats (Extension to Scheduled Areas) Act. The Maharashtra government subsequently halted the acquisition process pending further consultation. The protest and halt are corroborated; the permanent status of the projects and affected acreage require continued review.",
    directedAt:
      "Maharashtra Government; Gadchiroli District Administration; Maharashtra Airport Development authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-AS-0002",
    slug: "moran-motok-shutdown-representation-st-status",
    title:
      "Moran and Motok organisations enforce 48-hour shutdown over representation and ST-status demands",
    eventType: "Shutdown",
    eventStatus: "Concluded",
    topic:
      "Cabinet representation, Scheduled Tribe status and political recognition for Moran and Motok communities",
    stateOrUnionTerritory: "Assam",
    publicLocation: "Tinsukia and Dibrugarh districts, Assam",
    startDate: "2026-06-05",
    endDate: "2026-06-06",
    lastConfirmedActive: "2026-06-06",
    lastReviewed: "2026-07-21",
    summary:
      "Moran and Motok community organisations enforced a 48-hour shutdown across parts of Tinsukia and Dibrugarh districts on 5–6 June 2026. The action followed dissatisfaction over representation in the Assam cabinet and reiterated longstanding demands for Scheduled Tribe status. Reports documented transport and commercial disruption in affected areas. The occurrence is independently corroborated; the scale of compliance and the constitutional merits of the demands are not independently determined.",
    directedAt: "Assam Government; Union Ministry of Tribal Affairs",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-AS-0003",
    slug: "guwahati-tribal-township-hydropower-protest",
    title:
      "Tribal organisations protest proposed satellite-township and hydropower plans in Guwahati",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic:
      "Land, displacement and consultation concerns linked to proposed satellite townships and the Ukiam hydropower project",
    stateOrUnionTerritory: "Assam",
    publicLocation: "Guwahati, Assam",
    startDate: "2026-06-10",
    endDate: "2026-06-10",
    lastConfirmedActive: "2026-06-10",
    lastReviewed: "2026-07-21",
    summary:
      "Tribal organisations held a protest at Chachal in Guwahati on 10 June 2026 over concerns that proposed satellite-township and hydropower plans could displace tribal communities or affect protected land. Participants demanded consultation and withdrawal of proposals they considered harmful. The gathering and stated concerns are documented; the status, boundaries and final approval of the cited projects remain under verification and must not be presented as settled.",
    directedAt: "Assam Government; Guwahati development authorities; power-project authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-NL-0001",
    slug: "kohima-women-justice-sexual-violence",
    title:
      "Nagaland tribal women's organisations rally in Kohima for speedy justice in sexual-violence cases",
    eventType: "Rally",
    eventStatus: "Concluded",
    topic:
      "Speedy investigation, prosecution and institutional accountability in sexual-harassment and rape cases",
    stateOrUnionTerritory: "Nagaland",
    publicLocation: "Kohima, Nagaland",
    startDate: "2026-06-19",
    endDate: "2026-06-19",
    lastConfirmedActive: "2026-06-19",
    lastReviewed: "2026-07-21",
    summary:
      "Thousands of women from tribal organisations rallied in Kohima on 19 June 2026 demanding speedy justice and institutional accountability in sexual-harassment and rape cases, including a case involving a suspended civil servant. The rally proceeded under a district traffic advisory and submitted public demands. The occurrence and principal demand are independently corroborated; allegations in individual cases remain allegations unless established through judicial proceedings.",
    directedAt:
      "Nagaland Government; Nagaland Police; relevant investigating and judicial authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-MH-0004",
    slug: "best-workers-pension-pay-strike",
    title: "BEST workers begin strike over pension, pay-revision and retirement dues",
    eventType: "Strike",
    eventStatus: "Concluded",
    topic: "Pension, seventh-pay-commission implementation and settlement of retirement dues",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Mumbai, Maharashtra",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
    lastConfirmedActive: "2026-06-21",
    lastReviewed: "2026-08-03",
    summary:
      "Employees of Mumbai's Brihanmumbai Electric Supply and Transport undertaking began a strike in mid-June 2026 over pension, pay-revision and retirement dues. Bus operations were disrupted and court proceedings addressed the legality of the proposed action. Unions called off the strike on 21 June after talks with the Maharashtra government, and bus services began to resume. The occurrence, conclusion and demands are corroborated; implementation of the assurances remains subject to follow-up.",
    directedAt:
      "Brihanmumbai Electric Supply and Transport undertaking; Brihanmumbai Municipal Corporation; Maharashtra Government; Bombay High Court",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-MH-0005",
    slug: "maharashtra-rto-clerical-pen-down-strike",
    title: "Maharashtra RTO clerical employees hold statewide pen-down strike",
    eventType: "Strike",
    eventStatus: "Concluded",
    topic:
      "Cadre restructuring, promotions, staffing and service-condition demands of RTO clerical employees",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Maharashtra",
    startDate: "2026-06-16",
    endDate: "2026-06-23",
    lastConfirmedActive: "2026-06-23",
    lastReviewed: "2026-08-03",
    summary:
      "Clerical employees at Regional Transport Offices across Maharashtra began an indefinite pen-down strike on 16 June 2026 over cadre restructuring, promotions, staffing and related service conditions. Workers held coordinated sit-ins while public-facing RTO services were affected. The union called off the strike on 23 June after the transport minister accepted or gave assurances on the promotion demands. The occurrence and conclusion are corroborated; implementation of the assurances remains subject to follow-up.",
    directedAt: "Maharashtra Transport Department; Maharashtra Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-PB-0003",
    slug: "punjab-farmers-tubewell-power-protest",
    title: "Punjab farmers protest erratic tubewell power supply during paddy season",
    eventType: "Demonstration",
    eventStatus: "Outcome pending",
    topic: "Reliable agricultural electricity supply during paddy transplantation and peak demand",
    stateOrUnionTerritory: "Punjab",
    publicLocation: "Multiple districts, Punjab",
    startDate: "2026-06-29",
    endDate: "2026-06-30",
    lastConfirmedActive: "2026-06-30",
    lastReviewed: "2026-07-21",
    summary:
      "Farmers in several Punjab districts protested on 29–30 June 2026 over erratic or inadequate electricity supply to agricultural tubewells during paddy transplantation. Demonstrations were reported outside power offices and at road locations while the state experienced record electricity demand and industrial restrictions. The occurrence and demand for reliable supply are corroborated; outage duration, crop impact and responsibility for shortages remain source-dependent.",
    directedAt: "Punjab State Power Corporation Limited; Punjab Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-MH-0006",
    slug: "maharashtra-teachers-school-shutdown",
    title:
      "Maharashtra teachers hold statewide school shutdown over election duties and service demands",
    eventType: "Strike",
    eventStatus: "Concluded",
    topic:
      "Booth-level election duties, TET requirements, staffing, promotions and teacher service conditions",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Maharashtra",
    startDate: "2026-07-09",
    endDate: "2026-07-09",
    lastConfirmedActive: "2026-07-09",
    lastReviewed: "2026-07-21",
    summary:
      "Teacher organisations across Maharashtra held a statewide school shutdown and protests on 9 July 2026. The demands included withdrawal or revision of booth-level officer duties linked to electoral-roll work, changes concerning teacher eligibility tests, staffing and promotions. Reports documented closures and a gathering at Azad Maidan. The occurrence and broad demands are corroborated; the proportion of schools affected and uniformity of participation varied by district.",
    directedAt:
      "Maharashtra School Education Department; Election Commission authorities; Maharashtra Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-PB-0004",
    slug: "khanna-mgnrega-workers-regularisation-salaries",
    title:
      "MGNREGA employees and workers protest in Khanna over regularisation and unpaid salaries",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic:
      "Regularisation, pending salaries and employment conditions of MGNREGA staff and workers",
    stateOrUnionTerritory: "Punjab",
    publicLocation: "Khanna, Ludhiana district, Punjab",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    lastConfirmedActive: "2026-07-15",
    lastReviewed: "2026-07-21",
    summary:
      "MGNREGA employees and workers protested in Khanna on 15 July 2026, demanding regularisation and payment of salaries reported to have been pending for several months. Police used water cannon, tear gas and a baton charge when protesters attempted to advance. The occurrence and principal demands are independently corroborated; injury figures, responsibility for escalation and the exact duration of unpaid salaries remain attributed.",
    directedAt:
      "Punjab Rural Development and Panchayats Department; Punjab Government; Khanna Police",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-KA-0003",
    slug: "hidkal-displaced-farmers-belagavi-compensation",
    title:
      "Hidkal reservoir-displaced farmers begin round-the-clock compensation protest in Belagavi",
    eventType: "Sit-in",
    eventStatus: "Outcome pending",
    topic: "Compensation and land claims of families displaced by the Hidkal reservoir",
    stateOrUnionTerritory: "Karnataka",
    publicLocation: "Belagavi, Karnataka",
    startDate: "2026-07-14",
    endDate: null,
    lastConfirmedActive: "2026-07-16",
    lastReviewed: "2026-08-03",
    summary:
      "Farmers and families displaced by the Hidkal reservoir began a round-the-clock protest outside the Karnataka Neeravari Nigam office in Belagavi on 14 July 2026. They demanded compensation for land they said remained unsettled decades after displacement. Reporting documented an overnight sit-in continuing into a third day. The occurrence and core demand are corroborated; affected acreage, claimant eligibility and historical payment status require official land and compensation records. No reliable final outcome or continued activity after 16 July has been established.",
    directedAt:
      "Karnataka Neeravari Nigam Limited; Karnataka Water Resources Department; Belagavi District Administration",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-MH-0007",
    slug: "mumbai-police-action-education-protest",
    title:
      "Mumbai groups protest police action against education-accountability demonstrators in Delhi",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic:
      "Solidarity with education-accountability protesters and opposition to police action in Delhi",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Mumbai, Maharashtra",
    startDate: "2026-07-18",
    endDate: "2026-07-19",
    lastConfirmedActive: "2026-07-19",
    lastReviewed: "2026-07-21",
    summary:
      "Students and civil-society participants held separate weekend protests in Mumbai on 18 and 19 July 2026 in solidarity with the education-accountability movement in Delhi and against police action involving Sonam Wangchuk and other protesters. Police detained or booked some organisers during the Saturday action, while a Sunday gathering took place at Shivaji Park. The two actions are grouped as a bounded solidarity phase; claims about policing and injuries remain attributed.",
    directedAt: "Mumbai Police; Maharashtra Government; Union Ministry of Education",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-DL-0006",
    slug: "jammu-kashmir-statehood-jantar-mantar",
    title:
      "National Conference leaders protest in Delhi for restoration of Jammu and Kashmir statehood",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic: "Restoration of statehood to Jammu and Kashmir",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "Jantar Mantar, New Delhi",
    startDate: "2026-07-20",
    endDate: "2026-07-20",
    lastConfirmedActive: "2026-07-20",
    lastReviewed: "2026-07-21",
    summary:
      "Jammu and Kashmir National Conference leaders and supporters protested at Jantar Mantar in New Delhi on 20 July 2026 demanding restoration of statehood to Jammu and Kashmir. Senior party leaders participated and called on the Union government to fulfil its public commitment. The occurrence and demand are independently reported; political claims about delays, constitutional responsibility and public support remain attributed.",
    directedAt: "Union Ministry of Home Affairs; Government of India",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-DL-0007",
    slug: "kisan-ghat-india-us-trade-deal",
    title: "Farmers mobilise at Kisan Ghat and border points against proposed India–US trade deal",
    eventType: "Rally",
    eventStatus: "Concluded",
    topic:
      "Opposition to a proposed India–US trade agreement and its potential effects on agriculture, dairy and small businesses",
    stateOrUnionTerritory: "Delhi",
    publicLocation: "New Delhi and interstate approach routes",
    startDate: "2026-07-21",
    endDate: "2026-07-21",
    lastConfirmedActive: "2026-07-21",
    lastReviewed: "2026-08-03",
    summary:
      "Farmer organisations mobilised towards Delhi and gathered for a Kisan Mahapanchayat at Kisan Ghat on 21 July 2026 to oppose a proposed India–US trade agreement. Reporting documented convoys from Punjab, a gathering at the Shambhu border, police barricading and a Delhi traffic advisory. A planned march was called off after negotiations with police, while organisers warned of further action if agricultural safeguards were not addressed. The one-day mobilisation and gathering are corroborated; attendance claims and predictions about the trade agreement remain attributed.",
    directedAt:
      "Government of India; Union Ministry of Commerce and Industry; Delhi Police; Haryana Police",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-MP-0002",
    slug: "indore-dewas-ring-road-compensation",
    title:
      "Indore–Dewas farmers begin sit-in after police stop tractor rally over ring-road compensation",
    eventType: "Multi-form civic protest",
    eventStatus: "Outcome pending",
    topic:
      "Land-acquisition compensation for the Indore–Dewas Western Ring Road and related agricultural demands",
    stateOrUnionTerritory: "Madhya Pradesh",
    publicLocation: "Indore–Dewas corridor, Madhya Pradesh",
    startDate: "2026-07-20",
    endDate: null,
    lastConfirmedActive: "2026-07-20",
    lastReviewed: "2026-08-03",
    summary:
      "Farmers from villages in Indore and Dewas districts attempted a tractor rally towards Bhopal on 20 July 2026 to demand higher compensation for land acquired for the Western Ring Road. Police stopped the convoy at Barlai using barricades, water cannon and tear gas, after which protesters began an indefinite sit-in. The occurrence and broad demand are documented; participation, land valuations and responsibility for confrontation remain attributed. No reliable final outcome or continued activity after 20 July has been established.",
    directedAt:
      "Madhya Pradesh Government; Indore and Dewas district administrations; Madhya Pradesh Police; ring-road project authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-TN-0001",
    slug: "thanjavur-mekedatu-dam-protest",
    title: "Left parties and farmers protest Mekedatu dam proposal in Thanjavur",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic:
      "Opposition to Karnataka's proposed Mekedatu dam and protection of Cauvery-water interests",
    stateOrUnionTerritory: "Tamil Nadu",
    publicLocation: "Thanjavur, Tamil Nadu",
    startDate: "2026-05-29",
    endDate: "2026-05-29",
    lastConfirmedActive: "2026-05-29",
    lastReviewed: "2026-07-21",
    summary:
      "Members of the CPI, CPI(M), allied organisations and farmers protested in Thanjavur on 29 May 2026 against Karnataka's proposed Mekedatu dam and demanded an all-party meeting by the Tamil Nadu government. The occurrence and stated demands are documented through on-location reporting. Legal and hydrological claims about the project remain policy positions requiring official and judicial records.",
    directedAt:
      "Tamil Nadu Government; Karnataka Government; Cauvery Water Management Authority; Union Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-MH-0008",
    slug: "pune-neet-paper-leak-protest",
    title: "NSUI and Yuva Sena protest in Pune over alleged NEET paper leak",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic: "Investigation and accountability concerning alleged NEET-UG examination irregularities",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Pune, Maharashtra",
    startDate: "2026-05-18",
    endDate: "2026-05-18",
    lastConfirmedActive: "2026-05-18",
    lastReviewed: "2026-07-21",
    summary:
      "Members of the National Students' Union of India and Yuva Sena protested in Pune on 18 May 2026 over the alleged NEET-UG paper leak and examination cancellation. Participants demanded accountability and safeguards for students. The occurrence and demands are documented; the origin, beneficiaries and criminal responsibility for any leak remain matters for official investigation and court proceedings.",
    directedAt: "National Testing Agency; Union Ministry of Education; investigating authorities",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-PB-0005",
    slug: "mohali-aerotropolis-land-acquisition-hunger-strike",
    title: "Aerotropolis project-affected farmers hold hunger strike over Mohali land acquisition",
    eventType: "Hunger strike",
    eventStatus: "Concluded",
    topic:
      "Compensation, consent and rehabilitation linked to the Aerotropolis land-acquisition project",
    stateOrUnionTerritory: "Punjab",
    publicLocation: "Mohali, Punjab",
    startDate: "2026-03-25",
    endDate: "2026-04-15",
    lastConfirmedActive: "2026-04-15",
    lastReviewed: "2026-08-03",
    summary:
      "Farmers affected by the Aerotropolis project held a hunger strike and protest in Mohali from late March until 15 April 2026 over land acquisition, compensation and rehabilitation. The principal group ended the hunger strike after government assurances, while reporting indicated that another faction considered continuing separate action. The occurrence and interim assurance are corroborated; final compensation and factional representation remain unresolved.",
    directedAt:
      "Greater Mohali Area Development Authority; Punjab Housing and Urban Development Department; Punjab Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-MH-0009",
    slug: "akola-fuel-price-protest",
    title: "Vanchit Bahujan Aghadi holds symbolic fuel-price protest in Akola",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic: "Fuel-price increases and household transport costs",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Akola, Maharashtra",
    startDate: "2026-05-25",
    endDate: "2026-05-25",
    lastConfirmedActive: "2026-05-25",
    lastReviewed: "2026-07-21",
    summary:
      "Vanchit Bahujan Aghadi workers held a symbolic protest in Akola on 25 May 2026 using bullock carts, donkeys and bicycles to oppose higher fuel prices. The action sought to draw attention to transport and household costs. The occurrence is documented through local reporting; claims about causes, price impacts and political responsibility remain attributed to organisers.",
    directedAt: "Union Ministry of Petroleum and Natural Gas; Maharashtra Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-GA-0001",
    slug: "karapur-sarvan-luxury-township-protest",
    title: "Karapur-Sarvan residents continue protest against proposed luxury township project",
    eventType: "Multi-form civic protest",
    eventStatus: "Ongoing",
    topic:
      "Land use, environmental impacts, infrastructure pressure and local consent for a proposed housing and hotel project",
    stateOrUnionTerritory: "Goa",
    publicLocation: "Karapur-Sarvan, North Goa",
    startDate: null,
    endDate: null,
    lastConfirmedActive: "2026-07-25",
    lastReviewed: "2026-08-03",
    summary:
      "Residents of Karapur-Sarvan in North Goa sustained a multi-month campaign against a proposed luxury housing and hotel development, including village protests, marches towards Panaji and an announced or continuing sit-in. By mid-July, reporting described the movement as having crossed 100 days. Participants raised concerns about land use, water, roads, environment and local consent. The occurrence is corroborated; the exact start date, project impacts and legal status remain under review.",
    directedAt:
      "Goa Government; Town and Country Planning Department; North Goa District Administration; project developer",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
  {
    internalId: "IO-CM-TS-0002",
    slug: "shamshabad-high-speed-rail-land-protest",
    title: "Shamshabad farmers protest fencing of land for proposed high-speed rail hub",
    eventType: "Demonstration",
    eventStatus: "Concluded",
    topic: "Land acquisition, fencing and compensation for a proposed high-speed rail hub",
    stateOrUnionTerritory: "Telangana",
    publicLocation: "Shamshabad, Telangana",
    startDate: "2026-07-18",
    endDate: "2026-07-18",
    lastConfirmedActive: "2026-07-18",
    lastReviewed: "2026-07-21",
    summary:
      "Farmers and local residents protested in the Shamshabad area on 18 July 2026 as authorities attempted to fence land identified for a proposed high-speed rail hub. Reports described a confrontation in which chilli powder was thrown at police. Protesters raised objections concerning land, process and compensation. The occurrence is independently corroborated; individual responsibility for confrontation and the legal status of each parcel remain matters for official records.",
    directedAt:
      "Telangana Government; Ranga Reddy District Administration; Railway and high-speed rail project authorities; Telangana Police",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-TN-0002",
    slug: "kolli-hills-land-patta-protest",
    title:
      "Kolli Hills residents intensify protest seeking land pattas and revocation of government order",
    eventType: "Demonstration",
    eventStatus: "Outcome pending",
    topic:
      "Land pattas, forest and revenue classification, and revocation of Government Order 1168",
    stateOrUnionTerritory: "Tamil Nadu",
    publicLocation: "Kolli Hills, Namakkal district, Tamil Nadu",
    startDate: "2026-04-08",
    endDate: "2026-04-08",
    lastConfirmedActive: "2026-04-08",
    lastReviewed: "2026-07-21",
    summary:
      "Residents of Kolli Hills intensified a protest on 8 April 2026 seeking land pattas and revocation of Government Order 1168, which they said affected long-settled cultivation and residential rights. Participants also threatened an election boycott. The occurrence and demands are documented through regional reporting; population shares, historical occupancy and the legal effect of the order require official land, forest and revenue records.",
    directedAt:
      "Tamil Nadu Revenue and Disaster Management Department; Tamil Nadu Forest Department; Namakkal District Administration",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-MH-0010",
    slug: "pandharpur-farm-loan-waiver-hunger-strike",
    title: "Rohit Pawar holds hunger strike in Pandharpur over farm-loan waiver conditions",
    eventType: "Hunger strike",
    eventStatus: "Outcome pending",
    topic: "Eligibility conditions and implementation of Maharashtra's farm-loan waiver",
    stateOrUnionTerritory: "Maharashtra",
    publicLocation: "Pandharpur, Solapur district, Maharashtra",
    startDate: "2026-06-12",
    endDate: "2026-06-14",
    lastConfirmedActive: "2026-06-14",
    lastReviewed: "2026-07-21",
    summary:
      "Legislator Rohit Pawar and supporters held a hunger strike in Pandharpur from 12 to 14 June 2026 seeking removal or revision of conditions attached to Maharashtra's farm-loan-waiver programme. The fast was suspended after the government assured talks. The occurrence and interim assurance are corroborated; claims about beneficiary exclusion, fiscal impact and final policy changes remain attributed or unresolved.",
    directedAt: "Maharashtra Government; Cooperation Department; Finance Department",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 3,
  },
  {
    internalId: "IO-CM-JH-0001",
    slug: "jharkhand-statehood-activists-pension-jobs",
    title:
      "Jharkhand statehood activists protest for higher pensions, recognition and jobs for families",
    eventType: "Demonstration",
    eventStatus: "Outcome pending",
    topic:
      "Pensions, recognition and employment support for Jharkhand statehood movement activists and their families",
    stateOrUnionTerritory: "Jharkhand",
    publicLocation: "Ranchi, Jharkhand",
    startDate: "2026-06-10",
    endDate: "2026-06-10",
    lastConfirmedActive: "2026-06-10",
    lastReviewed: "2026-07-21",
    summary:
      "Jharkhand statehood movement activists gathered in Ranchi on 10 June 2026 seeking higher pensions, formal recognition and government employment support for eligible family members. Police restricted movement near the chief minister's residence. The planned further agitation was deferred after a government assurance of talks. The occurrence and broad demands are corroborated; eligibility, activist counts and fiscal implications require official records.",
    directedAt: "Jharkhand Government; Ranchi District Administration; Jharkhand Police",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 2,
  },
  {
    internalId: "IO-CM-HR-0003",
    slug: "channot-drinking-water-pipeline-protest",
    title: "Channot villagers sustain drinking-water protest until new pipeline link is approved",
    eventType: "Multi-form civic protest",
    eventStatus: "Concluded",
    topic: "Reliable canal-based drinking-water supply and approval of a new pipeline connection",
    stateOrUnionTerritory: "Haryana",
    publicLocation: "Channot, Hisar district, Haryana",
    startDate: "2026-05-16",
    endDate: "2026-07-15",
    lastConfirmedActive: "2026-07-15",
    lastReviewed: "2026-07-21",
    summary:
      "Residents of Channot village in Hisar district sustained a multi-phase protest from mid-May to 15 July 2026 seeking a reliable canal-water connection for drinking water. The movement included a sit-in and hunger strike, with temporary agreements followed by renewed protest. The action ended after approval of a new pipeline link. The occurrence and final administrative approval are corroborated; technical delivery and completion of the pipeline require follow-up.",
    directedAt:
      "Haryana Public Health Engineering Department; Hisar District Administration; Haryana Government",
    eventVerification: "Occurrence verified — disputed details remain",
    approvedSourceCount: 4,
  },
] as const satisfies readonly Omit<
  ReviewedEventPreview,
  | "primaryTopic"
  | "publicationStatus"
  | "publicLaunchStatus"
  | "publishedAt"
  | "sources"
  | "safety"
  | "safetyIncidents"
  | "visual"
>[];

const primaryTopicByInternalId = {
  "IO-CM-MP-0001": "Land & rehabilitation",
  "IO-CM-DL-0001": "Education",
  "IO-CM-KA-0001": "Agriculture & water",
  "IO-CM-CH-0001": "Trade & economic policy",
  "IO-CM-MH-0001": "Environment",
  "IO-CM-KA-0002": "Land & rehabilitation",
  "IO-CM-GJ-0001": "Land & rehabilitation",
  "IO-CM-UP-0001": "Environment",
  "IO-CM-AS-0001": "Land & rehabilitation",
  "IO-CM-MN-0001": "Labour & employment",
  "IO-CM-OD-0001": "Education",
  "IO-CM-UK-0001": "Environment",
  "IO-CM-HR-0001": "Agriculture & water",
  "IO-CM-HR-0002": "Labour & employment",
  "IO-CM-UP-0002": "Labour & employment",
  "IO-CM-DL-0002": "Education",
  "IO-CM-KL-0001": "Trade & economic policy",
  "IO-CM-PB-0001": "Labour & employment",
  "IO-CM-DL-0003": "Education",
  "IO-CM-TS-0001": "Education",
  "IO-CM-RJ-0001": "Education",
  "IO-CM-DL-0004": "Labour & employment",
  "IO-CM-DL-0005": "Civil rights & justice",
  "IO-CM-PB-0002": "Agriculture & water",
  "IO-CM-RJ-0002": "Agriculture & water",
  "IO-CM-MH-0002": "Labour & employment",
  "IO-CM-MH-0003": "Land & rehabilitation",
  "IO-CM-AS-0002": "Governance & transparency",
  "IO-CM-AS-0003": "Land & rehabilitation",
  "IO-CM-NL-0001": "Civil rights & justice",
  "IO-CM-MH-0004": "Labour & employment",
  "IO-CM-MH-0005": "Labour & employment",
  "IO-CM-PB-0003": "Agriculture & water",
  "IO-CM-MH-0006": "Education",
  "IO-CM-PB-0004": "Labour & employment",
  "IO-CM-KA-0003": "Land & rehabilitation",
  "IO-CM-MH-0007": "Civil rights & justice",
  "IO-CM-DL-0006": "Governance & transparency",
  "IO-CM-DL-0007": "Trade & economic policy",
  "IO-CM-MP-0002": "Land & rehabilitation",
  "IO-CM-TN-0001": "Agriculture & water",
  "IO-CM-MH-0008": "Education",
  "IO-CM-PB-0005": "Land & rehabilitation",
  "IO-CM-MH-0009": "Trade & economic policy",
  "IO-CM-GA-0001": "Environment",
  "IO-CM-TS-0002": "Land & rehabilitation",
  "IO-CM-TN-0002": "Land & rehabilitation",
  "IO-CM-MH-0010": "Agriculture & water",
  "IO-CM-JH-0001": "Governance & transparency",
  "IO-CM-HR-0003": "Infrastructure & public services",
} as const satisfies Record<
  (typeof reviewedEventRecords)[number]["internalId"],
  ReviewedEventPreview["primaryTopic"]
>;

const reviewedEventsWithoutMedia = reviewedEventRecords.map((event) => {
  const evidence = reviewedEventEvidenceByInternalId[event.internalId];

  return {
    ...event,
    ...evidence,
    publicationStatus: "published" as const,
    publicLaunchStatus:
      event.internalId === "IO-CM-OD-0001"
        ? ("temporarily_withheld" as const)
        : ("launchable" as const),
    publishedAt: "2026-07-21",
    approvedSourceCount: evidence.sources.length,
    primaryTopic: primaryTopicByInternalId[event.internalId],
  };
});

export type PublishedEventSlug = (typeof reviewedEventRecords)[number]["slug"];

export const eventMediaRegistry = createEventMediaRegistry(reviewedEventsWithoutMedia);
eventMediaRegistry satisfies Record<PublishedEventSlug, EventMediaRegistryEntry>;

export const reviewedEventsPreview: readonly ReviewedEventPreview[] =
  reviewedEventsWithoutMedia.map((event) => ({
    ...event,
    ...eventMediaRegistry[event.slug],
  }));
