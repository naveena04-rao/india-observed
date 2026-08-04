-- Delete only superseded scanner rows currently classified as new events.
-- Planned events, event updates, official responses, retained leads and public records are untouched.

create temporary table superseded_new_event_titles (
  title text primary key
) on commit drop;

insert into superseded_new_event_titles (title) values
  ('DMK cadres protest Udhayanidhi Stalin''s arrest'),
  ('DMK MPs protest in Parliament over the Cauvery water dispute'),
  ('Jharkhand students continue JPSC protest'),
  ('Students protest examination leaks in Madhya Pradesh'),
  ('Youth Congress protests outside Nitin Gadkari''s Nagpur residence'),
  ('Organisations condemn the NSA detention of Pranab Doley'),
  ('AMUCO condemns blockades and counter-blockades and seeks financial relief'),
  ('Cauvery farmers'' protest announced for 13 August'),
  ('VPP march on the Meghalaya Secretariat'),
  ('AISA expands anti-paper-leak movement'),
  ('Indian Medical Association plans to suspend services in Maharashtra'),
  ('Chowdry Ramzan invites leaders to join an August 5 protest'),
  ('NSA invoked against Pranab Doley after the Kaziranga hotel protest'),
  ('Supreme Court says states may close or withdraw FIRs against student protesters'),
  ('Supreme Court notice concerning regulation of the Jantar Mantar protest venue'),
  ('Fadnavis response to Delhi Police action during a NEET protest'),
  ('West Bengal CM orders action after violence during a NEET protest'),
  ('Kharge asks the Prime Minister to address Parliament over police action at a NEET protest'),
  ('Request for clarity on withdrawal of Maharashtra student-protest cases'),
  ('Tamil Nadu to withdraw cases against anti-NEET protesters'),
  ('Gujarat Police asked to withdraw FIRs against paper-leak protesters');

create temporary table deleted_new_event_candidates (
  id uuid primary key,
  discovered_item_id uuid not null,
  suggested_title text
) on commit drop;

insert into deleted_new_event_candidates (id, discovered_item_id, suggested_title)
select candidate.id, candidate.discovered_item_id, candidate.suggested_title
from public.editorial_candidates candidate
join superseded_new_event_titles title
  on lower(trim(candidate.suggested_title)) = lower(trim(title.title))
where candidate.candidate_type = 'new_event';

delete from public.editorial_candidates candidate
using deleted_new_event_candidates deleted
where candidate.id = deleted.id;

-- Remove only source observations that became fully orphaned after the candidate deletion.
delete from public.discovered_items item
using deleted_new_event_candidates deleted
where item.id = deleted.discovered_item_id
  and not exists (
    select 1
    from public.editorial_candidates remaining
    where remaining.discovered_item_id = item.id
  );

insert into public.compliance_audit_log (
  actor_id,
  action,
  subject_type,
  subject_id,
  safe_details
)
select
  null,
  'delete_incorrect_new_event_candidate',
  'editorial_candidate',
  deleted.id::text,
  jsonb_build_object(
    'title', deleted.suggested_title,
    'reason', 'Superseded by manual re-verification against current 2026 sources',
    'scope', 'private dashboard only'
  )
from deleted_new_event_candidates deleted;
