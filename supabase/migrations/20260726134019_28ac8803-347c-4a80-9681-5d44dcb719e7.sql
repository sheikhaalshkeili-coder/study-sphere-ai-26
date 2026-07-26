ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'assignment';
DO $$ BEGIN
  ALTER TABLE public.assignments ADD CONSTRAINT assignments_type_check CHECK (type IN ('assignment','homework','quiz','project'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS assignments_user_due_idx ON public.assignments (user_id, due_at);
CREATE INDEX IF NOT EXISTS exams_user_examat_idx ON public.exams (user_id, exam_at);
CREATE INDEX IF NOT EXISTS classes_user_day_idx ON public.classes (user_id, day_of_week);