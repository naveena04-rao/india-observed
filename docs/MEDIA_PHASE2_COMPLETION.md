# Event media Phase 2 completion

Completed 30 July 2026 for draft PR #14. This record documents the controlled review and hosted
development population workflow; it does not claim ownership, licence, permission or transfer of
copyright.

## Result

- Published event records: 50
- Approved primary visual treatments: 50
- Missing treatments: 0
- Exact-event photographs or thumbnails: 49
- Publisher-video embeds: 3
- Official social embeds: 1
- Source-document previews: 1

The only source-document exception is `kolli-hills-land-patta-protest`. Its public treatment is
labelled `Source document preview — not an event photograph`.

## Editorial basis and gates

Thirty-nine treatments were completed under
`editorial_fair_dealing_current_events`, following explicit owner authorisation for reduced,
source-linked current-events display. Each treatment records:

- exact-event and approved-source verification;
- publisher or creator credit and an original-source link;
- privacy, safety and integrity review;
- original and derivative SHA-256 values and dimensions;
- reduced WebP processing, including metadata removal;
- the public takedown and withdrawal path.

Rights remain with the credited creator or publisher. A display-basis decision does not override a
failed event-match, privacy, safety or integrity gate.

## Replacements and exception

Eight unsuitable candidates were not approved. The replacements register covers unresolved social
posts, mismatched archive imagery, generic or representative imagery, an AI-style illustration and
an unrelated file photograph. Seven received exact-event replacements. Kolli Hills received the
sole permitted source-document preview after focused review did not establish an exact-event visual.

The canonical machine-readable record is `data/event-media-phase2.json`.
Private derivative locations are supplied to the population command at execution time and are not
recorded in the repository.

## Hosted development workflow

The existing 11 approved treatments were preserved. Thirty-nine additional treatments were staged
privately and approved through the protected `approve_event_media` RPC. Uploaded derivatives were
validated as reduced WebP files without EXIF or GPS metadata before public copying. Private staging
was empty after completion, and the temporary media administrator and temporary authentication user
were removed.

The pre-change backup is outside the repository at:

`C:\Users\navee\Documents\IndiaObservedBackups\pr14-pre-phase2-media-20260730`

It contains the media-table export and both relevant Storage bucket inventories/objects. The backup
and all publisher-image derivatives remain outside Git.

## Review artifacts

The five archive contact sheets and the exceptions sheet are outside the repository at:

`C:\Users\navee\Documents\IndiaObserved\MediaReview\pr14-phase2-20260730`

Each archive sheet contains ten records with the selected treatment, title, slug, publisher,
photographer when known, source identifier, display basis and approval status.

## Scope protection

This phase did not change event facts, factual evidence relationships, claims, safety records,
following, authentication or the canonical workbook. Six source relationships added by the hosted
population are explicitly media-only provenance links and are not factual evidence relationships.
No publisher photograph or thumbnail was committed to Git.
