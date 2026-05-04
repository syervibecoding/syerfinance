ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_check;
ALTER TABLE public.services ADD CONSTRAINT services_category_check
CHECK (category IN ('Marketing','Plataformas','Web Ops','Sites','Certificado Digital'));