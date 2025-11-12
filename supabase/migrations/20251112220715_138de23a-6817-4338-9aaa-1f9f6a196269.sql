-- Create enum for verdict types
CREATE TYPE public.verdict_type AS ENUM ('good', 'fair', 'overpriced');

-- Create analyses table
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url TEXT,
  title TEXT NOT NULL,
  address JSONB NOT NULL,
  geo POINT,
  price NUMERIC NOT NULL,
  area_m2 NUMERIC NOT NULL,
  bedrooms INTEGER,
  estimated_market_value NUMERIC,
  estimated_rent_monthly NUMERIC,
  metrics JSONB DEFAULT '{}'::jsonb,
  assumptions JSONB DEFAULT '{
    "iptu": 0,
    "condominio": 0,
    "itbi_pct": 3,
    "taxes_fixed": 0,
    "vacancy_pct": 5,
    "maint_pct": 5,
    "financing": null
  }'::jsonb,
  verdict verdict_type,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create comps_sales table
CREATE TABLE public.comps_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address JSONB NOT NULL,
  geo POINT,
  price NUMERIC NOT NULL,
  area_m2 NUMERIC NOT NULL,
  price_per_m2 NUMERIC GENERATED ALWAYS AS (price / NULLIF(area_m2, 0)) STORED,
  source TEXT,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Create comps_rentals table
CREATE TABLE public.comps_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address JSONB NOT NULL,
  geo POINT,
  rent_monthly NUMERIC NOT NULL,
  area_m2 NUMERIC NOT NULL,
  rent_per_m2 NUMERIC GENERATED ALWAYS AS (rent_monthly / NULLIF(area_m2, 0)) STORED,
  source TEXT,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comps_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comps_rentals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analyses
CREATE POLICY "Users can view their own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comps (public read for estimation)
CREATE POLICY "Anyone can view comps_sales"
  ON public.comps_sales FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view comps_rentals"
  ON public.comps_rentals FOR SELECT
  USING (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for analyses
CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_comps_sales_geo ON public.comps_sales USING gist(geo);
CREATE INDEX idx_comps_rentals_geo ON public.comps_rentals USING gist(geo);

-- Insert seed data for São Paulo (mock comparables)
INSERT INTO public.comps_sales (address, price, area_m2, source) VALUES
  ('{"street": "Av. Paulista", "bairro": "Bela Vista", "cidade": "São Paulo", "estado": "SP", "cep": "01310-100"}', 850000, 75, 'seed'),
  ('{"street": "Rua Augusta", "bairro": "Consolação", "cidade": "São Paulo", "estado": "SP", "cep": "01305-100"}', 720000, 68, 'seed'),
  ('{"street": "Av. Rebouças", "bairro": "Pinheiros", "cidade": "São Paulo", "estado": "SP", "cep": "05401-100"}', 950000, 80, 'seed'),
  ('{"street": "Rua dos Pinheiros", "bairro": "Pinheiros", "cidade": "São Paulo", "estado": "SP", "cep": "05422-010"}', 1200000, 95, 'seed'),
  ('{"street": "Av. Faria Lima", "bairro": "Itaim Bibi", "cidade": "São Paulo", "estado": "SP", "cep": "04538-133"}', 1500000, 100, 'seed');

INSERT INTO public.comps_rentals (address, rent_monthly, area_m2, source) VALUES
  ('{"street": "Av. Paulista", "bairro": "Bela Vista", "cidade": "São Paulo", "estado": "SP", "cep": "01310-100"}', 4500, 75, 'seed'),
  ('{"street": "Rua Augusta", "bairro": "Consolação", "cidade": "São Paulo", "estado": "SP", "cep": "01305-100"}', 3800, 68, 'seed'),
  ('{"street": "Av. Rebouças", "bairro": "Pinheiros", "cidade": "São Paulo", "estado": "SP", "cep": "05401-100"}', 5200, 80, 'seed'),
  ('{"street": "Rua dos Pinheiros", "bairro": "Pinheiros", "cidade": "São Paulo", "estado": "SP", "cep": "05422-010"}', 6500, 95, 'seed'),
  ('{"street": "Av. Faria Lima", "bairro": "Itaim Bibi", "cidade": "São Paulo", "estado": "SP", "cep": "04538-133"}', 8000, 100, 'seed');