CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.tutor_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_conversations TO authenticated;
GRANT ALL ON public.tutor_conversations TO service_role;
ALTER TABLE public.tutor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tutor conversations" ON public.tutor_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tutor_conversations_user_idx ON public.tutor_conversations (user_id, updated_at DESC);
CREATE TRIGGER touch_tutor_conversations BEFORE UPDATE ON public.tutor_conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.tutor_conversations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON public.chat_messages (conversation_id, created_at);

CREATE TABLE public.study_plan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  focus TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 30,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plan_sessions TO authenticated;
GRANT ALL ON public.study_plan_sessions TO service_role;
ALTER TABLE public.study_plan_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plan sessions" ON public.study_plan_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX study_plan_sessions_user_start_idx ON public.study_plan_sessions (user_id, start_at);

ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS times_seen INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS times_correct INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS topic TEXT;