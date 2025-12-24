-- Create link_analytics table
CREATE TABLE public.link_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid,
  source text DEFAULT 'direct',
  event text NOT NULL DEFAULT 'view',
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_link_analytics_product_id ON public.link_analytics(product_id);
CREATE INDEX idx_link_analytics_created_at ON public.link_analytics(created_at);
CREATE INDEX idx_link_analytics_source ON public.link_analytics(source);

-- Enable RLS
ALTER TABLE public.link_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert analytics"
ON public.link_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
ON public.link_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view their product analytics"
ON public.link_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = link_analytics.product_id
    AND products.seller_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.link_analytics;