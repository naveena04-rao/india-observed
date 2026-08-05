begin;

select plan(4);

select is(
  (select count(*)::integer from public.media_event_registry where event_slug in ('karnataka-transport-employees-wage-strike', 'punjab-farmers-chandigarh-msp-compensation-rally', 'assam-tea-workers-wage-strike', 'tamil-nadu-noon-meal-anganwadi-workers-sit-in', 'national-trade-union-farmer-strike-labour-codes-trade-deal', 'mamata-banerjee-electoral-roll-dharna', 'west-bengal-government-employees-da-cease-work', 'punjab-himachal-border-entry-tax-blockade', 'telangana-road-transport-employees-strike', 'jaipur-city-transport-employees-hunger-strike', 'kuvempu-university-nsui-results-records-protest', 'madhya-pradesh-farmer-grievance-highway-protests', 'konkan-fruit-farmers-mumbai-compensation-march', 'andhra-pradesh-ysrcp-fuel-price-protests', 'kaniyambadi-brick-kiln-workers-extortion-allegation-protest', 'hassan-dairy-farmers-cattle-purchase-boycott-protest', 'panchana-dam-irrigation-water-farmers-protest', 'tamil-nadu-farmers-cases-withdrawal-hunger-strike', 'ranchi-cab-drivers-fare-revision-strike', 'bhim-rural-workers-mgnrega-replacement-rally', 'ranchi-auto-drivers-route-permit-protest', 'bengaluru-street-vendors-eviction-bandh', 'undavalli-seed-axis-road-land-acquisition-protest', 'bihar-neet-irregularities-bandh', 'kerala-neet-police-action-student-marches', 'chennai-college-students-neet-protests', 'kolkata-sealdah-esplanade-neet-march', 'odisha-farmers-paddy-procurement-bandh', 'samagra-shiksha-maharashtra-azad-maidan-hunger-strike', 'congress-student-campaign-paper-leaks-unemployment')),
  30,
  'all media-ready approved verification events are registered'
);

select is(
  (select count(*)::integer from public.media_event_sources where event_slug in ('karnataka-transport-employees-wage-strike', 'punjab-farmers-chandigarh-msp-compensation-rally', 'assam-tea-workers-wage-strike', 'tamil-nadu-noon-meal-anganwadi-workers-sit-in', 'national-trade-union-farmer-strike-labour-codes-trade-deal', 'mamata-banerjee-electoral-roll-dharna', 'west-bengal-government-employees-da-cease-work', 'punjab-himachal-border-entry-tax-blockade', 'telangana-road-transport-employees-strike', 'jaipur-city-transport-employees-hunger-strike', 'kuvempu-university-nsui-results-records-protest', 'madhya-pradesh-farmer-grievance-highway-protests', 'konkan-fruit-farmers-mumbai-compensation-march', 'andhra-pradesh-ysrcp-fuel-price-protests', 'kaniyambadi-brick-kiln-workers-extortion-allegation-protest', 'hassan-dairy-farmers-cattle-purchase-boycott-protest', 'panchana-dam-irrigation-water-farmers-protest', 'tamil-nadu-farmers-cases-withdrawal-hunger-strike', 'ranchi-cab-drivers-fare-revision-strike', 'bhim-rural-workers-mgnrega-replacement-rally', 'ranchi-auto-drivers-route-permit-protest', 'bengaluru-street-vendors-eviction-bandh', 'undavalli-seed-axis-road-land-acquisition-protest', 'bihar-neet-irregularities-bandh', 'kerala-neet-police-action-student-marches', 'chennai-college-students-neet-protests', 'kolkata-sealdah-esplanade-neet-march', 'odisha-farmers-paddy-procurement-bandh', 'samagra-shiksha-maharashtra-azad-maidan-hunger-strike', 'congress-student-campaign-paper-leaks-unemployment')),
  30,
  'each registered event has one reviewed media source'
);

select is(
  (
    select count(*)::integer
    from public.event_media
    where review_import_reference = 'Approved verification leads media review 2026-08-05'
      and status = 'approved'
      and same_event_verified
      and privacy_reviewed
      and safety_reviewed
      and integrity_reviewed
      and approved_source_verified
  ),
  30,
  'all approved-lead treatments pass the public media review gates'
);

select is(
  (
    select count(*)::integer
    from public.event_media_private_review review
    join public.event_media media on media.id = review.media_id
    where media.review_import_reference = 'Approved verification leads media review 2026-08-05'
      and review.derivative_sha256 is not null
      and review.derivative_width > 0
      and review.derivative_height > 0
  ),
  30,
  'all approved-lead treatments retain private derivative provenance'
);

select * from finish();
rollback;
