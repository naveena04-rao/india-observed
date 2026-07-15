# Security and privacy baseline

- Auto-publication is disabled and is not part of the Week 1 code path.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.
- `.env.local` and deployment secrets are excluded from Git.
- RLS is enabled on every data table; no anonymous database policy is created yet.
- The MVP does not accept file uploads.
- Public pages must not expose ordinary participant identities, exact tactical locations, private messages, confidential-source identities, health data, or unnecessary images of minors.
- Serious allegations require enhanced evidence and right-of-reply workflow before publication.
- Dependency updates pass CI before merge.
- Security headers remove the framework signature and restrict browser permissions.
- Any exposed personal data or unsupported consequential claim triggers a hold, correction, and incident review.
