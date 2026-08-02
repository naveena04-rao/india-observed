-- Private, human-gated discovery and publication workflow.
-- The production schedule, outbound email and GitHub writes are deliberately disabled.

create or replace function public.is_authorised_editor()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_media_admin();
$$;

revoke all on function public.is_authorised_editor() from public, anon, authenticated;
grant execute on function public.is_authorised_editor() to authenticated;

create table public.discovery_schedule_settings (
  singleton boolean primary key default true check (singleton),
  scan_cron_utc text not null default '30 23 * * *' check (scan_cron_utc = '30 23 * * *'),
  digest_cron_utc text not null default '30 2 * * *' check (digest_cron_utc = '30 2 * * *'),
  scheduler_enabled boolean not null default false,
  dry_run_only boolean not null default true,
  outbound_email_enabled boolean not null default false,
  github_write_enabled boolean not null default false,
  real_notifications_enabled boolean not null default false,
  compliance_report_reviewed boolean not null default false,
  qualified_legal_review_completed boolean not null default false,
  privacy_notice_updated boolean not null default false,
  takedown_process_ready boolean not null default false,
  owner_approved_at timestamptz null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null,
  constraint discovery_production_gates check (
    not scheduler_enabled
    or (
      not dry_run_only and updated_by is not null
      and compliance_report_reviewed and qualified_legal_review_completed
      and privacy_notice_updated and takedown_process_ready and owner_approved_at is not null
    )
  )
);

insert into public.discovery_schedule_settings (singleton) values (true);

create table public.compliance_registry (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('connector', 'source', 'platform')),
  subject_key text not null,
  platform_or_source_name text not null,
  source_url_or_api text null check (source_url_or_api is null or source_url_or_api ~ '^https://'),
  access_method text not null,
  jurisdiction text not null default 'Not assessed',
  terms_url text null check (terms_url is null or terms_url ~ '^https://'),
  api_terms_url text null check (api_terms_url is null or api_terms_url ~ '^https://'),
  terms_version text null,
  terms_last_checked_at timestamptz null,
  robots_policy text not null default 'not_assessed' check (robots_policy in ('not_applicable', 'not_assessed', 'allowed', 'restricted', 'forbidden')),
  copyright_or_licensing text not null default 'Unknown pending review',
  permitted_data_use text not null default 'None until reviewed',
  permitted_retention text not null default 'None until reviewed',
  permitted_redistribution text not null default 'No',
  permitted_media_display text not null default 'No',
  attribution_requirement text not null default 'Pending review',
  rate_limits text not null default 'Pending review',
  authentication_requirement text not null default 'Pending review',
  personal_data_risk text not null default 'not_assessed',
  sensitive_data_risk text not null default 'not_assessed',
  children_data_risk text not null default 'not_assessed',
  paywall_status text not null default 'not_assessed' check (paywall_status in ('none', 'not_assessed', 'partial', 'paywalled', 'access_controlled')),
  legal_review_status text not null default 'not_reviewed' check (legal_review_status in (
    'not_reviewed', 'approved_metadata_only', 'approved_link_and_excerpt', 'approved_official_api',
    'approved_internal_review_only', 'approved_public_display', 'restricted', 'rejected', 'requires_legal_counsel'
  )),
  reviewer uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  review_expires_at timestamptz null,
  production_enabled boolean not null default false,
  decision_reason text not null default 'Not reviewed',
  deletion_reconciliation_required boolean not null default false,
  last_deletion_reconciled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_type, subject_key),
  constraint compliance_enablement_gate check (
    not production_enabled or (
      legal_review_status in ('approved_metadata_only', 'approved_link_and_excerpt', 'approved_official_api', 'approved_internal_review_only', 'approved_public_display')
      and reviewer is not null and reviewed_at is not null and coalesce(review_expires_at > now(), false)
      and paywall_status not in ('paywalled', 'access_controlled')
      and robots_policy not in ('not_assessed', 'restricted', 'forbidden')
    )
  )
);

create table public.processing_purposes (
  id uuid primary key default gen_random_uuid(),
  purpose_key text not null unique,
  purpose_description text not null,
  lawful_basis_or_assessment text not null default 'Requires documented assessment',
  data_categories text[] not null default '{}',
  prohibited_data_categories text[] not null default '{}',
  retention_days integer not null check (retention_days between 1 and 3650),
  privacy_notice_required boolean not null default false,
  approved boolean not null default false,
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public.vendor_compliance (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  vendor_type text not null check (vendor_type in ('ai', 'translation', 'news_api', 'social_api', 'email', 'hosting', 'database', 'monitoring', 'ocr', 'transcription')),
  data_sent text not null default 'None while disabled',
  processing_purpose text not null,
  retention text not null default 'Pending review',
  training_use_setting text not null default 'Pending review',
  processing_location text not null default 'Pending review',
  contract_or_terms_url text null check (contract_or_terms_url is null or contract_or_terms_url ~ '^https://'),
  subprocessors text not null default 'Pending review',
  deletion_method text not null default 'Pending review',
  security_information text not null default 'Pending review',
  approval_state text not null default 'not_reviewed' check (approval_state in ('not_reviewed', 'approved', 'restricted', 'rejected', 'requires_legal_counsel')),
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  review_expires_at timestamptz null,
  production_enabled boolean not null default false,
  constraint vendor_enablement_gate check (
    not production_enabled or (
      approval_state = 'approved' and reviewed_by is not null
      and coalesce(review_expires_at > now(), false)
    )
  )
);

create table public.retention_schedules (
  record_type text primary key,
  retention_days integer not null check (retention_days between 1 and 3650),
  deletion_action text not null check (deletion_action in ('delete', 'redact_personal_data', 'retain_hash_and_url', 'manual_review')),
  legal_hold_allowed boolean not null default true,
  approved boolean not null default false,
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null,
  updated_at timestamptz not null default now()
);

create table public.compliance_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('copyright', 'privacy', 'personal_data_correction', 'personal_data_erasure', 'media_withdrawal', 'source_deletion', 'platform_deletion', 'defamation', 'incorrect_event_match', 'incorrect_identity', 'emergency_safety_removal', 'court_or_government_notice', 'grievance')),
  requester_details_encrypted text null,
  affected_url_or_record text not null,
  evidence_private text null,
  received_at timestamptz not null default now(),
  assigned_reviewer uuid null references auth.users(id) on delete set null,
  interim_action text null,
  final_decision text null,
  completion_time timestamptz null,
  emergency boolean not null default false,
  status text not null default 'received' check (status in ('received', 'triaged', 'interim_action', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.compliance_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid null references auth.users(id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id text not null,
  safe_details jsonb not null default '{}'::jsonb,
  legal_hold boolean not null default false,
  occurred_at timestamptz not null default now()
);

create table public.scan_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 200),
  base_url text not null check (base_url ~ '^https://'),
  scan_url text not null check (scan_url ~ '^https://'),
  source_type text not null check (source_type in (
    'news_publication', 'government_notice', 'district_administration', 'police_notice',
    'court_or_tribunal', 'union', 'civic_organisation', 'official_public_account',
    'rss_feed', 'permitted_api'
  )),
  coverage_scope text not null check (char_length(trim(coverage_scope)) between 2 and 300),
  state text null,
  district_or_region text null,
  language text not null default 'English' check (char_length(trim(language)) between 2 and 80),
  reliability_tier text not null check (reliability_tier in ('primary', 'high', 'standard', 'lead_only')),
  enabled boolean not null default false,
  scan_method text not null check (scan_method in ('rss', 'atom', 'json_api', 'sitemap', 'html_list', 'gdelt', 'youtube_api', 'bluesky_api', 'telegram_tdlib', 'lead_submission')),
  connector_config jsonb not null default '{}'::jsonb check (jsonb_typeof(connector_config) = 'object'),
  daily_request_limit integer not null default 24 check (daily_request_limit between 1 and 1000),
  minimum_request_interval_seconds integer not null default 300 check (minimum_request_interval_seconds between 1 and 86400),
  last_etag text null check (last_etag is null or char_length(last_etag) <= 1000),
  last_modified_header text null check (last_modified_header is null or char_length(last_modified_header) <= 200),
  scan_frequency text not null default 'daily' check (scan_frequency in ('daily', 'weekdays', 'weekly', 'manual')),
  automated_access_notes text not null check (char_length(trim(automated_access_notes)) between 8 and 1000),
  last_successful_scan timestamptz null,
  last_attempted_scan timestamptz null,
  last_error_code text null,
  last_error_summary text null check (last_error_summary is null or char_length(last_error_summary) <= 500),
  failure_count integer not null default 0 check (failure_count between 0 and 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,
  compliance_registry_id uuid null references public.compliance_registry(id) on delete restrict,
  unique (scan_url)
);

create table public.scan_runs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique check (idempotency_key ~ '^[a-z0-9][a-z0-9:_-]{7,199}$'),
  trigger_type text not null check (trigger_type in ('scheduled', 'manual', 'retry')),
  scheduled_for date null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'incomplete', 'failed')),
  source_count integer not null default 0 check (source_count >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  new_event_candidate_count integer not null default 0 check (new_event_candidate_count >= 0),
  update_candidate_count integer not null default 0 check (update_candidate_count >= 0),
  official_response_candidate_count integer not null default 0 check (official_response_candidate_count >= 0),
  source_candidate_count integer not null default 0 check (source_candidate_count >= 0),
  media_candidate_count integer not null default 0 check (media_candidate_count >= 0),
  high_priority_candidate_count integer not null default 0 check (high_priority_candidate_count >= 0),
  duplicate_candidate_count integer not null default 0 check (duplicate_candidate_count >= 0),
  quota_usage jsonb not null default '{"gdelt":{"used":0,"limit":60},"youtube":{"used":0,"limit":100},"bluesky":{"used":0,"limit":500}}'::jsonb,
  error_summary text null check (error_summary is null or char_length(error_summary) <= 1000),
  dry_run boolean not null default true,
  requested_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint scan_run_completion check (
    (status in ('queued', 'running') and completed_at is null)
    or (status in ('completed', 'incomplete', 'failed') and completed_at is not null)
  )
);

create unique index scan_runs_one_scheduled_day
on public.scan_runs (scheduled_for)
where trigger_type = 'scheduled';

create table public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references public.scan_runs(id) on delete cascade,
  source_id uuid not null references public.scan_sources(id) on delete restrict,
  state text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'retry_wait', 'skipped')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  items_discovered integer not null default 0 check (items_discovered >= 0),
  request_count integer not null default 0 check (request_count >= 0),
  quota_units_used integer not null default 0 check (quota_units_used >= 0),
  next_retry_at timestamptz null,
  error_code text null,
  safe_error_summary text null check (safe_error_summary is null or char_length(safe_error_summary) <= 500),
  created_at timestamptz not null default now(),
  unique (scan_run_id, source_id)
);

create table public.discovered_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.scan_sources(id) on delete restrict,
  first_scan_run_id uuid not null references public.scan_runs(id) on delete restrict,
  source_url text not null check (source_url ~ '^https://'),
  canonical_url text not null check (canonical_url ~ '^https://'),
  title text not null check (char_length(trim(title)) between 2 and 500),
  published_at timestamptz null,
  fetched_at timestamptz not null default now(),
  original_language text not null default 'und' check (char_length(original_language) between 2 and 20),
  original_text text null check (original_text is null or octet_length(original_text) <= 32768),
  translated_text text null check (translated_text is null or octet_length(translated_text) <= 32768),
  language_confidence numeric(5,4) null check (language_confidence between 0 and 1),
  source_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(source_metadata) = 'object'),
  content_fingerprint text not null unique check (content_fingerprint ~ '^[a-f0-9]{64}$'),
  pipeline_stage text not null default 'fetched' check (pipeline_stage in (
    'fetched', 'normalized', 'language_detected', 'translated', 'canonicalized',
    'deduplicated', 'entities_extracted', 'geography_resolved', 'classified',
    'event_matched', 'fields_extracted', 'corroborated', 'media_matched',
    'confidence_scored', 'candidate_created'
  )),
  processing_status text not null default 'pending' check (processing_status in (
    'pending', 'classified', 'duplicate', 'irrelevant', 'manual_review', 'failed'
  )),
  safe_error_code text null,
  normalized_title_fingerprint text null check (normalized_title_fingerprint is null or normalized_title_fingerprint ~ '^[a-f0-9]{64}$'),
  duplicate_group_key text null check (duplicate_group_key is null or char_length(duplicate_group_key) <= 300),
  duplicate_reason text null check (duplicate_reason is null or duplicate_reason in ('canonical_url', 'content_hash', 'normalized_title', 'source_family', 'syndicated_copy', 'event_date_location', 'perceptual_media')),
  safe_error_summary text null check (safe_error_summary is null or char_length(safe_error_summary) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.editorial_candidates (
  id uuid primary key default gen_random_uuid(),
  discovered_item_id uuid not null references public.discovered_items(id) on delete restrict,
  candidate_type text not null check (candidate_type in (
    'new_event', 'event_update', 'official_response', 'new_source', 'media_evidence',
    'duplicate', 'irrelevant', 'manual_review', 'processing_failed'
  )),
  target_event_slug text null references public.followable_events(event_slug) on delete restrict,
  suggested_title text null check (suggested_title is null or char_length(suggested_title) <= 500),
  state text null,
  district_or_region text null,
  locality text null,
  discovery_time timestamptz not null default now(),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent_editor_attention')),
  confidence numeric(5,4) null check (confidence between 0 and 1),
  corroboration_status text not null default 'one_source_uncorroborated' check (corroboration_status in (
    'one_source_uncorroborated', 'multiple_independent_sources', 'official_source_supported',
    'conflicting_sources', 'syndicated_only'
  )),
  independent_source_count integer not null default 1 check (independent_source_count >= 0),
  classification_method text not null default 'deterministic' check (classification_method in ('deterministic', 'ai_assisted', 'manual')),
  extraction_notes text null check (extraction_notes is null or char_length(extraction_notes) <= 3000),
  duplicate_candidate_id uuid null references public.editorial_candidates(id) on delete restrict,
  review_status text not null default 'unreviewed' check (review_status in (
    'unreviewed', 'under_review', 'approved', 'rejected', 'deferred', 'duplicate', 'failed'
  )),
  assigned_to uuid null references auth.users(id) on delete set null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index editorial_candidates_item_type_target_unique
on public.editorial_candidates (discovered_item_id, candidate_type, coalesce(target_event_slug, ''));

create table public.event_candidate_fields (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.editorial_candidates(id) on delete cascade,
  field_key text not null check (field_key in (
    'title', 'event_type', 'summary', 'start_date', 'end_date', 'date_precision',
    'event_status', 'public_location', 'locality', 'district_or_region',
    'state_or_union_territory', 'organisations', 'directed_at', 'main_issue',
    'latest_official_response', 'outcome_or_follow_up', 'unresolved_matters'
  )),
  field_label text not null check (char_length(trim(field_label)) between 2 and 120),
  current_public_value jsonb null,
  proposed_value jsonb not null,
  value_type text not null check (value_type in ('text', 'date', 'boolean', 'string_list', 'controlled_value')),
  proposal_reason text not null check (char_length(trim(proposal_reason)) between 8 and 3000),
  support_source_url text not null check (support_source_url ~ '^https://'),
  original_supporting_passage text not null check (char_length(trim(original_supporting_passage)) between 2 and 5000),
  translated_supporting_passage text null check (translated_supporting_passage is null or char_length(translated_supporting_passage) <= 5000),
  source_published_at timestamptz null,
  discovered_at timestamptz not null default now(),
  extraction_method text not null check (extraction_method in ('deterministic', 'ai_assisted', 'manual')),
  source_reliability_tier text not null check (source_reliability_tier in ('primary', 'high', 'standard', 'lead_only')),
  confidence numeric(5,4) null check (confidence between 0 and 1),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved', 'rejected', 'deferred')),
  reviewer_edited_value jsonb null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  decision_reason text null check (decision_reason is null or char_length(decision_reason) <= 2000),
  publication_reference uuid null,
  created_at timestamptz not null default now(),
  unique (candidate_id, field_key)
);

create table public.candidate_sources (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.editorial_candidates(id) on delete cascade,
  source_url text not null check (source_url ~ '^https://'),
  canonical_url text not null check (canonical_url ~ '^https://'),
  publisher text null,
  headline text null,
  published_at timestamptz null,
  reliability_tier text null check (reliability_tier is null or reliability_tier in ('primary', 'high', 'standard', 'lead_only')),
  evidence_summary text null check (evidence_summary is null or char_length(evidence_summary) <= 3000),
  original_language text not null default 'und',
  original_supporting_passage text null check (original_supporting_passage is null or char_length(original_supporting_passage) <= 5000),
  translated_supporting_passage text null check (translated_supporting_passage is null or char_length(translated_supporting_passage) <= 5000),
  source_family text null check (source_family is null or char_length(source_family) <= 200),
  ownership_group text null check (ownership_group is null or char_length(ownership_group) <= 200),
  independence_key text not null check (char_length(independence_key) between 3 and 300),
  source_relationship text not null default 'independent' check (source_relationship in ('independent', 'official', 'syndicated', 'copied', 'conflicting')),
  content_fingerprint text not null check (content_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (candidate_id, canonical_url)
);

create table public.candidate_media (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.editorial_candidates(id) on delete cascade,
  target_event_slug text null references public.followable_events(event_slug) on delete restrict,
  source_page_url text not null check (source_page_url ~ '^https://'),
  media_url text not null check (media_url ~ '^https://'),
  media_type text not null check (media_type in (
    'photograph', 'video', 'official_video_statement', 'publisher_hosted_video',
    'public_social_post', 'source_document_preview'
  )),
  publisher text null,
  creator text null,
  published_at timestamptz null,
  proposed_caption text null check (proposed_caption is null or char_length(proposed_caption) <= 1000),
  event_match_explanation text not null check (char_length(trim(event_match_explanation)) between 12 and 3000),
  event_match_kind text not null check (event_match_kind in ('exact_event', 'representative', 'uncertain')),
  duplicate_fingerprint text not null check (duplicate_fingerprint ~ '^[a-f0-9]{64}$'),
  perceptual_hash text null check (perceptual_hash is null or perceptual_hash ~ '^[a-f0-9]{16,128}$'),
  rights_evidence text null check (rights_evidence is null or char_length(rights_evidence) <= 3000),
  proposed_use text null check (proposed_use is null or char_length(proposed_use) <= 1000),
  licence_permission_or_exception text null check (licence_permission_or_exception is null or char_length(licence_permission_or_exception) <= 3000),
  attribution_requirement text null check (attribution_requirement is null or char_length(attribution_requirement) <= 1000),
  territorial_restriction text null check (territorial_restriction is null or char_length(territorial_restriction) <= 1000),
  duration_restriction text null check (duration_restriction is null or char_length(duration_restriction) <= 1000),
  withdrawal_contact text null check (withdrawal_contact is null or char_length(withdrawal_contact) <= 500),
  rights_display_status text not null default 'unknown_pending_review' check (rights_display_status in ('unknown_pending_review', 'evidence_supplied', 'human_review_required', 'approved_public_display', 'rejected')),
  privacy_concern text null check (privacy_concern is null or char_length(privacy_concern) <= 2000),
  safety_concern text null check (safety_concern is null or char_length(safety_concern) <= 2000),
  integrity_concern text null check (integrity_concern is null or char_length(integrity_concern) <= 2000),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'approved_for_media_review', 'rejected', 'duplicate', 'deferred')),
  existing_event_media_id uuid null references public.event_media(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (duplicate_fingerprint),
  constraint candidate_media_unknown_rights_gate check (
    review_status <> 'approved_for_media_review' or rights_display_status <> 'unknown_pending_review'
  )
);

create table public.editorial_review_decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.editorial_candidates(id) on delete restrict,
  candidate_field_id uuid null references public.event_candidate_fields(id) on delete restrict,
  decision text not null check (decision in ('approve', 'edit_and_approve', 'reject', 'duplicate', 'defer', 'request_rescan')),
  reason text null check (reason is null or char_length(reason) between 4 and 2000),
  edited_value jsonb null,
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now(),
  scan_run_id uuid null references public.scan_runs(id) on delete restrict,
  constraint editorial_decision_reason_required check (
    decision not in ('reject', 'duplicate') or reason is not null
  )
);

create table public.approved_change_sets (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.editorial_candidates(id) on delete restrict,
  target_event_slug text null references public.followable_events(event_slug) on delete restrict,
  change_kind text not null check (change_kind in ('new_event', 'event_update', 'official_response', 'source_update')),
  approved_values jsonb not null check (jsonb_typeof(approved_values) = 'object'),
  source_references jsonb not null check (jsonb_typeof(source_references) = 'array'),
  content_fingerprint text not null unique check (content_fingerprint ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  status text not null default 'ready_for_export' check (status in ('ready_for_export', 'exported', 'draft_pr_open', 'published', 'failed')),
  github_branch text null,
  pull_request_number integer null,
  publication_commit_sha text null check (publication_commit_sha is null or publication_commit_sha ~ '^[a-f0-9]{40}$'),
  failure_code text null,
  failure_summary text null check (failure_summary is null or char_length(failure_summary) <= 500),
  unique (candidate_id)
);

create table public.published_event_changes (
  id uuid primary key default gen_random_uuid(),
  approved_change_set_id uuid not null unique references public.approved_change_sets(id) on delete restrict,
  event_slug text not null references public.followable_events(event_slug) on delete restrict,
  change_type text not null check (change_type in ('new_event', 'status_change', 'official_response', 'outcome', 'major_correction', 'source', 'media')),
  changed_field_keys text[] not null check (cardinality(changed_field_keys) between 1 and 25),
  previous_public_value jsonb null,
  new_public_value jsonb not null,
  source_references jsonb not null check (jsonb_typeof(source_references) = 'array'),
  publication_commit_sha text not null check (publication_commit_sha ~ '^[a-f0-9]{40}$'),
  pull_request_number integer not null check (pull_request_number > 0),
  published_at timestamptz not null,
  notification_importance text not null default 'normal' check (notification_importance in ('none', 'normal', 'major')),
  notification_status text not null default 'not_queued' check (notification_status in ('not_queued', 'queued', 'complete', 'partial_failure')),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.editor_digest_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  digest_email_enabled boolean not null default false,
  digest_email text null check (digest_email is null or char_length(digest_email) between 3 and 254),
  daily_digest_time time not null default '08:00:00',
  states_of_interest text[] not null default '{}',
  candidate_types_of_interest text[] not null default '{}',
  high_priority_only boolean not null default false,
  scan_failure_alerts boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint editor_digest_email_gate check (not digest_email_enabled or digest_email is not null)
);

create table public.editorial_digests (
  id uuid primary key default gen_random_uuid(),
  digest_date date not null unique,
  scan_run_id uuid null references public.scan_runs(id) on delete restrict,
  generated_at timestamptz not null default now(),
  dashboard_summary jsonb not null check (jsonb_typeof(dashboard_summary) = 'object'),
  safe_email_summary text not null check (octet_length(safe_email_summary) <= 65536),
  email_status text not null default 'disabled' check (email_status in ('disabled', 'queued', 'sent', 'partial_failure', 'failed')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  safe_error_summary text null check (safe_error_summary is null or char_length(safe_error_summary) <= 500)
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_slug text null references public.followable_events(event_slug) on delete cascade,
  delivery_frequency text not null default 'immediate' check (delivery_frequency in ('immediate', 'daily_digest', 'weekly_digest', 'in_app_only', 'none')),
  email_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  global_opt_out boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index notification_preferences_user_scope_unique
on public.notification_preferences (user_id, coalesce(event_slug, ''));

create table public.event_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_slug text not null references public.followable_events(event_slug) on delete cascade,
  published_change_id uuid not null references public.published_event_changes(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 200),
  summary text not null check (char_length(trim(summary)) between 2 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz null,
  unique (user_id, published_change_id)
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.event_notifications(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email')),
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 200),
  delivery_state text not null default 'queued' check (delivery_state in ('queued', 'delivering', 'delivered', 'retry_wait', 'failed', 'disabled')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  last_attempt_at timestamptz null,
  delivered_at timestamptz null,
  next_retry_at timestamptz null,
  safe_error_code text null,
  created_at timestamptz not null default now(),
  unique (notification_id, channel)
);

create trigger discovery_schedule_settings_set_updated_at before update on public.discovery_schedule_settings
for each row execute function public.set_updated_at();
create trigger scan_sources_set_updated_at before update on public.scan_sources
for each row execute function public.set_updated_at();
create trigger discovered_items_set_updated_at before update on public.discovered_items
for each row execute function public.set_updated_at();
create trigger editorial_candidates_set_updated_at before update on public.editorial_candidates
for each row execute function public.set_updated_at();
create trigger editor_digest_preferences_set_updated_at before update on public.editor_digest_preferences
for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'discovery_schedule_settings', 'scan_sources', 'scan_runs', 'scan_jobs', 'discovered_items',
    'editorial_candidates', 'event_candidate_fields', 'candidate_sources', 'candidate_media',
    'editorial_review_decisions', 'approved_change_sets', 'published_event_changes',
    'editor_digest_preferences', 'editorial_digests', 'notification_preferences',
    'event_notifications', 'notification_deliveries'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
  end loop;
end $$;

grant select, insert, update, delete on table
  public.scan_sources, public.scan_runs, public.scan_jobs, public.discovered_items,
  public.editorial_candidates, public.event_candidate_fields, public.candidate_sources,
  public.candidate_media, public.editorial_review_decisions, public.approved_change_sets,
  public.published_event_changes, public.editor_digest_preferences, public.editorial_digests,
  public.event_notifications, public.notification_deliveries
to authenticated;
grant select on table public.discovery_schedule_settings to authenticated;

create policy discovery_schedule_editor_select on public.discovery_schedule_settings
for select to authenticated using (public.is_authorised_editor());

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'scan_sources', 'scan_runs', 'scan_jobs', 'discovered_items', 'editorial_candidates',
    'event_candidate_fields', 'candidate_sources', 'candidate_media', 'editorial_review_decisions',
    'approved_change_sets', 'published_event_changes', 'editor_digest_preferences',
    'editorial_digests', 'event_notifications', 'notification_deliveries'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_authorised_editor()) with check (public.is_authorised_editor())',
      table_name || '_editor_access', table_name
    );
  end loop;
end $$;

create or replace function public.start_scan_run(
  p_trigger_type text,
  p_idempotency_key text,
  p_dry_run boolean default true,
  p_scheduled_for date default null
) returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare run_id uuid;
begin
  if auth.role() <> 'service_role' and not public.is_authorised_editor() then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  if p_trigger_type not in ('scheduled', 'manual', 'retry') then
    raise exception using errcode = '22023', message = 'Invalid scan trigger';
  end if;
  if not p_dry_run and not (select scheduler_enabled and not dry_run_only from public.discovery_schedule_settings where singleton) then
    raise exception using errcode = '42501', message = 'Non-dry-run discovery is disabled';
  end if;

  insert into public.scan_runs (idempotency_key, trigger_type, scheduled_for, dry_run, requested_by)
  values (p_idempotency_key, p_trigger_type, p_scheduled_for, p_dry_run, auth.uid())
  on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
  returning id into run_id;

  insert into public.scan_jobs (scan_run_id, source_id, state)
  select run_id, id, state from public.scan_sources where enabled
  on conflict (scan_run_id, source_id) do nothing;

  update public.scan_runs
  set source_count = (select count(*) from public.scan_jobs where scan_run_id = run_id)
  where id = run_id;
  return run_id;
end;
$$;

create or replace function public.review_candidate_field(
  p_field_id uuid,
  p_decision text,
  p_edited_value jsonb default null,
  p_reason text default null
) returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare candidate_id_value uuid;
begin
  if not public.is_authorised_editor() then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  if p_decision not in ('approve', 'edit_and_approve', 'reject', 'defer') then
    raise exception using errcode = '22023', message = 'Invalid field decision';
  end if;
  if p_decision in ('reject', 'defer') and char_length(trim(coalesce(p_reason, ''))) < 4 then
    raise exception using errcode = '22023', message = 'A decision reason is required';
  end if;
  if p_decision = 'edit_and_approve' and p_edited_value is null then
    raise exception using errcode = '22023', message = 'Edited value is required';
  end if;

  update public.event_candidate_fields
  set review_status = case when p_decision in ('approve', 'edit_and_approve') then 'approved' else p_decision end,
      reviewer_edited_value = case when p_decision = 'edit_and_approve' then p_edited_value else null end,
      reviewed_by = auth.uid(), reviewed_at = now(), decision_reason = nullif(trim(p_reason), '')
  where id = p_field_id and review_status = 'unreviewed'
  returning candidate_id into candidate_id_value;
  if candidate_id_value is null then
    raise exception using errcode = 'P0002', message = 'Unreviewed candidate field not found';
  end if;

  insert into public.editorial_review_decisions (
    candidate_id, candidate_field_id, decision, reason, edited_value, decided_by
  ) values (candidate_id_value, p_field_id, p_decision, nullif(trim(p_reason), ''), p_edited_value, auth.uid());

  update public.editorial_candidates
  set review_status = case
        when exists (select 1 from public.event_candidate_fields where candidate_id = candidate_id_value and review_status = 'unreviewed') then 'under_review'
        when exists (select 1 from public.event_candidate_fields where candidate_id = candidate_id_value and review_status = 'approved') then 'approved'
        else 'rejected'
      end,
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = candidate_id_value;
end;
$$;

create or replace function public.review_editorial_candidate(
  p_candidate_id uuid,
  p_decision text,
  p_reason text default null
) returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not public.is_authorised_editor() then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  if p_decision not in ('reject', 'duplicate', 'defer', 'request_rescan') then
    raise exception using errcode = '22023', message = 'Invalid candidate decision';
  end if;
  if p_decision in ('reject', 'duplicate') and char_length(trim(coalesce(p_reason, ''))) < 4 then
    raise exception using errcode = '22023', message = 'A decision reason is required';
  end if;

  update public.editorial_candidates
  set review_status = case when p_decision = 'request_rescan' then 'deferred' else p_decision end,
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_candidate_id and review_status in ('unreviewed', 'under_review', 'deferred');
  if not found then
    raise exception using errcode = 'P0002', message = 'Reviewable candidate not found';
  end if;

  insert into public.editorial_review_decisions (candidate_id, decision, reason, decided_by)
  values (p_candidate_id, p_decision, nullif(trim(p_reason), ''), auth.uid());
end;
$$;

create or replace function public.create_approved_change_set(p_candidate_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  candidate_record public.editorial_candidates%rowtype;
  values_json jsonb;
  sources_json jsonb;
  fingerprint text;
  change_set_id uuid;
begin
  if not public.is_authorised_editor() then
    raise exception using errcode = '42501', message = 'Authorised editor access required';
  end if;
  select * into candidate_record from public.editorial_candidates where id = p_candidate_id;
  if candidate_record.id is null or candidate_record.review_status <> 'approved' then
    raise exception using errcode = '42501', message = 'Candidate is not approved';
  end if;
  if exists (
    select 1 from public.event_candidate_fields
    where candidate_id = p_candidate_id and review_status in ('unreviewed', 'deferred')
  ) then
    raise exception using errcode = '42501', message = 'Candidate fields still require review';
  end if;

  select jsonb_object_agg(field_key, coalesce(reviewer_edited_value, proposed_value) order by field_key)
  into values_json
  from public.event_candidate_fields
  where candidate_id = p_candidate_id and review_status = 'approved';
  if coalesce(jsonb_object_length(values_json), 0) = 0 then
    raise exception using errcode = '22023', message = 'No approved field values';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'url', canonical_url, 'publisher', publisher, 'headline', headline,
    'publishedAt', published_at, 'fingerprint', content_fingerprint
  ) order by canonical_url), '[]'::jsonb)
  into sources_json
  from public.candidate_sources where candidate_id = p_candidate_id;

  fingerprint := encode(digest(
    convert_to(p_candidate_id::text || values_json::text || sources_json::text, 'UTF8'), 'sha256'
  ), 'hex');

  insert into public.approved_change_sets (
    candidate_id, target_event_slug, change_kind, approved_values, source_references,
    content_fingerprint, created_by
  ) values (
    p_candidate_id, candidate_record.target_event_slug,
    case candidate_record.candidate_type
      when 'new_event' then 'new_event'
      when 'official_response' then 'official_response'
      when 'new_source' then 'source_update'
      else 'event_update'
    end,
    values_json, sources_json, fingerprint, auth.uid()
  )
  on conflict (candidate_id) do update set candidate_id = excluded.candidate_id
  returning id into change_set_id;
  return change_set_id;
end;
$$;

create or replace function public.set_notification_preference(
  p_event_slug text,
  p_delivery_frequency text,
  p_email_enabled boolean,
  p_in_app_enabled boolean,
  p_global_opt_out boolean
) returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare preference_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_event_slug is not null and not exists (
    select 1 from public.event_follows where event_slug = p_event_slug and user_id = auth.uid()
  ) then
    raise exception using errcode = '42501', message = 'Follow the event before enabling notifications';
  end if;
  if p_delivery_frequency not in ('immediate', 'daily_digest', 'weekly_digest', 'in_app_only', 'none') then
    raise exception using errcode = '22023', message = 'Invalid notification frequency';
  end if;

  insert into public.notification_preferences (
    user_id, event_slug, delivery_frequency, email_enabled, in_app_enabled, global_opt_out
  ) values (
    auth.uid(), p_event_slug, p_delivery_frequency, p_email_enabled, p_in_app_enabled, p_global_opt_out
  )
  on conflict (user_id, (coalesce(event_slug, ''))) do update
  set delivery_frequency = excluded.delivery_frequency,
      email_enabled = excluded.email_enabled,
      in_app_enabled = excluded.in_app_enabled,
      global_opt_out = excluded.global_opt_out,
      updated_at = now()
  returning id into preference_id;
  return preference_id;
end;
$$;

create or replace function public.queue_notifications_for_published_change(p_published_change_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  change_record public.published_event_changes%rowtype;
  queued_count integer := 0;
begin
  if auth.role() <> 'service_role' and not public.is_authorised_editor() then
    raise exception using errcode = '42501', message = 'Authorised publication access required';
  end if;
  select * into change_record from public.published_event_changes where id = p_published_change_id;
  if change_record.id is null then
    raise exception using errcode = 'P0002', message = 'Published change not found';
  end if;
  if not (select real_notifications_enabled from public.discovery_schedule_settings where singleton) then
    raise exception using errcode = '42501', message = 'Real follower notifications are disabled';
  end if;
  if change_record.notification_importance = 'none' then return 0; end if;

  with eligible as (
    select follows.user_id,
      coalesce(event_pref.in_app_enabled, global_pref.in_app_enabled, true) as in_app_enabled,
      coalesce(event_pref.email_enabled, global_pref.email_enabled, false) as email_enabled,
      coalesce(event_pref.delivery_frequency, global_pref.delivery_frequency, 'in_app_only') as frequency,
      coalesce(global_pref.global_opt_out, false) as opted_out
    from public.event_follows follows
    left join public.notification_preferences event_pref
      on event_pref.user_id = follows.user_id and event_pref.event_slug = follows.event_slug
    left join public.notification_preferences global_pref
      on global_pref.user_id = follows.user_id and global_pref.event_slug is null
    where follows.event_slug = change_record.event_slug
  ), inserted as (
    insert into public.event_notifications (user_id, event_slug, published_change_id, title, summary)
    select user_id, change_record.event_slug, change_record.id,
      'India Observed record updated',
      'A reviewed update is now published for an event you follow.'
    from eligible where not opted_out and frequency <> 'none' and (in_app_enabled or email_enabled)
    on conflict (user_id, published_change_id) do nothing
    returning id, user_id
  )
  select count(*) into queued_count from inserted;

  insert into public.notification_deliveries (
    notification_id, channel, idempotency_key, delivery_state, attempt_count, delivered_at
  )
  select notification.id, 'in_app',
    encode(digest(convert_to(notification.user_id::text || ':' || change_record.id::text || ':in_app', 'UTF8'), 'sha256'), 'hex'),
    'delivered', 1, now()
  from public.event_notifications notification
  where notification.published_change_id = change_record.id
  on conflict (notification_id, channel) do nothing;

  insert into public.notification_deliveries (
    notification_id, channel, idempotency_key, delivery_state
  )
  select notification.id, 'email',
    encode(digest(convert_to(notification.user_id::text || ':' || change_record.id::text || ':email', 'UTF8'), 'sha256'), 'hex'),
    'disabled'
  from public.event_notifications notification
  join public.notification_preferences preference
    on preference.user_id = notification.user_id and (preference.event_slug = notification.event_slug or preference.event_slug is null)
  where notification.published_change_id = change_record.id and preference.email_enabled
  on conflict (notification_id, channel) do nothing;

  update public.published_event_changes
  set notification_status = case when queued_count = 0 then 'complete' else 'queued' end
  where id = change_record.id;
  return queued_count;
end;
$$;

revoke all on function public.start_scan_run(text,text,boolean,date) from public, anon, authenticated;
revoke all on function public.review_candidate_field(uuid,text,jsonb,text) from public, anon, authenticated;
revoke all on function public.review_editorial_candidate(uuid,text,text) from public, anon, authenticated;
revoke all on function public.create_approved_change_set(uuid) from public, anon, authenticated;
revoke all on function public.set_notification_preference(text,text,boolean,boolean,boolean) from public, anon, authenticated;
revoke all on function public.queue_notifications_for_published_change(uuid) from public, anon, authenticated;
grant execute on function public.start_scan_run(text,text,boolean,date) to authenticated, service_role;
grant execute on function public.review_candidate_field(uuid,text,jsonb,text) to authenticated;
grant execute on function public.review_editorial_candidate(uuid,text,text) to authenticated;
grant execute on function public.create_approved_change_set(uuid) to authenticated;
grant execute on function public.set_notification_preference(text,text,boolean,boolean,boolean) to authenticated;
grant execute on function public.queue_notifications_for_published_change(uuid) to authenticated, service_role;

-- Seed only three already-reviewed source domains, all disabled pending an editor's terms review.
insert into public.scan_sources (
  name, base_url, scan_url, source_type, coverage_scope, state, language,
  reliability_tier, enabled, scan_method, scan_frequency, automated_access_notes
)
select seed.*
from (values
  ('Government of Assam', 'https://assam.gov.in/', 'https://assam.gov.in/', 'government_notice', 'Assam government public notices', 'Assam', 'English', 'primary', false, 'html_list', 'daily', 'Disabled until an editor confirms robots, terms and a bounded public notice endpoint.'),
  ('National Testing Agency', 'https://www.nta.ac.in/', 'https://www.nta.ac.in/', 'government_notice', 'National examination notices', null, 'English', 'primary', false, 'html_list', 'daily', 'Disabled until an editor confirms robots, terms and a bounded public notice endpoint.'),
  ('Namakkal District Administration', 'https://namakkal.nic.in/', 'https://namakkal.nic.in/', 'district_administration', 'Namakkal district public notices', 'Tamil Nadu', 'English', 'primary', false, 'html_list', 'daily', 'Disabled until an editor confirms robots, terms and a bounded public notice endpoint.')
) as seed(name, base_url, scan_url, source_type, coverage_scope, state, language, reliability_tier, enabled, scan_method, scan_frequency, automated_access_notes)
where exists (
  select 1 from public.media_event_sources source
  where source.source_url = seed.base_url
)
on conflict (scan_url) do nothing;

comment on table public.discovery_schedule_settings is
  'Fail-closed launch gates. Cron remains disabled until a separately approved production rollout.';
comment on table public.discovered_items is
  'Private bounded source extracts. Raw untrusted HTML must never be rendered.';
comment on table public.approved_change_sets is
  'Immutable reviewed values for PR-ready export. This table never edits public snapshots directly.';
comment on table public.published_event_changes is
  'Created only after a reviewed PR is live; scanner candidates cannot enqueue follower notifications.';
