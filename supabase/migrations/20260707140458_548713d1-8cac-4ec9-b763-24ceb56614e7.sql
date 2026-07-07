
-- ROLES ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Aspirant',
  target_exam TEXT NOT NULL DEFAULT 'JEE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- AUTO CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, target_exam)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'target_exam', 'JEE')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STUDY SESSIONS
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
  mode TEXT NOT NULL DEFAULT 'stopwatch',
  studied_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CHAPTER PROGRESS
CREATE TABLE public.chapter_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_key TEXT NOT NULL,
  theory_done BOOLEAN NOT NULL DEFAULT false,
  dpp_done BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_progress TO authenticated;
GRANT ALL ON public.chapter_progress TO service_role;
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.chapter_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MOCK TESTS
CREATE TABLE public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  test_date DATE NOT NULL,
  marks_obtained NUMERIC NOT NULL,
  total_marks NUMERIC NOT NULL CHECK (total_marks > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mocks" ON public.mock_tests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TODOS
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;
GRANT ALL ON public.todos TO service_role;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own todos" ON public.todos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MISTAKES
CREATE TABLE public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'Physics',
  chapter TEXT,
  tag TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistakes TO authenticated;
GRANT ALL ON public.mistakes TO service_role;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mistakes" ON public.mistakes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CHAPTER RESOURCES (global, admin managed)
CREATE TABLE public.chapter_resources (
  chapter_key TEXT PRIMARY KEY,
  notes_url TEXT,
  video_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chapter_resources TO authenticated, anon;
GRANT ALL ON public.chapter_resources TO service_role;
ALTER TABLE public.chapter_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources readable by all" ON public.chapter_resources FOR SELECT USING (true);
CREATE POLICY "Admins manage resources" ON public.chapter_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- LEADERBOARD FUNCTION
CREATE OR REPLACE FUNCTION public.get_leaderboard(period TEXT)
RETURNS TABLE (user_id UUID, display_name TEXT, total_seconds BIGINT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, p.display_name, COALESCE(SUM(s.duration_seconds), 0)::bigint AS total_seconds
  FROM public.study_sessions s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE (
    (period = 'week' AND s.studied_on >= (now() AT TIME ZONE 'utc')::date - INTERVAL '7 days')
    OR (period = 'month' AND s.studied_on >= (now() AT TIME ZONE 'utc')::date - INTERVAL '30 days')
    OR (period = 'all')
  )
  GROUP BY s.user_id, p.display_name
  ORDER BY total_seconds DESC
  LIMIT 100;
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT) TO authenticated;
