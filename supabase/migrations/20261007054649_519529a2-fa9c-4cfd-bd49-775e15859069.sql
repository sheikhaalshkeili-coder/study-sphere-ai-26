ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS course_id text;
CREATE UNIQUE INDEX IF NOT EXISTS classes_user_course_uniq ON public.classes(user_id, course_id) WHERE course_id IS NOT NULL;