-- Repair the source-domain allow-list used by bounded private enrichment. This migration does not
-- start a scan or enable scheduling, publication, notifications, email, media or GitHub writes.

update public.scan_sources
set connector_config = jsonb_set(
      connector_config,
      '{enrichmentDomains}',
      jsonb_build_array(substring(base_url from '^https?://(?:www[.])?([^/]+)')),
      true
    ),
    updated_at = now()
where connector_config ->> 'status' = 'approved_metadata_only'
  and connector_config ->> 'targetedEnrichment' = 'true';
