# India Observed

India Observed is a curated, source-linked public repository for documenting protests and civic movements in India. The project is evidence-led, privacy-preserving, correction-friendly, and explicitly does **not** provide live protest tracking or identify ordinary participants.

## Week 1 engineering scope

This repository contains the initial engineering foundation:

- Next.js App Router project structure with strict TypeScript
- restrained, responsive home-page prototype
- Supabase/PostgreSQL migrations for events, claims, sources, organisations, links, and corrections
- server-only Supabase health-check route
- CI, formatting, issue-template, Dependabot, security, and rollback documentation
- bounded Codex prompt and technical handover
- manually reviewed Week 1 research retained for later import

It does not yet contain a production editorial CMS, automated discovery pipeline, authentication, public forms, or a live deployment.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS 4
- Supabase / PostgreSQL
- Node's built-in test runner for foundation tests
- ESLint and Prettier
- GitHub Actions CI

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Run all checks:

```bash
npm run check
```

## Supabase local development

Docker is required for the local Supabase stack.

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

The hosted Supabase project is intentionally not encoded in the repository. Configure credentials only in `.env.local` and deployment-secret settings.

## Project rules

- `main` accepts reviewed changes only.
- Development work uses `develop` or `agent/*` branches.
- Auto-publication remains disabled.
- The manually reviewed workbook remains the source of truth until a verified import pipeline is approved.

See `docs/TECHNICAL_HANDOVER.md` for the handover and `docs/CODEX_PROMPT_01.md` for the first bounded coding prompt.

> A lockfile was not generated in the execution environment because package-registry access was unavailable. Generate and commit `package-lock.json` before the first protected merge.
