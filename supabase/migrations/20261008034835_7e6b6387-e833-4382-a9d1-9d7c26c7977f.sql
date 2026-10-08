CREATE TABLE public.learn_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  course_id text,
  course_name text NOT NULL DEFAULT '',
  topic text NOT NULL,
  lesson_title text NOT NULL DEFAULT '',
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  completed_steps integer NOT NULL DEFAULT 0,
  total_steps integer NOT NULL DEFAULT 0,
  questions_answered integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  review_concepts text[] NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learn_sessions TO authenticated;
GRANT ALL ON public.learn_sessions TO service_role;
ALTER TABLE public.learn_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learn sessions" ON public.learn_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX learn_sessions_user_idx ON public.learn_sessions(user_id, updated_at DESC);
CREATE TRIGGER learn_sessions_touch BEFORE UPDATE ON public.learn_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_visible boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.school_leaderboard(_period text)
RETURNS TABLE(user_id uuid, name text, avatar_url text, lessons integer, questions integer, sessions integer, score integer, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH me AS (SELECT lower(trim(school_name)) AS school FROM public.profiles WHERE id = auth.uid()),
  since AS (SELECT CASE _period WHEN 'week' THEN now() - interval '7 days' WHEN 'month' THEN now() - interval '30 days' ELSE '-infinity'::timestamptz END AS t),
  peers AS (
    SELECT p.* FROM public.profiles p, me
    WHERE me.school IS NOT NULL AND me.school <> '' AND lower(trim(p.school_name)) = me.school
      AND (p.leaderboard_visible OR p.id = auth.uid())
  ),
  stats AS (
    SELECT pr.id,
      (SELECT count(*) FROM public.learn_sessions l, since WHERE l.user_id = pr.id AND l.completed_at IS NOT NULL AND l.completed_at >= since.t)::int AS lessons,
      (SELECT COALESCE(sum(l.questions_answered),0) FROM public.learn_sessions l, since WHERE l.user_id = pr.id AND l.updated_at >= since.t)::int AS questions,
      (SELECT count(*) FROM public.study_sessions s, since WHERE s.user_id = pr.id AND s.started_at >= since.t)::int AS sessions
    FROM peers pr
  )
  SELECT pr.id, COALESCE(NULLIF(trim(pr.display_name),''), NULLIF(split_part(trim(pr.full_name),' ',1),''), 'Student'),
    pr.avatar_url, s.lessons, s.questions, s.sessions,
    (s.lessons * 20 + s.questions * 2 + s.sessions * 5)::int, pr.id = auth.uid()
  FROM peers pr JOIN stats s ON s.id = pr.id
  WHERE (s.lessons + s.questions + s.sessions) > 0
  ORDER BY 7 DESC, 2
  LIMIT 50
$$;
REVOKE EXECUTE ON FUNCTION public.school_leaderboard(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.school_leaderboard(text) TO authenticated;