-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant narrowly.

-- has_role: required by RLS policies for signed-in users
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- handle_new_user: trigger only, must not be callable directly
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- enforce_pdi_limit: trigger only (not SECURITY DEFINER but tighten anyway)
REVOKE ALL ON FUNCTION public.enforce_pdi_limit() FROM PUBLIC, anon, authenticated;

-- set_updated_at: trigger only
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;