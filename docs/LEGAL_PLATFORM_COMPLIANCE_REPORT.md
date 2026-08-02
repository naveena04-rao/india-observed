# Legal and platform compliance report

Status date: 2026-08-01. Designed with documented compliance controls; final legal assessment
remains the responsibility of qualified counsel. This report does not state or imply that a source,
use, connector, crawler, excerpt, embed, notification or publication is lawful merely because it is
technically possible.

## Connector and source-category register

All rows are **Not reviewed** and **production disabled**. Default private retention is seven days
for raw/API payloads, 14 days for extracted text, 90 days for evidence excerpts, and longer only
after an approved schedule or legal hold. Public display is “No” until the registry explicitly says
otherwise.

| Connector / category       | Access and API basis                                      | Copyright and personal-data treatment                                                   | Remaining question / counsel                                                                    |
| -------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| RSS / Atom                 | Publisher-provided feed preferred                         | Metadata, link and brief necessary excerpt; redact contacts and vulnerable people       | Feed terms, robots applicability, licence and retention per publisher; counsel if unclear       |
| Sitemaps / approved sites  | Public sitemap or bounded HTTPS request only              | No full-article archive or media download; public availability is not permission        | Automated-access and excerpt basis per domain; counsel for restriction or ambiguity             |
| News publications          | Feed, licensed API or expressly approved endpoint         | Treat text/media as protected; editorial paraphrase and source link preferred           | Paywall, syndication ownership, commercial API and fair-dealing assessment require review       |
| Government/district/police | Official domain, portal or feed                           | Preserve issuer/date/URL; minimise names; allegations remain attributed                 | Portal reuse terms and document status; legal-effect ambiguity requires editor/counsel          |
| Courts/tribunals           | Official portal where available                           | Distinguish interim order, allegation, finding and final judgment                       | Reporting restrictions, sealed/sensitive matters and legal effect require qualified review      |
| Civic/union organisations  | Expressly approved public feed/site                       | Public-capacity names only when necessary; no member/participant directory              | Consent, safety/retaliation, terms and copyright require source review                          |
| GDELT                      | Official DOC API lead discovery                           | Store metadata/link/brief evidence; underlying publisher rights still govern            | API terms, rate/retention, publisher licences and cross-border processing need review           |
| YouTube                    | Official Data API only                                    | Metadata/link or approved official embed; no download; deletion reconciliation required | API audit/policies, quota, display, retention and commercial use require platform/legal review  |
| Telegram                   | TDLib with own credentials, approved public channels only | No closed/private groups; no AI processing; no media copying                            | API/content-licensing terms, sponsored-message requirements and permitted use need counsel      |
| Bluesky                    | Official public API only                                  | Minimal post metadata; privacy/context/authenticity and deletion handling               | Network/service terms, retention, redistribution and moderation duties need review              |
| X                          | Official API only                                         | No unofficial scraping; metadata/link and policy-compliant display only                 | Paid tier, endpoint rights, retention/deletion/display rules require platform/legal review      |
| Meta official accounts     | Official Graph API/app review only                        | Approved public official accounts; no general profile collection                        | Permissions, app review, display/deletion and commercial-use terms need review                  |
| Google Fact Check          | Official Fact Check Tools API only                        | Claim-review metadata and link; not a substitute for source verification                | Terms, quota, retention and reuse require platform review                                       |
| Commercial news API        | Licensed provider only                                    | Contract controls excerpt/full-text/media and redistribution                            | Provider, contract, geography, retention and public-display rights unresolved; counsel required |

## DPDP and privacy readiness controls

- Private processing-purpose register, data categories, prohibited categories, retention and approval.
- Existing passwordless Supabase identity and media-admin UUID boundary reused for editor access.
- RLS and grants deny anonymous/public access to fetched text, evidence, compliance notes, requests,
  vendor records and audit history.
- Email/phone redaction before persistence; no participant directories, facial embeddings,
  biometrics, device IDs, location trails or live tactical locations.
- Possible children, victims, witnesses, whistleblowers, vulnerable participants, safety risk and
  reputation-harming allegations are escalated to mandatory human review.
- Private grievance, correction, erasure, source/platform deletion, takedown, media-withdrawal,
  defamation and emergency-safety request records with assignment, interim action and audit fields.
- Retention job with legal-hold exclusion. Legal holds and approvals are authorised-editor only.
- Vendor register covers AI, translation, news/social API, email, hosting, database, monitoring, OCR
  and transcription; no vendor connector is enabled.

Before activation, qualified counsel should confirm the applicable Digital Personal Data Protection
Act, 2023 rules/notifications, lawful processing basis, notice and grievance obligations, processor
contracts, cross-border treatment, retention and breach procedure. Privacy notice updates are still
required to describe discovery, direct collection notices, rights requests, vendors, retention and
notification preferences. The database production gate records that update; it is false.

## Copyright, media and factual-risk workflow

Source text, posts, photographs, videos and graphics are presumed protected. Private review retains
only source metadata, a bounded/redacted text sample and a brief attributed passage. The public site
should link and use original editorial paraphrase. A link or platform embed is not recorded as
ownership or permission.

Media candidates record creator/publisher, source, date, proposed use, rights basis, attribution,
territory/duration restrictions, withdrawal contact, decision and evidence. Rights default to
`unknown_pending_review`; a database constraint blocks advancement to media review while unknown.
Existing public media approval continues to require rights, attribution, privacy, safety, integrity,
event-match and reviewer gates.

Allegation, official/police statement, court finding, final judgment, reported/disputed fact,
unverified assertion and editorial inference must remain distinct. Criminal, corruption, violence,
misconduct, named-private-person and wrongdoing proposals require exact wording, status,
contradiction/right-of-reply context and reviewer decision. The deterministic scanner escalates
reputational terms; it must not turn them into declarative facts.

## Retention, vendors, notifications and requests

| Record                                           | Default days | Default action                   |
| ------------------------------------------------ | -----------: | -------------------------------- |
| Raw pages / failed responses / API payloads      |            7 | Delete                           |
| Extracted article text                           |           14 | Delete                           |
| Rejected candidate personal data                 |           30 | Redact                           |
| Media candidates                                 |           30 | Manual rights/privacy review     |
| Source excerpts / duplicates / notification logs |           90 | Review, hash/URL only, or delete |
| Editor audit logs                                |          730 | Manual legal/editorial review    |

These are conservative engineering defaults, not approved legal retention periods. Every schedule is
unapproved and requires owner/counsel review. Credentials/tokens are prohibited from scan records and
logs. The initial vendor inventory is Supabase (database/auth/storage), Vercel (hosting), prospective
API providers, prospective AI/translation/OCR/transcription services, prospective email and
monitoring providers; each begins “Not reviewed” with no data sent by this feature.

Follower notification preferences are event-specific, frequency-aware, opt-in and globally
unsubscribeable. Delivery records have idempotency keys and audit states. Notifications can only be
created after a reviewed publication record and while the global real-notification gate is enabled.
Lead-submission contacts are never queried. Complaint/bounce/suppression handling and sender identity
must be completed before email enablement.

The compliance-request workflow covers copyright/privacy complaints, correction/erasure, source or
platform deletion, media withdrawal, defamation, mismatch/identity errors, emergency safety removal
and court/government notices. Operational emergency unpublishing still needs a documented on-call
runbook and authorised production procedure before activation.

## Production activation checklist and unresolved risk

The database requires compliance-report review, qualified legal review, privacy-notice update,
takedown readiness and explicit owner approval before the scheduler can be enabled. Each source also
needs current reviewer identity/date/expiry, permissible legal state, non-paywalled access and an
allowed robots assessment. Vendor gates are equivalent. Technical tests alone cannot activate them.

Still unresolved: source-by-source terms and robots review; copyright/fair-dealing and excerpt basis;
platform/API contracts, deletion and display rules; representative benchmark quality; DPDP rules and
cross-border assessment; child/vulnerable-person operational procedure; breach response; emergency
unpublish runbook; vendor DPAs/security; privacy/terms text; email consent, suppression, bounce and
complaint operations; and qualified counsel sign-off. External legal counsel is required wherever
the registry says `requires_legal_counsel` and before overall production activation.
