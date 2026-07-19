
CREATE TABLE public.recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'one_on_one' CHECK (kind IN ('one_on_one','feedback','other')),
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('mic','upload')),
  audio_path TEXT,
  audio_mime TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','transcribing','transcribed','summarizing','ready','error')),
  error_message TEXT,
  transcript TEXT,
  summary TEXT,
  key_topics JSONB,
  action_items JSONB,
  suggested_blocks JSONB,
  suggested_sbi JSONB,
  sensitive_flags JSONB,
  linked_meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  linked_feedback_id UUID REFERENCES public.feedbacks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recordings TO authenticated;
GRANT ALL ON public.recordings TO service_role;

ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage own recordings"
  ON public.recordings FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "HR can view all recordings"
  ON public.recordings FOR SELECT
  USING (public.has_role(auth.uid(), 'hr'));

CREATE TRIGGER recordings_set_updated_at
  BEFORE UPDATE ON public.recordings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_recordings_manager ON public.recordings(manager_id, created_at DESC);
CREATE INDEX idx_recordings_employee ON public.recordings(employee_id);

-- Storage policies for recordings bucket (bucket created via tool)
CREATE POLICY "Managers can upload own recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Managers can read own recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recordings'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'hr'))
  );

CREATE POLICY "Managers can delete own recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
