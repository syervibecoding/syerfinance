
-- Helper trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- SERVICES
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendente','Em Produção','Entregue','Atrasado')),
  value NUMERIC NOT NULL DEFAULT 0,
  deadline TEXT,
  category TEXT NOT NULL CHECK (category IN ('Marketing','Plataformas','Web Ops','Sites')),
  implementation_charged NUMERIC DEFAULT 0,
  implementation_paid NUMERIC DEFAULT 0,
  recurrence_value NUMERIC DEFAULT 0,
  recurrence_period TEXT CHECK (recurrence_period IN ('Mensal','Anual')),
  recurrence_start_date DATE,
  payment_day INT,
  traffic_reload_day INT,
  discount_percentage NUMERIC DEFAULT 0,
  discount_type TEXT,
  has_contract BOOLEAN DEFAULT false,
  contract_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own services select" ON public.services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own services insert" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own services update" ON public.services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own services delete" ON public.services FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MAINTENANCE CONTRACTS
CREATE TABLE public.maintenance_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  url TEXT NOT NULL,
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Ativo','Pausado')),
  last_check TEXT,
  recurrence_start_date DATE,
  payment_day INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mc select" ON public.maintenance_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own mc insert" ON public.maintenance_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own mc update" ON public.maintenance_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own mc delete" ON public.maintenance_contracts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER mc_updated BEFORE UPDATE ON public.maintenance_contracts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendente','Pago')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exp select" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own exp insert" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exp update" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own exp delete" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER exp_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  equity NUMERIC NOT NULL DEFAULT 0,
  payment_day TEXT,
  payment_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own co select" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own co insert" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own co update" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own co delete" ON public.companies FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER co_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COMPANY TASKS
CREATE TABLE public.company_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pendente','Em Execução','Concluído')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ct select" ON public.company_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ct insert" ON public.company_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ct update" ON public.company_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ct delete" ON public.company_tasks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER ct_updated BEFORE UPDATE ON public.company_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USEFUL LINKS
CREATE TABLE public.useful_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.useful_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ul select" ON public.useful_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ul insert" ON public.useful_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ul update" ON public.useful_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ul delete" ON public.useful_links FOR DELETE USING (auth.uid() = user_id);
