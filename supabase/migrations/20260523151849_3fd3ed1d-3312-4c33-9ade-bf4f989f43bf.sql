CREATE TABLE public.traffic_recharges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  service_id uuid NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  recharge_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.traffic_recharges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tr select" ON public.traffic_recharges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tr insert" ON public.traffic_recharges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tr update" ON public.traffic_recharges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own tr delete" ON public.traffic_recharges FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_tr_service ON public.traffic_recharges(service_id, recharge_date DESC);
CREATE TRIGGER trg_tr_updated BEFORE UPDATE ON public.traffic_recharges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();