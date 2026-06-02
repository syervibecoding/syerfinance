CREATE TABLE public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;
GRANT ALL ON public.expense_categories TO service_role;

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ec select" ON public.expense_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ec insert" ON public.expense_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ec update" ON public.expense_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ec delete" ON public.expense_categories FOR DELETE USING (auth.uid() = user_id);