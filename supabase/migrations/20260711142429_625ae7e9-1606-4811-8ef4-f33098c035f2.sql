
-- 1. Private schema not exposed to Data API
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 2. Recreate has_role inside private
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. Update policies to use private.has_role
DROP POLICY IF EXISTS "Manager sees own employees" ON public.employees;
CREATE POLICY "Manager sees own employees" ON public.employees FOR SELECT TO authenticated
  USING ((auth.uid() = manager_id) OR private.has_role(auth.uid(), 'hr'::public.app_role));

DROP POLICY IF EXISTS "Manager sees own meetings" ON public.meetings;
CREATE POLICY "Manager sees own meetings" ON public.meetings FOR SELECT TO authenticated
  USING ((auth.uid() = manager_id) OR private.has_role(auth.uid(), 'hr'::public.app_role));

DROP POLICY IF EXISTS "Blocks follow meeting access" ON public.meeting_blocks;
CREATE POLICY "Blocks follow meeting access" ON public.meeting_blocks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_blocks.meeting_id
    AND (m.manager_id = auth.uid() OR private.has_role(auth.uid(), 'hr'::public.app_role))));

DROP POLICY IF EXISTS "Actions follow meeting access" ON public.action_items;
CREATE POLICY "Actions follow meeting access" ON public.action_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = action_items.meeting_id
    AND (m.manager_id = auth.uid() OR private.has_role(auth.uid(), 'hr'::public.app_role))));

DROP POLICY IF EXISTS "Feedback read own or hr" ON public.feedbacks;
CREATE POLICY "Feedback read own or hr" ON public.feedbacks FOR SELECT TO authenticated
  USING ((auth.uid() = manager_id) OR private.has_role(auth.uid(), 'hr'::public.app_role));

DROP POLICY IF EXISTS "PDI read own or hr" ON public.pdi_objectives;
CREATE POLICY "PDI read own or hr" ON public.pdi_objectives FOR SELECT TO authenticated
  USING ((auth.uid() = manager_id) OR private.has_role(auth.uid(), 'hr'::public.app_role));

DROP POLICY IF EXISTS "Own incidents or HR" ON public.sensitive_incidents;
CREATE POLICY "Own incidents or HR" ON public.sensitive_incidents FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'hr'::public.app_role));

DROP POLICY IF EXISTS "Legacy own or HR" ON public.legacy_feedbacks;
CREATE POLICY "Legacy own or HR" ON public.legacy_feedbacks FOR SELECT TO authenticated
  USING ((auth.uid() = uploaded_by) OR private.has_role(auth.uid(), 'hr'::public.app_role));

DROP POLICY IF EXISTS "HR can view all recordings" ON public.recordings;
CREATE POLICY "HR can view all recordings" ON public.recordings FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'hr'::public.app_role));

DROP POLICY IF EXISTS "Managers can read own recordings" ON storage.objects;
CREATE POLICY "Managers can read own recordings" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recordings'
    AND ((storage.foldername(name))[1] = (auth.uid())::text
      OR private.has_role(auth.uid(), 'hr'::public.app_role)));

-- 4. Drop the exposed public function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
