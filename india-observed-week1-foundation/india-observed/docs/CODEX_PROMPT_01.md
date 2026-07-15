# First bounded Codex prompt

You are working in the private `india-observed` repository.

## Goal
Implement only the engineering foundation and initial database contract. Do not build the full product, automated discovery, authentication, editorial CMS, public submission endpoints, or autonomous publication.

## Before coding
1. Read `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and the issue.
2. Return an implementation plan.
3. List the files you will create or modify and explain the architecture.
4. Identify security, privacy, migration, and rollback risks.

## Required output
- Strict TypeScript Next.js App Router project.
- Basic responsive home page with project name and pilot description.
- Server-only Supabase connection helper and disabled-by-default health endpoint.
- Migrations for events, claims, sources, claim_sources, organisations, event_organisations, corrections, indexes, constraints, and RLS.
- Issue template, Dependabot, CI, formatting, tests, and documentation.

## Non-negotiable controls
- `auto_publish_enabled` remains false.
- No secret may be committed or exposed to client components.
- No participant directory, live location, tactical data, or private upload workflow.
- Every schema choice must be explained.
- Run formatting, lint, type-check, tests, and build.
- Finish with the diff summary, checks, security considerations, and rollback steps.
