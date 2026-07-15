# Week 1 technical handover

## Delivered

- repository-ready Next.js / TypeScript structure
- responsive home-page prototype
- initial Supabase schema and pgTAP tests
- CI, issue template, Dependabot, formatting and security configuration
- local `develop` branch and commit
- bounded Codex prompt and architecture/security documentation
- source workbook retained for later verified import

## Commands

```bash
npm install
npm run dev
npm run check
npx supabase start
npx supabase db reset
npx supabase test db
```

## Credential locations

- local: `.env.local` (Git-ignored)
- staging/production: hosting provider secret manager
- never commit service-role keys

## External actions still requiring account authentication

- create the private GitHub repository and push local branches
- configure branch protection and repository security settings
- create/link the hosted Supabase development project
- deploy a staging preview

## Next engineering tasks

1. Authenticate GitHub and publish the repository.
2. Install dependencies and run all checks.
3. Start Docker and execute Supabase migration tests.
4. Create hosted Supabase and staging.
5. Build browse and event pages.
6. Design a reviewed workbook-to-database import process.
