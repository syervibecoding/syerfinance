CREATE TABLE public.implementation_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.implementation_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ip select" ON public.implementation_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ip insert" ON public.implementation_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ip update" ON public.implementation_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ip delete" ON public.implementation_payments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_ip_updated_at BEFORE UPDATE ON public.implementation_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ip_service ON public.implementation_payments(service_id);
CREATE INDEX idx_ip_user_date ON public.implementation_payments(user_id, paid_date);

-- Migrar dados existentes: cada serviço com implementation_paid > 0 vira 1 pagamento histórico
INSERT INTO public.implementation_payments (user_id, service_id, value, paid_date, notes)
SELECT user_id, id, implementation_paid, created_at::date, 'Pagamento histórico'
FROM public.services
WHERE COALESCE(implementation_paid, 0) > 0;