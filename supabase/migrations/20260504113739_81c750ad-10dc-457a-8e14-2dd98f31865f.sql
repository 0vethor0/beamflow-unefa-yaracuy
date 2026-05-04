-- Fix search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke public execute on SECURITY DEFINER functions; only triggers / internal use
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
-- has_role still needs to be callable by authenticated users for RLS policies, keep it executable
grant execute on function public.has_role(uuid, public.app_role) to authenticated;