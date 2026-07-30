begin;

grant execute on function public.is_allowed_media_embed(text) to authenticated;

comment on function public.is_allowed_media_embed(text) is
  'Immutable allow-list validator used by the event-media table constraint and protected approval RPC.';

commit;
