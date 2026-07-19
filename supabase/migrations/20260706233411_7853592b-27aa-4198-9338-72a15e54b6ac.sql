
-- ================== ENUMS ==================
CREATE TYPE public.app_role AS ENUM ('manager', 'hr');
CREATE TYPE public.meeting_type AS ENUM ('one_on_one', 'feedback');
CREATE TYPE public.meeting_status AS ENUM ('draft', 'scheduled', 'completed', 'canceled');
CREATE TYPE public.block_kind AS ENUM ('checkin', 'agenda', 'deliveries', 'development', 'agreements');
CREATE TYPE public.action_status AS ENUM ('open', 'in_progress', 'done', 'blocked');
CREATE TYPE public.pdi_status AS ENUM ('active', 'completed', 'paused', 'canceled');

-- ================== updated_at HELPER ==================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ================== PROFILES ==================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  job_title TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  -- default role manager for every new signup
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'manager')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- ================== USER ROLES ==================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Trigger new user AFTER user_roles table exists
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================== COMPETENCIES (Levels seed) ==================
CREATE TABLE public.competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.competencies TO authenticated;
GRANT ALL ON public.competencies TO service_role;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads competencies" ON public.competencies FOR SELECT TO authenticated USING (true);

INSERT INTO public.competencies (code, name, category, description) VALUES
  ('tech_delivery', 'Entrega Técnica', 'Técnica', 'Qualidade, consistência e previsibilidade nas entregas técnicas.'),
  ('problem_solving', 'Resolução de Problemas', 'Técnica', 'Capacidade de decompor, investigar e resolver problemas complexos.'),
  ('communication', 'Comunicação com Stakeholders', 'Comportamental', 'Clareza, escuta ativa e adaptação de linguagem entre times e clientes.'),
  ('collaboration', 'Colaboração', 'Comportamental', 'Trabalho em conjunto, apoio a colegas e construção de acordos.'),
  ('ownership', 'Ownership', 'Comportamental', 'Responsabilidade sobre resultados de ponta a ponta, mesmo fora do escopo direto.'),
  ('leadership', 'Liderança e Influência', 'Liderança', 'Orientar pessoas e times, dar feedback e criar direção compartilhada.'),
  ('customer_focus', 'Foco no Cliente', 'Negócio', 'Entendimento de contexto e impacto no cliente/negócio.'),
  ('continuous_learning', 'Aprendizado Contínuo', 'Comportamental', 'Curiosidade estruturada, prática deliberada e compartilhamento de conhecimento.');

-- ================== EMPLOYEES (liderados) ==================
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  position TEXT,
  level TEXT,
  cadence_days INT NOT NULL DEFAULT 15,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manager sees own employees" ON public.employees FOR SELECT TO authenticated
  USING (auth.uid() = manager_id OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Manager writes own employees" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Manager updates own employees" ON public.employees FOR UPDATE TO authenticated
  USING (auth.uid() = manager_id) WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Manager deletes own employees" ON public.employees FOR DELETE TO authenticated
  USING (auth.uid() = manager_id);
CREATE TRIGGER employees_set_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================== MEETINGS ==================
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type meeting_type NOT NULL DEFAULT 'one_on_one',
  status meeting_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_min INT,
  cadence_suggestion TEXT,
  hr_signal TEXT, -- optional anonymized signal: 'risk_leave' | 'overload' | null
  next_meeting_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manager sees own meetings" ON public.meetings FOR SELECT TO authenticated
  USING (auth.uid() = manager_id OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Manager writes own meetings" ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Manager updates own meetings" ON public.meetings FOR UPDATE TO authenticated
  USING (auth.uid() = manager_id) WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Manager deletes own meetings" ON public.meetings FOR DELETE TO authenticated
  USING (auth.uid() = manager_id);
CREATE TRIGGER meetings_set_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX meetings_manager_idx ON public.meetings(manager_id, scheduled_at DESC);
CREATE INDEX meetings_employee_idx ON public.meetings(employee_id);

-- ================== MEETING BLOCKS (5 blocos da 1:1) ==================
CREATE TABLE public.meeting_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  kind block_kind NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_blocks TO authenticated;
GRANT ALL ON public.meeting_blocks TO service_role;
ALTER TABLE public.meeting_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blocks follow meeting access" ON public.meeting_blocks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id
    AND (m.manager_id = auth.uid() OR public.has_role(auth.uid(),'hr'))));
CREATE POLICY "Blocks write for manager" ON public.meeting_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id AND m.manager_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id AND m.manager_id = auth.uid()));
CREATE TRIGGER meeting_blocks_set_updated_at BEFORE UPDATE ON public.meeting_blocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================== ACTION ITEMS ==================
CREATE TABLE public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  owner TEXT NOT NULL, -- 'manager' | 'employee' | 'both'
  due_date DATE,
  status action_status NOT NULL DEFAULT 'open',
  previous_id UUID REFERENCES public.action_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_items TO authenticated;
GRANT ALL ON public.action_items TO service_role;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Actions follow meeting access" ON public.action_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id
    AND (m.manager_id = auth.uid() OR public.has_role(auth.uid(),'hr'))));
CREATE POLICY "Actions write for manager" ON public.action_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id AND m.manager_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id AND m.manager_id = auth.uid()));
CREATE TRIGGER action_items_set_updated_at BEFORE UPDATE ON public.action_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================== FEEDBACKS (SBI) ==================
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  context TEXT NOT NULL DEFAULT '',
  listening_notes TEXT NOT NULL DEFAULT '',
  situation TEXT NOT NULL,
  behavior TEXT NOT NULL,
  impact TEXT NOT NULL,
  agreement TEXT NOT NULL DEFAULT '',
  self_feedback TEXT NOT NULL DEFAULT '',
  tone_score NUMERIC,
  tone_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feedback read own or hr" ON public.feedbacks FOR SELECT TO authenticated
  USING (auth.uid() = manager_id OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Feedback write own" ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Feedback update own" ON public.feedbacks FOR UPDATE TO authenticated
  USING (auth.uid() = manager_id) WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Feedback delete own" ON public.feedbacks FOR DELETE TO authenticated
  USING (auth.uid() = manager_id);
CREATE TRIGGER feedbacks_set_updated_at BEFORE UPDATE ON public.feedbacks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================== PDI OBJECTIVES ==================
CREATE TABLE public.pdi_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id),
  goal_description TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of strings, max 3
  deadline DATE NOT NULL,
  verification_marker TEXT NOT NULL,
  manager_support TEXT NOT NULL,
  status pdi_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdi_objectives TO authenticated;
GRANT ALL ON public.pdi_objectives TO service_role;
ALTER TABLE public.pdi_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PDI read own or hr" ON public.pdi_objectives FOR SELECT TO authenticated
  USING (auth.uid() = manager_id OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "PDI write own" ON public.pdi_objectives FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "PDI update own" ON public.pdi_objectives FOR UPDATE TO authenticated
  USING (auth.uid() = manager_id) WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "PDI delete own" ON public.pdi_objectives FOR DELETE TO authenticated
  USING (auth.uid() = manager_id);
CREATE TRIGGER pdi_set_updated_at BEFORE UPDATE ON public.pdi_objectives FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enforce max 3 active PDIs per employee (F-03)
CREATE OR REPLACE FUNCTION public.enforce_pdi_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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
CREATE TRIGGER pdi_limit BEFORE INSERT OR UPDATE ON public.pdi_objectives
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pdi_limit();

-- ================== SENSITIVE INCIDENTS (LGPD log) ==================
CREATE TABLE public.sensitive_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID,
  field TEXT NOT NULL,
  reason TEXT NOT NULL,
  masked_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sensitive_incidents TO authenticated;
GRANT ALL ON public.sensitive_incidents TO service_role;
ALTER TABLE public.sensitive_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own incidents or HR" ON public.sensitive_incidents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Insert own incident" ON public.sensitive_incidents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ================== LEGACY FEEDBACKS (PDF import) ==================
CREATE TABLE public.legacy_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  sbi_extracted JSONB,
  tone_analysis JSONB,
  suggestions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legacy_feedbacks TO authenticated;
GRANT ALL ON public.legacy_feedbacks TO service_role;
ALTER TABLE public.legacy_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Legacy own or HR" ON public.legacy_feedbacks FOR SELECT TO authenticated
  USING (auth.uid() = uploaded_by OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Legacy write own" ON public.legacy_feedbacks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Legacy update own" ON public.legacy_feedbacks FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Legacy delete own" ON public.legacy_feedbacks FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by);
