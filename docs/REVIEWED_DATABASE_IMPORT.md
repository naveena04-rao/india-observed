# Reviewed database import v1

## Canonical source

- Workbook: `India_Observed_Master_Tracker.xlsx`
- SHA-256: `594C6320521B2858FEA3487D333E3A2A5374F74201E8DE25646DFAD077A2EDCC`
- Workbook review date: 17 July 2026
- Imported registers: Events, Claims, Sources, Organisations and Corrections

The binary workbook remains in the protected project archive and is not required to build the
application. The migration is the reviewed, version-controlled import snapshot.

## Imported records

| Register           | Rows |
| ------------------ | ---: |
| Events             |   22 |
| Claims             |  136 |
| Sources            |   77 |
| Organisations      |   90 |
| Corrections        |    2 |
| Claim-source links |  314 |

All 22 events are imported with `candidate` publication status. The migration does not add an
anonymous policy, public read path, authentication change or auto-publication mechanism.

## Mapping rules

- Workbook dates are converted from Excel serial dates to ISO calendar dates.
- Controlled workbook labels are mapped to the existing PostgreSQL enum values.
- `Claims supported` is parsed as the workbook's explicit comma-separated claim-ID relationship.
- Every claim-source link is checked for an existing claim, an existing source and a matching event.
- Empty optional cells remain SQL `null`; required values are not guessed.
- Internal notes remain protected by the existing RLS boundary and must not be exposed by public
  queries.

The Organisations register contains standard entities, but the workbook does not provide explicit
event-to-organisation foreign keys. `Organising group` and `Authority involved` are reviewed free
text. This import therefore adds no `event_organisations` rows rather than creating heuristic links.

## Transaction and verification

The migration runs in one transaction and aborts unless the imported table counts match the
reviewed workbook. pgTAP tests verify counts, foreign-key integrity, event consistency for evidence
links, candidate-only publication status and pre-publication correction state.

## Rollback

Before production use, take a database backup. To reverse this import without reverting the schema,
delete the imported rows in dependency order inside one transaction:

1. `corrections`
2. `claim_sources`
3. `sources`
4. `claims`
5. `event_organisations` (none are created by v1)
6. `organisations`
7. `events`

Use the IDs contained in the import migration and review the rollback in staging first. Do not run a
broad production delete based only on row counts.
