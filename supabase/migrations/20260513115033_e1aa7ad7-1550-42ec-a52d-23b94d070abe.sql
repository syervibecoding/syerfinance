-- payment_records: registra entradas previstas vs realizadas mês a mês
CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL, -- service | contract | company | implementation | certificate
  source_id uuid NOT NULL,
  client text NOT NULL,
  reference_month date NOT NULL, -- sempre dia 1
  expected_value numeric NOT NULL DEFAULT 0,
  received_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- paid | partial | pending | overdue | unpaid
  paid_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id, reference_month)
);

CREATE INDEX idx_payment_records_user_month ON public.payment_records(user_id, reference_month);

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own pr select" ON public.payment_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own pr insert" ON public.payment_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pr update" ON public.payment_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own pr delete" ON public.payment_records FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_pr_updated_at BEFORE UPDATE ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Reajuste futuro
ALTER TABLE public.services
  ADD COLUMN next_recurrence_value numeric,
  ADD COLUMN next_value_start date;

ALTER TABLE public.maintenance_contracts
  ADD COLUMN next_monthly_value numeric,
  ADD COLUMN next_value_start date;

ALTER TABLE public.companies
  ADD COLUMN next_payment_value numeric,
  ADD COLUMN next_value_start date;