-- Expand services with traffic fields
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS last_recharge_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recharge_date date,
  ADD COLUMN IF NOT EXISTS daily_spend numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS traffic_balance numeric DEFAULT 0;

-- Expand expenses with installments
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS installments_total integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installments_current integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_expense_id uuid;

-- Create tasks table for Kanban
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Pendente',
  priority text DEFAULT 'Normal',
  client text,
  service_id uuid,
  due_date date,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tasks select" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tasks insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own tasks delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_parent ON public.expenses(parent_expense_id);