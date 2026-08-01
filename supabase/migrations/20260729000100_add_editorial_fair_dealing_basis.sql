alter type public.media_rights_basis
add value if not exists 'editorial_fair_dealing_current_events';

comment on type public.media_rights_basis is
  'Controlled display bases. editorial_fair_dealing_current_events records a reviewed editorial assessment, not permission, a licence or ownership.';
