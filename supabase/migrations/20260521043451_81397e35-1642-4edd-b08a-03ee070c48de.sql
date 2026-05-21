-- Restrict SECURITY DEFINER functions: revoke broad EXECUTE
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role still needs to be callable from authenticated for RLS-side checks via SECURITY DEFINER context;
-- keep authenticated execute to allow client-side role checks if needed.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Tighten storage listing: remove the broad public SELECT policy.
-- Files remain reachable via their public URL (bucket is public),
-- but the storage API will not list arbitrary contents.
DROP POLICY IF EXISTS "Profile photos publicly readable" ON storage.objects;