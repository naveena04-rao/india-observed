-- Permit reader-friendly submissions to remain structured when editors must choose the final field.

alter table public.lead_event_field_proposals
  drop constraint lead_proposal_field_key,
  add constraint lead_proposal_field_key check (field_key in (
    'title', 'event_type', 'main_issue', 'primary_topic', 'state_name', 'general_location',
    'start_date', 'end_date', 'lifecycle_status', 'neutral_summary', 'directed_at',
    'latest_official_response', 'editorial_mapping', 'correction_request',
    'outcome_or_follow_up', 'public_participants'
  ));

comment on constraint lead_proposal_field_key on public.lead_event_field_proposals is
  'Allows exact event fields plus private editorial-mapping categories; never mutates public events.';
