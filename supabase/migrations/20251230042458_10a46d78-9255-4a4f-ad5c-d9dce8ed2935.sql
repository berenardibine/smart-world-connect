-- Create unified locations table for hierarchical location structure
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('country', 'province', 'district', 'sector')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index on slug within parent
CREATE UNIQUE INDEX idx_locations_slug_parent ON public.locations(slug, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for locations
CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage locations" ON public.locations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add location_id to products table for regional filtering
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- Add location_id to shops table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS market_center TEXT;

-- Add is_regional and location_id to communities for regional communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_regional BOOLEAN DEFAULT false;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- Add detected_location fields to profiles for auto-location
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS detected_ip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_location_enabled BOOLEAN DEFAULT true;

-- Create function to get location hierarchy
CREATE OR REPLACE FUNCTION public.get_location_hierarchy(location_uuid UUID)
RETURNS TABLE(
  location_id UUID,
  location_name TEXT,
  location_type TEXT,
  location_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE hierarchy AS (
    SELECT l.id, l.name, l.type, l.slug, l.parent_id
    FROM locations l WHERE l.id = location_uuid
    UNION ALL
    SELECT l.id, l.name, l.type, l.slug, l.parent_id
    FROM locations l
    JOIN hierarchy h ON l.id = h.parent_id
  )
  SELECT h.id, h.name, h.type, h.slug FROM hierarchy h;
END;
$$;

-- Create function to get all child locations
CREATE OR REPLACE FUNCTION public.get_child_locations(location_uuid UUID)
RETURNS TABLE(location_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE children AS (
    SELECT l.id FROM locations l WHERE l.id = location_uuid
    UNION ALL
    SELECT l.id FROM locations l
    JOIN children c ON l.parent_id = c.id
  )
  SELECT c.id FROM children c;
END;
$$;

-- Insert Rwanda location data
INSERT INTO public.locations (id, name, slug, parent_id, type) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Rwanda', 'rwanda', NULL, 'country')
ON CONFLICT DO NOTHING;

-- Insert migration of existing provinces to locations
INSERT INTO public.locations (id, name, slug, parent_id, type)
SELECT id, name, LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', '')), '00000000-0000-0000-0001-000000000001', 'province'
FROM public.provinces
ON CONFLICT DO NOTHING;

-- Insert migration of existing districts to locations
INSERT INTO public.locations (id, name, slug, parent_id, type)
SELECT d.id, d.name, LOWER(REPLACE(REPLACE(d.name, ' ', '-'), '''', '')), d.province_id, 'district'
FROM public.districts d
ON CONFLICT DO NOTHING;

-- Insert migration of existing sectors to locations
INSERT INTO public.locations (id, name, slug, parent_id, type)
SELECT s.id, s.name, LOWER(REPLACE(REPLACE(s.name, ' ', '-'), '''', '')), s.district_id, 'sector'
FROM public.sectors s
ON CONFLICT DO NOTHING;

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_products_location_id ON public.products(location_id);
CREATE INDEX IF NOT EXISTS idx_shops_location ON public.shops(province_id, district_id, sector_id);
CREATE INDEX IF NOT EXISTS idx_communities_location_id ON public.communities(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);