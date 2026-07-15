# Architecture

## Week 1 boundary

The application is a Next.js server-rendered public interface backed by Supabase/PostgreSQL. The spreadsheet remains the editorial source of truth until a verified import process is approved.

## Layers

1. **Public UI** — server-rendered pages; no live tracking or participant directory.
2. **Server data access** — server-only Supabase service-role client; no service key in client code.
3. **PostgreSQL model** — events, claims, sources, claim-source links, organisations, event roles, and corrections.
4. **Editorial control** — publication status, verification status, evidence links, last-reviewed date, and correction history.
5. **Future discovery system** — separate from public publication; automated leads cannot publish records.

## Key decisions

- Text IDs preserve the existing India Observed conventions.
- Claims and sources use a many-to-many evidence join table.
- RLS is enabled immediately, with no anonymous policies in Week 1.
- Public read policies and a published-record view will be designed only after editorial permissions are defined.
- Source-family metadata supports duplicate and syndicated-report grouping.
