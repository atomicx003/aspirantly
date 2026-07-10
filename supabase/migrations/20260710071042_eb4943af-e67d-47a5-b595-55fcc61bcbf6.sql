ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_on date;
CREATE INDEX IF NOT EXISTS todos_user_due_idx ON public.todos (user_id, due_on);