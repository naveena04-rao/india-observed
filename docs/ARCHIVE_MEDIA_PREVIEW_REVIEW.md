# Archive media preview review

Review date: 30 July 2026

This note records the archive-preview repair performed for the four already-approved official
embeds. It does not approve media that remains permission-pending, evidence-pending or rejected in
the canonical tracker.

## Canonical review gate

Canonical workbook:
`C:\Users\navee\Documents\IndiaObserved\tasks\India_Observed_Master_Tracker.xlsx`

SHA-256:
`76958985A005AFE9EF332F657959FFB039334E7B97D0205D3FC82C5DDD249262`

The `Media Candidates` register contains 51 candidate rows for 50 events. At this review point it
records:

- 37 candidates as needing permission;
- 11 candidates as needing more evidence;
- 2 rejected candidates;
- one Preview-only approval and one currently displayable publisher alternate.

These human review outcomes were not overridden.

## Approved embed previews

All four derivatives were visually inspected, resized to 960×540, encoded as WebP and stripped of
source metadata. Each derivative has a separate same-event, source, privacy, safety and integrity
decision in the media library.

| Event                                 | Approved treatment                | Preview source                                                                  | Derivative SHA-256                                                 |
| ------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `bidadi-farmers-land-acquisition`     | NDTV publisher-video thumbnail    | Official NDTV exact-event video                                                 | `448f200ee372324b25f31c609bd270743043d3527913ea3ae85495dc09845b09` |
| `dasiya-villagers-ethanol-plant`      | Live Times social-video thumbnail | Official Live Times exact-event post                                            | `af4f3eae85295c5ab1c89d4b20095f3ac098cffff97cc47d9dcee56cce196d36` |
| `indore-dewas-ring-road-compensation` | NDTV MPCG publisher thumbnail     | Official NDTV MPCG exact-event report                                           | `90cf1b95a536e1484727d0174a7b4d8d62a3a02f24656c94b922cd84d3eed707` |
| `jamia-yuva-kumbh-campus-protest`     | NDTV exact-video frame            | Official NDTV exact-event video; the article-level file photograph was rejected | `1860659e6f2a6a162099cb0f21f125003b98835c03dadfc923afdccf37e609e5` |

The archive uses only these static derivatives. The third-party player remains click-to-load on the
event detail page.

## Coverage and blocker

- Published records: 50
- Existing approved media: 11
- Approved uploaded photographs: 7
- Approved embed previews: 4
- Homepage Phase 1 records with archive imagery: 9 of 9
- Phase 2 records: 41
- Phase 2 records already approved before this repair: 2
- Phase 2 records still awaiting a publishable media decision: 39

The 39 unresolved records cannot be approved without new permission or evidence and a human review
decision. The archive verifier intentionally fails until those decisions exist. Generic,
representative, contextual, stock and AI imagery remain prohibited.

## Cache diagnosis

The earlier cache wrapper could persist an empty approved-media response from a disabled build and
reuse it in Preview. Disabled environments now bypass the cached loader, while enabled responses
are keyed by the Supabase project reference under `approved-event-media-v3`. A Preview-equivalent
build loaded 50 records, 11 approved media records and attached approved media to 11 archive rows.
