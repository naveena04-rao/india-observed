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
- configure branch protection and repository security settings
- create/link the hosted Supabase development project
- deploy a staging preview

## Next engineering tasks
1. Install dependencies and run all checks.
2. Start Docker and execute Supabase migration tests.
3. Create hosted Supabase and staging.
4. Build browse and event pages.
5. Design a reviewed workbook-to-database import process.
