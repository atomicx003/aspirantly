
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'cyan';
ALTER TABLE public.doubts ADD COLUMN IF NOT EXISTS image_url text;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.custom_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_key text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  cls text NOT NULL DEFAULT '12',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_chapters TO authenticated;
GRANT ALL ON public.custom_chapters TO service_role;
ALTER TABLE public.custom_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Custom chapters readable by authenticated" ON public.custom_chapters
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage custom chapters" ON public.custom_chapters
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_custom_chapters_updated_at BEFORE UPDATE ON public.custom_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.chapter_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('pdf','video')),
  title text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chapter_links_chapter ON public.chapter_links(chapter_key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_links TO authenticated;
GRANT ALL ON public.chapter_links TO service_role;
ALTER TABLE public.chapter_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chapter links readable by authenticated" ON public.chapter_links
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage chapter links" ON public.chapter_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_chapter_links_updated_at BEFORE UPDATE ON public.chapter_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'atomixaryan@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
