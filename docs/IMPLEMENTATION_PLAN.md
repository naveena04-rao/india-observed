# Day 7 implementation plan

1. Create the repository-ready Next.js and TypeScript structure.
2. Add the restrained home-page prototype from the approved information architecture.
3. Add server-only environment validation and Supabase health endpoint.
4. Create a single reversible initial migration and pgTAP schema tests.
5. Add formatting, lint, type-check, test, build, CI, issue-template, and Dependabot configuration.
6. Preserve manually reviewed Week 1 records for later import.
7. Review the diff and secret exposure.
8. Commit locally on `develop`.
9. Create the private GitHub repository, configure branch protection, create the hosted Supabase project, and deploy staging after account authentication is available.

## Rollback

The initial schema is contained in one migration. Before public data exists, rollback is `supabase db reset` after removing or replacing that migration. After shared environments exist, use a forward migration rather than destructive history edits.
