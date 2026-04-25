ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS split_payment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_day_2 integer;