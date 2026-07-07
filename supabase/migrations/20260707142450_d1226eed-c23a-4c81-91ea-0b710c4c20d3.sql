CREATE TABLE public.doubts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, subject TEXT NOT NULL DEFAULT 'Physics', chapter TEXT, title TEXT NOT NULL, body TEXT NOT NULL, resolved BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubts TO authenticated;
GRANT ALL ON public.doubts TO service_role;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doubts viewable by authenticated" ON public.doubts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own doubts" ON public.doubts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own doubts" ON public.doubts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own doubts" ON public.doubts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.doubt_answers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubt_answers TO authenticated;
GRANT ALL ON public.doubt_answers TO service_role;
ALTER TABLE public.doubt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers viewable by authenticated" ON public.doubt_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own answers" ON public.doubt_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own answers" ON public.doubt_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_doubt_answers_doubt ON public.doubt_answers(doubt_id);
CREATE INDEX idx_doubts_created ON public.doubts(created_at DESC);
-- migration end