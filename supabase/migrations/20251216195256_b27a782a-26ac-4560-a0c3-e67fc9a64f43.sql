-- Create ads table for admin-managed advertisements
CREATE TABLE IF NOT EXISTS public.ads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('image', 'text')),
    title text NOT NULL,
    description text,
    image_url text,
    bg_color text DEFAULT '#f97316',
    text_color text DEFAULT '#ffffff',
    font_size text DEFAULT 'medium',
    link text,
    start_date timestamp with time zone NOT NULL DEFAULT now(),
    end_date timestamp with time zone NOT NULL,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_ads_active ON public.ads(is_active, start_date, end_date);
CREATE INDEX idx_ads_priority ON public.ads(priority DESC);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Everyone can view active ads
CREATE POLICY "Anyone can view active ads"
ON public.ads
FOR SELECT
USING (is_active = true AND start_date <= now() AND end_date > now());

-- Only admins can manage ads
CREATE POLICY "Admins can manage ads"
ON public.ads
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for ad images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ad images
CREATE POLICY "Anyone can view ad images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-images');

CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ad images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad images"
ON storage.objects FOR DELETE
USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'::app_role));