
-- Fix search_path on all custom functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.enforce_pdi_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE cnt INT;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT count(*) INTO cnt FROM public.pdi_objectives
     WHERE employee_id = NEW.employee_id AND status = 'active' AND id <> NEW.id;
    IF cnt >= 3 THEN
      RAISE EXCEPTION 'Máximo de 3 objetivos de PDI ativos por liderado';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Restrict SECURITY DEFINER execution
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
