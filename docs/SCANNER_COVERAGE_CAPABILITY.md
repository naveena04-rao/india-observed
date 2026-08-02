# Scanner coverage and capability report

Status date: 2026-08-01. This is a candid engineering inventory, not a claim of complete news or
social-media coverage. Every connector is production-disabled and requires source-specific legal,
security and editorial approval.

| Connector                   | Implementation                                    | Credentials / cost / quota                      | Search and coverage                           | Current limitation                                                    |
| --------------------------- | ------------------------------------------------- | ----------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| RSS / Atom                  | Available through bounded approved-feed fetcher   | Usually none; publisher terms apply             | Configured publishers and languages           | No feed may run before robots/terms/copyright review                  |
| Public sitemap              | Available through bounded approved-source fetcher | Usually none                                    | Configured official/publisher domains         | Sitemap availability is not reuse permission                          |
| Approved website            | Available through bounded public HTTPS fetcher    | None by default                                 | Only allow-listed pages                       | No generic crawling, browser emulation, CAPTCHA or paywall bypass     |
| Government/district notices | Available as approved-site/feed method            | Usually none                                    | Configured official domains                   | Authority, date and legal effect require human review                 |
| GDELT DOC 2.0               | URL builder and JSON candidate parser             | Public API; capped at 60 planned searches/day   | Exact/OR, state, ongoing, domain, NEAR/REPEAT | Candidate URLs only; no verification or reuse clearance               |
| YouTube Data API            | Optional official `search.list` builder/parser    | API key; capped at 100 search calls/day         | India region, date, language, priority query  | Policy, display, retention and deletion review required               |
| Telegram TDLib              | Manifest only; unavailable                        | `api_id` and `api_hash`; client session         | Approved public channels only                 | Terms restrict AI use; private/closed/invite-only sources prohibited  |
| Bluesky                     | Official public `searchPosts` builder/parser      | Public endpoint; planned bound of 500/day       | Approved public keywords/accounts; links only | Retention, moderation, deletion and commercial-use review required    |
| Commercial news API         | Abstraction only                                  | Paid/licensed provider not selected             | Provider-dependent                            | Licence and redistribution terms unresolved                           |
| X API                       | Manifest only                                     | Official access token and plan-dependent limits | Plan/endpoint-dependent                       | No scraping; commercial access, retention and display review required |
| Meta official accounts      | Manifest only                                     | Official Graph API and app review               | Approved official accounts only               | No claim of general Facebook/Instagram discovery                      |
| Google Fact Check Tools     | Manifest only                                     | Google API credentials/quota                    | Published fact-check claims, not general news | Terms, quota and reuse review required                                |

Primary technical references: [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/),
[YouTube API overview](https://developers.google.com/youtube/v3/getting-started),
[YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies-guide),
[Telegram API terms](https://core.telegram.org/api/terms),
[TDLib](https://core.telegram.org/tdlib),
[Bluesky rate limits](https://docs.bsky.app/docs/advanced-guides/rate-limits), and
[X API support](https://developer.x.com/en/support/twitter-api/error-troubleshooting).
These references can change; the registry records review and expiry dates rather than silently
accepting new terms.

## Language and query coverage

The deterministic query dictionaries cover English, Hindi, Bengali, Marathi, Tamil, Telugu,
Kannada, Malayalam, Gujarati, Punjabi, Odia, Assamese and Urdu across four families: protest/event,
official response, consequence/outcome and visual/fact-check evidence. Script detection preserves
original language. Bengali/Assamese and Hindi/Marathi share scripts and therefore require semantic
or human language resolution; the system does not pretend script detection is full language
identification. Translation is an optional provider interface and remains unconfigured.

## Pipeline and evaluation

The pipeline exposes 15 named stages from fetch to candidate creation. Semantic matching has a
provider interface with a deterministic local fallback. Corroboration counts independent ownership
keys rather than domains alone and distinguishes official support, independent corroboration,
conflict and syndication-only repetition. Media candidates store exact-event reasoning,
cryptographic/perceptual hashes, provenance and `unknown_pending_review` rights by default.

`npm run scanner:benchmark` evaluates a checked-in 30-item, 13-language fixture. The current fixture
reports 100% new-event precision, 96.3% recall, 100% labelled existing-event match, update detection,
duplicate suppression, state resolution, district resolution, source attribution and media match,
96.7% language detection, and 100% safety-flag recall. It is a small regression corpus, not a
representative estimate of real-world national performance, translation quality or entity extraction.
Production-quality targets require a separately reviewed, larger labelled corpus with
source-family, geography, freshness, duplicate/conflict and media-ground-truth annotations.

## Coverage dashboard and known gaps

The private Source Coverage view shows source health, failures, last success, enabled state,
connector capability and pending compliance reviews. With all sources disabled, current geographic,
source-family and language recall is zero by design. Paid APIs, restricted social platforms,
translation, OCR, transcription, perceptual-media computation, terms-change polling and email
delivery are not implemented. The architecture has explicit interfaces and data fields for later
reviewed adapters; it does not claim those capabilities are operational.

## Free-version budget and expected workload

The defaults scan all approved feeds, recent sitemaps and enabled source-specific adapters within
per-source limits; cap GDELT at 60 searches, YouTube at 100 official search calls, and Bluesky at
500 bounded public requests; and allocate zero to Telegram. YouTube's budget is 45 ongoing-event,
25 high-priority/weak-state, 15 official-response, 10 new-event-media and 5 general-discovery calls.
Budgets stop safely and are recorded in scan-run quota JSON.

District and city queries draw from a version-controlled nationwide bootstrap dictionary, then
prioritise ongoing-event locations, weak-coverage states and locations seen in recent items. The
list is intentionally bounded and is not presented as an exhaustive district gazetteer.

The source import template is intentionally empty. Three already-reviewed evidence domains are
seeded as disabled examples: Assam (English), Tamil Nadu (English), and one national/central source
(English). This is not an approved national source list. With zero enabled sources, every state and
all 13 configured languages are operationally weak, expected daily candidate volume is zero, and
expected editorial workload is zero. After a preview dry run, the dashboard must measure volumes
before staffing or paid-resource estimates are made. Potential later paid resources are a licensed
news API, translation, OCR/transcription, or official social API access, but only if measured gaps
justify them.

**The free scanner provides broad permitted public-source coverage but cannot claim complete
coverage of all Indian news or social media.**
