
-- 1. Lock down SECURITY DEFINER functions from being executable by API roles.
-- handle_new_user is a trigger function; no client should call it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies; policy evaluation runs with the caller's
-- privileges, so authenticated must retain EXECUTE. Revoke from anon/public.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- 2. Explicit write policies on user_roles: deny all client-side INSERT/UPDATE/DELETE.
-- Role assignment happens via the SECURITY DEFINER trigger handle_new_user or service_role.
CREATE POLICY "No client inserts to user_roles"
  ON public.user_roles FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "No client updates to user_roles"
  ON public.user_roles FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No client deletes to user_roles"
  ON public.user_roles FOR DELETE TO authenticated, anon
  USING (false);
