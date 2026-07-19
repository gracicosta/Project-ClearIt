
DO $$
DECLARE
  target_id uuid;
  breno_id uuid := '624f1860-b4a9-411f-b08c-64a5037b9f84';
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = 'goncalvestudostrabalho@gmail.com' LIMIT 1;
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'Usuário goncalvestudostrabalho@gmail.com não encontrado. Faça login pelo menos uma vez em produção antes.';
  END IF;

  -- Garante profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (target_id, 'Gonçalves (Demo)')
  ON CONFLICT (id) DO NOTHING;

  -- Papel de manager + hr (vê todos os squads)
  INSERT INTO public.user_roles (user_id, role) VALUES (target_id, 'manager') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_id, 'hr') ON CONFLICT DO NOTHING;

  -- Reatribui a massa do squad demo (Breno) para o usuário alvo
  UPDATE public.employees          SET manager_id = target_id WHERE manager_id = breno_id;
  UPDATE public.meetings           SET manager_id = target_id WHERE manager_id = breno_id;
  UPDATE public.feedbacks          SET manager_id = target_id WHERE manager_id = breno_id;
  UPDATE public.pdi_objectives     SET manager_id = target_id WHERE manager_id = breno_id;
  UPDATE public.recordings         SET manager_id = target_id WHERE manager_id = breno_id;
  UPDATE public.sensitive_incidents SET user_id   = target_id WHERE user_id   = breno_id;
  UPDATE public.legacy_feedbacks   SET uploaded_by = target_id WHERE uploaded_by = breno_id;
END $$;
