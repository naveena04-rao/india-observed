# Staging and Supabase deployment

## Hosted Supabase

1. Create a development project in the intended account or organisation.
2. Store URL, anon key, and service-role key in the hosting platform secret manager.
3. Link the repository with the Supabase CLI.
4. Apply migrations.
5. Verify RLS and ensure no unintended public policy exists.
6. Set `SUPABASE_CONNECTION_CHECK_ENABLED=true` only after credentials and schema exist.

## Staging

Deploy `develop` to a non-promoted preview or staging environment. The Week 1 staging page may display only the basic home page and health status. Do not expose service credentials in browser bundles or logs.

## Rollback

- Application: redeploy the previous successful build.
- Database before shared data: reset the development project.
- Database after shared data: create a forward migration; do not rewrite applied migration history.
