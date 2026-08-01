begin;

create type public.approved_media_type as enum (
  'uploaded_event_image',
  'publisher_video_embed',
  'official_social_embed'
);

create type public.media_rights_basis as enum (
  'owned_original',
  'explicit_permission',
  'official_embed',
  'official_reuse_terms',
  'cc0',
  'public_domain',
  'cc_by',
  'cc_by_sa'
);

create type public.media_review_status as enum (
  'draft',
  'approved',
  'rejected',
  'withdrawn'
);

create table public.media_event_registry (
  event_slug text primary key,
  created_at timestamptz not null default now(),
  constraint media_event_registry_slug_format check (
    event_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

create table public.media_event_sources (
  event_slug text not null references public.media_event_registry(event_slug) on delete cascade,
  source_url text not null check (source_url ~ '^https://'),
  created_at timestamptz not null default now(),
  primary key (event_slug, source_url)
);

-- Controlled public event and approved-source registry generated from the reviewed snapshot.
insert into public.media_event_registry (event_slug)
values
  ('bundelkhand-rehabilitation-compensation-protest'),
  ('education-accountability-jantar-mantar'),
  ('mandya-farmers-krs-irrigation-water'),
  ('bku-rajewal-chandigarh-trade-rally'),
  ('save-sgnp-human-chain-thane'),
  ('bidadi-farmers-land-acquisition'),
  ('morbi-transmission-compensation-satyagraha'),
  ('dasiya-villagers-ethanol-plant'),
  ('kokrajhar-apdcl-land-allotment-protest'),
  ('manipur-government-employees-strike'),
  ('dharmasala-teacher-vacancy-protest'),
  ('bhaniyawala-rishikesh-tree-felling-protest'),
  ('haryana-rabi-procurement-protests'),
  ('manesar-industrial-workers-protest'),
  ('noida-factory-workers-protest'),
  ('jamia-yuva-kumbh-campus-protest'),
  ('kerala-hospitality-lpg-shutdown'),
  ('punjab-transport-workers-gate-rallies'),
  ('delhi-neet-paper-leak-protests'),
  ('hyderabad-neet-paper-leak-protests'),
  ('jaipur-neet-irregularities-march'),
  ('delhi-ncr-transport-strike'),
  ('bharat-tiwari-justice-rights-assembly'),
  ('punjab-farmers-lok-bhavan-msp-water'),
  ('hanumangarh-wheat-procurement-pilibanga'),
  ('maharashtra-scheme-workers-azad-maidan'),
  ('gadchiroli-land-acquisition-airport-industrial'),
  ('moran-motok-shutdown-representation-st-status'),
  ('guwahati-tribal-township-hydropower-protest'),
  ('kohima-women-justice-sexual-violence'),
  ('best-workers-pension-pay-strike'),
  ('maharashtra-rto-clerical-pen-down-strike'),
  ('punjab-farmers-tubewell-power-protest'),
  ('maharashtra-teachers-school-shutdown'),
  ('khanna-mgnrega-workers-regularisation-salaries'),
  ('hidkal-displaced-farmers-belagavi-compensation'),
  ('mumbai-police-action-education-protest'),
  ('jammu-kashmir-statehood-jantar-mantar'),
  ('kisan-ghat-india-us-trade-deal'),
  ('indore-dewas-ring-road-compensation'),
  ('thanjavur-mekedatu-dam-protest'),
  ('pune-neet-paper-leak-protest'),
  ('mohali-aerotropolis-land-acquisition-hunger-strike'),
  ('akola-fuel-price-protest'),
  ('karapur-sarvan-luxury-township-protest'),
  ('shamshabad-high-speed-rail-land-protest'),
  ('kolli-hills-land-patta-protest'),
  ('pandharpur-farm-loan-waiver-hunger-strike'),
  ('jharkhand-statehood-activists-pension-jobs'),
  ('channot-drinking-water-pipeline-protest');

insert into public.media_event_sources (event_slug, source_url)
values
  ('bundelkhand-rehabilitation-compensation-protest', 'https://nwda.gov.in/content/innerpage/ken-betwa-link-project.php'),
  ('bundelkhand-rehabilitation-compensation-protest', 'https://timesofindia.indiatimes.com/city/bhopal/protest-against-ken-betwa-project-tribals-allege-their-water-supply-stopped/articleshow/132297638.cms'),
  ('bundelkhand-rehabilitation-compensation-protest', 'https://www.downtoearth.org.in/rivers/pyre-protest-against-ken-betwa-link-project-resumes-in-madhya-pradesh'),
  ('bundelkhand-rehabilitation-compensation-protest', 'https://www.downtoearth.org.in/environment/ken-betwa-link-leaves-tribal-families-fighting-for-fair-compensation'),
  ('bundelkhand-rehabilitation-compensation-protest', 'https://x.com/PeekTV_in/status/2077307986998071627'),
  ('bundelkhand-rehabilitation-compensation-protest', 'https://www.downtoearth.org.in/rivers/people-affected-by-ken-betwa-river-linking-project-postpone-protest-after-administrations-assurance'),
  ('bundelkhand-rehabilitation-compensation-protest', 'https://www.instagram.com/reel/DazWNL3BYFb/'),
  ('education-accountability-jantar-mantar', 'https://apnews.com/article/dc9d61bf27f26510c0bd427f4d889699'),
  ('education-accountability-jantar-mantar', 'https://www.theguardian.com/world/2026/jul/20/cockroach-janta-party-protest-march-sonam-wangchuk-india-parliament'),
  ('education-accountability-jantar-mantar', 'https://indianexpress.com/article/india/police-move-sonam-wangchuk-to-hospital-from-jantar-mantar-after-20-day-fast-10791928/'),
  ('education-accountability-jantar-mantar', 'https://apnews.com/article/0bb7c16a58f21649fb5df72db9714c31'),
  ('education-accountability-jantar-mantar', 'https://www.ndtv.com/india-news/cjp-protest-at-jantar-mantar-weak-outside-strong-inside-sonam-wangchuk-on-hunger-strike-for-17-days-11768325'),
  ('education-accountability-jantar-mantar', 'https://www.reuters.com/world/india/indian-activist-urged-give-up-hunger-strike-over-exam-leaks-2026-07-14/'),
  ('education-accountability-jantar-mantar', 'https://www.hindustantimes.com/india-news/sonam-wangchuk-hunger-strike-live-updates-cjp-cockroach-janta-party-protest-abhijeet-dipke-rahul-gandhi-modi-delhi-101784084569584.html'),
  ('education-accountability-jantar-mantar', 'https://www.hindustantimes.com/india-news/cjp-protest-delhi-live-updates-cockroach-janta-party-jantar-mantar-today-abhijeet-dipke-dharmendra-pradhan-re-neet-ug-101782010668315.html'),
  ('mandya-farmers-krs-irrigation-water', 'https://www.newindianexpress.com/states/karnataka/2026/Jul/14/agitation-over-delay-in-releasing-krs-water-intensifies-in-mandya'),
  ('mandya-farmers-krs-irrigation-water', 'https://timesofindia.indiatimes.com/city/mysuru/mandya-farmers-await-krs-water-as-govt-eyes-cwma-verdict/articleshow/132397492.cms'),
  ('mandya-farmers-krs-irrigation-water', 'https://timesofindia.indiatimes.com/city/mysuru/mandya-farmers-protest-seeking-krs-dam-water/articleshow/132368324.cms'),
  ('bku-rajewal-chandigarh-trade-rally', 'https://timesofindia.indiatimes.com/city/chandigarh/farmers-rally-chokes-city-and-mohali-again/articleshow/132375468.cms'),
  ('bku-rajewal-chandigarh-trade-rally', 'https://www.tribuneindia.com/live-blog/chandigarh/farmers-protest-in-chandigarh-live-traffic-halted-at-multiple-points-as-bku-rajewal-members-enter-city/'),
  ('save-sgnp-human-chain-thane', 'https://www.change.org/p/save-sgnp-manpada-thane'),
  ('save-sgnp-human-chain-thane', 'https://www.freepressjournal.in/lifestyle/what-is-the-save-sgnp-movement-understanding-the-protest-against-development-near-sanjay-gandhi-national-park-2'),
  ('save-sgnp-human-chain-thane', 'https://timesofindia.indiatimes.com/city/thane/hundreds-join-save-sgnp-protest-in-thane-oppose-projects-near-forest/articleshow/132199148.cms'),
  ('save-sgnp-human-chain-thane', 'https://www.instagram.com/reel/DacYWWktqjL/'),
  ('bidadi-farmers-land-acquisition', 'https://m.economictimes.com/news/politics-and-nation/karnataka-cm-responds-to-farmer-protests-review-of-controversial-ai-township-project-announced/articleshow/132412974.cms'),
  ('bidadi-farmers-land-acquisition', 'https://www.newindianexpress.com/states/karnataka/2026/Jul/15/attempt-to-murder-case-filed-after-farmers-clash-with-officials-during-gbit-land-survey-in-karnataka'),
  ('bidadi-farmers-land-acquisition', 'https://www.indiatoday.in/amp/india/karnataka/story/bidadi-ai-township-protest-second-fir-over-attack-on-officials-during-ramanagara-land-survey-2947469-2026-07-14'),
  ('bidadi-farmers-land-acquisition', 'https://timesofindia.indiatimes.com/city/bengaluru/farmers-take-out-appiko-protest-in-bidadi/articleshow/132056408.cms'),
  ('bidadi-farmers-land-acquisition', 'https://www.newindianexpress.com/cities/bengaluru/2026/Jun/13/karnataka-govt-set-to-acquire-500-acres-for-bidadi-township-project'),
  ('bidadi-farmers-land-acquisition', 'https://www.thenewsminute.com/karnataka/bidadi-township-women-farmers-wield-brooms-to-stop-land-survey-accuse-govt-of-betraying-farmers'),
  ('bidadi-farmers-land-acquisition', 'https://www.thenewsminute.com/karnataka/ground-report-bidadi-farmers-resist-ai-city-land-acquisition-after-years-under-red-zone'),
  ('bidadi-farmers-land-acquisition', 'https://www.thenewsminute.com/karnataka/bidadi-township-what-the-project-is-who-opposes-it-and-why'),
  ('morbi-transmission-compensation-satyagraha', 'https://indianexpress.com/article/cities/ahmedabad/gujarat-farmers-protest-adani-transmission-line-compensation-morbi-10775737/'),
  ('morbi-transmission-compensation-satyagraha', 'https://www.telegraphindia.com/india/gujarat-buckles-under-farmers-protest-over-land-compensation-for-adani-project-prnt/cid/2168777'),
  ('morbi-transmission-compensation-satyagraha', 'https://m.thewire.in/article/rights/nothing-short-of-dictatorship-despite-compensation-hike-gujarat-farmers-fast-against-adani-project-on/amp'),
  ('morbi-transmission-compensation-satyagraha', 'https://www.instagram.com/p/DadCC4NFo-C/'),
  ('dasiya-villagers-ethanol-plant', 'https://navbharattimes.indiatimes.com/state/uttar-pradesh/basti/e20-petrol-buzz-across-country-protest-ethanol-factory-being-built-in-dasiya-basti/articleshow/132390066.cms'),
  ('dasiya-villagers-ethanol-plant', 'https://www.amarujala.com/uttar-pradesh/basti/issue-of-ethanol-factory-under-construction-heats-up-basti-news-c-207-1-bst1006-161441-2026-06-30'),
  ('dasiya-villagers-ethanol-plant', 'https://www.amarujala.com/uttar-pradesh/basti/opposition-to-the-proposed-ethanol-factory-basti-news-c-207-1-bst1006-161009-2026-06-23'),
  ('dasiya-villagers-ethanol-plant', 'https://www.facebook.com/LiveTimesNewsChannel/videos/uttarpradesh-%E0%A4%AC%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%80-%E0%A4%AE%E0%A5%87%E0%A4%82-%E0%A4%8F%E0%A4%A5%E0%A5%87%E0%A4%A8%E0%A5%89%E0%A4%B2-%E0%A4%AB%E0%A5%88%E0%A4%95%E0%A5%8D%E0%A4%9F%E0%A5%8D%E0%A4%B0%E0%A5%80-%E0%A4%95%E0%A5%87-%E0%A4%96%E0%A4%BF%E0%A4%B2%E0%A4%BE%E0%A4%AB-%E0%A4%9C%E0%A4%A8-%E0%A4%86%E0%A4%82%E0%A4%A6%E0%A5%8B%E0%A4%B2%E0%A4%A8-%E0%A4%B9%E0%A4%9C%E0%A4%BE%E0%A4%B0%E0%A5%8B%E0%A4%82-%E0%A4%97%E0%A5%8D%E0%A4%B0%E0%A4%BE%E0%A4%AE%E0%A5%80%E0%A4%A3%E0%A5%8B%E0%A4%82-%E0%A4%A8%E0%A5%87-%E0%A4%95%E0%A4%BF/2065530604339052/'),
  ('kokrajhar-apdcl-land-allotment-protest', 'https://www.indiatodayne.in/assam/video/bodo-community-protests-land-allotment-to-apdcl-opposes-rehabilitation-of-evicted-families-in-assams-kokrajhar-1423007-2026-07-12'),
  ('kokrajhar-apdcl-land-allotment-protest', 'https://www.facebook.com/kokrajharnews/posts/malgaon-villagers-protest-against-proposed-apdcl-project-and-minority-resettleme/1516794640464697/'),
  ('kokrajhar-apdcl-land-allotment-protest', 'https://www.facebook.com/northeastpublish/posts/bodo-community-protests-apdcl-land-allotment-in-kokrajharhundreds-of-bodo-reside/1482971287180960/'),
  ('manipur-government-employees-strike', 'https://nenow.in/north-east-news/manipur/manipur-govt-announces-five-day-work-week-employees-continue-cease-work-strike.html'),
  ('manipur-government-employees-strike', 'https://economictimes.indiatimes.com/news/india/manipur-govt-employees-strike-enters-ninth-day-rs-13-28-crore-loss-reported/articleshow/132297673.cms'),
  ('manipur-government-employees-strike', 'https://www.thesangaiexpress.com/Encyc/2026/7/11/by-our-staff-reporter-imphal-jul-10-even-as-the-saturday-holiday-for-government-employees-has-been-restored-th.html'),
  ('manipur-government-employees-strike', 'https://www.thesangaiexpress.com/Encyc/2026/7/10/waari-singbul-network-imphal-jul-9-the-manipur-government-services-federation-mgsf-has-threatened-to-intensify.html'),
  ('manipur-government-employees-strike', 'https://www.thesangaiexpress.com/Encyc/2026/7/1/imphal-jun-30-employees-of-the-state-government-are-all-set-to-launch-a-ceasework-strike-from-wednesday-until-.html'),
  ('dharmasala-teacher-vacancy-protest', 'https://www.newindianexpress.com/states/odisha/2026/Jul/11/dharmasala-high-school-students-stage-protest-over-teacher-shortage'),
  ('dharmasala-teacher-vacancy-protest', 'https://timesofindia.indiatimes.com/city/bhubaneswar/school-students-lock-gate-stage-dharna-over-teacher-shortage/articleshow/132310990.cms'),
  ('bhaniyawala-rishikesh-tree-felling-protest', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2282251&lang=2&reg=48'),
  ('bhaniyawala-rishikesh-tree-felling-protest', 'https://timesofindia.indiatimes.com/city/dehradun/residents-hug-trees-to-stop-felling-along-bhaniyawala-rkesh-stretch/articleshow/132336173.cms'),
  ('bhaniyawala-rishikesh-tree-felling-protest', 'https://avikaluttarakhand.com/uttarakhand/protest-against-tree-felling-on-the-rishikesh-bhaniyawala-highway/'),
  ('bhaniyawala-rishikesh-tree-felling-protest', 'https://timesofindia.indiatimes.com/city/dehradun/2-held-fir-against-2-dozen-as-tree-felling-resumes-on-rishikesh-bhaniyawala-stretch/articleshow/132375064.cms'),
  ('bhaniyawala-rishikesh-tree-felling-protest', 'https://x.com/MohammadAman48/status/2077721151774810616'),
  ('bhaniyawala-rishikesh-tree-felling-protest', 'https://x.com/swatinegi2/status/2077765341711888588'),
  ('haryana-rabi-procurement-protests', 'https://prms.prharyana.gov.in/press-release/1026'),
  ('haryana-rabi-procurement-protests', 'https://timesofindia.indiatimes.com/city/chandigarh/farmers-launch-indefinite-stir-in-jind-against-biometric-system/articleshow/130094851.cms'),
  ('haryana-rabi-procurement-protests', 'https://indianexpress.com/article/cities/chandigarh/farmers-hold-protests-across-haryana-oppose-new-rabi-procurement-rules-10631410/'),
  ('manesar-industrial-workers-protest', 'https://indianexpress.com/article/cities/delhi/gurgaon-manesar-violence-arrests-conspiracy-citu-protest-wages-10634611/'),
  ('manesar-industrial-workers-protest', 'https://www.reuters.com/business/world-at-work/indian-auto-hub-hikes-minimum-wage-after-protests-over-soaring-costs-due-iran-2026-04-10/'),
  ('noida-factory-workers-protest', 'https://www.reuters.com/business/world-at-work/indias-uttar-pradesh-state-raises-workers-wages-amid-protests-over-pay-2026-04-14/'),
  ('noida-factory-workers-protest', 'https://indianexpress.com/article/cities/delhi/violence-in-noida-as-factory-workers-protest-seeking-higher-wages-10634904/'),
  ('noida-factory-workers-protest', 'https://www.reuters.com/business/world-at-work/police-fire-tear-gas-workers-protest-indias-noida-turns-violent-2026-04-13/'),
  ('jamia-yuva-kumbh-campus-protest', 'https://www.ndtv.com/education/jamia-students-protest-rss-yuva-kumbh-event-on-campus-heavy-police-deployed-11419540'),
  ('jamia-yuva-kumbh-campus-protest', 'https://indianexpress.com/article/cities/delhi/jamia-protest-rss-event-student-clash-10660482/'),
  ('kerala-hospitality-lpg-shutdown', 'https://www.keralakaumudi.com/en/news/KERALA/GENERAL/hotels-and-restaurants-across-kerala-to-shut-down-today-1742482'),
  ('kerala-hospitality-lpg-shutdown', 'https://timesofindia.indiatimes.com/city/kochi/hotel-shutdown-hits-kochi-hard/articleshow/130867139.cms'),
  ('kerala-hospitality-lpg-shutdown', 'https://www.onmanorama.com/news/kerala/2026/05/06/lpg-price-hike-hotels-restaurants-to-shut-across-kerala-on-may-6.html'),
  ('punjab-transport-workers-gate-rallies', 'https://timesofindia.indiatimes.com/city/chandigarh/prtc-punjab-roadways-strike-called-off-after-govt-agrees-to-key-demands/amp_articleshow/131642970.cms'),
  ('punjab-transport-workers-gate-rallies', 'https://www.tribuneindia.com/news/punjab-roadways-punbus-and-prtc-contract-workers-hold-gate-rallies/'),
  ('punjab-transport-workers-gate-rallies', 'https://timesofindia.indiatimes.com/city/chandigarh/punjab-transport-workers-announce-strike-calendar-demand-release-of-jailed-colleagues/articleshow/130684127.cms'),
  ('delhi-neet-paper-leak-protests', 'https://www.newindianexpress.com/amp/story/states/delhi/2026/May/15/students-take-neet-paper-leak-stir-to-delhis-jantar-mantar'),
  ('delhi-neet-paper-leak-protests', 'https://indianexpress.com/article/cities/delhi/neet-ug-cancellation-abvp-workers-protest-nta-delhi-10687268/'),
  ('hyderabad-neet-paper-leak-protests', 'https://telanganatoday.com/bharat-rashtra-samithi-vidyarthi-protests-at-lok-bhavan-over-alleged-neet-paper-leak'),
  ('hyderabad-neet-paper-leak-protests', 'https://www.newindianexpress.com/states/telangana/2026/May/14/student-bodies-stage-protest-over-neet-ug-exam-paper-leak-in-hyderabad'),
  ('jaipur-neet-irregularities-march', 'https://timesofindia.indiatimes.com/city/jaipur/neet-ug-paper-leak-row-congress-protests-over-irregularities-in-jaipur-police-use-water-cannons-several-detained/articleshow/131242199.cms'),
  ('jaipur-neet-irregularities-march', 'https://www.newindianexpress.com/amp/story/states/rajasthan/2026/May/21/congress-workers-protest-over-neet-irregularities-in-jaipur-police-use-water-cannons-to-stop-march'),
  ('delhi-ncr-transport-strike', 'https://www.hindustantimes.com/india-news/why-cabs-and-autos-are-on-strike-in-delhi-today-us-iran-war-to-blame-101779332694986.html'),
  ('delhi-ncr-transport-strike', 'https://indianexpress.com/article/cities/delhi/taxi-auto-strike-delhi-ncr-today-10700486/'),
  ('delhi-ncr-transport-strike', 'https://www.indiatoday.in/business/story/why-cab-auto-drivers-called-3-day-strike-ola-uber-delhi-ncr-fuel-prices-app-commissions-enviornmental-ecc-charges-2914767-2026-05-21'),
  ('bharat-tiwari-justice-rights-assembly', 'https://www.indiatoday.in/india/story/bihar-orders-judicial-enquiry-into-bhojpur-encounter-killing-of-bharat-bhushan-tiwari-ptag-2930610-2026-06-20'),
  ('bharat-tiwari-justice-rights-assembly', 'https://www.livehindustan.com/bihar/bharat-tiwari-encounter-protest-in-delhi-jantar-mantar-judicial-commission-records-sdm-statement-201784339439671.html'),
  ('bharat-tiwari-justice-rights-assembly', 'https://navbharattimes.indiatimes.com/state/bihar/ara/bharat-tiwari-encounter-protest-at-jantar-mantar-what-demands-people-raise-upon-reaching-delhi/articleshow/132463868.cms'),
  ('bharat-tiwari-justice-rights-assembly', 'https://hindi.oneindia.com/news/bihar/bharat-tiwari-encounter-protest-jantar-mantar-supreme-court-lawyer-committee-memorandum-pm-president-1610729.html'),
  ('bharat-tiwari-justice-rights-assembly', 'https://x.com/sabakhan21051/status/2078058539059462557'),
  ('bharat-tiwari-justice-rights-assembly', 'https://www.aajtak.in/bihar/story/bharat-bhushan-tiwari-case-jantar-mantar-protest-17-july-national-movement-lclar-strc-2590789-2026-06-30'),
  ('punjab-farmers-lok-bhavan-msp-water', 'https://timesofindia.indiatimes.com/city/chandigarh/farmers-train-guns-on-bjp-after-police-action-near-chandigarh/articleshow/131124222.cms'),
  ('punjab-farmers-lok-bhavan-msp-water', 'https://indianexpress.com/article/cities/chandigarh/chandigarh-police-water-cannons-tear-gas-disperse-farmers-punjab-lok-bhavan-10692228/'),
  ('hanumangarh-wheat-procurement-pilibanga', 'https://www.hindustantimes.com/cities/jaipur-news/rajasthan-farmers-protest-over-wheat-procurement-demands-block-railway-track-in-hanumangarh-101780133920901.html'),
  ('hanumangarh-wheat-procurement-pilibanga', 'https://indianexpress.com/article/india/rajasthan-farmers-protest-wheat-procurement-hanumangarh-rail-blockade-pilibanga-10716173/'),
  ('maharashtra-scheme-workers-azad-maidan', 'https://indianexpress.com/article/cities/mumbai/maharashtra-citu-azad-maidan-protest-nhm-workers-demands-fadnavis-meeting-10722846/'),
  ('maharashtra-scheme-workers-azad-maidan', 'https://timesofindia.indiatimes.com/city/mumbai/after-decades-of-service-asha-anganwadi-healthcare-workers-in-mumbai-demand-regularisation-better-rights-and-social-security/articleshow/131448960.cms'),
  ('maharashtra-scheme-workers-azad-maidan', 'https://indianexpress.com/article/cities/mumbai/maharashtra-anganwadi-asha-workers-protest-azad-maidan-nhm-salary-delay-10718846/'),
  ('gadchiroli-land-acquisition-airport-industrial', 'https://gadchiroli.gov.in/notice/regarding-publication-of-notification-under-section-11-1-of-the-right-to-transparency-in-land-acquisition-rehabilitation-and-resettlement-act-2013-in-cases-related-to-land-acquisition-in-private-l/'),
  ('gadchiroli-land-acquisition-airport-industrial', 'https://www.newindianexpress.com/states/maharashtra/2026/Jun/07/after-farmers-stir-maharashtra-halts-land-acquisition-process-for-gadchiroli-airport-industries'),
  ('gadchiroli-land-acquisition-airport-industrial', 'https://indianexpress.com/article/cities/mumbai/gadchiroli-airport-land-acquisition-halted-after-farmers-protest-10727281/'),
  ('gadchiroli-land-acquisition-airport-industrial', 'https://indianexpress.com/article/cities/mumbai/gadchiroli-farmers-protest-land-acquisition-airport-jsw-steel-pesa-10726233/'),
  ('moran-motok-shutdown-representation-st-status', 'https://www.nenow.in/north-east-news/assam/assam-48-hour-shutdown-disrupts-normal-life-in-tinsukia-dibrugarh.html'),
  ('moran-motok-shutdown-representation-st-status', 'https://eastmojo.com/assam/2026/06/05/48-hour-bandh-disrupts-life-in-tinsukia-dibrugarh-over-st-status-demand/'),
  ('moran-motok-shutdown-representation-st-status', 'https://www.ndtv.com/india-news/assams-moran-motok-communities-begin-shutdown-to-demand-cabinet-inclusion-11596073'),
  ('guwahati-tribal-township-hydropower-protest', 'https://assam.gov.in/'),
  ('guwahati-tribal-township-hydropower-protest', 'https://timesofindia.indiatimes.com/city/guwahati/protest-in-guwahati-over-fear-of-tribal-displacement/articleshow/131641286.cms'),
  ('kohima-women-justice-sexual-violence', 'https://ipr.nagaland.gov.in/index.php/DC-KOHIMA-ISSUES-TRAFFIC-ADVISORY-AHEAD-OF-TRIBAL-WOMEN-BODIES-RALLY'),
  ('kohima-women-justice-sexual-violence', 'https://nagalandtribune.in/tribal-women-bodies-rally-in-kohima-demand-speedy-justice-in-alleged-sexual-harassment-case-against-suspended-ias-officer/'),
  ('kohima-women-justice-sexual-violence', 'https://theprint.in/india/thousands-take-out-rally-in-kohima-demanding-speedy-justice-in-sexual-harassment-rape-cases/2964588/'),
  ('kohima-women-justice-sexual-violence', 'https://apnews.com/article/5c58be8e6deb51706ee5cf306f91d540'),
  ('best-workers-pension-pay-strike', 'https://www.newindianexpress.com/states/maharashtra/2026/Jun/20/best-strike-enters-second-day-as-mumbai-commuters-struggle-amid-stalled-bus-services'),
  ('best-workers-pension-pay-strike', 'https://www.hindustantimes.com/india-news/mumbai-best-buses-on-strike-employees-demand-settling-of-legal-dues-of-those-retired-7th-pay-commission-101781852122236.html'),
  ('best-workers-pension-pay-strike', 'https://indianexpress.com/article/cities/mumbai/court-grants-interim-relief-to-best-restrains-staff-from-proposed-strike-10746871/'),
  ('best-workers-pension-pay-strike', 'https://indianexpress.com/article/cities/mumbai/best-workers-protest-mumbai-reasons-10747300/'),
  ('maharashtra-rto-clerical-pen-down-strike', 'https://timesofindia.indiatimes.com/city/mumbai/rto-clerical-staff-across-maharashtra-intensify-stir-on-seventh-day-two-hour-sit-in-protest-on-june-22/articleshow/131896016.cms'),
  ('maharashtra-rto-clerical-pen-down-strike', 'https://timesofindia.indiatimes.com/city/mumbai/rto-clerical-staff-declare-pen-down-strike-across-maharashtra-from-tuesday/articleshow/131726367.cms'),
  ('maharashtra-rto-clerical-pen-down-strike', 'https://indianexpress.com/article/cities/pune/maharashtra-pune-rto-strike-day-7-clerical-staff-sit-in-protest-surendra-sartape-10752264/'),
  ('punjab-farmers-tubewell-power-protest', 'https://www.hindustantimes.com/cities/chandigarh-news/punjab-power-shortfall-despite-record-supply-sparks-farmers-protest-101782841949224.html'),
  ('punjab-farmers-tubewell-power-protest', 'https://www.hindustantimes.com/cities/chandigarh-news/record-power-demand-triggers-outages-across-punjab-farmers-hold-protests-101782671497516.html'),
  ('punjab-farmers-tubewell-power-protest', 'https://indianexpress.com/article/cities/chandigarh/punjab-power-crisis-record-demand-farmer-protests-industrial-power-cuts-10764455/'),
  ('maharashtra-teachers-school-shutdown', 'https://indianexpress.com/article/cities/pune/maharashtra-schools-closed-july-9-teacher-protest-tet-blo-demands-10777177/'),
  ('maharashtra-teachers-school-shutdown', 'https://timesofindia.indiatimes.com/city/pune/statewide-school-shutdown-today-by-maha-teachers-over-blo-duty/articleshow/132272338.cms'),
  ('maharashtra-teachers-school-shutdown', 'https://indianexpress.com/article/cities/mumbai/maharashtra-teachers-strike-school-shutdown-blo-duties-mumbai-azad-maidan-10778849/'),
  ('khanna-mgnrega-workers-regularisation-salaries', 'https://www.hindustantimes.com/cities/chandigarh-news/khanna-protesting-mgnrega-workers-staff-face-tear-gas-water-cannons-101784145012987-amp.html'),
  ('khanna-mgnrega-workers-regularisation-salaries', 'https://indianexpress.com/article/cities/chandigarh/police-resort-lathi-charge-teargas-water-cannons-disperse-protesting-mgnrega-workers-10788858/'),
  ('hidkal-displaced-farmers-belagavi-compensation', 'https://timesofindia.indiatimes.com/city/hubballi/hidkal-evacuees-dig-in-seek-compensation-for-394-acres/articleshow/132444418.cms'),
  ('hidkal-displaced-farmers-belagavi-compensation', 'https://timesofindia.indiatimes.com/city/hubballi/over-500-farmers-launch-overnight-protest-outside-belagavi-knnl-office/articleshow/132417631.cms'),
  ('mumbai-police-action-education-protest', 'https://indianexpress.com/article/explained/cjp-protest-mumbai-azad-maidan-restrictions-10793775/'),
  ('mumbai-police-action-education-protest', 'https://www.hindustantimes.com/cities/mumbai-news/elgar-parishad-accused-booked-for-protesting-in-support-of-sonam-wangchuk-101784403293161.html'),
  ('mumbai-police-action-education-protest', 'https://indianexpress.com/article/cities/mumbai/cjp-protest-protesters-gather-at-mumbais-shivaji-park-over-sonam-wangchuk-detention-10793948/'),
  ('mumbai-police-action-education-protest', 'https://indianexpress.com/article/cities/mumbai/students-protest-against-sonam-wangchuks-detention-mumbai-police-book-organisers-10793074/'),
  ('jammu-kashmir-statehood-jantar-mantar', 'https://www.hindustantimes.com/cities/chandigarh-news/farooq-abdullah-to-lead-nc-s-july-20-protest-for-statehood-at-jantar-mantar-101784486592834.html'),
  ('jammu-kashmir-statehood-jantar-mantar', 'https://timesofindia.indiatimes.com/city/delhi/watch-omar-abdullah-ditches-car-for-auto-rickshaw-to-attend-jk-statehood-protest-in-delhi-amid-jantar-mantar-chaos/articleshow/132516171.cms'),
  ('jammu-kashmir-statehood-jantar-mantar', 'https://m.economictimes.com/news/india/nc-protests-in-delhi-demands-centre-honour-promise-on-jk-statehood-restoration/articleshow/132523139.cms'),
  ('kisan-ghat-india-us-trade-deal', 'https://www.hindustantimes.com/india-news/haryana-punjab-farmers-at-shambhu-border-rally-march-to-delhi-protest-india-us-trade-deal-kisan-mahapanchayat-cjp-news-101784605506778.html'),
  ('kisan-ghat-india-us-trade-deal', 'https://www.theweek.in/news/india/2026/07/21/another-farmer-protest-why-are-punjab-farmers-opposing-the-us-india-trade-deal.html'),
  ('kisan-ghat-india-us-trade-deal', 'https://theprint.in/india/haryana-police-seals-shambhu-border-point-as-farmers-head-to-delhi-for-kisan-mahapanchayat/2991896/'),
  ('kisan-ghat-india-us-trade-deal', 'https://timesofindia.indiatimes.com/city/chandigarh/farmers-assemble-at-beas-march-to-delhi-for-july-21-rally-against-proposed-indiaus-trade-deal/articleshow/132523375.cms'),
  ('indore-dewas-ring-road-compensation', 'https://mp.gov.in/'),
  ('indore-dewas-ring-road-compensation', 'https://mpcg.ndtv.in/madhya-pradesh-news/indore-farmers-protest-mp-farmers-west-ring-road-project-land-acquisition-compensation-tractor-rally-mohan-yadav-11795930'),
  ('indore-dewas-ring-road-compensation', 'https://timesofindia.indiatimes.com/city/indore/tractor-rally-towards-bhopal-water-cannon-tear-gas-used-against-protesting-farmers/articleshow/132523419.cms'),
  ('thanjavur-mekedatu-dam-protest', 'https://cwc.gov.in/cauvery-water-management-authority'),
  ('thanjavur-mekedatu-dam-protest', 'https://www.newindianexpress.com/states/tamil-nadu/2026/May/30/allies-cpm-cpi-stage-stir-demand-all-party-meeting'),
  ('pune-neet-paper-leak-protest', 'https://www.nta.ac.in/'),
  ('pune-neet-paper-leak-protest', 'https://indianexpress.com/article/cities/pune/nsui-yuva-sena-protest-over-neet-paper-leak-10696608/'),
  ('mohali-aerotropolis-land-acquisition-hunger-strike', 'https://www.hindustantimes.com/cities/chandigarh-news/mohali-farmers-end-hunger-strike-over-aerotropolis-project-after-govt-assurances-101776192818489.html'),
  ('mohali-aerotropolis-land-acquisition-hunger-strike', 'https://indianexpress.com/article/cities/chandigarh/land-acquisition-aerotropolis-project-farmers-end-hunger-strike-assurances-govt-10637164/'),
  ('mohali-aerotropolis-land-acquisition-hunger-strike', 'https://indianexpress.com/article/cities/city-others/aerotropolis-land-acquisition-farmers-protest-gmada-10635187/'),
  ('akola-fuel-price-protest', 'https://ppac.gov.in/prices/contribution-to-central-and-state-exchequer'),
  ('akola-fuel-price-protest', 'https://timesofindia.indiatimes.com/city/nagpur/bullock-carts-donkeys-cycles-vba-holds-unusual-stir-in-akola/articleshow/131317153.cms'),
  ('karapur-sarvan-luxury-township-protest', 'https://www.thegoan.net/goa-news/%C3%A2%E2%82%AC%CB%9Csave-karapur%C3%A2%E2%82%AC%E2%84%A2-protest-reaches-panaji-agitators-threaten-indefinite-sitin/149594.html'),
  ('karapur-sarvan-luxury-township-protest', 'https://timesofindia.indiatimes.com/city/goa/karapur-sarvan-villagers-detained-while-marching-to-azad-maidan-over-hsg-project/articleshow/131861422.cms'),
  ('karapur-sarvan-luxury-township-protest', 'https://timesofindia.indiatimes.com/city/goa/karapur-villagers-escalate-protest-give-monday-deadline-to-halt-housing-project/articleshow/131692118.cms'),
  ('karapur-sarvan-luxury-township-protest', 'https://indianexpress.com/article/india/goa-mega-housing-project-protest-delhi-luxury-villas-plan-5-star-hotel-opposition-10785238/lite/'),
  ('shamshabad-high-speed-rail-land-protest', 'https://timesofindia.indiatimes.com/city/hyderabad/shamshabad-set-to-become-indias-bullet-train-hub-scr/articleshow/127870587.cms'),
  ('shamshabad-high-speed-rail-land-protest', 'https://theprint.in/india/farmers-protest-against-govt-fencing-land-meant-for-bullet-train-hub-throws-chilli-powder-at-police/2990180/'),
  ('shamshabad-high-speed-rail-land-protest', 'https://timesofindia.indiatimes.com/city/hyderabad/watch-farmers-protest-against-bullet-train-hub-land-fencing-in-telangana-throw-chilli-powder-at-police/articleshow/132483020.cms'),
  ('kolli-hills-land-patta-protest', 'https://namakkal.nic.in/'),
  ('kolli-hills-land-patta-protest', 'https://www.newindianexpress.com/states/tamil-nadu/2026/Apr/08/tns-kolli-hills-residents-intensify-protest-over-pattas-threaten-poll-boycott'),
  ('pandharpur-farm-loan-waiver-hunger-strike', 'https://www.hindustantimes.com/cities/mumbai-news/rohit-pawar-calls-off-hunger-strike-after-government-assures-talks-on-farm-loan-waiver-101781465397780-amp.html'),
  ('pandharpur-farm-loan-waiver-hunger-strike', 'https://www.hindustantimes.com/cities/pune-news/rohit-pawar-s-indefinite-fast-to-seek-removal-of-conditions-from-farm-loan-waiver-continues-on-day-2-101781348163695-amp.html'),
  ('pandharpur-farm-loan-waiver-hunger-strike', 'https://indianexpress.com/article/cities/pune/rohit-pawar-ends-hunger-strike-maharashtra-farm-loan-waiver-row-10740047/'),
  ('jharkhand-statehood-activists-pension-jobs', 'https://www.hindustantimes.com/cities/ranchi-news/jharkhand-activists-defer-strike-after-government-assurance-101781108660421.html'),
  ('jharkhand-statehood-activists-pension-jobs', 'https://timesofindia.indiatimes.com/city/ranchi/statehood-movement-activists-seek-hike-in-pension-govt-jobs-for-kin/articleshow/131639473.cms'),
  ('channot-drinking-water-pipeline-protest', 'https://timesofindia.indiatimes.com/city/chandigarh/channot-protest-ends-khattar-clears-new-water-pipeline-link-for-hansi-village/articleshow/132422737.cms'),
  ('channot-drinking-water-pipeline-protest', 'https://www.tribuneindia.com/news/haryana/46-days-on-chanot-villagers-step-up-protest-over-bhakra-pipeline-water-connection/amp/'),
  ('channot-drinking-water-pipeline-protest', 'https://timesofindia.indiatimes.com/city/chandigarh/bhakra-water-link-hansi-villagers-end-stir-after-36-days/articleshow/131894361.cms'),
  ('channot-drinking-water-pipeline-protest', 'https://www.hindustantimes.com/cities/chandigarh-news/hansi-villagers-end-36-day-stir-after-govt-accepts-canal-water-demand-101782070248776.html');

create table public.media_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create function public.is_media_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.media_admins ma
      where ma.user_id = auth.uid()
    );
$$;

create function public.is_allowed_media_embed(p_url text)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select p_url ~ '^https://www[.]ndtv[.]com/videos/embed-player/'
    or p_url ~ '^https://www[.]instagram[.]com/.+/embed/?$'
    or p_url ~ '^https://www[.]facebook[.]com/plugins/video[.]php[?]';
$$;

create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null references public.media_event_registry(event_slug) on delete restrict,
  media_type public.approved_media_type not null,
  status public.media_review_status not null default 'draft',
  storage_path text null,
  source_url text not null check (source_url ~ '^https://'),
  media_url text null check (media_url is null or media_url ~ '^https://'),
  publisher text null,
  creator text null,
  rights_holder text null,
  credit_line text not null check (length(trim(credit_line)) between 3 and 500),
  rights_basis public.media_rights_basis not null,
  licence_name text null,
  licence_url text null check (licence_url is null or licence_url ~ '^https://'),
  permission_reference text null,
  alt_text text not null check (length(trim(alt_text)) between 8 and 500),
  focal_position text null default '50% 50%',
  same_event_verified boolean not null default false,
  privacy_reviewed boolean not null default false,
  safety_reviewed boolean not null default false,
  integrity_reviewed boolean not null default false,
  approved_source_verified boolean not null default false,
  uploaded_by uuid null references auth.users(id) on delete set null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  replaces_media_id uuid null references public.event_media(id) on delete restrict,
  replacement_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz null,
  withdrawn_at timestamptz null,
  constraint event_media_upload_path_required check (
    media_type <> 'uploaded_event_image' or storage_path is not null
  ),
  constraint event_media_embed_url_required check (
    media_type = 'uploaded_event_image' or media_url is not null
  ),
  constraint event_media_embed_host_allowed check (
    media_type = 'uploaded_event_image' or public.is_allowed_media_embed(media_url)
  ),
  constraint event_media_official_embed_not_rehosted check (
    rights_basis <> 'official_embed'
    or (
      media_type in ('publisher_video_embed', 'official_social_embed')
      and storage_path is null
    )
  ),
  constraint event_media_uploaded_rights_redistributable check (
    media_type <> 'uploaded_event_image'
    or rights_basis in (
      'owned_original',
      'explicit_permission',
      'official_reuse_terms',
      'cc0',
      'public_domain',
      'cc_by',
      'cc_by_sa'
    )
  ),
  constraint event_media_embed_rights_basis check (
    media_type = 'uploaded_event_image' or rights_basis = 'official_embed'
  ),
  constraint event_media_approved_attribution_complete check (
    status <> 'approved'
    or (
      length(trim(coalesce(publisher, ''))) > 0
      and (
        media_type <> 'uploaded_event_image'
        or length(trim(coalesce(creator, rights_holder, ''))) > 0
      )
    )
  ),
  constraint event_media_approved_rights_evidence_complete check (
    status <> 'approved'
    or (
      (rights_basis <> 'explicit_permission'
        or length(trim(coalesce(permission_reference, ''))) > 0)
      and (
        rights_basis not in (
          'official_reuse_terms',
          'cc0',
          'public_domain',
          'cc_by',
          'cc_by_sa'
        )
        or (
          length(trim(coalesce(licence_name, ''))) > 0
          and licence_url is not null
        )
      )
    )
  ),
  constraint event_media_approval_complete check (
    status <> 'approved'
    or (
      same_event_verified
      and privacy_reviewed
      and safety_reviewed
      and integrity_reviewed
      and approved_source_verified
      and reviewed_by is not null
      and approved_at is not null
    )
  ),
  constraint event_media_withdrawal_complete check (
    status <> 'withdrawn' or withdrawn_at is not null
  ),
  constraint event_media_replacement_reason_required check (
    replaces_media_id is null
    or length(trim(coalesce(replacement_reason, ''))) >= 8
  ),
  constraint event_media_focal_position_format check (
    focal_position is null
    or focal_position ~ '^(left|center|right|top|bottom|[0-9]{1,3}%)([ ]+(top|center|bottom|[0-9]{1,3}%))?$'
  )
);

create table public.event_media_private_review (
  media_id uuid primary key references public.event_media(id) on delete cascade,
  permission_evidence text null,
  review_notes text null,
  same_event_reasoning text not null check (length(trim(same_event_reasoning)) >= 12),
  privacy_notes text not null check (length(trim(privacy_notes)) >= 8),
  safety_notes text not null check (length(trim(safety_notes)) >= 8),
  integrity_notes text not null check (length(trim(integrity_notes)) >= 8),
  rejection_reason text null,
  original_filename text null,
  original_sha256 text null check (original_sha256 is null or original_sha256 ~ '^[a-f0-9]{64}$'),
  original_media_url text null check (
    original_media_url is null or original_media_url ~ '^https://'
  ),
  staging_path text null,
  previous_public_storage_path text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Four previously reviewed embeds are migrated as drafts. They are not public until a
-- media administrator rechecks the source, event match, privacy, safety and integrity gates and
-- explicitly approves them.
insert into public.event_media (
  id,
  event_slug,
  media_type,
  status,
  source_url,
  media_url,
  publisher,
  credit_line,
  rights_basis,
  alt_text,
  same_event_verified,
  privacy_reviewed,
  safety_reviewed,
  integrity_reviewed,
  approved_source_verified
)
values
  (
    '14000000-0000-4000-8000-000000000001',
    'jamia-yuva-kumbh-campus-protest',
    'publisher_video_embed',
    'draft',
    'https://www.ndtv.com/education/jamia-students-protest-rss-yuva-kumbh-event-on-campus-heavy-police-deployed-11419540',
    'https://www.ndtv.com/videos/embed-player/?id=1091649&mute=1&autostart=0&mutestart=true&pWidth=100&pHeight=100',
    'NDTV',
    'Video/Post: NDTV · View original',
    'official_embed',
    'NDTV video report showing the 28 April 2026 Jamia campus protest.',
    true,
    true,
    true,
    true,
    true
  ),
  (
    '14000000-0000-4000-8000-000000000002',
    'save-sgnp-human-chain-thane',
    'official_social_embed',
    'draft',
    'https://www.instagram.com/reel/DacYWWktqjL/',
    'https://www.instagram.com/reel/DacYWWktqjL/embed/',
    'ScienceKriti / Save SGNP campaign contributors',
    'Video/Post: Save SGNP campaign contributors · View original',
    'official_embed',
    'Official Instagram post documenting the 5 July 2026 Save SGNP human chain in Thane.',
    true,
    false,
    true,
    true,
    true
  ),
  (
    '14000000-0000-4000-8000-000000000003',
    'morbi-transmission-compensation-satyagraha',
    'official_social_embed',
    'draft',
    'https://www.instagram.com/p/DadCC4NFo-C/',
    'https://www.instagram.com/p/DadCC4NFo-C/embed/',
    'The Wire',
    'Video/Post: The Wire · View original',
    'official_embed',
    'The Wire Instagram post about the Morbi farmers compensation fast.',
    true,
    true,
    true,
    true,
    true
  ),
  (
    '14000000-0000-4000-8000-000000000004',
    'dasiya-villagers-ethanol-plant',
    'official_social_embed',
    'draft',
    'https://www.facebook.com/LiveTimesNewsChannel/videos/uttarpradesh-%E0%A4%AC%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%80-%E0%A4%AE%E0%A5%87%E0%A4%82-%E0%A4%8F%E0%A4%A5%E0%A5%87%E0%A4%A8%E0%A5%89%E0%A4%B2-%E0%A4%AB%E0%A5%88%E0%A4%95%E0%A5%8D%E0%A4%9F%E0%A5%8D%E0%A4%B0%E0%A5%80-%E0%A4%95%E0%A5%87-%E0%A4%96%E0%A4%BF%E0%A4%B2%E0%A4%BE%E0%A4%AB-%E0%A4%9C%E0%A4%A8-%E0%A4%86%E0%A4%82%E0%A4%A6%E0%A5%8B%E0%A4%B2%E0%A4%A8-%E0%A4%B9%E0%A4%9C%E0%A4%BE%E0%A4%B0%E0%A5%8B%E0%A4%82-%E0%A4%97%E0%A5%8D%E0%A4%B0%E0%A4%BE%E0%A4%AE%E0%A5%80%E0%A4%A3%E0%A5%8B%E0%A4%82-%E0%A4%A8%E0%A5%87-%E0%A4%95%E0%A4%BF/2065530604339052/',
    'https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/LiveTimesNewsChannel/videos/2065530604339052/&show_text=false&width=960',
    'Live Times',
    'Video/Post: Live Times · View original',
    'official_embed',
    'Live Times video from the public movement against the Dasiya ethanol factory.',
    true,
    true,
    true,
    true,
    true
  );

insert into public.event_media_private_review (
  media_id,
  same_event_reasoning,
  privacy_notes,
  safety_notes,
  integrity_notes,
  original_media_url,
  review_notes
)
values
  (
    '14000000-0000-4000-8000-000000000001',
    'The publisher, campus, date, Yuva Kumbh dispute and student protest match the reviewed event.',
    'Public campus footage is retained in the publisher context; no identities are extracted.',
    'Click-to-load only; no live tactical location or sensitive operational detail is added.',
    'Official NDTV publisher page and embed were reviewed; no file was downloaded or rehosted.',
    'https://www.ndtv.com/video/jamia-protests-rss-event-sparks-protests-at-jamia-university-in-delhi-1091649',
    'Imported as a draft from the pre-library source-only review. Human reapproval is required.'
  ),
  (
    '14000000-0000-4000-8000-000000000002',
    'The official campaign post identifies the 5 July 2026 Save SGNP human chain in Thane.',
    'Possible minors and ordinary participants remain visible; privacy approval is intentionally pending.',
    'No live tactical location is exposed and no local copy is made.',
    'Official Instagram post URL; the platform embed is the only proposed display method.',
    'https://www.instagram.com/reel/DacYWWktqjL/',
    'Imported as a draft and withheld pending a fresh privacy decision.'
  ),
  (
    '14000000-0000-4000-8000-000000000003',
    'The Wire post identifies the Morbi compensation fast and belongs to the approved source set.',
    'People remain within the publisher reporting context; India Observed extracts no identities.',
    'No live tactical information or vulnerable precise location is added.',
    'Official publisher account post; the platform embed is the only proposed display method.',
    'https://www.instagram.com/p/DadCC4NFo-C/',
    'Imported as a draft from the pre-library source-only review. Human reapproval is required.'
  ),
  (
    '14000000-0000-4000-8000-000000000004',
    'The Live Times post identifies the Dasiya ethanol-plant movement and is an approved source.',
    'Wide public-action footage is used without identifying ordinary participants.',
    'No live tactical detail is added; display remains click-to-load.',
    'Official source-linked Facebook video; no file was downloaded or rehosted.',
    'https://www.facebook.com/LiveTimesNewsChannel/videos/2065530604339052/',
    'Imported as a draft from the pre-library source-only review. Human reapproval is required.'
  );

create unique index event_media_one_approved_primary_per_event_idx
on public.event_media(event_slug)
where status = 'approved';

create unique index event_media_unique_media_url_idx
on public.event_media(media_url)
where media_url is not null and status <> 'rejected';

create unique index event_media_private_review_sha256_idx
on public.event_media_private_review(original_sha256)
where original_sha256 is not null;

create index event_media_event_status_idx
on public.event_media(event_slug, status, created_at desc);

create trigger event_media_set_updated_at
before update on public.event_media
for each row execute function public.set_updated_at();

create trigger event_media_private_review_set_updated_at
before update on public.event_media_private_review
for each row execute function public.set_updated_at();

alter table public.media_event_registry enable row level security;
alter table public.media_event_sources enable row level security;
alter table public.media_admins enable row level security;
alter table public.event_media enable row level security;
alter table public.event_media_private_review enable row level security;

revoke all on table public.media_event_registry from public, anon, authenticated;
revoke all on table public.media_event_sources from public, anon, authenticated;
revoke all on table public.media_admins from public, anon, authenticated;
revoke all on table public.event_media from public, anon, authenticated;
revoke all on table public.event_media_private_review from public, anon, authenticated;

grant select on table public.media_event_registry to authenticated;
grant select on table public.media_event_sources to authenticated;
grant select, insert on table public.event_media to authenticated;
grant select, insert, update on table public.event_media_private_review to authenticated;

create policy media_event_registry_admin_select
on public.media_event_registry
for select
to authenticated
using (public.is_media_admin());

create policy media_event_sources_admin_select
on public.media_event_sources
for select
to authenticated
using (public.is_media_admin());

create policy event_media_admin_select
on public.event_media
for select
to authenticated
using (public.is_media_admin());

create policy event_media_admin_insert
on public.event_media
for insert
to authenticated
with check (
  public.is_media_admin()
  and uploaded_by = auth.uid()
  and status = 'draft'
);

create policy event_media_private_review_admin_select
on public.event_media_private_review
for select
to authenticated
using (public.is_media_admin());

create policy event_media_private_review_admin_insert
on public.event_media_private_review
for insert
to authenticated
with check (
  public.is_media_admin()
  and exists (
    select 1
    from public.event_media em
    where em.id = media_id
      and em.uploaded_by = auth.uid()
  )
);

create policy event_media_private_review_admin_update
on public.event_media_private_review
for update
to authenticated
using (public.is_media_admin())
with check (public.is_media_admin());

revoke all on function public.is_media_admin() from public, anon, authenticated;
revoke all on function public.is_allowed_media_embed(text) from public, anon, authenticated;
grant execute on function public.is_media_admin() to authenticated;

create function public.get_public_event_media(p_event_slug text default null)
returns table (
  event_slug text,
  media_type public.approved_media_type,
  storage_path text,
  media_url text,
  source_url text,
  publisher text,
  creator text,
  rights_holder text,
  credit_line text,
  rights_basis public.media_rights_basis,
  licence_name text,
  licence_url text,
  alt_text text,
  focal_position text,
  approved_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    em.event_slug,
    em.media_type,
    case when em.media_type = 'uploaded_event_image' then em.storage_path else null end,
    case when em.media_type <> 'uploaded_event_image' then em.media_url else null end,
    em.source_url,
    em.publisher,
    em.creator,
    em.rights_holder,
    em.credit_line,
    em.rights_basis,
    em.licence_name,
    em.licence_url,
    em.alt_text,
    em.focal_position,
    em.approved_at
  from public.event_media em
  where em.status = 'approved'
    and em.same_event_verified
    and em.privacy_reviewed
    and em.safety_reviewed
    and em.integrity_reviewed
    and em.approved_source_verified
    and (p_event_slug is null or em.event_slug = p_event_slug);
$$;

create function public.update_event_media_review(
  p_media_id uuid,
  p_same_event_verified boolean,
  p_privacy_reviewed boolean,
  p_safety_reviewed boolean,
  p_integrity_reviewed boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_media_admin() then
    raise exception using errcode = '42501', message = 'Media administrator access required';
  end if;

  update public.event_media
  set
    same_event_verified = p_same_event_verified,
    privacy_reviewed = p_privacy_reviewed,
    safety_reviewed = p_safety_reviewed,
    integrity_reviewed = p_integrity_reviewed
  where id = p_media_id
    and status = 'draft';

  if not found then
    raise exception using errcode = '22023', message = 'Draft media unavailable';
  end if;
end;
$$;

create function public.approve_event_media(
  p_media_id uuid,
  p_public_storage_path text default null
)
returns table (
  approved_media_id uuid,
  replaced_media_id uuid,
  replaced_storage_path text
)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  candidate public.event_media%rowtype;
  previous public.event_media%rowtype;
begin
  if not public.is_media_admin() then
    raise exception using errcode = '42501', message = 'Media administrator access required';
  end if;

  select *
  into candidate
  from public.event_media
  where id = p_media_id
  for update;

  if candidate.id is null or candidate.status <> 'draft' then
    raise exception using errcode = '22023', message = 'Draft media unavailable';
  end if;

  if not (
    candidate.same_event_verified
    and candidate.privacy_reviewed
    and candidate.safety_reviewed
    and candidate.integrity_reviewed
    and candidate.approved_source_verified
  ) then
    raise exception using errcode = '23514', message = 'All media review gates must pass';
  end if;

  if not exists (
    select 1
    from public.event_media_private_review review
    where review.media_id = candidate.id
  ) then
    raise exception using errcode = '23514', message = 'Private media review is required';
  end if;

  if not exists (
    select 1
    from public.media_event_sources mes
    where mes.event_slug = candidate.event_slug
      and mes.source_url = candidate.source_url
  ) then
    raise exception using errcode = '23503', message = 'Source does not belong to event';
  end if;

  if candidate.media_type = 'uploaded_event_image' then
    if not exists (
      select 1
      from public.event_media_private_review review
      where review.media_id = candidate.id
        and length(trim(coalesce(review.original_filename, ''))) > 0
        and review.original_sha256 is not null
        and review.staging_path = candidate.storage_path
    ) then
      raise exception using errcode = '23514', message = 'Uploaded-file provenance is incomplete';
    end if;
    if p_public_storage_path <> candidate.event_slug || '/' || candidate.id || '/primary.webp' then
      raise exception using errcode = '22023', message = 'Invalid public storage path';
    end if;
  elsif p_public_storage_path is not null then
    raise exception using errcode = '22023', message = 'Embeds cannot use public storage';
  elsif not public.is_allowed_media_embed(candidate.media_url) then
    raise exception using errcode = '22023', message = 'Embed host is not allowed';
  elsif not exists (
    select 1
    from public.event_media_private_review review
    where review.media_id = candidate.id
      and review.original_media_url is not null
  ) then
    raise exception using errcode = '23514', message = 'Original embed provenance is required';
  end if;

  select *
  into previous
  from public.event_media
  where event_slug = candidate.event_slug
    and status = 'approved'
  for update;

  if previous.id is not null then
    if candidate.replaces_media_id is distinct from previous.id
      or length(trim(coalesce(candidate.replacement_reason, ''))) < 8
    then
      raise exception using errcode = '23514', message = 'Replacement reason and target required';
    end if;

    update public.event_media
    set
      status = 'withdrawn',
      withdrawn_at = now()
    where id = previous.id;

    update public.event_media_private_review
    set previous_public_storage_path = previous.storage_path
    where media_id = candidate.id;
  end if;

  update public.event_media
  set
    status = 'approved',
    storage_path = case
      when media_type = 'uploaded_event_image' then p_public_storage_path
      else null
    end,
    reviewed_by = auth.uid(),
    approved_at = now(),
    withdrawn_at = null
  where id = candidate.id;

  return query
  select candidate.id, previous.id, previous.storage_path;
end;
$$;

create function public.reject_event_media(p_media_id uuid, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_media_admin() then
    raise exception using errcode = '42501', message = 'Media administrator access required';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 8 then
    raise exception using errcode = '22023', message = 'Rejection reason required';
  end if;

  update public.event_media
  set status = 'rejected', reviewed_by = auth.uid()
  where id = p_media_id and status = 'draft';

  if not found then
    raise exception using errcode = '22023', message = 'Draft media unavailable';
  end if;

  update public.event_media_private_review
  set rejection_reason = p_reason
  where media_id = p_media_id;
end;
$$;

create function public.withdraw_event_media(p_media_id uuid, p_reason text)
returns text
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  prior_path text;
begin
  if not public.is_media_admin() then
    raise exception using errcode = '42501', message = 'Media administrator access required';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 8 then
    raise exception using errcode = '22023', message = 'Withdrawal reason required';
  end if;

  update public.event_media
  set status = 'withdrawn', withdrawn_at = now(), reviewed_by = auth.uid()
  where id = p_media_id and status = 'approved'
  returning storage_path into prior_path;

  if not found then
    raise exception using errcode = '22023', message = 'Approved media unavailable';
  end if;

  update public.event_media_private_review
  set rejection_reason = p_reason, previous_public_storage_path = prior_path
  where media_id = p_media_id;

  return prior_path;
end;
$$;

revoke all on function public.get_public_event_media(text) from public, anon, authenticated;
revoke all on function public.update_event_media_review(uuid, boolean, boolean, boolean, boolean)
from public, anon, authenticated;
revoke all on function public.approve_event_media(uuid, text) from public, anon, authenticated;
revoke all on function public.reject_event_media(uuid, text) from public, anon, authenticated;
revoke all on function public.withdraw_event_media(uuid, text) from public, anon, authenticated;

grant execute on function public.get_public_event_media(text) to anon, authenticated;
grant execute on function public.update_event_media_review(uuid, boolean, boolean, boolean, boolean)
to authenticated;
grant execute on function public.approve_event_media(uuid, text) to authenticated;
grant execute on function public.reject_event_media(uuid, text) to authenticated;
grant execute on function public.withdraw_event_media(uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'event-media-staging',
    'event-media-staging',
    false,
    10485760,
    array['image/webp']
  ),
  (
    'event-media-public',
    'event-media-public',
    true,
    10485760,
    array['image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy event_media_staging_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'event-media-staging'
  and public.is_media_admin()
);

create policy event_media_staging_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-media-staging'
  and public.is_media_admin()
  and exists (
    select 1
    from public.event_media em
    where em.event_slug = (storage.foldername(name))[1]
      and em.id::text = (storage.foldername(name))[2]
      and em.storage_path = name
      and em.uploaded_by = auth.uid()
      and em.status = 'draft'
      and name = em.event_slug || '/' || em.id || '/upload.webp'
  )
);

create policy event_media_staging_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-media-staging'
  and public.is_media_admin()
)
with check (
  bucket_id = 'event-media-staging'
  and public.is_media_admin()
);

create policy event_media_staging_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-media-staging'
  and public.is_media_admin()
);

create policy event_media_public_read
on storage.objects
for select
to public
using (bucket_id = 'event-media-public');

create policy event_media_public_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-media-public'
  and public.is_media_admin()
  and exists (
    select 1
    from public.event_media em
    where em.event_slug = (storage.foldername(name))[1]
      and em.id::text = (storage.foldername(name))[2]
      and name = em.event_slug || '/' || em.id || '/primary.webp'
  )
);

create policy event_media_public_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-media-public'
  and public.is_media_admin()
)
with check (
  bucket_id = 'event-media-public'
  and public.is_media_admin()
);

create policy event_media_public_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-media-public'
  and public.is_media_admin()
);

comment on table public.media_admins is
  'Private UUID allow-list for media administrators; email matching is not an authorization boundary.';
comment on table public.event_media is
  'Editorial media metadata. Public access is only through get_public_event_media().';
comment on table public.event_media_private_review is
  'Sensitive permission evidence, reviewer reasoning and original-file metadata; never public.';
comment on function public.approve_event_media(uuid, text) is
  'Revalidates all review, source, rights, path and replacement gates before approval.';
comment on function public.update_event_media_review(uuid, boolean, boolean, boolean, boolean) is
  'Allows media administrators to change only the four public review gates on a draft.';

commit;
