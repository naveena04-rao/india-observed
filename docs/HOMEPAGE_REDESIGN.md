# Civic Ledger homepage redesign

## Status

The homepage redesign is complete and validated locally on branch `agent/homepage-redesign-v1`.

## Visual direction

- Primary reference: The Marshall Project's editorial restraint and hierarchy
- India Observed adaptation: a structured civic-record archive rather than an article-led newsroom
- Palette: warm paper, charcoal ink, deep civic teal, terracotta accent
- Typography: bundled system/Georgia stacks; no external font downloads
- Components: thin rules, square geometry, case-file records, visible evidence language

## Homepage modules

1. Archival identity, utility bar and responsive navigation
2. Editorial hero with repository brief and scope disclosure
3. Archive-search entry point and topic shortcuts
4. Three structured sample records
5. Claim-level verification language
6. Discover → Separate claims → Verify → Human review methodology
7. Selective coverage and correction visibility
8. Public-source-only lead call-to-action and archive footer

## Safety boundaries

- no live protest tracking
- no tactical locations
- no ordinary participant directory
- no autoplaying or sensational protest media
- no autonomous publication
- no database migration or environment-variable changes

## Validation

The following command passed:

```bash
npm run check
```

It includes the repository secret scan, Prettier, ESLint, strict TypeScript, five tests and the Next.js production build.

## Files changed for the visual redesign

- `src/app/page.tsx`
- `src/app/globals.css`
- `tests/foundation.test.mjs`
- `tsconfig.json` (format-only normalization)

## Release plan

1. Publish `agent/homepage-redesign-v1` to GitHub.
2. Open a draft pull request against `main`.
3. Review the Vercel branch preview on desktop and mobile.
4. Make one bounded revision from founder feedback.
5. Merge only after explicit visual approval.

## Rollback

Close the draft pull request or delete the redesign branch. The current production deployment and Supabase schema are not changed by the local redesign package.
