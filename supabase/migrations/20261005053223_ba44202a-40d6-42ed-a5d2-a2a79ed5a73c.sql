ALTER TABLE public.profiles
  ADD COLUMN gems_status text CHECK (gems_status IN ('member','not_member')),
  ADD COLUMN gems_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN community_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN display_name text,
  ADD COLUMN avatar_url text;

CREATE OR REPLACE FUNCTION public.protect_gems_verified()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.gems_verified IS DISTINCT FROM OLD.gems_verified AND current_user IN ('authenticated','anon') THEN
    NEW.gems_verified := OLD.gems_verified;
  END IF;
  IF NEW.gems_status IS DISTINCT FROM 'member' THEN NEW.gems_verified := false; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_protect_gems BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_gems_verified();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, education_level, grade_year, school_name, gems_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'education_level','')::public.education_level,
    NULLIF(NEW.raw_user_meta_data->>'grade_year',''),
    NULLIF(NEW.raw_user_meta_data->>'school_name',''),
    CASE WHEN NEW.raw_user_meta_data->>'gems_status' IN ('member','not_member') THEN NEW.raw_user_meta_data->>'gems_status' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_gems_member(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND gems_status = 'member')
$$;

CREATE TABLE public.gems_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id text NOT NULL CHECK (char_length(course_id) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, DELETE ON public.gems_enrollments TO authenticated;
GRANT ALL ON public.gems_enrollments TO service_role;
ALTER TABLE public.gems_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own enrollments select" ON public.gems_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "members enroll self" ON public.gems_enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_gems_member(auth.uid()));
CREATE POLICY "own enrollments delete" ON public.gems_enrollments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX gems_enrollments_course_idx ON public.gems_enrollments(course_id);

CREATE OR REPLACE FUNCTION public.is_enrolled(_uid uuid, _course text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_gems_member(_uid) AND EXISTS (
    SELECT 1 FROM public.gems_enrollments WHERE user_id = _uid AND course_id = _course)
$$;

CREATE TABLE public.shared_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  course_id text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  topic text,
  creator_name text NOT NULL DEFAULT '',
  cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  card_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_decks TO authenticated;
GRANT ALL ON public.shared_decks TO service_role;
ALTER TABLE public.shared_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classmates read decks" ON public.shared_decks FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.is_enrolled(auth.uid(), course_id));
CREATE POLICY "enrolled share decks" ON public.shared_decks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.is_enrolled(auth.uid(), course_id));
CREATE POLICY "owner updates deck" ON public.shared_decks FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner deletes deck" ON public.shared_decks FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX shared_decks_course_idx ON public.shared_decks(course_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.shared_deck_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT COALESCE(NULLIF(trim(display_name),''), NULLIF(trim(full_name),''), 'Classmate')
    INTO NEW.creator_name FROM public.profiles WHERE id = NEW.owner_id;
  NEW.card_count := jsonb_array_length(NEW.cards);
  IF TG_OP = 'UPDATE' THEN NEW.owner_id := OLD.owner_id; NEW.course_id := OLD.course_id; NEW.updated_at := now(); END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER shared_decks_defaults BEFORE INSERT OR UPDATE ON public.shared_decks
FOR EACH ROW EXECUTE FUNCTION public.shared_deck_defaults();

CREATE TABLE public.deck_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.shared_decks(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deck_id, reporter_id)
);
GRANT SELECT, INSERT ON public.deck_reports TO authenticated;
GRANT ALL ON public.deck_reports TO service_role;
ALTER TABLE public.deck_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports select" ON public.deck_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "report visible decks" ON public.deck_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND EXISTS (
    SELECT 1 FROM public.shared_decks d WHERE d.id = deck_id AND public.is_enrolled(auth.uid(), d.course_id)));

CREATE OR REPLACE FUNCTION public.community_members(_course text)
RETURNS TABLE (user_id uuid, name text, avatar_url text, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
         COALESCE(NULLIF(trim(p.display_name),''), NULLIF(trim(p.full_name),''), 'Classmate'),
         p.avatar_url,
         p.id = auth.uid()
  FROM public.gems_enrollments e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE e.course_id = _course
    AND p.gems_status = 'member'
    AND (p.community_visible OR p.id = auth.uid())
    AND public.is_enrolled(auth.uid(), _course)
  ORDER BY 2
$$;
REVOKE EXECUTE ON FUNCTION public.community_members(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.community_members(text) TO authenticated;