import type {
  EventDetailMedia,
  EventStatus,
  EventType,
  EventVisual,
  MediaEvidenceClass,
  MediaRightsBasis,
  OpenLicensedImageVisual,
  PrimaryTopic,
  PublisherVideoVisual,
  RecordFallbackVisual,
} from "../lib/events/types";

const rightsReviewedAt = "2026-07-26";

export type EventMediaRegistrySource = {
  slug: string;
  title: string;
  eventType: EventType;
  eventStatus: EventStatus;
  primaryTopic: PrimaryTopic;
  publicLocation: string;
};

export type EventMediaRegistryEntry = {
  visual: EventVisual;
  detailMedia?: EventDetailMedia;
};

type VerifiedPublisherVideoConfig = Omit<PublisherVideoVisual, "fallbackRecord">;

const verifiedPublisherVideos = {
  "education-accountability-jantar-mantar": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/from-online-movement-to-street-protest-cjp-gathers-at-jantar-mantar-1109578",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1109578&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://c.ndtvimg.com/2026-06/ihl87sqg_image_160x120_06_June_26.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report from the Jantar Mantar education protest.",
    credit: "Video: NDTV",
    sameEventVerified: true,
    rightsReviewedAt,
  },
  "bidadi-farmers-land-acquisition": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/protests-in-karnataka-s-bidadi-after-government-proposes-to-cut-trees-for-ai-city-project-1120270",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1120270&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://c.ndtvimg.com/2026-06/t9gf8cms_bidadi_160x120_30_June_26.png?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail showing a protest scene reported in Bidadi, Karnataka.",
    credit: "Video: NDTV",
    duration: "2:49",
    sameEventVerified: true,
    rightsReviewedAt,
  },
  "jamia-yuva-kumbh-campus-protest": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/jamia-protests-rss-event-sparks-protests-at-jamia-university-in-delhi-1091649",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1091649&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://drop.ndtv.com/video/images/vod/medium/2026-04/1091649_maxresdefault.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report on the Jamia campus protest in New Delhi.",
    credit: "Video: NDTV",
    sameEventVerified: true,
    rightsReviewedAt,
  },
  "delhi-neet-paper-leak-protests": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/neet-exam-leak-protesters-intensify-attack-on-nta-after-neet-exam-cancellation-1098156",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1098156&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://drop.ndtv.com/video/images/vod/medium/2026-05/1098156_maxresdefault.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report on NEET-UG accountability protests in Delhi.",
    credit: "Video: NDTV",
    sameEventVerified: true,
    rightsReviewedAt,
  },
  "jaipur-neet-irregularities-march": {
    kind: "publisher_video",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    publisher: "NDTV",
    sourceUrl:
      "https://www.ndtv.com/video/neet-paper-leak-row-protests-in-jaipur-water-cannons-used-to-disperse-crowds-1102287",
    embedUrl:
      "https://www.ndtv.com/videos/embed-player/?id=1102287&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100",
    thumbnailUrl:
      "https://c.ndtvimg.com/2026-05/f1fjibmo_neet-protest_160x120_21_May_26.jpg?downsize=1600:900",
    thumbnailSource: "publisher_page",
    alt: "NDTV publisher thumbnail for its video report on the Jaipur NEET-UG accountability march.",
    credit: "Video: NDTV",
    sameEventVerified: true,
    rightsReviewedAt,
  },
} as const satisfies Record<string, VerifiedPublisherVideoConfig>;

const previewDetailMedia = {
  "save-sgnp-human-chain-thane": {
    kind: "instagram_embed",
    evidenceClass: "verified_event_media",
    rightsBasis: "official_embed",
    platform: "Instagram",
    publisher: "Instagram",
    sourceUrl: "https://www.instagram.com/reel/DacYWWktqjL/",
    embedUrl: "https://www.instagram.com/reel/DacYWWktqjL/embed/",
    alt: "Official Instagram post associated with the Save SGNP human-chain event in Thane.",
    credit: "Official post: man_of_the_forest_ and musefoundationwts on Instagram",
    sameEventVerified: true,
    rightsReviewedAt,
    previewOnly: true,
  },
} as const satisfies Record<string, EventDetailMedia>;

type LicensedAsset = {
  fileName: string;
  creator: string;
  rightsBasis: Extract<MediaRightsBasis, "cc_by" | "cc_by_sa" | "cc0" | "public_domain">;
  licenseName: string;
  licenseUrl: string;
};

const licensedAssets = {
  kenRiverPanna: {
    fileName: "Raneh falls, Madhya Pradesh 11.jpg",
    creator: "Sarah Welch",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  jantarMantar: {
    fileName: "Jantar Mantar New Delhi.jpg",
    creator: "Subeesh Balan",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  krsDam: {
    fileName: "Krishna Raja Sagara dam and fountains.jpg",
    creator: "Nandhinikandhasamy",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  chandigarhAssembly: {
    fileName: "Palace of Assembly Chandigarh 2006.jpg",
    creator: "duncid",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  sanjayGandhiNationalPark: {
    fileName: "Sanjay Gandhi National Park.JPG",
    creator: "Patrice78500",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  morbiDistrictMap: {
    fileName: "Morbi Gujarat map.svg",
    creator: "DSP2092",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  sugarcane: {
    fileName: ".ugarcane.jpg",
    creator: "Mayank 3031",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  kokrajharStation: {
    fileName: "Kokrajhar Railway Station.jpg",
    creator: "Unbreakablerodent",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  imphalCity: {
    fileName: "City of Imphal.jpg",
    creator: "Ritezh Thoudam",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  jajpurCollege: {
    fileName: "Biraja Law College Jajpur near Ankula - panoramio.jpg",
    creator: "Deepak das",
    rightsBasis: "cc_by",
    licenseName: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  rishikeshLandscape: {
    fileName: "Rishikesh l Uttrakhand.jpg",
    creator: "Piyush Tripathi",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  haryanaWheat: {
    fileName: "Wheat fields IN Haryana.jpg",
    creator: "Aman Rania",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  gurugramDistrictMap: {
    fileName: "Gurugram in Haryana (India).svg",
    creator: "Milenioscuro",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  noidaIndustrialArea: {
    fileName: "Block A, Industrial Area, Sector 62, Noida, Uttar Pradesh, India - panoramio.jpg",
    creator: "Ali Rizvi",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  lpgCylinders: {
    fileName: "LPG Cylinders.jpg",
    creator: "Kullatan Kin",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  punjabRoadways: {
    fileName: "Amritsar Lahore Punjab Roadways.JPG",
    creator: "Tanuhsp",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  osmaniaArtsCollege: {
    fileName: "Osmania Arts College.jpg",
    creator: "Akhil.challa",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  delhiAutoRickshaws: {
    fileName: "Auto Rickshaws outside Purana Qila, Delhi.jpg",
    creator: "Slyronit",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  punjabFields: {
    fileName:
      "Agricultural fields located near the Wagah Border, Punjab, India, 7 April 2023 02.jpg",
    creator: "MaplesyrupSushi",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  rajasthanWheat: {
    fileName: "Wheat in Fields - panoramio.jpg",
    creator: "Indrapal Jangid",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  azadMaidan: {
    fileName: "Azad Maidan in Mumbai.jpg",
    creator: "David.Clay.Photography",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  allapalliForest: {
    fileName: "Glory of Allapalli.jpg",
    creator: "Rajat Patle",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  dibrugarhTeaGarden: {
    fileName: "Beautiful Tea Garden of Dibrugarh,Assam.jpg",
    creator: "Nilotpal Hazarika123",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  brahmaputraGuwahati: {
    fileName: "Brahmaputra from Hatisila Guwahati.jpg",
    creator: "Ishanjyotibora",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  nagalandAssembly: {
    fileName: "Nagaland Legislative Assembly buildings.jpg",
    creator: "GeoEvan",
    rightsBasis: "cc_by",
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  bestBus: {
    fileName: "Double decker best bus CST 01.jpg",
    creator: "Shishirdasika",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  rtoDhule: {
    fileName: "RTO Office, Dhule.jpg",
    creator: "Jainpankaj009",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  nagpurSchool: {
    fileName: "Front view of school building.jpg",
    creator: "Yjac25",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  hidkalDam: {
    fileName: "Hidkal Dam1.jpg",
    creator: "Shil.4349",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  universityOfMumbai: {
    fileName: "Office building, University of Mumbai, Fort, Mumbai.jpg",
    creator: "Udaykumar PR",
    rightsBasis: "cc_by",
    licenseName: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  rajGhat: {
    fileName: "Raj Ghat Delhi India.JPG",
    creator: "Shahnoor Habib Munmun",
    rightsBasis: "cc_by",
    licenseName: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  nationalHighway52: {
    fileName: "Nh 52.jpg",
    creator: "Yashrajsolat217",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  kaveriThiruvaiyaru: {
    fileName: "Kaviri at Thiruvaiyaru.jpg",
    creator: "Vadakkan",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  puneUniversity: {
    fileName: "Savitribai Phule University Main Building.jpg",
    creator: "Komal Sambhudas",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  fuelDispenser: {
    fileName: "Fuel Dispenser.jpg",
    creator: "Santeri Viinamäki",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  mayemLake: {
    fileName: "Mayem Lake, Panorama.jpg",
    creator: "Bssasidhar",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  shamshabadAirportRoad: {
    fileName: "Airport Approach Road, Hyderabad International Airport, Shamshabad, Telangana.jpg",
    creator: "Saptarshi Pal",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  kolliHillsFarm: {
    fileName: "A scenic farm in the forests of Kolli Hills Tamil Nadu India.jpg",
    creator: "Pravinraaj",
    rightsBasis: "cc_by",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  bhimaRiver: {
    fileName: "Bhima River.jpg",
    creator: "Arupparia",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  jharkhandAssembly: {
    fileName: "Jharkhand Legislative Assembly.jpg",
    creator: "Jayantamitra980",
    rightsBasis: "cc0",
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  haryanaCanal: {
    fileName: "Canal at Uchana, Haryana.jpg",
    creator: "Anup Sadi",
    rightsBasis: "cc_by_sa",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
} as const satisfies Record<string, LicensedAsset>;

type LicensedSelection = {
  source: keyof typeof licensedAssets;
  evidenceClass: Extract<MediaEvidenceClass, "context_media" | "documentary_context">;
  relevance: string;
  alt: string;
};

const licensedMediaSelections = {
  "bundelkhand-rehabilitation-compensation-protest": {
    source: "kenRiverPanna",
    evidenceClass: "context_media",
    relevance:
      "Raneh Falls is on the Ken River in the Chhatarpur–Panna landscape affected by the Ken–Betwa project.",
    alt: "Rocky Ken River landscape at Raneh Falls in Madhya Pradesh.",
  },
  "mandya-farmers-krs-irrigation-water": {
    source: "krsDam",
    evidenceClass: "context_media",
    relevance:
      "The Krishna Raja Sagara dam and reservoir are the specific irrigation system named in the record.",
    alt: "Krishna Raja Sagara dam and reservoir in Karnataka.",
  },
  "bku-rajewal-chandigarh-trade-rally": {
    source: "chandigarhAssembly",
    evidenceClass: "context_media",
    relevance:
      "The Chandigarh Assembly complex identifies the city and governmental setting of the rally route.",
    alt: "Palace of Assembly at the Chandigarh Capitol Complex.",
  },
  "save-sgnp-human-chain-thane": {
    source: "sanjayGandhiNationalPark",
    evidenceClass: "context_media",
    relevance:
      "The photograph shows Sanjay Gandhi National Park, the environmental subject of the campaign.",
    alt: "Forested lake landscape in Sanjay Gandhi National Park.",
  },
  "morbi-transmission-compensation-satyagraha": {
    source: "morbiDistrictMap",
    evidenceClass: "documentary_context",
    relevance:
      "The licensed district map locates Morbi and its talukas without implying that it depicts the protest.",
    alt: "Map of Morbi district and its talukas in Gujarat.",
  },
  "dasiya-villagers-ethanol-plant": {
    source: "sugarcane",
    evidenceClass: "context_media",
    relevance:
      "Sugarcane is a principal feedstock associated with ethanol production and provides subject context for the proposed plant.",
    alt: "Close view of a sugarcane field.",
  },
  "kokrajhar-apdcl-land-allotment-protest": {
    source: "kokrajharStation",
    evidenceClass: "context_media",
    relevance:
      "Kokrajhar railway station provides a recognisable, non-sensitive location reference for the district.",
    alt: "Kokrajhar railway station in Assam.",
  },
  "manipur-government-employees-strike": {
    source: "imphalCity",
    evidenceClass: "context_media",
    relevance:
      "The Imphal cityscape locates the state-wide government-office strike without depicting participants.",
    alt: "Dusk cityscape of Imphal, Manipur.",
  },
  "dharmasala-teacher-vacancy-protest": {
    source: "jajpurCollege",
    evidenceClass: "context_media",
    relevance:
      "The education building is in Jajpur district and supplies institutional context without depicting the school protest.",
    alt: "Biraja Law College building in Jajpur district, Odisha.",
  },
  "bhaniyawala-rishikesh-tree-felling-protest": {
    source: "rishikeshLandscape",
    evidenceClass: "context_media",
    relevance:
      "The forested Rishikesh landscape relates directly to the highway corridor and tree-felling concern.",
    alt: "Forested hills around Rishikesh, Uttarakhand.",
  },
  "haryana-rabi-procurement-protests": {
    source: "haryanaWheat",
    evidenceClass: "context_media",
    relevance:
      "The Haryana wheat field represents the Rabi crop at the centre of the procurement requirements.",
    alt: "Wheat fields in Haryana.",
  },
  "manesar-industrial-workers-protest": {
    source: "gurugramDistrictMap",
    evidenceClass: "documentary_context",
    relevance:
      "The district locator map identifies Gurugram district, including Manesar, without using unrelated worker imagery.",
    alt: "Locator map of Gurugram district in Haryana.",
  },
  "noida-factory-workers-protest": {
    source: "noidaIndustrialArea",
    evidenceClass: "context_media",
    relevance:
      "The photograph shows Noida's Sector 62 industrial area, matching the record's factory-work context and city.",
    alt: "Industrial buildings in Sector 62, Noida.",
  },
  "kerala-hospitality-lpg-shutdown": {
    source: "lpgCylinders",
    evidenceClass: "context_media",
    relevance: "Commercial LPG prices are the stated trigger for the hospitality shutdown.",
    alt: "LPG cylinders stored behind a protective barrier.",
  },
  "punjab-transport-workers-gate-rallies": {
    source: "punjabRoadways",
    evidenceClass: "context_media",
    relevance: "The Punjab Roadways bus is the public-transport institution named in the record.",
    alt: "Punjab Roadways bus.",
  },
  "hyderabad-neet-paper-leak-protests": {
    source: "osmaniaArtsCollege",
    evidenceClass: "context_media",
    relevance:
      "Osmania University's Arts College provides recognisable Hyderabad higher-education context.",
    alt: "Osmania Arts College building in Hyderabad.",
  },
  "delhi-ncr-transport-strike": {
    source: "delhiAutoRickshaws",
    evidenceClass: "context_media",
    relevance:
      "Delhi auto-rickshaws directly represent one of the transport sectors participating in the strike.",
    alt: "Auto-rickshaws waiting in Delhi.",
  },
  "bharat-tiwari-justice-rights-assembly": {
    source: "jantarMantar",
    evidenceClass: "context_media",
    relevance: "Jantar Mantar is the exact public site named for the justice-rights assembly.",
    alt: "Jantar Mantar complex in New Delhi.",
  },
  "punjab-farmers-lok-bhavan-msp-water": {
    source: "punjabFields",
    evidenceClass: "context_media",
    relevance:
      "Punjab agricultural fields relate directly to the MSP and river-water demands in the record.",
    alt: "Agricultural fields in Punjab.",
  },
  "hanumangarh-wheat-procurement-pilibanga": {
    source: "rajasthanWheat",
    evidenceClass: "context_media",
    relevance:
      "The Rajasthan wheat field represents the crop at the centre of the Pilibanga procurement action.",
    alt: "Wheat field in Rajasthan.",
  },
  "maharashtra-scheme-workers-azad-maidan": {
    source: "azadMaidan",
    evidenceClass: "context_media",
    relevance: "Azad Maidan is the exact Mumbai protest location named in the record.",
    alt: "Azad Maidan in Mumbai.",
  },
  "gadchiroli-land-acquisition-airport-industrial": {
    source: "allapalliForest",
    evidenceClass: "context_media",
    relevance:
      "The Allapalli forest is in Gadchiroli district and gives place-specific landscape context for proposed development.",
    alt: "Forest at Allapalli in Gadchiroli district.",
  },
  "moran-motok-shutdown-representation-st-status": {
    source: "dibrugarhTeaGarden",
    evidenceClass: "context_media",
    relevance:
      "The Dibrugarh tea landscape identifies one of the two districts affected by the shutdown.",
    alt: "Tea garden landscape in Dibrugarh, Assam.",
  },
  "guwahati-tribal-township-hydropower-protest": {
    source: "brahmaputraGuwahati",
    evidenceClass: "context_media",
    relevance:
      "The Brahmaputra at Guwahati supplies geographic context for the township and hydropower concerns.",
    alt: "Brahmaputra River landscape at Guwahati.",
  },
  "kohima-women-justice-sexual-violence": {
    source: "nagalandAssembly",
    evidenceClass: "context_media",
    relevance:
      "The Nagaland Legislative Assembly complex provides recognisable civic-institutional context in Kohima.",
    alt: "Nagaland Legislative Assembly buildings in Kohima.",
  },
  "best-workers-pension-pay-strike": {
    source: "bestBus",
    evidenceClass: "context_media",
    relevance:
      "A BEST bus is the public-transport service whose workers are described in the record.",
    alt: "Red BEST double-decker bus in Mumbai.",
  },
  "maharashtra-rto-clerical-pen-down-strike": {
    source: "rtoDhule",
    evidenceClass: "context_media",
    relevance: "The Dhule RTO office supplies exact institutional context within Maharashtra.",
    alt: "Regional Transport Office compound in Dhule, Maharashtra.",
  },
  "punjab-farmers-tubewell-power-protest": {
    source: "punjabFields",
    evidenceClass: "context_media",
    relevance:
      "Punjab agricultural fields are the setting in which tubewell electricity is used for paddy cultivation.",
    alt: "Agricultural fields in Punjab.",
  },
  "maharashtra-teachers-school-shutdown": {
    source: "nagpurSchool",
    evidenceClass: "context_media",
    relevance:
      "The Nagpur school façade provides Maharashtra education-system context without showing pupils.",
    alt: "School building façade in Nagpur, Maharashtra.",
  },
  "khanna-mgnrega-workers-regularisation-salaries": {
    source: "punjabFields",
    evidenceClass: "context_media",
    relevance:
      "The rural Punjab landscape relates to the employment programme and Ludhiana-district setting.",
    alt: "Agricultural landscape in Punjab.",
  },
  "hidkal-displaced-farmers-belagavi-compensation": {
    source: "hidkalDam",
    evidenceClass: "context_media",
    relevance:
      "Hidkal dam and reservoir are the specific infrastructure associated with the displaced communities.",
    alt: "Hidkal dam and reservoir in Karnataka.",
  },
  "mumbai-police-action-education-protest": {
    source: "universityOfMumbai",
    evidenceClass: "context_media",
    relevance:
      "The University of Mumbai building provides local education-institution context without implying it hosted the action.",
    alt: "University of Mumbai office building in Fort, Mumbai.",
  },
  "jammu-kashmir-statehood-jantar-mantar": {
    source: "jantarMantar",
    evidenceClass: "context_media",
    relevance: "Jantar Mantar is the exact Delhi protest site named in the record.",
    alt: "Jantar Mantar complex in New Delhi.",
  },
  "kisan-ghat-india-us-trade-deal": {
    source: "rajGhat",
    evidenceClass: "context_media",
    relevance:
      "Raj Ghat is in the same memorial precinct as Kisan Ghat and provides transparent nearby-place context.",
    alt: "Landscaped memorial precinct at Raj Ghat in Delhi.",
  },
  "indore-dewas-ring-road-compensation": {
    source: "nationalHighway52",
    evidenceClass: "context_media",
    relevance:
      "National Highway 52 on the Indore–Dewas corridor supplies road-infrastructure context for the compensation dispute.",
    alt: "National Highway 52 near the Indore–Dewas corridor.",
  },
  "thanjavur-mekedatu-dam-protest": {
    source: "kaveriThiruvaiyaru",
    evidenceClass: "context_media",
    relevance:
      "The Kaveri near Thiruvaiyaru in Thanjavur district is the river system implicated by the dam proposal.",
    alt: "Kaveri River at Thiruvaiyaru in Thanjavur district.",
  },
  "pune-neet-paper-leak-protest": {
    source: "puneUniversity",
    evidenceClass: "context_media",
    relevance:
      "The Savitribai Phule Pune University main building supplies recognisable local higher-education context.",
    alt: "Main building of Savitribai Phule Pune University.",
  },
  "mohali-aerotropolis-land-acquisition-hunger-strike": {
    source: "punjabFields",
    evidenceClass: "context_media",
    relevance:
      "Punjab agricultural land is the specific type of land affected by the Mohali Aerotropolis acquisition.",
    alt: "Agricultural fields in Punjab.",
  },
  "akola-fuel-price-protest": {
    source: "fuelDispenser",
    evidenceClass: "context_media",
    relevance:
      "The fuel dispenser directly represents the petrol and diesel prices at issue without using unrelated protest imagery.",
    alt: "Petrol and diesel fuel dispensers.",
  },
  "karapur-sarvan-luxury-township-protest": {
    source: "mayemLake",
    evidenceClass: "context_media",
    relevance:
      "Mayem Lake is in Bicholim taluka, providing close North Goa landscape context for Karapur-Sarvan.",
    alt: "Mayem Lake landscape in Bicholim, North Goa.",
  },
  "shamshabad-high-speed-rail-land-protest": {
    source: "shamshabadAirportRoad",
    evidenceClass: "context_media",
    relevance:
      "The airport approach road identifies Shamshabad and its major transport-infrastructure landscape.",
    alt: "Approach road near Hyderabad International Airport in Shamshabad.",
  },
  "kolli-hills-land-patta-protest": {
    source: "kolliHillsFarm",
    evidenceClass: "context_media",
    relevance:
      "The photograph shows a farm in the Kolli Hills, the exact landscape and land context of the record.",
    alt: "Farm and forest landscape in the Kolli Hills, Tamil Nadu.",
  },
  "pandharpur-farm-loan-waiver-hunger-strike": {
    source: "bhimaRiver",
    evidenceClass: "context_media",
    relevance:
      "The Bhima River landscape identifies the Pandharpur area and its agricultural setting.",
    alt: "Bhima River landscape near Pandharpur, Maharashtra.",
  },
  "jharkhand-statehood-activists-pension-jobs": {
    source: "jharkhandAssembly",
    evidenceClass: "context_media",
    relevance:
      "The Jharkhand Legislative Assembly provides direct state-institution context for recognition and pension demands.",
    alt: "Jharkhand Legislative Assembly building in Ranchi.",
  },
  "channot-drinking-water-pipeline-protest": {
    source: "haryanaCanal",
    evidenceClass: "context_media",
    relevance:
      "The Haryana canal is part of the regional water-supply system and gives subject context for the pipeline demand.",
    alt: "Water canal in Haryana.",
  },
} as const satisfies Record<string, LicensedSelection>;

function commonsFilePage(fileName: string) {
  return `https://commons.wikimedia.org/wiki/File:${fileName.replaceAll(" ", "_")}`;
}

function commonsOriginalMedia(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;
}

function createRecordFallback(
  event: EventMediaRegistrySource,
  sourceUrl: string,
): RecordFallbackVisual {
  return {
    title: event.title,
    location: event.publicLocation,
    sourceUrl,
  };
}

function createLicensedVisual(
  event: EventMediaRegistrySource,
  selection: LicensedSelection,
): OpenLicensedImageVisual {
  const asset = licensedAssets[selection.source];
  const sourceUrl = commonsFilePage(asset.fileName);
  const documentary = selection.evidenceClass === "documentary_context";
  const modificationDisclosure = documentary
    ? "Resized and letterboxed to 1600×900 WebP; no content alteration."
    : "Resized and center-cropped to 1600×900 WebP; no other alteration.";

  return {
    kind: "open_licensed_image",
    evidenceClass: selection.evidenceClass,
    rightsBasis: asset.rightsBasis,
    creator: asset.creator,
    publisher: "Wikimedia Commons",
    sourceUrl,
    originalMediaUrl: commonsOriginalMedia(asset.fileName),
    imageUrl: `/media/events/${event.slug}/context.webp`,
    localPath: `/media/events/${event.slug}/context.webp`,
    originalFileName: asset.fileName,
    licenseName: asset.licenseName,
    licenseUrl: asset.licenseUrl,
    attributionText: `${asset.fileName} by ${asset.creator}, ${asset.licenseName}. ${modificationDisclosure}`,
    modificationDisclosure,
    relevance: selection.relevance,
    privacyReview:
      "No close identifiable ordinary participant or minor is central to the selected crop; any people are incidental public-place context.",
    safetyReview:
      "No live tactical location, sensitive participant identity or incident-specific safety detail is disclosed.",
    alt: selection.alt,
    credit: `${asset.creator} · ${asset.licenseName}`,
    rightsReviewedAt,
    fallbackRecord: createRecordFallback(event, sourceUrl),
  };
}

function assertCompleteRightsMetadata(entry: EventMediaRegistryEntry, slug: string) {
  const media = [entry.visual, entry.detailMedia].filter(Boolean) as Array<
    EventVisual | EventDetailMedia
  >;

  for (const item of media) {
    if (!item.credit || !item.rightsReviewedAt || !item.evidenceClass || !item.rightsBasis) {
      throw new Error(`Incomplete media rights metadata for ${slug}`);
    }

    if ("sourceUrl" in item && !item.sourceUrl.startsWith("https://")) {
      throw new Error(`External media source is not HTTPS for ${slug}`);
    }

    if (
      item.kind === "open_licensed_image" &&
      (!item.creator ||
        !item.attributionText ||
        !item.licenseName ||
        !item.licenseUrl.startsWith("https://") ||
        !item.originalMediaUrl.startsWith("https://") ||
        !item.localPath.startsWith(`/media/events/${slug}/`) ||
        item.localPath !== item.imageUrl ||
        !item.modificationDisclosure ||
        !item.relevance ||
        !item.privacyReview ||
        !item.safetyReview)
    ) {
      throw new Error(`Open-licensed media lacks audit metadata for ${slug}`);
    }

    if (
      item.evidenceClass === "verified_event_media" &&
      (!("sameEventVerified" in item) || item.sameEventVerified !== true)
    ) {
      throw new Error(`Verified media lacks same-event verification for ${slug}`);
    }
  }
}

export function createEventMediaRegistry<const T extends readonly EventMediaRegistrySource[]>(
  events: T,
): Record<T[number]["slug"], EventMediaRegistryEntry> {
  const eventSlugs = new Set(events.map((event) => event.slug));

  for (const configuredSlug of [
    ...Object.keys(verifiedPublisherVideos),
    ...Object.keys(previewDetailMedia),
    ...Object.keys(licensedMediaSelections),
  ]) {
    if (!eventSlugs.has(configuredSlug)) {
      throw new Error(`Media registry contains unknown event slug: ${configuredSlug}`);
    }
  }

  const entries = events.map((event) => {
    const publisherVideo = verifiedPublisherVideos[
      event.slug as keyof typeof verifiedPublisherVideos
    ] as VerifiedPublisherVideoConfig | undefined;
    const selection = licensedMediaSelections[
      event.slug as keyof typeof licensedMediaSelections
    ] as LicensedSelection | undefined;
    const detailMedia = previewDetailMedia[event.slug as keyof typeof previewDetailMedia] as
      EventDetailMedia | undefined;

    if (!publisherVideo && !selection) {
      throw new Error(`Published event has no approved primary visual: ${event.slug}`);
    }
    if (publisherVideo && selection) {
      throw new Error(`Published event has multiple primary visuals: ${event.slug}`);
    }

    const visual: EventVisual = publisherVideo
      ? {
          ...publisherVideo,
          fallbackRecord: createRecordFallback(event, publisherVideo.sourceUrl),
        }
      : createLicensedVisual(event, selection!);
    const entry: EventMediaRegistryEntry = {
      visual,
      ...(detailMedia ? { detailMedia } : {}),
    };

    assertCompleteRightsMetadata(entry, event.slug);
    return [event.slug, entry] as const;
  });

  if (entries.length !== events.length) {
    throw new Error("Media registry does not cover every reviewed event");
  }

  return Object.fromEntries(entries) as Record<T[number]["slug"], EventMediaRegistryEntry>;
}
